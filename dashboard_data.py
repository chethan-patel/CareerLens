import json
import os

# CareerLens dashboard data generator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "dashboard",
    "dashboard_data.json"
)

REQUIRED_SECTIONS = [
    "summary",
    "top_paying_roles",
    "salary_by_city",
    "salary_by_experience",
    "salary_by_year",
    "top_required_skills",
    "job_demand_by_role"
]


def generate_dashboard_data():

    print("CareerLens dashboard data preparation started!")

    if not os.path.exists(DATA_FILE):
        print("ERROR: Dashboard JSON file not found!")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    missing_sections = [
        section for section in REQUIRED_SECTIONS
        if section not in data
    ]

    if missing_sections:
        print("Missing sections:", missing_sections)
        return

    print("\nDASHBOARD DATA VALIDATED SUCCESSFULLY!")

    print("Total jobs:", data["summary"]["total_jobs"])
    print("Total job roles:", data["summary"]["total_job_roles"])
    print("Total cities:", data["summary"]["total_cities"])
    print("Average salary:", data["summary"]["average_salary"])

    print("\nAll 7 dashboard sections are available.")
    print("Existing JSON file has NOT been modified.")


if __name__ == "__main__":
    generate_dashboard_data()