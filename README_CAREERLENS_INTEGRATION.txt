CAREERLENS — CAREER INSIGHTS PLATFORM

1. PROJECT OVERVIEW

CareerLens is a career insights platform that provides:

- Job listings and job search.
- Salary insights and analytics.
- Skills demand analysis.
- Mock interview functionality.
- User login and registration.
- Saved jobs and interview results.

Frontend: HTML, CSS and JavaScript
Backend: Python and Flask
Database: MySQL
Authentication and user features: Firebase
Data processing: Pandas

2. PROJECT STRUCTURE

- app.py — Flask backend
- dashboard_data.py — Dashboard data validation
- test_db.py — MySQL connection test
- requirements.txt — Python dependencies
- salary.html — Salary dashboard
- salary.js — Salary dashboard JavaScript
- salary.css — Salary dashboard styling
- firebase.js — Firebase configuration
- data/dashboard/dashboard_data.json — Dashboard dataset

3. INSTALLATION

Open the CareerLens folder in Visual Studio Code.

Open Terminal and run:

pip install -r requirements.txt

4. START THE PYTHON BACKEND

Run:

python app.py

Backend address:

http://127.0.0.1:5000

Keep this terminal running.

5. BACKEND API ENDPOINTS

Endpoint| Purpose
/| Backend home
/api/health| Backend health
/api/jobs| Job listings
/api/salary| Complete salary data
/api/salary/summary| Salary summary
/api/salary/location| City salary data
/api/skills/demand| Skills demand
/api/dashboard| Complete dashboard

6. RUN THE FRONTEND

Open a second VS Code terminal.

Run:

python -m http.server 8000

Open:

http://localhost:8000/salary.html

Keep both backend and frontend terminals running.

7. MYSQL DATABASE

Database name: careerlens

MySQL connection was tested successfully using test_db.py.

Note: Application tables and full MySQL integration are still pending.

Firebase currently handles authentication and user-specific features.

8. DATA NOTE

The dashboard contains a synthetic academic sample dataset:

- 6,000 sample job records
- 200 job roles
- 7 cities

These are not verified real-world salary or hiring statistics.

9. IMPORTANT NOTES

- Do not open salary.html directly using file://.
- Start the local frontend server before opening the page.
- Start Flask before testing backend-connected pages.
- Do not expose Flask debug mode to the public internet.
- Keep Firebase credentials and database passwords secure.

10. CURRENT DEVELOPMENT STATUS

Completed:

- Flask backend
- Eight API endpoints
- Dashboard JSON validation
- Salary dashboard API connection
- Pandas installation
- MySQL connection test
- Python requirements file

Pending:

- Actual dashboard data-generation pipeline
- MySQL application tables and integration
- Full frontend and backend integration testing
- Production deployments