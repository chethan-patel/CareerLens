from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import re
import html
import pandas as pd
from functools import lru_cache
import urllib.request
import urllib.parse
import urllib.error
import time

# Create Flask application
app = Flask(__name__)

# Enable CORS
CORS(app)

# Project paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Headcount Labs API configuration
HEADCOUNT_API_URL = "https://api.headcountlabs.com/v1/jobs"
HEADCOUNT_API_KEY = os.environ.get("HEADCOUNTLABS_API_KEY")

HEADCOUNT_PAGE_SIZE = 50
HEADCOUNT_CACHE_SECONDS = 300

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "dashboard",
    "dashboard_data.json"
)

JOBS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "careerlens_jobs_cleaned.csv"
)
# Fetch one page of live jobs from Headcount Labs
def fetch_headcount_jobs(filters, cursor=None):

    if not HEADCOUNT_API_KEY:
        raise RuntimeError(
            "HEADCOUNTLABS_API_KEY is not configured."
        )

    params = dict(filters)

    params["limit"] = HEADCOUNT_PAGE_SIZE
    params["fields"] = (
       "job_id,title,employer_name,description,"
"locations,postings,work_arrangement"
    )
    params["include"] = "source_data"
    if cursor:
        params["cursor"] = cursor

    url = (
        HEADCOUNT_API_URL
        + "?"
        + urllib.parse.urlencode(params)
    )

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {HEADCOUNT_API_KEY}",
            "Accept": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(
                response.read().decode("utf-8")
            )

    except urllib.error.HTTPError as error:
        error_body = error.read().decode(
            "utf-8", errors="replace"
        )

        raise RuntimeError(
            f"Headcount Labs API error ({error.code}): "
            f"{error_body}"
        )

    except urllib.error.URLError as error:
        raise RuntimeError(
            f"Could not connect to Headcount Labs: {error.reason}"
        )
    # Extract job-specific skills from description
def extract_skills(description):

    skill_list = [
        "Python", "Java", "JavaScript", "TypeScript",
        "C", "C++", "C#", "PHP",
        "HTML", "CSS", "React", "Angular", "Vue",
        "Node.js", "Django", "Flask", "FastAPI",
        "Spring Boot", "ASP.NET",
        "SQL", "MySQL", "PostgreSQL", "MongoDB",
        "Oracle", "SQLite",
        "Excel", "Power BI", "Tableau",
        "Pandas", "NumPy", "Matplotlib",
        "Machine Learning", "Deep Learning",
        "Artificial Intelligence",
        "TensorFlow", "PyTorch",
        "AWS", "Azure", "Google Cloud",
        "Docker", "Kubernetes",
        "Git", "GitHub",
        "Linux", "REST API",
        "Data Analysis", "Data Visualization",
        "PowerPoint", "Word"
    ]

    found_skills = []

    for skill in skill_list:
        pattern = r'(?<!\w)' + re.escape(skill) + r'(?!\w)'

        if re.search(pattern, description, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills

# Convert Headcount Labs job into CareerLens format
def convert_headcount_job(item):

    def get_value(field):
        value = item.get(field, {})
        if isinstance(value, dict) and value.get("state") == "known":
            return value.get("value")
        return None

    title = get_value("title") or "Untitled Job"
    company = get_value("employer_name") or "Company not specified"
    description = clean_text(get_value("description") or "")

    locations = item.get("locations", [])
    location = "Location not specified"

    if locations:
        location_data = locations[0].get("value", {})
        city = location_data.get("city")
        region = location_data.get("region")

        location = ", ".join(
            part for part in [city, region] if part
        ) or location

    postings = item.get("postings", [])
    application_url = None
    work_mode = "Not specified"
    employment_type = "Not specified"
    is_active = False

    arrangement = item.get("work_arrangement", {})

    if arrangement.get("state") == "known":
        arrangement_value = arrangement.get("value", "").lower()

        work_mode = {
            "remote": "Remote",
            "hybrid": "Hybrid",
            "in_person": "On-site"
        }.get(arrangement_value, "Not specified")

    if postings:
        posting = postings[0]
        source_data = posting.get("source_data", {})
        employment_type = source_data.get("employment_type") or "Not specified"

        url_data = posting.get("application_url", {})

        if url_data.get("state") == "known":
            candidate_url = url_data.get("value")

            if candidate_url:
                parsed_url = urllib.parse.urlparse(candidate_url)

                if parsed_url.scheme == "https" and parsed_url.netloc:
                    application_url = candidate_url

        is_active = posting.get("posting_status") == "listed"

        posting_location = posting.get("location", {}).get("value", {})

        if posting_location.get("remote") is True:
            work_mode = "Remote"

    return {
        "id": item.get("job_id"),
        "title": title,
        "company": company,
        "location": location,
        "type": "Not specified",
        "salary": "Not disclosed",
        "skills": extract_skills(description),
        "description": description,
        "experience": "Not specified",
        "education": "Not specified",
        "work_mode": work_mode,
        "employment_type": employment_type,
        "is_active": is_active,
        "application_url": application_url
    }


@lru_cache(maxsize=1)
def load_jobs_data():
    return pd.read_csv(JOBS_FILE)


# Read dashboard JSON
def load_dashboard_data():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


# Clean text values
def clean_text(value):
    if pd.isna(value):
        return ""

    value = html.unescape(str(value))
    value = re.sub(r"<[^>]*>", "", value)

    return value.strip()


# Convert a job record into API format
def format_job(row, index):

    title = clean_text(row.get("job_title"))
    company = clean_text(row.get("company_name"))
    location = clean_text(row.get("location_city"))

    employment_type = clean_text(
        row.get("employment_type")
    )

    work_mode = clean_text(
        row.get("work_mode")
    )

    # Remote jobs use Remote as their displayed type
    if work_mode.lower() == "remote":
        job_type = "Remote"
    else:
        job_type = employment_type

    # Format salary in INR.
    # The dataset does not specify the salary period.
    minimum = row.get("salary_minimum")
    maximum = row.get("salary_maximum")

    if pd.notna(minimum) and pd.notna(maximum):
        salary = (
            f"₹{minimum:,.0f} – ₹{maximum:,.0f} INR "
            "(period not specified)"
        )
    else:
        salary = "Salary not available"

    # Convert comma-separated skills into a list
    skills_text = clean_text(
        row.get("skills_extracted")
    )

    skills = [
        skill.strip()
        for skill in skills_text.split(",")
        if skill.strip()
    ]

    # Convert active status
    active_value = str(
        row.get("is_active", "")
    ).strip().lower()

    is_active = active_value in ["true", "1", "yes"]

    return {
        "id": int(index),
        "title": title,
        "company": company,
        "location": location,
        "type": job_type,
        "salary": salary,
        "skills": skills,
        "description": clean_text(
            row.get("job_description")
        ),
        "experience": clean_text(
            row.get("experience_required")
        ),
        "education": clean_text(
            row.get("education_required")
        ),
        "work_mode": work_mode,
        "employment_type": employment_type,
        "is_active": is_active
    }


# 1. Home API
@app.route("/")
def home():
    return jsonify({
        "message": "CareerLens Python Backend is running!",
        "status": "success"
    })


# 2. Health API
@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "project": "CareerLens"
    })


# 3. Jobs API - Connected to Headcount Labs live data
@app.route("/api/jobs", methods=["GET"])
def get_jobs():

    try:
        # Read frontend filters
        keyword = request.args.get(
            "keyword", ""
        ).strip()

        city = request.args.get(
            "city", ""
        ).strip().lower()

        job_type = request.args.get(
            "type", ""
        ).strip().lower()

        page = request.args.get("page", 1, type=int)
        page = max(page, 1)

        cursor = request.args.get("cursor")

        # Search live Indian job listings
        search_term = keyword or "software engineer"

        filters = {
            "q": search_term,
            "country": "IN",
            "currentness": "current",
            "has_application_url": "true"
        }

        # Fetch jobs from Headcount Labs
        result = fetch_headcount_jobs(
            filters,
            cursor=cursor
        )

        raw_jobs = result.get("data", [])

        # Convert provider records into CareerLens format
        jobs = [
            convert_headcount_job(item)
            for item in raw_jobs
        ]

        # Keep currently listed jobs with application links
        jobs = [
            job for job in jobs
            if job["is_active"] and job["application_url"]
        ]

        # Apply city filter when requested
        if city:
            jobs = [
                job for job in jobs
                if city in job["location"].lower()
            ]

        # Apply job type filters
        if job_type == "remote":
            jobs = [
                job for job in jobs
                if job["work_mode"] == "Remote"
            ]

        elif job_type == "full-time":
            jobs = [
                job for job in jobs
                if job["employment_type"].lower().replace("-", " ") == "full time"
            ]

        elif job_type == "internship":
            jobs = [
                job for job in jobs
                if "intern" in job["employment_type"].lower()
            ]
        return jsonify({
            "status": "success",
            "source": "Headcount Labs",
            "page": page,
            "limit": HEADCOUNT_PAGE_SIZE,
            "search_term": search_term,
            "jobs": jobs,
            "next_cursor": result.get("next_cursor"),
            "snapshot_watermark": result.get(
                "snapshot_watermark"
            )
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

# 4. Complete Salary API
@app.route("/api/salary")
def get_salary_data():
    try:
        return jsonify(load_dashboard_data())

    except FileNotFoundError:
        return jsonify({
            "error": "Salary data file not found"
        }), 404

    except json.JSONDecodeError:
        return jsonify({
            "error": "Salary data file contains invalid JSON"
        }), 500


# 5. Salary Summary API
@app.route("/api/salary/summary")
def get_salary_summary():
    try:
        data = load_dashboard_data()

        return jsonify(data["summary"])

    except FileNotFoundError:
        return jsonify({
            "error": "Salary data file not found"
        }), 404

    except (json.JSONDecodeError, KeyError):
        return jsonify({
            "error": "Invalid dashboard data or summary missing"
        }), 500


# 6. Salary by Location API
@app.route("/api/salary/location")
def get_salary_by_location():
    try:
        data = load_dashboard_data()

        return jsonify({
            "salary_by_city": data["salary_by_city"]
        })

    except FileNotFoundError:
        return jsonify({
            "error": "Salary data file not found"
        }), 404

    except (json.JSONDecodeError, KeyError):
        return jsonify({
            "error": "Invalid dashboard data or city data missing"
        }), 500


# 7. Skills Demand API
@app.route("/api/skills/demand")
def get_skills_demand():
    try:
        data = load_dashboard_data()

        return jsonify({
            "top_required_skills": data["top_required_skills"]
        })

    except FileNotFoundError:
        return jsonify({
            "error": "Salary data file not found"
        }), 404

    except (json.JSONDecodeError, KeyError):
        return jsonify({
            "error": "Invalid dashboard data or skills data missing"
        }), 500


# 8. Complete Dashboard API
@app.route("/api/dashboard")
def get_dashboard():
    try:
        data = load_dashboard_data()

        return jsonify({
            "status": "success",
            "dashboard": data
        })

    except FileNotFoundError:
        return jsonify({
            "error": "Dashboard data file not found"
        }), 404

    except json.JSONDecodeError:
        return jsonify({
            "error": "Dashboard data contains invalid JSON"
        }), 500


# Run Flask application
if __name__ == "__main__":
    print("Starting CareerLens Backend...")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )