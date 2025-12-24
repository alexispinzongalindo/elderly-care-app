# Patient Care Tracker

## Overview

Patient Care Tracker is a healthcare management web application designed to help users track medications, appointments, and exercises. It provides a dashboard for monitoring daily health activities and maintaining adherence to medical routines. The application features a Flask-based backend with SQLite and a vanilla JavaScript frontend.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**December 7, 2025**:
- **Added Vital Signs Tracker** - Monitor blood pressure, glucose levels, and weight with interactive charts
  - Comprehensive tracking form for blood pressure (systolic/diastolic), blood glucose, and weight
  - Color-coded health indicators: Green (normal BP <130/80, glucose 70-140), Yellow (borderline BP 130-139/80-89, glucose 140-180), Red (high BP ≥140/90, glucose <70 or >180)
  - Interactive line charts using Chart.js showing trends over time
  - Separate charts for blood pressure trends (systolic and diastolic), glucose levels, and weight progression
  - Timestamp-based records with optional notes field
  - **Edit functionality** - Edit any vital sign entry with one click
  - Delete functionality for correcting errors
  - **Apple Health Integration** - Bi-directional sync with Apple Health
    - **Import** - Upload Apple Health CSV exports to import vital signs
      - Automatic parsing of Apple Health CSV format
      - Supports blood pressure, glucose, and weight data
      - Unit conversion (kg to lbs, mmol/L to mg/dL)
      - Bulk import capability
      - Step-by-step import instructions in UI
    - **Export** - Download vital signs in Apple Health compatible CSV format
      - One-click download of all vital signs data
      - Automatic unit conversion (lbs to kg for weight)
      - Apple Health compatible data types (HKQuantityTypeIdentifier)
      - Ready to import into Apple Health or other apps
  - Mobile-responsive design with color-coded sections

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla JavaScript, HTML5, CSS3

The frontend utilizes a single-page application (SPA) pattern without frameworks, prioritizing simplicity and maintainability. Navigation is client-side, and the UI is component-based with a mobile-first responsive design. The color scheme is healthcare-appropriate, using blue for primary elements, green for success, yellow for pending, and red for missed/overdue states.

**Key Design Decisions**:
- **Component-based UI**: Modular sections for dashboard, medications, appointments, and exercises.
- **Responsive design**: CSS custom properties and mobile-first patterns.
- **Client-side routing**: Improves user experience by avoiding full page reloads.
- **Healthcare-appropriate design**: Clean color scheme with intuitive status indicators.

### Backend Architecture

**Technology Stack**: Flask (Python), SQLite3

The backend uses Flask to serve static files and provide RESTful API endpoints. It separates concerns between data access, business logic, and API routing. SQLite is chosen for data persistence due to its simplicity and zero-configuration setup, suitable for single-user or small-scale deployments. The database schema is initialized automatically on first run.

**Database Schema**:
- `medications`: Stores medication details, frequency, and treatment periods.
- `medication_logs`: Tracks adherence with timestamps and status.
- `appointments`: Manages scheduled appointments with detailed information.
- `exercises`: Stores exercise templates.
- `exercise_logs`: Tracks completed exercises.
- `vital_signs`: Stores vital sign measurements including blood pressure (systolic/diastolic), glucose levels, weight, and notes.

**API Endpoints**: RESTful endpoints are provided for managing medications, medication logs, appointments, exercises, exercise logs, dashboard statistics, and calendar activities.

### Deployment Configuration

The application is configured for Replit's autoscale deployment, running the Flask development server on port 5000.

## External Dependencies

### Python Packages

- **Flask**: Web framework.
- **Flask-CORS**: Cross-Origin Resource Sharing.
- **OpenAI**: Official Python client for OpenAI API (installed, not currently used).
- **python-dotenv**: Environment variable management (installed, not currently required).
- **sqlite3**: Built-in Python library for database operations.

### Frontend Libraries

- **Chart.js 4.4.0**: Interactive charting library for visualizing vital signs trends (blood pressure, glucose, weight).

### Database

- **SQLite3**: Embedded relational database (`patient_care.db`) managed via Python's `sqlite3` module.