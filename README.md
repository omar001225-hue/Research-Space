Research-Space
Research-Space is a full-stack web application for managing research opportunities, built with React, FastAPI, and MariaDB/MySQL.

GitHub Repository: https://github.com/omar001225-hue/Research-Space

Requirements
Install these before starting:

XAMPP — database server
Python — backend
Node.js and npm — frontend
Visual Studio Code — development environment
Project Structure

Research-Space/

├── backend/

│   ├── main.py
│   ├── run.py
│   ├── requirements.txt
│   └── research_opportunities.sql

├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md

Setup and Run Instructions

1. Download the Project
Clone the repository:

git clone https://github.com/omar001225-hue/Research-Space.git
cd Research-Space
Alternatively, download the repository as a ZIP from GitHub and extract it.

2. Set Up the Database
Open the XAMPP Control Panel.
Start Apache and MySQL.
Open phpMyAdmin: http://localhost/phpmyadmin
Select the Import tab.
Choose backend/research_opportunities.sql.
Click Import or Go to execute the SQL script.
Ensure the database and tables are created successfully. The database name and connection settings must match those configured in backend/main.py.

3. Install Backend Dependencies
Open the project in VS Code. In the terminal, navigate to the backend folder:

cd backend
Create and activate a Python virtual environment:

python -m venv venv
.\venv\Scripts\Activate.ps1
Install the required packages:

pip install -r requirements.txt
4. Run the Backend
From inside the backend/ folder, run:

uvicorn main:app --reload
Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

5. Install and Run the Frontend
Open a second terminal in VS Code and navigate to the frontend folder from the project root:

cd frontend
Install frontend dependencies:

npm install
Start the development server:

npm run dev
Open the local URL displayed in the terminal, usually http://localhost:5173.

Keep this terminal running as well.

Troubleshooting
Database connection error: Check that XAMPP's MySQL service is running and the database name, username, password, and port match backend/main.py.
Python dependency error: Activate the virtual environment and run pip install -r requirements.txt from backend/.
Frontend dependency error: Run npm install from frontend/.
Frontend cannot connect to backend: Verify the backend URL and check the backend's CORS configuration.
Important Notes
Run the frontend and backend in separate terminals.
Keep XAMPP running while using the application.
backend/requirements.txt lists Python dependencies; frontend/package.json lists JavaScript dependencies.
Do not upload passwords, .env files, virtual environments, or node_modules to GitHub.
