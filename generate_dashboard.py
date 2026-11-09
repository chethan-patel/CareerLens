import pandas as pd
import json
import os

print("CareerLens Dashboard Generation Started!")

# Project folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Input: cleaned dataset
INPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "careerlens_jobs_cleaned.csv"
)

# Output: dashboard JSON
OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "dashboard",
    "dashboard_data.json"
)

# Load dataset
df = pd.read_csv(INPUT_FILE)

# Create a salary midpoint for analysis.
# Salary period is not confirmed, so values are kept in INR.
df["salary_midpoint"] = (
    df["salary_minimum"] + df["salary_maximum"]
) / 2

# 1. Summary
summary = {
    "total_jobs": int(len(df)),
    "total_job_roles": int(df["job_title"].nunique()),
    "total_cities": int(df["location_city"].nunique()),
    "average_salary": round(df["salary_midpoint"].mean(), 2)
}

# 2. Top-paying roles
top_paying_roles = (
    df.groupby("job_title")["salary_midpoint"]
    .mean()
    .sort_values(ascending=False)
    .head(10)
    .reset_index()
)

top_paying_roles.columns = ["job_role", "average_salary"]
top_paying_roles["average_salary"] = (
    top_paying_roles["average_salary"].round(2)
)

# 3. Salary by city
salary_by_city = (
    df.groupby("location_city")["salary_midpoint"]
    .mean()
    .sort_values(ascending=False)
    .reset_index()
)

salary_by_city.columns = ["city", "average_salary"]
salary_by_city["average_salary"] = (
    salary_by_city["average_salary"].round(2)
)

# 4. Salary by experience
salary_by_experience = (
    df.groupby("experience_level")["salary_midpoint"]
    .mean()
    .reset_index()
)

salary_by_experience.columns = [
    "experience_level",
    "average_salary"
]

salary_by_experience["average_salary"] = (
    salary_by_experience["average_salary"].round(2)
)

# 5. Salary by year
df["posted_date"] = pd.to_datetime(
    df["posted_date"],
    errors="coerce"
)

df["year"] = df["posted_date"].dt.year

salary_by_year = (
    df.groupby("year")["salary_midpoint"]
    .mean()
    .reset_index()
)

salary_by_year.columns = ["year", "average_salary"]
salary_by_year["average_salary"] = (
    salary_by_year["average_salary"].round(2)
)

salary_by_year["year"] = salary_by_year["year"].astype(int)

# 6. Top required skills
all_skills = (
    df["skills_extracted"]
    .dropna()
    .str.split(",")
    .explode()
    .str.strip()
)

top_required_skills = (
    all_skills[all_skills != ""]
    .value_counts()
    .head(10)
    .rename_axis("skill")
    .reset_index(name="count")
)

# 7. Job postings by role
job_demand_by_role = (
    df.groupby("job_title")
    .size()
    .sort_values(ascending=False)
    .head(10)
    .reset_index(name="job_count")
)

job_demand_by_role.columns = ["job_role", "job_count"]

# Combine all dashboard sections
dashboard_data = {
    "summary": summary,
    "top_paying_roles": top_paying_roles.to_dict(orient="records"),
    "salary_by_city": salary_by_city.to_dict(orient="records"),
    "salary_by_experience": salary_by_experience.to_dict(orient="records"),
    "salary_by_year": salary_by_year.to_dict(orient="records"),
    "top_required_skills": top_required_skills.to_dict(orient="records"),
    "job_demand_by_role": job_demand_by_role.to_dict(orient="records"),
    "salary_currency": "INR",
    "salary_unit": "Not specified in dataset"
}

# Save dashboard JSON
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(dashboard_data, file, indent=4, ensure_ascii=False)

print("\nDASHBOARD GENERATED SUCCESSFULLY!")
print("Total records:", len(df))
print("Total job roles:", summary["total_job_roles"])
print("Total cities:", summary["total_cities"])
print("Top skills:", len(top_required_skills))
print("Saved to:", OUTPUT_FILE)