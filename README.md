[Read_me.md](https://github.com/user-attachments/files/33402626/Read_me.md)
# Research-Space

Research-Space is a full-stack web application for managing research opportunities, built with React, FastAPI, and MariaDB/MySQL.

**GitHub Repository:** https://github.com/omar001225-hue/Research-Space

## Requirements

Install these before starting:

- [XAMPP](https://www.apachefriends.org/) — database server
- [Python](https://www.python.org/downloads/) — backend
- [Node.js and npm](https://nodejs.org/) — frontend
- [Visual Studio Code](https://code.visualstudio.com/) — development environment

## Project Structure

```text
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
```

## Setup and Run Instructions

### 1. Download the Project

Clone the repository:

```bash
git clone https://github.com/omar001225-hue/Research-Space.git
cd Research-Space
```

Alternatively, download the repository as a ZIP from GitHub and extract it.

### 2. Set Up the Database

1. Open the XAMPP Control Panel.
2. Start **Apache** and **MySQL**.
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Select the **Import** tab.
5. Choose `backend/research_opportunities.sql`.
6. Click **Import** or **Go** to execute the SQL script.

Ensure the database and tables are created successfully. The database name and connection settings must match those configured in `backend/main.py`.

### 3. Install Backend Dependencies

Open the project in VS Code. In the terminal, navigate to the backend folder:

```powershell
cd backend
```

Create and activate a Python virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the required packages:

```powershell
pip install -r requirements.txt
```

### 4. Run the Backend

From inside the `backend/` folder, run:

```powershell
uvicorn main:app --reload
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

### 5. Install and Run the Frontend

Open a **second terminal** in VS Code and navigate to the frontend folder from the project root:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the local URL displayed in the terminal, usually http://localhost:5173.

Keep this terminal running as well.

## Troubleshooting

- **Database connection error:** Check that XAMPP's MySQL service is running and the database name, username, password, and port match `backend/main.py`.
- **Python dependency error:** Activate the virtual environment and run `pip install -r requirements.txt` from `backend/`.
- **Frontend dependency error:** Run `npm install` from `frontend/`.
- **Frontend cannot connect to backend:** Verify the backend URL and check the backend's CORS configuration.

## Important Notes

- Run the frontend and backend in separate terminals.
- Keep XAMPP running while using the application.
- `backend/requirements.txt` lists Python dependencies; `frontend/package.json` lists JavaScript dependencies.
- Do not upload passwords, `.env` files, virtual environments, or `node_modules` to GitHub.

## Contributors

Add the project contributors here.

