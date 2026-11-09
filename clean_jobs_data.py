import pandas as pd
import os

print("CareerLens Data Cleaning Started!")

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "raw",
    "indian_tech_career_intelligence_2026.csv"
)

OUTPUT_DIR = os.path.join(BASE_DIR, "data", "processed")

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "careerlens_jobs_cleaned.csv"
)

# Create processed folder
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load dataset
df = pd.read_csv(INPUT_FILE)

print("\nOriginal records:", len(df))

# Remove unnecessary spaces from text columns
for column in df.select_dtypes(include=["str"]).columns:
    df[column] = df[column].str.strip()

# Convert empty strings into missing values
df.replace("", pd.NA, inplace=True)

# Convert date columns
df["posted_date"] = pd.to_datetime(
    df["posted_date"],
    format="%d-%m-%Y",
    errors="coerce"
)

df["application_deadline"] = pd.to_datetime(
    df["application_deadline"],
    format="%d-%m-%Y",
    errors="coerce"
)

# Ensure salary columns are numeric
df["salary_minimum"] = pd.to_numeric(
    df["salary_minimum"], errors="coerce"
)

df["salary_maximum"] = pd.to_numeric(
    df["salary_maximum"], errors="coerce"
)

# Remove exact duplicate records only
df.drop_duplicates(inplace=True)

# Preserve records with missing probation periods
# Preserve both active and inactive jobs

# Save cleaned dataset
df.to_csv(OUTPUT_FILE, index=False)

print("\nDATA CLEANING COMPLETED!")
print("Remaining records:", len(df))
print("Total columns:", len(df.columns))
print("Missing probation values:", df["probation_period"].isna().sum())
print("Saved file:", OUTPUT_FILE)