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
- 🩺 **Vital Signs Monitoring** - Record and track vital signs (BP, glucose, temperature, heart rate, weight, respiratory rate, SpO₂, oxygen flow rate, oxygen method, pain score)
- 🗄️ **Archived Residents** - Soft-delete residents (archive) and restore (admin-only)
- 📊 **Dashboard** - Overview of daily activities and statistics
- 📘 **History / Journal** - Activity timeline with filtering and PDF export
- 🌐 **Bilingual Support** - Spanish/English interface
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## App Sections & Features (EN + ES)

### Core Navigation / Navegación principal

- **Dashboard**
  - **EN:** Quick overview of daily operations with KPI cards (med adherence, meds due soon, vitals recorded, incidents, care notes, appointments, active residents/staff) plus "Needs Attention" and recent activity.
  - **ES:** Vista general rápida de la operación diaria con indicadores (adherencia a medicamentos, medicamentos por vencer, signos vitales registrados, incidentes, notas de cuidado, citas, residentes/personal activos), además de "Requiere atención" y actividad reciente.

### Care Management / Gestión de cuidado

- **Residents / Residentes**
  - **EN:** Create and manage resident profiles (demographics, room/bed, photo, emergency contacts, medical conditions, allergies, dietary restrictions). Select a resident to unlock resident-specific pages.
  - **ES:** Cree y administre perfiles de residentes (datos, cuarto/cama, foto, contactos de emergencia, condiciones médicas, alergias, restricciones dietarias). Seleccione un residente para habilitar las páginas por residente.

- **Medications / Medicamentos**
  - **EN:** Maintain each resident's medication list and schedule (dosage, frequency, start/end/ongoing, instructions, scheduled times) and mark doses as taken to track adherence.
  - **ES:** Mantenga la lista y el horario de medicamentos (dosis, frecuencia, inicio/fin/continuo, instrucciones, horas programadas) y marque dosis como administradas para medir la adherencia.

- **Appointments / Citas**
  - **EN:** Track resident appointments (date/time, provider, facility, purpose, location, notes) and update schedules as care changes.
  - **ES:** Registre citas (fecha/hora, proveedor, facilidad, propósito, ubicación, notas) y actualice el calendario según cambien las necesidades de cuidado.

- **Vital Signs / Signos Vitales**
  - **EN:** Record and review vitals over time (BP, glucose, temperature, heart rate, weight, SpO₂ and notes).
  - **ES:** Registre y revise signos vitales a través del tiempo (presión, glucosa, temperatura, pulso, peso, SpO₂ y notas).

- **Care Notes / Notas de Cuidado**
  - **EN:** Daily care documentation covering nutrition/hydration, personal care, mobility/pain, sleep, mood/behavior, activities, and general observations.
  - **ES:** Documentación diaria del cuidado que cubre nutrición/hidratación, cuidado personal, movilidad/dolor, sueño, estado de ánimo/conducta, actividades y observaciones generales.

### Records & Reports / Registros y reportes

- **Incidents / Incidentes**
  - **EN:** Create incident reports with staff/resident selection, incident details, actions taken, witnesses, and photo uploads.
  - **ES:** Cree reportes de incidentes con selección de personal/residentes, detalles, acciones tomadas, testigos y carga de fotos.

- **Calendar / Calendario**
  - **EN:** Central calendar to browse and search activities (appointments, medications, and logged care events).
  - **ES:** Calendario central para ver y buscar actividades (citas, medicamentos y eventos de cuidado registrados).

- **Reports / Reportes**
  - **EN:** Generate report previews by type and date range; export CSV and support print/PDF workflows.
  - **ES:** Genere vistas previas por tipo y rango de fechas; exporta a CSV y apoya flujo de impresión/PDF.

### Financial / Financiero

- **Billing / Facturación**
  - **EN:** Create and manage bills, track status, record payments, and view balance summaries.
  - **ES:** Cree y administre facturas, dé seguimiento a estatus, registre pagos y vea resúmenes de balance.

- **Financial Management / Gestión Financiera** *(Admin/Enabled-area controlled)*
  - **EN:** Manage bank accounts, transactions, reconciliation, and payment receipts.
  - **ES:** Gestione cuentas bancarias, transacciones, conciliación y recibos de pago.

### System / Sistema

- **Notifications / Notificaciones**
  - **EN:** View system notifications and alerts; review and mark items as read.
  - **ES:** Vea notificaciones y alertas; revise y marque como leído.

- **Time Clock / Reloj**
  - **EN:** PIN-based clock actions (clock in/out, break start/end) plus a "My Hours" summary.
  - **ES:** Acciones del reloj con PIN (entrada/salida, inicio/fin de break) y resumen de "Mis horas".

- **History / Journal / Historial**
  - **EN:** Audit-style timeline by resident/staff and date range; supports export/print/email reporting workflows.
  - **ES:** Historial tipo bitácora por residente/personal y rango de fechas; apoya exportación/impresión/envío por correo.

- **Regulations / Regulaciones**
  - **EN:** Search and browse regulations/reference documents for compliance.
  - **ES:** Busque y consulte regulaciones/documentos de referencia para cumplimiento.

- **Training (Practice Mode) / Entrenamiento** *(Admin/Enabled-area controlled)*
  - **EN:** Practice environment with demo residents/data and practice reports.
  - **ES:** Ambiente de práctica con residentes/datos de demostración y reportes de práctica.

- **Documents / Documentos** *(Admin/Enabled-area controlled)*
  - **EN:** Upload and organize resident documents by category (PDF/photo).
  - **ES:** Suba y organice documentos del residente por categoría (PDF/foto).

- **Archived Residents / Residentes Archivados** *(Admin/Enabled-area controlled)*
  - **EN:** Restore previously archived residents back into active care.
  - **ES:** Restaure residentes archivados para que vuelvan a estar activos.

- **Staff / Personal** *(Admin/Enabled-area controlled)*
  - **EN:** Manage staff users/roles and generate PINs for time clock access.
  - **ES:** Administre usuarios/roles y genere PINs para acceso al reloj.

- **Payroll / Nómina** *(Admin/Enabled-area controlled)*
  - **EN:** Generate payroll reports by date range and staff selection; export CSV.
  - **ES:** Genere reportes de nómina por rango de fechas y personal; exporta a CSV.

- **Settings / Configuración** *(Admin/Enabled-area controlled)*
  - **EN:** Configure enabled areas/modules and landing-page behavior.
  - **ES:** Configure áreas/módulos habilitados y el comportamiento del "landing".

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

## Landing Page (Login) Quick Links

On the login screen, you can open:

- **What's New** - Summary of the latest updates
- **User Manual** - Quick guide for daily workflow

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







