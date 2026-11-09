# CareerLens

CareerLens is a career and job market analysis project designed to help users explore job opportunities, salary trends, required skills, and job demand.

## Technologies Used

### Backend
- Python
- Flask
- Flask-CORS
- Pandas
- MySQL Connector

### Frontend
- HTML
- CSS
- JavaScript
- Firebase Authentication
- Firebase Firestore

## Project Structure

```text
CareerLens/
│
├── app.py
├── requirements.txt
├── README.md
│
├── data/
│   └── dashboard/
│       └── dashboard_data.json
│
├── firebase.js
├── jobs.html
├── jobs.js
├── login.html
└── signup.html
```

## Installation

Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Environment Configuration

The live Jobs API requires a Headcount Labs API key.

Configure the environment variable before starting the backend:

```powershell
$env:HEADCOUNTLABS_API_KEY = "YOUR_API_KEY"
```

Keep the API key private. Do not commit it to GitHub or expose it in frontend JavaScript.

## Running the Backend

Open PowerShell in the CareerLens project folder.

Run:

```powershell
python app.py
```

Backend address:

```text
http://127.0.0.1:5000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/jobs` | Search and retrieve job listings |
| GET | `/api/salary` | Complete salary and dashboard-related data |
| GET | `/api/salary/summary` | Salary summary |
| GET | `/api/salary/location` | Salary by city |
| GET | `/api/skills/demand` | Top required skills |
| GET | `/api/dashboard` | Complete dashboard data |

### Example API Requests

```text
http://127.0.0.1:5000/api/health
http://127.0.0.1:5000/api/jobs?keyword=Python
http://127.0.0.1:5000/api/salary/summary
http://127.0.0.1:5000/api/salary/location
http://127.0.0.1:5000/api/skills/demand
http://127.0.0.1:5000/api/dashboard
```

## Jobs API Filters

The Jobs API supports search filters including:

- Keyword
- City
- Employment type
- Remote work
- Pagination

Example:

```text
/api/jobs?keyword=Python
/api/jobs?keyword=software%20engineer&city=Hyderabad
```

## Frontend Testing

Open another PowerShell window in the project folder.

Run:

```powershell
python -m http.server 8000
```

Open the frontend in Chrome:

```text
http://localhost:8000/jobs.html
```

The Flask backend must also be running.

## Backend Testing

The backend APIs can be tested using:

- PowerShell Invoke-RestMethod
- Browser
- Postman

The main API endpoints have been tested successfully during development.

## Important Notes

- Flask-CORS is enabled for frontend-backend communication.
- The Jobs API retrieves live listings through Headcount Labs.
- Dashboard and salary data are provided through the project's configured dataset.
- The salary unit is currently not specified in the dataset; verify it before presenting values as annual or monthly salaries.
- Never expose API keys or Firebase private configuration credentials.

## Team Integration

The backend provides REST API endpoints for frontend integration.

The frontend team can use these endpoints to retrieve job listings, salary information, skills demand, and dashboard statistics.

**Project:** CareerLens  
**Backend:** Python + Flask + Pandas  
**Frontend:** HTML + CSS + JavaScript