# Elder Care Management System - Puerto Rico

A comprehensive web application for managing elderly care homes in Puerto Rico with multi-resident support, staff authentication, and bilingual (Spanish/English) interface.

## Features

- 🔐 **Staff Authentication** - Secure login system with role-based access
- 👥 **Multi-Resident Management** - Manage multiple residents with detailed profiles
- 🎓 **Training (Practice Mode)** - Built-in staff training with demo data hidden from normal views (caregivers + admins)
- 🧾 **Practice Reports (Training Only)** - Generate/print practice Journal PDFs using training data (ALL training residents + date range)
- 🗂️ **Documents** - Upload and store resident documents (scanner PDFs or photos), download, and soft delete (admin-only)
- 💊 **Medication Tracking** - Track medications per resident with scheduling
- 📅 **Appointment Management** - Schedule and track medical appointments
- 🩺 **Vital Signs Monitoring** - Record and track vital signs (BP, glucose, temperature, heart rate, weight)
- 🗄️ **Archived Residents** - Soft-delete residents (archive) and restore (admin-only)
- 📊 **Dashboard** - Overview of daily activities and statistics
- 📘 **History / Journal** - Activity timeline with filtering and PDF export
- 🌐 **Bilingual Support** - Spanish/English interface
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Setup

1. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   python3 server.py
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5002`

## Default Login

- **Username:** `admin`
- **Password:** `admin123`

## Usage

1. **Login** - Use the default admin credentials or create new staff accounts
2. **Select Resident** - Choose a resident from the list or add a new one
3. **Manage Data** - Add medications, appointments, and record vital signs
4. **View Dashboard** - See daily overview and statistics
5. **Training (Practice Mode)** - Go to **Training** to create demo residents and generate practice PDFs (training data is hidden from normal Residents/History/Reports)

## Project Structure

```
.
├── server.py          # Flask backend with all APIs
├── index.html         # Frontend HTML
├── script.js          # JavaScript functionality
├── style.css          # Styling
├── requirements.txt   # Python dependencies
├── elder_care.db      # SQLite database (created automatically)
└── README.md          # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Residents
- `GET /api/residents` - List all residents
- `POST /api/residents` - Create new resident
- `GET /api/residents/<id>` - Get resident details
- `PUT /api/residents/<id>` - Update resident
- `DELETE /api/residents/<id>` - Delete resident

### Medications
- `GET /api/medications?resident_id=<id>` - Get medications
- `POST /api/medications` - Add medication
- `PUT /api/medications/<id>` - Update medication
- `DELETE /api/medications/<id>` - Delete medication
- `POST /api/medications/<id>/log` - Log medication taken

### Appointments
- `GET /api/appointments?resident_id=<id>` - Get appointments
- `POST /api/appointments` - Add appointment
- `PUT /api/appointments/<id>` - Update appointment
- `DELETE /api/appointments/<id>` - Delete appointment

### Vital Signs
- `GET /api/vital-signs?resident_id=<id>` - Get vital signs
- `POST /api/vital-signs` - Record vital signs
- `PUT /api/vital-signs/<id>` - Update vital signs
- `DELETE /api/vital-signs/<id>` - Delete vital signs

## Database Schema

The application uses SQLite with the following main tables:
- `staff` - Staff members and authentication
- `residents` - Resident profiles
- `medications` - Medication prescriptions
- `medication_logs` - Medication administration records
- `appointments` - Medical appointments
- `vital_signs` - Vital sign measurements
- `sessions` - Authentication sessions

## Security

- Passwords are hashed using SHA-256
- Session-based authentication with tokens
- Role-based access control (admin, caregiver)
- All API endpoints require authentication

## Deployment

For production deployment:

1. Change the default admin password
2. Use a production WSGI server (e.g., Gunicorn)
3. Set up HTTPS/SSL
4. Configure proper database backups
5. Set environment variables for sensitive data

### Render persistence (production)

If you deploy on Render with SQLite, you must use a **Persistent Disk** and set:

- `DB_PATH=/var/data/elder_care.db`

This prevents losing residents/documents on restarts or redeploys.

## Support

For issues or questions, please check the code comments or contact the development team.

## License

This project is for use in elderly care facilities in Puerto Rico.







