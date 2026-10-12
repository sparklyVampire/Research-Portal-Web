# University Research Opportunity Portal

A web application where faculty members can post, view, update, close, and manage research opportunities in one centralized portal.

- **Student Name:** Saad Ali
- **Roll Number:** 24P-0564
- **Course:** Computer Networks (BCS 5C)
- **GitHub Repository:** https://github.com/sparklyVampire/Research-Portal-Web
- **Demonstration Video:** `demo.mp4` (included in repository root)

---

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Python 3, Flask, PyMySQL |
| **Database** | MySQL |
| **Frontend** | HTML5, CSS3, JavaScript (Fetch API) |
| **Testing** | Postman |

---

## Project Structure

```
Research-Portal-Web/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── database/
│   └── schema.sql
├── postman/
│   └── Research_Opportunity_Portal.postman_collection.json
├── demo.mp4
├── .gitignore
└── README.md
```

---

## Prerequisites

- Python 3.9+
- MySQL Server 8+
- Modern Web Browser (Chrome, Firefox, Edge)

---

## Setup and Running

### 1. Database Setup
Log in to MySQL and run the schema file:
```bash
mysql -u root -p < database/schema.sql
```
This creates the `research_portal` database and the `opportunities` table.

### 2. Environment Configuration
Navigate to the `backend/` directory, copy the example file, and configure your MySQL credentials:
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=research_portal
DB_PORT=3306
```
> Note: `.env` is listed in `.gitignore` and private credentials are never committed.

### 3. Install Dependencies & Start Backend
From the `backend/` directory:
```bash
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
The Flask backend runs at **http://127.0.0.1:5000**.

### 4. Access the Frontend
Open your browser and navigate to:
```
http://127.0.0.1:5000
```
*(The Flask server serves `frontend/index.html` directly, or you can open `frontend/index.html` directly in your browser).*

---

## REST API Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/opportunities` | Create a new research opportunity | `201 Created`, `400 Bad Request` |
| `GET` | `/api/opportunities` | Retrieve all research opportunities | `200 OK` |
| `GET` | `/api/opportunities/:id` | Retrieve details of a specific opportunity | `200 OK`, `404 Not Found` |
| `PUT` | `/api/opportunities/:id` | Update opportunity details or status | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/opportunities/:id` | Delete an opportunity | `200 OK`, `404 Not Found` |

---

## Postman API Testing

An exported Postman collection is available at:
`postman/Research_Opportunity_Portal.postman_collection.json`

### Import & Test Instructions:
1. Open Postman and click **Import**.
2. Select `postman/Research_Opportunity_Portal.postman_collection.json`.
3. Run the requests to verify all assignment criteria:
   1. **Create Opportunities:** Creates 3 sample opportunities (`201 Created`).
   2. **Retrieve All:** Returns all opportunities from the database (`200 OK`).
   3. **Retrieve by ID:** Returns full details of an opportunity (`200 OK`).
   4. **Update Opportunity:** Updates fields like required skills and positions (`200 OK`).
   5. **Close Opportunity:** Updates status from `Open` to `Closed` (`200 OK`).
   6. **Delete Opportunity:** Deletes the opportunity (`200 OK`).
   7. **Verify Deletion (404):** Requests the deleted opportunity to demonstrate `404 Not Found`.
   8. **Input Validation (400):** Sends missing/invalid fields to demonstrate `400 Bad Request`.

---

## Features Implemented

- **Full CRUD Support:** Create, read (all and single), update, and delete opportunities backed by MySQL.
- **Dynamic Frontend:** Clean UI communicating with backend REST API without hard-coded data.
- **Opportunity Details Modal:** View full details for any selected opportunity.
- **Status Toggling:** Quickly change opportunity status between `Open` and `Closed`.
- **Validation & Error Handling:** Input validation with clear feedback and proper HTTP status codes (`200`, `201`, `400`, `404`, `500`).