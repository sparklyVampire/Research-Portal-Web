// API Base URL configuration
const API_BASE = window.location.protocol.startsWith("http")
    ? `${window.location.origin}/api/opportunities`
    : "http://127.0.0.1:5000/api/opportunities";

// Bootstrap modal instances
let detailsModalInstance = null;
let formModalInstance = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    detailsModalInstance = new bootstrap.Modal(document.getElementById("detailsModal"));
    formModalInstance = new bootstrap.Modal(document.getElementById("formModal"));
    loadOpportunities();
});

// Show notification banner
function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    const alertMessage = document.getElementById("alertMessage");

    alertBox.className = `alert alert-${type} alert-dismissible fade show`;
    alertMessage.textContent = message;
    alertBox.classList.remove("d-none");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Hide notification banner
function hideAlert() {
    const alertBox = document.getElementById("alertBox");
    alertBox.classList.add("d-none");
}

// Helper to escape HTML and prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 1. Fetch & Display all opportunities
async function loadOpportunities() {
    const tbody = document.getElementById("opportunitiesTableBody");
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            throw new Error(`Failed to load opportunities (HTTP ${response.status})`);
        }
        const data = await response.json();

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        No research opportunities posted yet. Click <strong>+ Post New Opportunity</strong> to create one.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const isClosed = item.status === "Closed";
            const badgeClass = isClosed ? "badge-closed" : "badge-open";
            const toggleActionText = isClosed ? "Open" : "Close";
            const toggleBtnClass = isClosed ? "btn-outline-success" : "btn-outline-warning";

            return `
                <tr>
                    <td><span class="badge bg-light text-dark border">#${escapeHtml(item.id)}</span></td>
                    <td class="fw-semibold">${escapeHtml(item.title)}</td>
                    <td><span class="badge bg-info-subtle text-info-emphasis border">${escapeHtml(item.research_area)}</span></td>
                    <td>
                        <div>${escapeHtml(item.faculty_name)}</div>
                        <small class="text-muted">${escapeHtml(item.department)}</small>
                    </td>
                    <td><span class="badge bg-secondary-subtle text-dark">${escapeHtml(item.available_positions)}</span></td>
                    <td><small>${escapeHtml(item.application_deadline)}</small></td>
                    <td><span class="badge ${badgeClass}">${escapeHtml(item.status)}</span></td>
                    <td class="text-end">
                        <div class="action-group">
                        <button class="btn btn-sm btn-outline-primary" title="View Details" onclick="viewDetails(${item.id})">View</button>
                        <button class="btn btn-sm btn-outline-secondary" title="Edit" onclick="openEditModal(${item.id})">Edit</button>
                        <button class="btn btn-sm ${toggleBtnClass}" title="Toggle Open/Closed" onclick="toggleStatus(${item.id}, '${escapeHtml(item.status)}')">
                            ${toggleActionText}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteOpportunity(${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    Error connecting to backend: ${escapeHtml(err.message)}
                </td>
            </tr>
        `;
    }
}

// 2. View details of a single opportunity
async function viewDetails(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch opportunity #${id}`);
        }
        const item = await response.json();

        document.getElementById("viewTitle").textContent = item.title;
        const statusSpan = document.getElementById("viewStatus");
        statusSpan.textContent = item.status;
        statusSpan.className = `badge ${item.status === 'Closed' ? 'badge-closed' : 'badge-open'}`;

        document.getElementById("viewArea").textContent = item.research_area;
        document.getElementById("viewFacultyDept").textContent = `${item.faculty_name} (${item.department})`;
        document.getElementById("viewPositions").textContent = item.available_positions;
        document.getElementById("viewDeadline").textContent = item.application_deadline;
        document.getElementById("viewSkills").textContent = item.required_skills;
        document.getElementById("viewDescription").textContent = item.description;

        detailsModalInstance.show();
    } catch (err) {
        showAlert(err.message, "danger");
    }
}

// 3. Open Create Modal
function openCreateModal() {
    hideAlert();
    document.getElementById("opportunityForm").reset();
    document.getElementById("opportunityId").value = "";
    document.getElementById("formStatus").value = "Open";
    document.getElementById("formModalLabel").textContent = "Post Research Opportunity";
    document.getElementById("saveBtn").textContent = "Create Opportunity";
    formModalInstance.show();
}

// 4. Open Edit Modal
async function openEditModal(id) {
    hideAlert();
    try {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) {
            throw new Error(`Failed to load opportunity #${id}`);
        }
        const item = await response.json();

        document.getElementById("opportunityId").value = item.id;
        document.getElementById("formTitle").value = item.title;
        document.getElementById("formArea").value = item.research_area;
        document.getElementById("formFaculty").value = item.faculty_name;
        document.getElementById("formDept").value = item.department;
        document.getElementById("formPositions").value = item.available_positions;
        document.getElementById("formDeadline").value = item.application_deadline;
        document.getElementById("formSkills").value = item.required_skills;
        document.getElementById("formStatus").value = item.status;
        document.getElementById("formDescription").value = item.description;

        document.getElementById("formModalLabel").textContent = `Edit Research Opportunity #${id}`;
        document.getElementById("saveBtn").textContent = "Save Changes";
        formModalInstance.show();
    } catch (err) {
        showAlert(err.message, "danger");
    }
}

// 5. Handle Form Submit (Create or Update)
async function handleFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById("opportunityId").value;
    const isEdit = Boolean(id);

    const payload = {
        title: document.getElementById("formTitle").value.trim(),
        research_area: document.getElementById("formArea").value.trim(),
        faculty_name: document.getElementById("formFaculty").value.trim(),
        department: document.getElementById("formDept").value.trim(),
        available_positions: parseInt(document.getElementById("formPositions").value, 10),
        application_deadline: document.getElementById("formDeadline").value.trim(),
        required_skills: document.getElementById("formSkills").value.trim(),
        description: document.getElementById("formDescription").value.trim(),
        status: document.getElementById("formStatus").value
    };

    // Form validation check
    for (const [key, value] of Object.entries(payload)) {
        if (!value && value !== 0) {
            showAlert(`Field '${key}' cannot be empty.`, "warning");
            return;
        }
    }

    if (payload.available_positions < 1) {
        showAlert("Available positions must be at least 1.", "warning");
        return;
    }

    try {
        const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
        const method = isEdit ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            const errorDetails = result.details
                ? (typeof result.details === "object" ? JSON.stringify(result.details) : result.details)
                : result.error || "Operation failed.";
            showAlert(`Error: ${errorDetails}`, "danger");
            return;
        }

        formModalInstance.hide();
        showAlert(isEdit ? `Opportunity #${id} updated successfully!` : "New research opportunity posted successfully!", "success");
        loadOpportunities();

    } catch (err) {
        showAlert(`Network error: ${err.message}`, "danger");
    }
}

// 6. Toggle Status (Open <-> Closed)
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "Open" ? "Closed" : "Open";
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        if (!response.ok) {
            showAlert(`Failed to update status: ${result.error || "Server error"}`, "danger");
            return;
        }

        showAlert(`Opportunity #${id} status changed to ${newStatus}.`, "success");
        loadOpportunities();
    } catch (err) {
        showAlert(`Network error: ${err.message}`, "danger");
    }
}

// 7. Delete an Opportunity
async function deleteOpportunity(id) {
    if (!confirm(`Are you sure you want to delete research opportunity #${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();
        if (!response.ok) {
            showAlert(`Failed to delete: ${result.error || "Server error"}`, "danger");
            return;
        }

        showAlert(`Opportunity #${id} deleted successfully.`, "success");
        loadOpportunities();
    } catch (err) {
        showAlert(`Network error: ${err.message}`, "danger");
    }
}