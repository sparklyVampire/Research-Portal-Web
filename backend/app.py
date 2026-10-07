import os
from datetime import date, datetime
import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# Field definitions
TEXT_FIELDS = {
    "title": 200,
    "description": None,
    "research_area": 100,
    "faculty_name": 100,
    "department": 100,
    "required_skills": 255,
}

ALL_FIELDS = list(TEXT_FIELDS.keys()) + ["available_positions", "application_deadline", "status"]
REQUIRED_FIELDS = list(TEXT_FIELDS.keys()) + ["available_positions", "application_deadline"]


def get_db():
    """Establish and return a connection to MariaDB/MySQL."""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "research_user"),
        password=os.getenv("DB_PASSWORD", "research_pass"),
        database=os.getenv("DB_NAME", "research_portal"),
        port=int(os.getenv("DB_PORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def serialize(row):
    """Convert dates and datetimes to ISO formatted strings."""
    if not row:
        return row
    for key, value in row.items():
        if isinstance(value, (date, datetime)):
            row[key] = value.isoformat()
    return row


def validate_payload(data, partial=False):
    """Validate incoming request body.
    - partial=False (for POST): checks all required fields are present.
    - partial=True (for PUT): validates only fields provided in the body.
    """
    if not isinstance(data, dict):
        return {"body": "Request body must be a valid JSON object"}, {}

    errors = {}
    clean = {}

    # Check missing fields on full create
    if not partial:
        for field in REQUIRED_FIELDS:
            if field not in data or data[field] is None:
                errors[field] = f"'{field}' is required"

    # Validate each supplied field
    for field, value in data.items():
        if field not in ALL_FIELDS:
            continue

        if field in TEXT_FIELDS:
            if not isinstance(value, str) or not value.strip():
                errors[field] = f"'{field}' must be a non-empty string"
            else:
                max_len = TEXT_FIELDS[field]
                val_trimmed = value.strip()
                if max_len and len(val_trimmed) > max_len:
                    errors[field] = f"'{field}' exceeds maximum length of {max_len} characters"
                else:
                    clean[field] = val_trimmed

        elif field == "available_positions":
            try:
                # Accept int or numeric string
                int_val = int(value)
                if isinstance(value, bool) or int_val < 1:
                    errors[field] = "'available_positions' must be an integer >= 1"
                else:
                    clean[field] = int_val
            except (ValueError, TypeError):
                errors[field] = "'available_positions' must be an integer >= 1"

        elif field == "application_deadline":
            try:
                # Validate date format YYYY-MM-DD
                parsed_date = datetime.strptime(str(value).strip(), "%Y-%m-%d").date()
                clean[field] = parsed_date.isoformat()
            except (ValueError, TypeError):
                errors[field] = "'application_deadline' must be a valid date in YYYY-MM-DD format"

        elif field == "status":
            if value not in ("Open", "Closed"):
                errors[field] = "'status' must be either 'Open' or 'Closed'"
            else:
                clean[field] = value

    return errors, clean


def fetch_by_id(cur, opp_id):
    """Helper to fetch a single opportunity by ID."""
    cur.execute("SELECT * FROM opportunities WHERE id = %s", (opp_id,))
    return cur.fetchone()


# CORS support
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# Static frontend serving
@app.route("/")
def index():
    if os.path.exists(os.path.join(FRONTEND_DIR, "index.html")):
        return send_from_directory(FRONTEND_DIR, "index.html")
    return jsonify({
        "message": "Research Opportunity Portal API is running.",
        "endpoints": {
            "GET /api/opportunities": "Retrieve all opportunities",
            "GET /api/opportunities/:id": "Retrieve one opportunity by ID",
            "POST /api/opportunities": "Create a new opportunity",
            "PUT /api/opportunities/:id": "Update an existing opportunity",
            "DELETE /api/opportunities/:id": "Delete an opportunity"
        }
    }), 200


# Post
@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Bad Request", "details": "Request body must be valid JSON"}), 400

    errors, clean = validate_payload(data, partial=False)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    clean.setdefault("status", "Open")

    columns = ", ".join(clean.keys())
    placeholders = ", ".join(["%s"] * len(clean))
    query = f"INSERT INTO opportunities ({columns}) VALUES ({placeholders})"

    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(query, list(clean.values()))
                created_id = cur.lastrowid
                row = fetch_by_id(cur, created_id)
            return jsonify(serialize(row)), 201
        finally:
            conn.close()
    except pymysql.MySQLError as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


# Get
@app.route("/api/opportunities", methods=["GET"])
def get_all_opportunities():
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM opportunities ORDER BY id DESC")
                rows = cur.fetchall()
            return jsonify([serialize(row) for row in rows]), 200
        finally:
            conn.close()
    except pymysql.MySQLError as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route("/api/opportunities/<int:opp_id>", methods=["GET"])
def get_opportunity(opp_id):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                row = fetch_by_id(cur, opp_id)
            if not row:
                return jsonify({"error": f"Opportunity with ID {opp_id} not found"}), 404
            return jsonify(serialize(row)), 200
        finally:
            conn.close()
    except pymysql.MySQLError as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


# Put
@app.route("/api/opportunities/<int:opp_id>", methods=["PUT"])
def update_opportunity(opp_id):
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Bad Request", "details": "Request body must be valid JSON"}), 400

    errors, clean = validate_payload(data, partial=True)
    if not clean and not errors:
        return jsonify({"error": "Bad Request", "details": "No valid fields provided to update"}), 400
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                existing = fetch_by_id(cur, opp_id)
                if not existing:
                    return jsonify({"error": f"Opportunity with ID {opp_id} not found"}), 404

                set_clause = ", ".join(f"{key} = %s" for key in clean.keys())
                update_query = f"UPDATE opportunities SET {set_clause} WHERE id = %s"
                cur.execute(update_query, list(clean.values()) + [opp_id])

                updated_row = fetch_by_id(cur, opp_id)
            return jsonify(serialize(updated_row)), 200
        finally:
            conn.close()
    except pymysql.MySQLError as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


# Delete
@app.route("/api/opportunities/<int:opp_id>", methods=["DELETE"])
def delete_opportunity(opp_id):
    try:
        conn = get_db()
        try:
            with conn.cursor() as cur:
                existing = fetch_by_id(cur, opp_id)
                if not existing:
                    return jsonify({"error": f"Opportunity with ID {opp_id} not found"}), 404
                cur.execute("DELETE FROM opportunities WHERE id = %s", (opp_id,))
            return jsonify({"message": f"Opportunity with ID {opp_id} deleted successfully"}), 200
        finally:
            conn.close()
    except pymysql.MySQLError as e:
        return jsonify({"error": "Database error", "details": str(e)}), 500


# HTTP errors
@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def handle_405(e):
    return jsonify({"error": "HTTP method not allowed for this endpoint"}), 405


@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
