# University Research Opportunity Portal

A web application where faculty members can post, view, update, close and delete research opportunities in one place.

**GitHub Repository:** https://github.com/sparklyVampire/Research-Portal-Web
**Demo Video:** <paste video link here, or "see demo.mp4 in the ZIP">

**Author:** <Saad Ali> | **Roll No:** P24P-0564 | **Class:** (BCS 5C) | **Course:** Computer Networks

---

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Backend   | Python 3, Flask                    |
| Database  | MySQL                              |
| Frontend  | HTML, CSS, JavaScript (Fetch API)  |
| Testing   | Postman                            |

## Project Structure

> Adjust to match your actual folders.

```
research-opportunity-portal/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── database/
│   └── schema.sql
├── postman/
│   └── Research_Opportunity_Portal.postman_collection.json
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.9+
- MySQL Server 8+
- pip
- A modern web browser

## Setup and Run

### 1. Clone the repository
```bash
git clone https://github.com/sparklyVampire/Research-Portal-Web.git
cd research-opportunity-portal
```

### 2. Set up the database
Log in to MySQL and run the schema file:
```bash
mysql -u root -p < database/schema.sql
```
This creates the database and the `opportunities` table.

### 3. Configure environment variables
Copy the example file and fill in your own MySQL credentials:
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=research_portal
```
> `.env` is listed in `.gitignore` and is never committed.

### 4. Install dependencies and start the backend
```bash
python -m venv venv
# Windows:  venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python app.py
```
The API runs at **http://127.0.0.1:5000**.

## API Testing

The exported Postman collection is in `postman/Research_Opportunity_Portal.postman_collection.json`.
Import it in Postman (Import → select file) and run the requests in order. It covers: creating 3 opportunities, get all, get one, update, close, delete, 404 after delete, and an invalid-data request (400).

## Features

- Create, view, update and delete research opportunities (all stored in MySQL)
- View full details of a selected opportunity
- Change status from Open to Closed
- Form validation and success/error messages
- No hard-coded data in the frontend

## Notes

- No credentials are stored in this repository; use `.env.example` as a template.