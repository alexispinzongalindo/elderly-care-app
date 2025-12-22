from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
import os
import sys
import threading
import time
import re
import io

# Import email service
try:
    from email_service import (
        send_medication_alert,
        send_vital_signs_alert,
        send_incident_alert,
        send_custom_alert,
        send_email
    )
    EMAIL_SERVICE_AVAILABLE = True
    # Check email configuration on startup
    sender_email = os.getenv('SENDER_EMAIL', '')
    sender_password = os.getenv('SENDER_PASSWORD', '')
    if not sender_email or not sender_password:
        print("⚠️ WARNING: Email service available but not configured!")
        print(f"   SENDER_EMAIL: {'SET' if sender_email else 'NOT SET'}")
        print(f"   SENDER_PASSWORD: {'SET' if sender_password else 'NOT SET'}")
        print("   Email notifications will NOT work until environment variables are set.")
    else:
        print(f"✅ Email service configured and ready")
        print(f"   Sender: {sender_email}")
except ImportError:
    EMAIL_SERVICE_AVAILABLE = False
    print("⚠️ Email service not available. Email notifications will be disabled.")

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

# Import SMS service - supports both ClickSend API and email-to-SMS gateway
# Priority: ClickSend (if configured) > email-to-SMS (free fallback)
USE_CLICKSEND = os.getenv('CLICKSEND_API_KEY', '') and os.getenv('CLICKSEND_USERNAME', '')

SMS_SERVICE_AVAILABLE = False
send_medication_alert_sms = None
send_vital_signs_alert_sms = None
send_incident_alert_sms = None
send_custom_alert_sms = None

if USE_CLICKSEND:
    # Try ClickSend first (more reliable, costs ~$0.09/SMS)
    try:
        from clicksend_sms import (
            send_medication_alert_sms,
            send_vital_signs_alert_sms,
            send_incident_alert_sms,
            send_custom_alert_sms
        )
        SMS_SERVICE_AVAILABLE = True
        print("✅ SMS service available via ClickSend API")
    except ImportError:
        print("⚠️ ClickSend configured but clicksend_sms.py not found. Falling back to email-to-SMS.")
        USE_CLICKSEND = False

if not USE_CLICKSEND:
    # Fallback to email-to-SMS gateway (FREE alternative to Twilio)
    try:
        from sms_service import (
            send_medication_alert_sms,
            send_vital_signs_alert_sms,
            send_incident_alert_sms,
            send_custom_alert_sms
        )
        SMS_SERVICE_AVAILABLE = True
        print("✅ SMS service available (email-to-SMS gateway - FREE)")
    except ImportError:
        SMS_SERVICE_AVAILABLE = False
        print("⚠️ SMS service not available. SMS notifications will be disabled.")

app = Flask(__name__, static_folder='.')
CORS(app)

DATABASE = os.getenv('DB_PATH', 'elder_care.db')

def get_db():
    db_dir = os.path.dirname(DATABASE)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_staff_display_name(conn, staff_id):
    if not staff_id:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT full_name FROM staff WHERE id = ?', (staff_id,))
        row = cursor.fetchone()
        return row['full_name'] if row and row['full_name'] else None
    except Exception:
        return None

def _journal_entry_exists(conn, source_table, source_id):
    try:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT 1 FROM journal_entries WHERE source_table = ? AND source_id = ? LIMIT 1',
            (source_table, source_id)
        )
        return cursor.fetchone() is not None
    except Exception:
        return False

def backfill_journal_entries(conn):
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) AS count FROM journal_entries')
        row = cursor.fetchone()
        if row and int(row['count']) > 0:
            return

        cursor.execute('SELECT id, resident_id, recorded_at, systolic, diastolic, glucose, weight, temperature, heart_rate, notes, staff_id FROM vital_signs ORDER BY COALESCE(recorded_at, id) ASC')
        for vs in cursor.fetchall() or []:
            if _journal_entry_exists(conn, 'vital_signs', vs['id']):
                continue
            resident_name = 'Unknown Resident'
            try:
                cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (int(vs['resident_id']),))
                resident_row = cursor.fetchone()
                if resident_row:
                    resident_name = f"{resident_row['first_name']} {resident_row['last_name']}"
            except Exception:
                pass
            parts = []
            if vs['systolic'] is not None and vs['diastolic'] is not None:
                parts.append(f"BP: {vs['systolic']}/{vs['diastolic']}")
            if vs['heart_rate'] is not None:
                parts.append(f"HR: {vs['heart_rate']}")
            if vs['temperature'] is not None:
                parts.append(f"Temp: {vs['temperature']}")
            if vs['glucose'] is not None:
                parts.append(f"Glucose: {vs['glucose']}")
            if vs['weight'] is not None:
                parts.append(f"Weight: {vs['weight']}")
            details = f"{resident_name} - " + (' | '.join(parts) if parts else 'Vitals recorded')
            if vs['notes']:
                details = (details + ' | ' if details else '') + str(vs['notes']).strip()

            create_journal_entry(
                conn,
                resident_id=int(vs['resident_id']),
                entry_type='vital_signs',
                title='Vital Signs Recorded',
                details=details,
                occurred_at=(vs['recorded_at'] or datetime.utcnow().isoformat() + 'Z'),
                staff_id=int(vs['staff_id']) if vs['staff_id'] else None,
                staff_name=get_staff_display_name(conn, int(vs['staff_id'])) if vs['staff_id'] else None,
                source_table='vital_signs',
                source_id=int(vs['id'])
            )

        cursor.execute('SELECT id, resident_id, incident_date, incident_type, severity, description, staff_id FROM incident_reports ORDER BY COALESCE(incident_date, created_at) ASC')
        for inc in cursor.fetchall() or []:
            if _journal_entry_exists(conn, 'incident_reports', inc['id']):
                continue
            severity = (inc['severity'] or 'minor')
            incident_type = (inc['incident_type'] or 'Incident')
            description = (inc['description'] or '').strip()
            details = incident_type + (f" | {description[:200]}" if description else '')

            create_journal_entry(
                conn,
                resident_id=int(inc['resident_id']),
                entry_type='incident',
                title=f"Incident Reported ({severity})",
                details=details,
                occurred_at=(inc['incident_date'] or datetime.utcnow().isoformat() + 'Z'),
                staff_id=int(inc['staff_id']) if inc['staff_id'] else None,
                staff_name=get_staff_display_name(conn, int(inc['staff_id'])) if inc['staff_id'] else None,
                source_table='incident_reports',
                source_id=int(inc['id'])
            )

        cursor.execute('SELECT id, resident_id, note_date, note_time, shift, general_notes, staff_id, created_at FROM daily_care_notes ORDER BY COALESCE(created_at, note_date) ASC')
        for note in cursor.fetchall() or []:
            if _journal_entry_exists(conn, 'daily_care_notes', note['id']):
                continue
            shift = (note['shift'] or '').strip()
            general_notes = (note['general_notes'] or '').strip()
            details = ''
            if shift:
                details = f"Shift: {shift}"
            if general_notes:
                details = (details + ' | ' if details else '') + general_notes[:300]

            occurred_at = None
            if note['note_date'] and note['note_time']:
                occurred_at = f"{note['note_date']}T{note['note_time']}Z"
            else:
                occurred_at = note['created_at'] or datetime.utcnow().isoformat() + 'Z'

            create_journal_entry(
                conn,
                resident_id=int(note['resident_id']),
                entry_type='care_note',
                title='Care Note Created',
                details=details,
                occurred_at=occurred_at,
                staff_id=int(note['staff_id']) if note['staff_id'] else None,
                staff_name=get_staff_display_name(conn, int(note['staff_id'])) if note['staff_id'] else None,
                source_table='daily_care_notes',
                source_id=int(note['id'])
            )

        cursor.execute('''
            SELECT ml.id, ml.medication_id, ml.taken_at, ml.scheduled_time, ml.status, ml.staff_id,
                   m.resident_id, m.name, m.dosage
            FROM medication_logs ml
            JOIN medications m ON m.id = ml.medication_id
            ORDER BY COALESCE(ml.taken_at, ml.id) ASC
        ''')
        for ml in cursor.fetchall() or []:
            if _journal_entry_exists(conn, 'medication_logs', ml['id']):
                continue
            med_name = (ml['name'] or 'Medication')
            dosage = (ml['dosage'] or '').strip()
            status = (ml['status'] or '').strip().lower()
            scheduled = (ml['scheduled_time'] or '').strip()

            title = 'Medication Logged'
            if status == 'taken':
                title = 'Medication Administered'
            elif status == 'missed':
                title = 'Medication Missed'

            details = med_name + (f" ({dosage})" if dosage else '')
            if scheduled:
                details += f" | Scheduled: {scheduled}"
            if status:
                details += f" | Status: {status}"

            create_journal_entry(
                conn,
                resident_id=int(ml['resident_id']),
                entry_type='medication',
                title=title,
                details=details,
                occurred_at=(ml['taken_at'] or datetime.utcnow().isoformat() + 'Z'),
                staff_id=int(ml['staff_id']) if ml['staff_id'] else None,
                staff_name=get_staff_display_name(conn, int(ml['staff_id'])) if ml['staff_id'] else None,
                source_table='medication_logs',
                source_id=int(ml['id'])
            )
    except Exception as e:
        print(f"⚠️ Warning: Journal backfill failed: {e}")

def create_journal_entry(conn, *, resident_id, entry_type, title, details, occurred_at=None, staff_id=None, staff_name=None, source_table=None, source_id=None):
    try:
        if not staff_name and staff_id:
            staff_name = get_staff_display_name(conn, staff_id)

        conn.cursor().execute('''
            INSERT INTO journal_entries (
                resident_id, entry_type, title, details,
                occurred_at,
                staff_id, staff_name,
                source_table, source_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            resident_id,
            entry_type,
            title,
            details,
            occurred_at,
            staff_id,
            staff_name,
            source_table,
            source_id
        ))
    except Exception as e:
        print(f"⚠️ Warning: Could not create journal entry: {e}")

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Staff/Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'caregiver',
            email TEXT,
            phone TEXT,
            preferred_language TEXT DEFAULT 'en',
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Add preferred_language column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE staff ADD COLUMN preferred_language TEXT DEFAULT "en"')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Add phone_carrier column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE staff ADD COLUMN phone_carrier TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Add emergency_contact_email column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE residents ADD COLUMN emergency_contact_email TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Add emergency_contact_carrier column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE residents ADD COLUMN emergency_contact_carrier TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Residents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            date_of_birth DATE,
            room_number TEXT,
            bed_number TEXT,
            gender TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            emergency_contact_relation TEXT,
            insurance_provider TEXT,
            insurance_number TEXT,
            medical_conditions TEXT,
            allergies TEXT,
            dietary_restrictions TEXT,
            notes TEXT,
            photo_path TEXT,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Medications table (linked to residents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            time_slots TEXT NOT NULL,
            hours_interval INTEGER,
            start_date DATETIME,
            end_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active BOOLEAN DEFAULT 1,
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
    ''')

    # Add hours_interval column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE medications ADD COLUMN hours_interval INTEGER')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Medication logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medication_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medication_id INTEGER NOT NULL,
            taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            scheduled_time TEXT NOT NULL,
            status TEXT NOT NULL,
            staff_id INTEGER,
            FOREIGN KEY (medication_id) REFERENCES medications (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Appointments table (linked to residents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            doctor_name TEXT NOT NULL,
            facility TEXT,
            purpose TEXT,
            notes TEXT,
            completed BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
    ''')

    # Vital signs table (linked to residents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vital_signs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            systolic INTEGER,
            diastolic INTEGER,
            glucose REAL,
            weight REAL,
            temperature REAL,
            heart_rate INTEGER,
            notes TEXT,
            staff_id INTEGER,
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Billing table (linked to residents)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS billing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            billing_date DATE NOT NULL,
            due_date DATE NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            category TEXT,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
    ''')

    # Payments table (linked to billing)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            billing_id INTEGER,
            resident_id INTEGER NOT NULL,
            payment_date DATE NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT,
            reference_number TEXT,
            notes TEXT,
            staff_id INTEGER,
            receipt_number TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (billing_id) REFERENCES billing (id),
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Add receipt_number column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE payments ADD COLUMN receipt_number TEXT UNIQUE')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Bank Accounts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            account_number TEXT,
            bank_name TEXT NOT NULL,
            account_type TEXT DEFAULT 'checking',
            routing_number TEXT,
            opening_balance REAL DEFAULT 0,
            current_balance REAL DEFAULT 0,
            active BOOLEAN DEFAULT 1,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Transactions table (for checkbook reconciliation)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_account_id INTEGER NOT NULL,
            resident_id INTEGER,
            transaction_date DATE NOT NULL,
            transaction_type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            check_number TEXT,
            payee TEXT,
            category TEXT,
            reconciled BOOLEAN DEFAULT 0,
            reconciled_date DATE,
            payment_id INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (payment_id) REFERENCES payments (id)
        )
    ''')

    # Add resident_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE transactions ADD COLUMN resident_id INTEGER')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Reconciliation records
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reconciliation_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_account_id INTEGER NOT NULL,
            statement_date DATE NOT NULL,
            statement_balance REAL NOT NULL,
            cleared_balance REAL NOT NULL,
            outstanding_deposits REAL DEFAULT 0,
            outstanding_checks REAL DEFAULT 0,
            difference REAL DEFAULT 0,
            reconciled_by INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id),
            FOREIGN KEY (reconciled_by) REFERENCES staff (id)
        )
    ''')

    # Sessions table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Incident Reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incident_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            incident_date DATETIME NOT NULL,
            incident_type TEXT NOT NULL,
            location TEXT,
            description TEXT NOT NULL,
            severity TEXT DEFAULT 'minor',
            witnesses TEXT,
            actions_taken TEXT,
            family_notified BOOLEAN DEFAULT 0,
            family_notification_date DATETIME,
            follow_up_required BOOLEAN DEFAULT 0,
            follow_up_notes TEXT,
            photos TEXT,
            residents_involved TEXT,
            staff_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Add residents_involved column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE incident_reports ADD COLUMN residents_involved TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Daily Care Notes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_care_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            note_date DATE NOT NULL,
            note_time TIME,
            shift TEXT,
            meal_breakfast TEXT,
            meal_lunch TEXT,
            meal_dinner TEXT,
            meal_snacks TEXT,
            appetite_rating TEXT,
            fluid_intake TEXT,
            bathing TEXT,
            hygiene TEXT,
            toileting TEXT,
            mobility TEXT,
            pain_level TEXT,
            pain_location TEXT,
            skin_condition TEXT,
            sleep_hours REAL,
            sleep_quality TEXT,
            mood TEXT,
            behavior_notes TEXT,
            activities TEXT,
            general_notes TEXT,
            staff_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Add new columns to existing table if they don't exist (migration)
    new_columns = [
        ('note_time', 'TIME'),
        ('appetite_rating', 'TEXT'),
        ('fluid_intake', 'TEXT'),
        ('toileting', 'TEXT'),
        ('mobility', 'TEXT'),
        ('pain_level', 'TEXT'),
        ('pain_location', 'TEXT'),
        ('skin_condition', 'TEXT')
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f'ALTER TABLE daily_care_notes ADD COLUMN {col_name} {col_type}')
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER,
            notification_type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT DEFAULT 'normal',
            read BOOLEAN DEFAULT 0,
            action_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
    ''')

    # Journal / History table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER NOT NULL,
            entry_type TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT,
            occurred_at DATETIME,
            staff_id INTEGER,
            staff_name TEXT,
            source_table TEXT,
            source_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')

    # Create default admin user if no staff exists
    cursor.execute('SELECT COUNT(*) as count FROM staff')
    if cursor.fetchone()['count'] == 0:
        default_password = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute('''
            INSERT INTO staff (username, password_hash, full_name, role, email, active)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('admin', default_password, 'Administrator', 'admin', 'admin@eldercare.pr', 1))
        print('✅ Default admin user created: username=admin, password=admin123')

    backfill_journal_entries(conn)

    conn.commit()
    conn.close()

_db_initialized = False

def ensure_db_initialized():
    global _db_initialized
    if _db_initialized:
        return
    try:
        init_db()
    except Exception as e:
        print(f"⚠️ Warning: init_db failed: {e}")
    finally:
        _db_initialized = True

ensure_db_initialized()

# Authentication helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    return hash_password(password) == password_hash

def generate_session_token():
    return secrets.token_urlsafe(32)

def format_phone_number(phone):
    """
    Format phone number as (XXX) XXX-XXXX for display
    Returns the formatted string or original if invalid
    """
    if not phone:
        return phone

    # Remove all non-digits
    digits = re.sub(r'\D', '', str(phone))

    # Remove leading 1 if present (US country code)
    if digits.startswith('1') and len(digits) == 11:
        digits = digits[1:]

    # Format as (XXX) XXX-XXXX if 10 digits
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"

    # Return original if can't format
    return phone

def _normalize_person_name_part(value: str) -> str:
    if value is None:
        return ''
    return str(value).strip()

def _resident_display_name(first_name, last_name) -> str:
    first = _normalize_person_name_part(first_name)
    last = _normalize_person_name_part(last_name)
    full = f"{first} {last}".strip()
    # Collapse multiple spaces
    return re.sub(r'\s+', ' ', full)

def get_current_staff(request):
    """Get current logged-in staff from session token"""
    session_token = request.headers.get('Authorization')
    if not session_token or not session_token.startswith('Bearer '):
        return None

    token = session_token.replace('Bearer ', '')
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT s.* FROM sessions ses
        JOIN staff s ON ses.staff_id = s.id
        WHERE ses.session_token = ? AND ses.expires_at > datetime('now') AND s.active = 1
    ''', (token,))

    staff = cursor.fetchone()
    conn.close()

    if staff:
        return dict(staff)
    return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        staff = get_current_staff(request)
        if not staff:
            return jsonify({'error': 'Authentication required'}), 401
        request.current_staff = staff
        return f(*args, **kwargs)
    return decorated_function

def require_role(*allowed_roles):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            staff = get_current_staff(request)
            if not staff:
                return jsonify({'error': 'Authentication required'}), 401
            if staff['role'] not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            request.current_staff = staff
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received / No se recibieron datos'}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'error': 'Username and password required / Se requiere usuario y contraseña'}), 400

        conn = get_db()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute('SELECT * FROM staff WHERE username = ? AND active = 1', (username,))
        staff = cursor.fetchone()

        if not staff:
            conn.close()
            print(f'Login failed: User not found or inactive - {username}')
            return jsonify({'error': 'Invalid credentials / Credenciales inválidas'}), 401

        # Verify password
        password_hash = staff['password_hash']
        if not verify_password(password, password_hash):
            conn.close()
            print(f'Login failed: Invalid password for user - {username}')
            return jsonify({'error': 'Invalid credentials / Credenciales inválidas'}), 401

        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now() + timedelta(days=1)

        cursor.execute('''
            INSERT INTO sessions (staff_id, session_token, expires_at)
            VALUES (?, ?, ?)
        ''', (staff['id'], session_token, expires_at))

        conn.commit()
        conn.close()

        print(f'Login successful for user: {username}')
        # Get preferred_language, handling both dict and Row object access
        preferred_lang = 'en'
        if 'preferred_language' in staff.keys():
            preferred_lang = staff['preferred_language'] or 'en'

        return jsonify({
            'token': session_token,
            'staff': {
                'id': staff['id'],
                'username': staff['username'],
                'full_name': staff['full_name'],
                'role': staff['role'],
                'email': staff['email'],
                'preferred_language': preferred_lang
            }
        })
    except Exception as e:
        print(f'Login error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)} / Error del servidor'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    session_token = request.headers.get('Authorization', '').replace('Bearer ', '')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM sessions WHERE session_token = ?', (session_token,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    # Get preferred_language, handling both dict and Row object access
    preferred_lang = 'en'
    if 'preferred_language' in request.current_staff.keys():
        preferred_lang = request.current_staff['preferred_language'] or 'en'

    return jsonify({
        'id': request.current_staff['id'],
        'username': request.current_staff['username'],
        'full_name': request.current_staff['full_name'],
        'role': request.current_staff['role'],
        'email': request.current_staff['email'],
        'preferred_language': preferred_lang
    })

@app.route('/api/staff/language', methods=['PUT'])
@require_auth
def update_staff_language():
    try:
        data = request.json
        language = data.get('language', 'en')

        if language not in ['en', 'es']:
            return jsonify({'error': 'Invalid language. Must be "en" or "es"'}), 400

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE staff SET preferred_language = ? WHERE id = ?', (language, request.current_staff['id']))
        conn.commit()
        conn.close()

        # Update current staff object
        request.current_staff['preferred_language'] = language

        return jsonify({'message': 'Language preference updated', 'language': language})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Residents endpoints
@app.route('/api/residents', methods=['GET', 'POST'])
@require_auth
def residents():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        query = 'SELECT * FROM residents'
        if active_only:
            query += ' WHERE active = 1'
        query += ' ORDER BY last_name, first_name'

        cursor.execute(query)
        residents_list = []
        for row in cursor.fetchall():
            resident_dict = dict(row)
            resident_dict['full_name'] = _resident_display_name(resident_dict.get('first_name'), resident_dict.get('last_name'))
            resident_dict['display_name'] = resident_dict['full_name']
            # Format emergency contact phone number for display
            if resident_dict.get('emergency_contact_phone'):
                resident_dict['emergency_contact_phone_formatted'] = format_phone_number(resident_dict['emergency_contact_phone'])
            residents_list.append(resident_dict)
        conn.close()
        return jsonify(residents_list)

    elif request.method == 'POST':
        try:
            data = request.json
            if not data:
                conn.close()
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            if not data.get('first_name') or not data.get('first_name').strip():
                conn.close()
                return jsonify({'error': 'First name is required / El nombre es requerido'}), 400

            if not data.get('last_name') or not data.get('last_name').strip():
                conn.close()
                return jsonify({'error': 'Last name is required / El apellido es requerido'}), 400

            first_name = _normalize_person_name_part(data.get('first_name'))
            last_name = _normalize_person_name_part(data.get('last_name'))

            # Get carrier value and normalize empty strings to None
            carrier_value = data.get('emergency_contact_carrier')
            if carrier_value == '' or carrier_value is None:
                carrier_value = None
            print(f"📱 [INSERT] Emergency contact carrier value: '{carrier_value}' (type: {type(carrier_value).__name__})", flush=True)

            cursor.execute('''
                INSERT INTO residents (
                    first_name, last_name, date_of_birth, room_number, bed_number,
                    gender, emergency_contact_name, emergency_contact_phone, emergency_contact_carrier,
                    emergency_contact_relation, emergency_contact_email, insurance_provider, insurance_number,
                    medical_conditions, allergies, dietary_restrictions, notes, photo_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                first_name,
                last_name,
                data.get('date_of_birth'),
                data.get('room_number'),
                data.get('bed_number'),
                data.get('gender'),
                data.get('emergency_contact_name'),
                data.get('emergency_contact_phone'),
                carrier_value,  # Carrier for SMS (None if empty)
                data.get('emergency_contact_relation'),
                data.get('emergency_contact_email'),
                data.get('insurance_provider'),
                data.get('insurance_number'),
                data.get('medical_conditions'),
                data.get('allergies'),
                data.get('dietary_restrictions'),
                data.get('notes'),
                data.get('photo_path')
            ))
            conn.commit()
            resident_id = cursor.lastrowid
            conn.close()
            return jsonify({'id': resident_id, 'message': 'Resident added successfully'}), 201
        except sqlite3.Error as e:
            conn.rollback()
            conn.close()
            print(f"Database error adding resident: {e}")
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        except Exception as e:
            conn.rollback()
            conn.close()
            print(f"Error adding resident: {e}")
            return jsonify({'error': f'Error adding resident: {str(e)}'}), 500

@app.route('/api/residents/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def resident_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM residents WHERE id = ?', (id,))
        resident = cursor.fetchone()
        if not resident:
            conn.close()
            return jsonify({'error': 'Resident not found'}), 404
        resident_dict = dict(resident)
        resident_dict['full_name'] = _resident_display_name(resident_dict.get('first_name'), resident_dict.get('last_name'))
        resident_dict['display_name'] = resident_dict['full_name']
        # Format emergency contact phone number for display
        if resident_dict.get('emergency_contact_phone'):
            resident_dict['emergency_contact_phone_formatted'] = format_phone_number(resident_dict['emergency_contact_phone'])
        conn.close()
        return jsonify(resident_dict)

    elif request.method == 'PUT':
        data = request.json

        first_name = _normalize_person_name_part(data.get('first_name'))
        last_name = _normalize_person_name_part(data.get('last_name'))

        # Very visible logging for carrier debugging
        print("=" * 70, flush=True)
        print("🚨🚨🚨 RESIDENT UPDATE REQUEST RECEIVED 🚨🚨🚨", flush=True)
        print(f"Resident ID: {id}", flush=True)
        print("=" * 70, flush=True)

        # Log ALL carrier-related fields
        print(f"📱 Raw emergency_contact_carrier from request: {repr(data.get('emergency_contact_carrier'))}", flush=True)
        print(f"📱 Type: {type(data.get('emergency_contact_carrier')).__name__}", flush=True)

        # Get carrier value and normalize empty strings to None
        carrier_value = data.get('emergency_contact_carrier')
        if carrier_value == '' or carrier_value is None:
            carrier_value = None
        print(f"📱 Normalized carrier_value to save: {repr(carrier_value)}", flush=True)
        print("=" * 70, flush=True)

        # Prepare all values for UPDATE
        update_values = (
            first_name,
            last_name,
            data.get('date_of_birth'),
            data.get('room_number'),
            data.get('bed_number'),
            data.get('gender'),
            data.get('emergency_contact_name'),
            data.get('emergency_contact_phone'),
            carrier_value,  # Carrier for SMS (None if empty)
            data.get('emergency_contact_relation'),
            data.get('emergency_contact_email'),
            data.get('insurance_provider'),
            data.get('insurance_number'),
            data.get('medical_conditions'),
            data.get('allergies'),
            data.get('dietary_restrictions'),
            data.get('notes'),
            data.get('photo_path'),
            id
        )

        print(f"💾 About to UPDATE resident ID {id} with carrier_value: {repr(carrier_value)}", flush=True)

        cursor.execute('''
            UPDATE residents
            SET first_name = ?, last_name = ?, date_of_birth = ?, room_number = ?,
                bed_number = ?, gender = ?, emergency_contact_name = ?,
                emergency_contact_phone = ?, emergency_contact_carrier = ?, emergency_contact_relation = ?,
                emergency_contact_email = ?, insurance_provider = ?, insurance_number = ?, medical_conditions = ?,
                allergies = ?, dietary_restrictions = ?, notes = ?, photo_path = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', update_values)

        print(f"✅ UPDATE executed. Rows affected: {cursor.rowcount}", flush=True)
        conn.commit()

        # Verify the carrier was saved
        cursor.execute('SELECT emergency_contact_carrier FROM residents WHERE id = ?', (id,))
        saved_carrier = cursor.fetchone()
        print(f"🔍 VERIFICATION: Carrier value now in database: {repr(saved_carrier[0]) if saved_carrier else 'NOT FOUND'}", flush=True)

        conn.close()
        return jsonify({'message': 'Resident updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('UPDATE residents SET active = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Resident deactivated successfully'})

# Medications endpoints
@app.route('/api/medications', methods=['GET', 'POST'])
@require_auth
def medications():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        query = 'SELECT * FROM medications WHERE active = 1'
        params = []

        if resident_id:
            query += ' AND resident_id = ?'
            params.append(resident_id)

        query += ' ORDER BY created_at DESC'
        cursor.execute(query, params)
        meds = []
        for row in cursor.fetchall():
            med = dict(row)

            cursor.execute('''
                SELECT taken_at, scheduled_time FROM medication_logs
                WHERE medication_id = ? AND status = 'taken'
                ORDER BY taken_at DESC LIMIT 1
            ''', (med['id'],))
            last_log = cursor.fetchone()

            if last_log:
                med['last_taken'] = last_log['taken_at']
                med['last_taken_time'] = last_log['scheduled_time']
            else:
                med['last_taken'] = None
                med['last_taken_time'] = None

            meds.append(med)

        conn.close()
        return jsonify(meds)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO medications (resident_id, name, dosage, frequency, time_slots, hours_interval, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data['name'],
            data['dosage'],
            data['frequency'],
            json.dumps(data['time_slots']),
            data.get('hours_interval'),
            data.get('start_date'),
            data.get('end_date')
        ))
        conn.commit()
        med_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': med_id, 'message': 'Medication added successfully'}), 201

@app.route('/api/medications/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def medication_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM medications WHERE id = ? AND active = 1', (id,))
        med = cursor.fetchone()
        conn.close()
        if not med:
            return jsonify({'error': 'Medication not found'}), 404
        return jsonify(dict(med))

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE medications
            SET name = ?, dosage = ?, frequency = ?, time_slots = ?, hours_interval = ?, start_date = ?, end_date = ?
            WHERE id = ?
        ''', (
            data['name'],
            data['dosage'],
            data['frequency'],
            json.dumps(data['time_slots']),
            data.get('hours_interval'),
            data.get('start_date'),
            data.get('end_date'),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Medication updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('UPDATE medications SET active = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Medication deleted successfully'})

@app.route('/api/medications/<int:id>/log', methods=['POST'])
@require_auth
def log_medication(id):
    conn = get_db()
    cursor = conn.cursor()
    data = request.json

    medication_status = data.get('status', '').lower()
    scheduled_time = data.get('scheduled_time', '')
    staff_id = request.current_staff['id']

    cursor.execute('''
        INSERT INTO medication_logs (medication_id, scheduled_time, status, staff_id)
        VALUES (?, ?, ?, ?)
    ''', (id, scheduled_time, medication_status, staff_id))
    conn.commit()
    log_id = cursor.lastrowid

    try:
        cursor.execute('''
            SELECT m.name, m.dosage, r.id as resident_id, r.first_name, r.last_name
            FROM medications m
            JOIN residents r ON m.resident_id = r.id
            WHERE m.id = ?
        ''', (id,))
        row = cursor.fetchone()
        if row:
            resident_id = row['resident_id']
            med_name = row['name']
            dosage = row['dosage']
            resident_name = f"{row['first_name']} {row['last_name']}"
            title = f"Medication {medication_status.title()}"
            details = f"{resident_name} - {med_name} {dosage} | Scheduled: {scheduled_time}"
            create_journal_entry(
                conn,
                resident_id=resident_id,
                entry_type='medication',
                title=title,
                details=details,
                occurred_at=datetime.utcnow().isoformat() + 'Z',
                staff_id=staff_id,
                staff_name=request.current_staff.get('full_name'),
                source_table='medication_logs',
                source_id=log_id
            )
            conn.commit()
    except Exception as e:
        print(f"⚠️ Warning: Could not journal medication log: {e}")

    # If medication is marked as "missed", send email alert in background
    if medication_status == 'missed' and EMAIL_SERVICE_AVAILABLE:
        def send_medication_alert_background():
            try:
                print(f"💊 [Background] Medication alert thread started for medication_id={id}, status='missed'", flush=True)

                # Create new database connection in background thread
                bg_conn = get_db()
                bg_cursor = bg_conn.cursor()

                # Get medication details with resident information
                bg_cursor.execute('''
                    SELECT m.name, m.dosage, r.first_name, r.last_name, r.id as resident_id
                    FROM medications m
                    JOIN residents r ON m.resident_id = r.id
                    WHERE m.id = ?
                ''', (id,))
                med_info = bg_cursor.fetchone()

                if not med_info:
                    print(f"⚠️ [Background] Medication not found (medication_id: {id})", flush=True)
                    bg_conn.close()
                    return

                medication_name = med_info['name']
                resident_name = f"{med_info['first_name']} {med_info['last_name']}"
                resident_id_for_email = med_info['resident_id']

                print(f"💊 [Background] Medication: {medication_name} for {resident_name}", flush=True)
                print(f"   Scheduled time: {scheduled_time}", flush=True)

                # Get staff emails and phone numbers for notification (managers, admins, or assigned staff)
                bg_cursor.execute('''
                    SELECT email, phone, phone_carrier, preferred_language FROM staff
                    WHERE (role IN ('admin', 'manager') OR id = ?)
                    AND active = 1
                ''', (staff_id,))
                staff_records = bg_cursor.fetchall()
                staff_emails = [row['email'] for row in staff_records if row['email']]
                # Filter phones: exclude NULL, empty strings, and whitespace-only strings
                staff_phones = [(row['phone'], row['phone_carrier'], row['preferred_language'] or 'en') for row in staff_records
                               if row['phone'] and row['phone'].strip()]
                print(f"👥 [Background] Found {len(staff_emails)} staff email(s): {staff_emails}", flush=True)
                print(f"📱 [Background] Found {len(staff_phones)} staff phone(s) for SMS: {[p[0] for p in staff_phones]}", flush=True)

                # Get emergency contact phone for the resident
                bg_cursor.execute('SELECT emergency_contact_phone, emergency_contact_carrier FROM residents WHERE id = ?', (resident_id_for_email,))
                emergency_contact_row = bg_cursor.fetchone()
                emergency_contact_phone = None
                emergency_contact_carrier = None
                if emergency_contact_row and emergency_contact_row['emergency_contact_phone']:
                    phone_str = emergency_contact_row['emergency_contact_phone'].strip() if emergency_contact_row['emergency_contact_phone'] else None
                    emergency_contact_phone = phone_str if phone_str else None
                    emergency_contact_carrier = emergency_contact_row['emergency_contact_carrier'] if emergency_contact_row['emergency_contact_carrier'] else None
                print(f"📱 [Background] Emergency contact phone: {emergency_contact_phone if emergency_contact_phone else 'None'}", flush=True)
                print(f"📱 [Background] Emergency contact carrier from DB: '{emergency_contact_carrier}' (will use: {emergency_contact_carrier or 'default verizon'})", flush=True)

                # Fallback: If no recipients found, try to get ANY staff email
                if not staff_emails:
                    print(f"⚠️ [Background] No staff emails found, trying fallback...", flush=True)
                    bg_cursor.execute('''
                        SELECT email FROM staff
                        WHERE email IS NOT NULL
                        AND email != ''
                        AND active = 1
                        LIMIT 1
                    ''')
                    fallback_staff = bg_cursor.fetchone()
                    if fallback_staff and fallback_staff['email']:
                        staff_emails.append(fallback_staff['email'])
                        print(f"⚠️ [Background] Using fallback staff email: {fallback_staff['email']}", flush=True)

                bg_conn.close()

                if not staff_emails:
                    print(f"❌ [Background] No email addresses found to send medication alert for {resident_name}", flush=True)
                    return

                # Default to English for language
                language_for_email = 'en'

                print(f"📬 [Background] Preparing to send medication missed alerts to {len(staff_emails)} recipient(s)", flush=True)

                # Send email to all staff recipients
                emails_sent = 0
                email_errors = []
                for recipient_email in staff_emails:
                    print(f"📤 [Background] Sending medication missed alert to {recipient_email}...", flush=True)
                    try:
                        email_result = send_medication_alert(
                            resident_name=resident_name,
                            medication_name=medication_name,
                            scheduled_time=scheduled_time,
                            staff_email=recipient_email,
                            language=language_for_email
                        )
                        if email_result:
                            emails_sent += 1
                            print(f"✅ [Background] Medication alert sent successfully to {recipient_email}", flush=True)
                        else:
                            error_msg = f"Email function returned False for {recipient_email}"
                            email_errors.append(error_msg)
                            print(f"❌ [Background] {error_msg}", flush=True)
                    except Exception as email_exception:
                        error_msg = f"Exception sending email to {recipient_email}: {str(email_exception)}"
                        email_errors.append(error_msg)
                        print(f"❌ [Background] {error_msg}", flush=True)
                        import traceback
                        traceback.print_exc(file=sys.stdout)

                if emails_sent > 0:
                    print(f"✅ [Background] Sent {emails_sent}/{len(staff_emails)} medication missed alert email(s) for {resident_name}", flush=True)
                else:
                    print(f"⚠️ [Background] Failed to send medication missed alert emails.", flush=True)
                    print(f"   Errors: {email_errors}", flush=True)

                # Send SMS notifications (FREE via email-to-SMS gateway)
                sms_sent = 0
                sms_errors = []
                if SMS_SERVICE_AVAILABLE:
                    print(f"📱 [Background] Preparing to send SMS alerts to {len(staff_phones)} staff phone(s) and emergency contact", flush=True)
                    if len(staff_phones) > 0:
                        print(f"   Staff phones: {[p[0] for p in staff_phones]}", flush=True)
                    if emergency_contact_phone:
                        print(f"   Emergency contact phone: {emergency_contact_phone}", flush=True)
                    else:
                        print(f"   ⚠️ No emergency contact phone found for resident {resident_id_for_email}", flush=True)

                    # Send SMS to staff
                    for phone, carrier, language in staff_phones:
                        if phone:
                            try:
                                sms_result = send_medication_alert_sms(
                                    resident_name=resident_name,
                                    medication_name=medication_name,
                                    scheduled_time=scheduled_time,
                                    phone=phone,
                                    carrier=carrier,  # Use carrier from database
                                    language=language or 'en'
                                )
                                if sms_result:
                                    sms_sent += 1
                                    print(f"✅ [Background] SMS sent successfully to {phone}", flush=True)
                                else:
                                    error_msg = f"SMS function returned False for {phone}"
                                    sms_errors.append(error_msg)
                                    print(f"❌ [Background] {error_msg}", flush=True)
                            except Exception as sms_exception:
                                error_msg = f"Exception sending SMS to {phone}: {str(sms_exception)}"
                                sms_errors.append(error_msg)
                                print(f"❌ [Background] {error_msg}", flush=True)

                    # Send SMS to emergency contact
                    if emergency_contact_phone:
                        try:
                            sms_result = send_medication_alert_sms(
                                resident_name=resident_name,
                                medication_name=medication_name,
                                scheduled_time=scheduled_time,
                                phone=emergency_contact_phone,
                                carrier=emergency_contact_carrier,  # Use carrier from database
                                language='en'  # Default to English for emergency contacts
                            )
                            if sms_result:
                                sms_sent += 1
                                print(f"✅ [Background] SMS sent successfully to emergency contact: {emergency_contact_phone}", flush=True)
                            else:
                                error_msg = f"SMS function returned False for emergency contact {emergency_contact_phone}"
                                sms_errors.append(error_msg)
                                print(f"❌ [Background] {error_msg}", flush=True)
                        except Exception as sms_exception:
                            error_msg = f"Exception sending SMS to emergency contact {emergency_contact_phone}: {str(sms_exception)}"
                            sms_errors.append(error_msg)
                            print(f"❌ [Background] {error_msg}", flush=True)

                    if sms_sent > 0:
                        print(f"✅ [Background] Sent {sms_sent} medication alert SMS(s)", flush=True)
                else:
                    print(f"ℹ️ [Background] SMS service not available, skipping SMS notifications", flush=True)
            except Exception as bg_error:
                print(f"❌ [Background] Error in medication alert thread: {bg_error}", flush=True)
                import traceback
                traceback.print_exc(file=sys.stdout)

        # Start background thread for email sending
        email_thread = threading.Thread(target=send_medication_alert_background, daemon=True)
        email_thread.start()
        print(f"💊 Medication missed alert thread started (non-blocking, thread ID: {email_thread.ident})", flush=True)

    conn.close()
    return jsonify({'message': 'Medication logged successfully'}), 201

@app.route('/api/medications/<int:id>/logs', methods=['GET'])
@require_auth
def get_medication_logs(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM medication_logs
        WHERE medication_id = ?
        AND DATE(taken_at) = DATE('now')
        ORDER BY taken_at DESC
    ''', (id,))
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(logs)

# Appointments endpoints
@app.route('/api/appointments', methods=['GET', 'POST'])
@require_auth
def appointments():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        query = 'SELECT * FROM appointments'
        params = []

        if resident_id:
            query += ' WHERE resident_id = ?'
            params.append(resident_id)

        query += ' ORDER BY date, time'
        cursor.execute(query, params)
        appts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(appts)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO appointments (resident_id, date, time, doctor_name, facility, purpose, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data['date'],
            data['time'],
            data['doctor_name'],
            data.get('facility', ''),
            data.get('purpose', ''),
            data.get('notes', '')
        ))
        conn.commit()
        appt_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': appt_id, 'message': 'Appointment added successfully'}), 201

@app.route('/api/appointments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def appointment_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM appointments WHERE id = ?', (id,))
        appt = cursor.fetchone()
        conn.close()
        if not appt:
            return jsonify({'error': 'Appointment not found'}), 404
        return jsonify(dict(appt))

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE appointments
            SET date = ?, time = ?, doctor_name = ?, facility = ?,
                purpose = ?, notes = ?, completed = ?
            WHERE id = ?
        ''', (
            data['date'],
            data['time'],
            data['doctor_name'],
            data.get('facility', ''),
            data.get('purpose', ''),
            data.get('notes', ''),
            data.get('completed', 0),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Appointment updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM appointments WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Appointment deleted successfully'})

# Vital signs endpoints
@app.route('/api/vital-signs', methods=['GET', 'POST'])
@require_auth
def vital_signs():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        query = 'SELECT * FROM vital_signs'
        params = []

        if resident_id:
            query += ' WHERE resident_id = ?'
            params.append(resident_id)

        query += ' ORDER BY recorded_at DESC'
        cursor.execute(query, params)
        signs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(signs)

    elif request.method == 'POST':
        data = request.json
        resident_id = data.get('resident_id')
        if not resident_id:
            conn.close()
            return jsonify({'error': 'resident_id is required'}), 400
        try:
            resident_id = int(resident_id)
        except Exception:
            conn.close()
            return jsonify({'error': 'resident_id must be a number'}), 400
        cursor.execute('SELECT id FROM residents WHERE id = ?', (resident_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Resident not found'}), 400
        systolic = data.get('systolic')
        diastolic = data.get('diastolic')
        glucose = data.get('glucose')
        temperature = data.get('temperature')
        heart_rate = data.get('heart_rate')
        staff_id = request.current_staff['id']

        cursor.execute('''
            INSERT INTO vital_signs (resident_id, recorded_at, systolic, diastolic, glucose, weight, temperature, heart_rate, notes, staff_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            resident_id,
            data.get('recorded_at'),
            systolic,
            diastolic,
            glucose,
            data.get('weight'),
            temperature,
            heart_rate,
            data.get('notes', ''),
            staff_id
        ))
        conn.commit()
        sign_id = cursor.lastrowid

        try:
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id,))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else 'Unknown Resident'
            parts = []
            if systolic is not None and diastolic is not None:
                parts.append(f"BP {systolic}/{diastolic}")
            if glucose is not None:
                parts.append(f"Glucose {glucose}")
            if temperature is not None:
                parts.append(f"Temp {temperature}")
            if heart_rate is not None:
                parts.append(f"HR {heart_rate}")
            if data.get('weight') is not None:
                parts.append(f"Weight {data.get('weight')}")
            vitals_summary = ', '.join(parts) if parts else 'Vitals recorded'
            notes_text = (data.get('notes') or '').strip()
            details = f"{resident_name} - {vitals_summary}" + (f" | Notes: {notes_text}" if notes_text else '')
            create_journal_entry(
                conn,
                resident_id=resident_id,
                entry_type='vital_signs',
                title='Vital Signs Recorded',
                details=details,
                occurred_at=(data.get('recorded_at') or datetime.utcnow().isoformat() + 'Z'),
                staff_id=staff_id,
                staff_name=request.current_staff.get('full_name'),
                source_table='vital_signs',
                source_id=sign_id
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not journal vital signs: {e}")

        # Check for critical values and send alerts in background
        critical_alerts = []
        if EMAIL_SERVICE_AVAILABLE:
            # Check blood pressure (systolic ≥ 140 or diastolic ≥ 90)
            if systolic and systolic >= 140:
                critical_alerts.append(('Blood Pressure', f'Systolic: {systolic} mmHg', 'Systolic ≥ 140 mmHg'))
            elif diastolic and diastolic >= 90:
                critical_alerts.append(('Blood Pressure', f'Diastolic: {diastolic} mmHg', 'Diastolic ≥ 90 mmHg'))

            # Check glucose (low: < 70, high: > 180)
            if glucose is not None:
                if glucose < 70:
                    critical_alerts.append(('Glucose', f'{glucose} mg/dL', '< 70 mg/dL (Low)'))
                elif glucose > 180:
                    critical_alerts.append(('Glucose', f'{glucose} mg/dL', '> 180 mg/dL (High)'))

            # Check heart rate (low: < 60, high: > 100)
            if heart_rate is not None:
                if heart_rate < 60:
                    critical_alerts.append(('Heart Rate', f'{heart_rate} bpm', '< 60 bpm (Low)'))
                elif heart_rate > 100:
                    critical_alerts.append(('Heart Rate', f'{heart_rate} bpm', '> 100 bpm (High)'))

            # Check temperature (fever: > 100.4°F, hypothermia: < 95°F)
            if temperature is not None:
                if temperature > 100.4:
                    critical_alerts.append(('Temperature', f'{temperature}°F', '> 100.4°F (Fever)'))
                elif temperature < 95:
                    critical_alerts.append(('Temperature', f'{temperature}°F', '< 95°F (Hypothermia)'))

        conn.close()

        # If critical values detected, send email alerts in background
        if critical_alerts and EMAIL_SERVICE_AVAILABLE:
            def send_vital_signs_alerts_background():
                try:
                    print(f"🚨 [Background] Vital signs alert thread started for resident_id={resident_id}", flush=True)
                    print(f"   Critical alerts detected: {len(critical_alerts)}", flush=True)

                    # Create new database connection in background thread
                    bg_conn = get_db()
                    bg_cursor = bg_conn.cursor()

                    # Get resident name
                    bg_cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id,))
                    resident = bg_cursor.fetchone()
                    if not resident:
                        print(f"⚠️ [Background] Resident not found (resident_id: {resident_id})", flush=True)
                        bg_conn.close()
                        return

                    resident_name = f"{resident['first_name']} {resident['last_name']}"
                    print(f"📋 [Background] Resident: {resident_name}", flush=True)

                    # Get staff emails and phone numbers for notification (managers, admins, or assigned staff)
                    bg_cursor.execute('''
                        SELECT email, phone, preferred_language FROM staff
                        WHERE (role IN ('admin', 'manager') OR id = ?)
                        AND active = 1
                    ''', (staff_id,))
                    staff_records = bg_cursor.fetchall()
                    staff_emails = [row['email'] for row in staff_records if row['email']]
                    staff_phones = [(row['phone'], row['preferred_language'] or 'en') for row in staff_records if row['phone']]
                    print(f"👥 [Background] Found {len(staff_emails)} staff email(s): {staff_emails}", flush=True)
                    print(f"📱 [Background] Found {len(staff_phones)} staff phone(s) for SMS", flush=True)

                    # Get emergency contact phone for the resident
                    bg_cursor.execute('SELECT emergency_contact_phone FROM residents WHERE id = ?', (resident_id,))
                    emergency_contact_row = bg_cursor.fetchone()
                    emergency_contact_phone = emergency_contact_row['emergency_contact_phone'] if emergency_contact_row and emergency_contact_row['emergency_contact_phone'] else None
                    print(f"📱 [Background] Emergency contact phone: {emergency_contact_phone if emergency_contact_phone else 'None'}", flush=True)

                    # Fallback: If no recipients found, try to get ANY staff email
                    if not staff_emails:
                        print(f"⚠️ [Background] No staff emails found, trying fallback...", flush=True)
                        bg_cursor.execute('''
                            SELECT email FROM staff
                            WHERE email IS NOT NULL
                            AND email != ''
                            AND active = 1
                            LIMIT 1
                        ''')
                        fallback_staff = bg_cursor.fetchone()
                        if fallback_staff and fallback_staff['email']:
                            staff_emails.append(fallback_staff['email'])
                            print(f"⚠️ [Background] Using fallback staff email: {fallback_staff['email']}", flush=True)

                    bg_conn.close()

                    if not staff_emails:
                        print(f"❌ [Background] No email addresses found to send vital signs alerts for {resident_name}", flush=True)
                        return

                    # Default to English for language
                    language_for_email = 'en'

                    print(f"📬 [Background] Preparing to send {len(critical_alerts)} vital signs alert(s) to {len(staff_emails)} recipient(s)", flush=True)

                    # Send email for each critical alert
                    emails_sent = 0
                    email_errors = []
                    for vital_type, value, threshold in critical_alerts:
                        for recipient_email in staff_emails:
                            print(f"📤 [Background] Sending {vital_type} alert ({value}) to {recipient_email}...", flush=True)
                            try:
                                email_result = send_vital_signs_alert(
                                    resident_name=resident_name,
                                    vital_type=vital_type,
                                    value=value,
                                    threshold=threshold,
                                    staff_email=recipient_email,
                                    language=language_for_email
                                )
                                if email_result:
                                    emails_sent += 1
                                    print(f"✅ [Background] {vital_type} alert sent successfully to {recipient_email}", flush=True)
                                else:
                                    error_msg = f"Email function returned False for {recipient_email} ({vital_type})"
                                    email_errors.append(error_msg)
                                    print(f"❌ [Background] {error_msg}", flush=True)
                            except Exception as email_exception:
                                error_msg = f"Exception sending {vital_type} alert to {recipient_email}: {str(email_exception)}"
                                email_errors.append(error_msg)
                                print(f"❌ [Background] {error_msg}", flush=True)
                                import traceback
                                traceback.print_exc(file=sys.stdout)

                    if emails_sent > 0:
                        print(f"✅ [Background] Sent {emails_sent} vital signs alert email(s) for {resident_name}", flush=True)
                    else:
                        print(f"⚠️ [Background] Failed to send vital signs alert emails.", flush=True)
                        print(f"   Errors: {email_errors}", flush=True)

                    # Send SMS notifications for each critical alert (FREE via email-to-SMS gateway)
                    sms_sent = 0
                    sms_errors = []
                    if SMS_SERVICE_AVAILABLE:
                        # Re-fetch staff phones (connection was closed)
                        bg_conn_sms = get_db()
                        bg_cursor_sms = bg_conn_sms.cursor()
                        bg_cursor_sms.execute('''
                            SELECT phone, phone_carrier, preferred_language FROM staff
                            WHERE (role IN ('admin', 'manager') OR id = ?)
                            AND phone IS NOT NULL
                            AND phone != ''
                            AND active = 1
                        ''', (staff_id,))
                        staff_phone_records = bg_cursor_sms.fetchall()
                        staff_phones = [(row['phone'].strip(), row['phone_carrier'], row['preferred_language'] or 'en') for row in staff_phone_records if row['phone'] and row['phone'].strip()]
                        bg_cursor_sms.execute('SELECT emergency_contact_phone, emergency_contact_carrier FROM residents WHERE id = ?', (resident_id,))
                        emergency_contact_row = bg_cursor_sms.fetchone()
                        emergency_contact_phone = None
                        emergency_contact_carrier = None
                        if emergency_contact_row and emergency_contact_row['emergency_contact_phone']:
                            phone_str = emergency_contact_row['emergency_contact_phone'].strip() if emergency_contact_row['emergency_contact_phone'] else None
                            emergency_contact_phone = phone_str if phone_str else None
                            emergency_contact_carrier = emergency_contact_row['emergency_contact_carrier'] if emergency_contact_row['emergency_contact_carrier'] else None
                        bg_conn_sms.close()

                        print(f"📱 [Background] Preparing to send SMS alerts to {len(staff_phones)} staff phone(s) and emergency contact", flush=True)
                        if len(staff_phones) > 0:
                            print(f"   Staff phones: {[p[0] for p in staff_phones]}", flush=True)
                        if emergency_contact_phone:
                            print(f"   Emergency contact phone: {emergency_contact_phone}", flush=True)
                        else:
                            print(f"   ⚠️ No emergency contact phone found for resident {resident_id}", flush=True)

                        # Send SMS to staff for each critical alert
                        for vital_type, value, threshold in critical_alerts:
                            for phone, carrier, language in staff_phones:
                                if phone:
                                    try:
                                        sms_result = send_vital_signs_alert_sms(
                                            resident_name=resident_name,
                                            vital_type=vital_type,
                                            value=value,
                                            threshold=threshold,
                                            phone=phone,
                                            carrier=carrier,  # Use carrier from database
                                            language=language or 'en'
                                        )
                                        if sms_result:
                                            sms_sent += 1
                                            print(f"✅ [Background] SMS sent successfully to {phone} for {vital_type}", flush=True)
                                        else:
                                            error_msg = f"SMS function returned False for {phone}"
                                            sms_errors.append(error_msg)
                                            print(f"❌ [Background] {error_msg}", flush=True)
                                    except Exception as sms_exception:
                                        error_msg = f"Exception sending SMS to {phone}: {str(sms_exception)}"
                                        sms_errors.append(error_msg)
                                        print(f"❌ [Background] {error_msg}", flush=True)

                            # Send SMS to emergency contact for each critical alert
                            if emergency_contact_phone:
                                try:
                                    sms_result = send_vital_signs_alert_sms(
                                        resident_name=resident_name,
                                        vital_type=vital_type,
                                        value=value,
                                        threshold=threshold,
                                        phone=emergency_contact_phone,
                                        carrier=emergency_contact_carrier,  # Use carrier from database
                                        language='en'  # Default to English for emergency contacts
                                    )
                                    if sms_result:
                                        sms_sent += 1
                                        print(f"✅ [Background] SMS sent successfully to emergency contact: {emergency_contact_phone} for {vital_type}", flush=True)
                                    else:
                                        error_msg = f"SMS function returned False for emergency contact {emergency_contact_phone}"
                                        sms_errors.append(error_msg)
                                        print(f"❌ [Background] {error_msg}", flush=True)
                                except Exception as sms_exception:
                                    error_msg = f"Exception sending SMS to emergency contact {emergency_contact_phone}: {str(sms_exception)}"
                                    sms_errors.append(error_msg)
                                    print(f"❌ [Background] {error_msg}", flush=True)

                        if sms_sent > 0:
                            print(f"✅ [Background] Sent {sms_sent} vital signs alert SMS(s)", flush=True)
                    else:
                        print(f"ℹ️ [Background] SMS service not available, skipping SMS notifications", flush=True)
                except Exception as bg_error:
                    print(f"❌ [Background] Error in vital signs alert thread: {bg_error}", flush=True)
                    import traceback
                    traceback.print_exc(file=sys.stdout)

            # Start background thread for email sending
            email_thread = threading.Thread(target=send_vital_signs_alerts_background, daemon=True)
            email_thread.start()
            print(f"🚨 Vital signs alert thread started (non-blocking, thread ID: {email_thread.ident})", flush=True)
            print(f"   Critical values detected: {critical_alerts}", flush=True)

        return jsonify({'id': sign_id, 'message': 'Vital signs recorded successfully'}), 201

@app.route('/api/vital-signs/<int:sign_id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def vital_sign_detail(sign_id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM vital_signs WHERE id = ?', (sign_id,))
        sign = cursor.fetchone()
        conn.close()
        if not sign:
            return jsonify({'error': 'Vital sign not found'}), 404
        return jsonify(dict(sign))

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE vital_signs
            SET recorded_at = ?, systolic = ?, diastolic = ?, glucose = ?, weight = ?,
                temperature = ?, heart_rate = ?, notes = ?
            WHERE id = ?
        ''', (
            data.get('recorded_at'),
            data.get('systolic'),
            data.get('diastolic'),
            data.get('glucose'),
            data.get('weight'),
            data.get('temperature'),
            data.get('heart_rate'),
            data.get('notes', ''),
            sign_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Vital signs updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM vital_signs WHERE id = ?', (sign_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Vital signs deleted successfully'})

# Billing endpoints
@app.route('/api/billing', methods=['GET', 'POST'])
@require_auth
def billing():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        query = 'SELECT * FROM billing'
        params = []

        if resident_id:
            query += ' WHERE resident_id = ?'
            params.append(resident_id)

        query += ' ORDER BY billing_date DESC, due_date DESC'
        cursor.execute(query, params)
        bills = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(bills)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO billing (resident_id, billing_date, due_date, amount, description, category, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data.get('billing_date'),
            data.get('due_date'),
            data.get('amount'),
            data.get('description', ''),
            data.get('category', 'General'),
            data.get('status', 'pending'),
            data.get('notes', '')
        ))
        conn.commit()
        bill_id = cursor.lastrowid

        try:
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (data.get('resident_id'),))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else f"Resident ID {data.get('resident_id')}"
            amount = data.get('amount')
            due = data.get('due_date')
            category = data.get('category', 'General')
            desc = (data.get('description') or '').strip()
            details_parts = [
                f"{resident_name}",
                f"Amount: ${float(amount):.2f}" if amount is not None else None,
                f"Due: {due}" if due else None,
                f"Category: {category}" if category else None,
                f"{desc}" if desc else None
            ]
            details = ' | '.join([p for p in details_parts if p])
            create_journal_entry(
                conn,
                resident_id=int(data.get('resident_id')),
                entry_type='billing',
                title='Bill Created',
                details=details,
                occurred_at=(data.get('billing_date') or datetime.utcnow().isoformat() + 'Z'),
                staff_id=request.current_staff['id'],
                staff_name=request.current_staff.get('full_name'),
                source_table='billing',
                source_id=bill_id
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not journal bill creation: {e}")

        conn.close()
        return jsonify({'id': bill_id, 'message': 'Bill created successfully'}), 201

@app.route('/api/billing/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def billing_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM billing WHERE id = ?', (id,))
        bill = cursor.fetchone()
        if not bill:
            conn.close()
            return jsonify({'error': 'Bill not found'}), 404
        conn.close()
        return jsonify(dict(bill))

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE billing
            SET billing_date = ?, due_date = ?, amount = ?, description = ?,
                category = ?, status = ?, notes = ?
            WHERE id = ?
        ''', (
            data.get('billing_date'),
            data.get('due_date'),
            data.get('amount'),
            data.get('description', ''),
            data.get('category', 'Monthly Fee'),
            data.get('status', 'pending'),
            data.get('notes', ''),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Bill updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM billing WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Bill deleted successfully'})

@app.route('/api/payments', methods=['GET', 'POST'])
@require_auth
def payments():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        query = 'SELECT * FROM payments'
        params = []

        if resident_id:
            query += ' WHERE resident_id = ?'
            params.append(resident_id)

        query += ' ORDER BY payment_date DESC'
        cursor.execute(query, params)
        payments_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(payments_list)

    elif request.method == 'POST':
        data = request.json

        # Generate receipt number
        receipt_number = f"RCP-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()[:6]}"

        cursor.execute('''
            INSERT INTO payments (billing_id, resident_id, payment_date, amount, payment_method, reference_number, notes, staff_id, receipt_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('billing_id'),
            data.get('resident_id'),
            data.get('payment_date'),
            data.get('amount'),
            data.get('payment_method', 'Cash'),
            data.get('reference_number', ''),
            data.get('notes', ''),
            request.current_staff['id'],
            receipt_number
        ))

        # Update billing status if linked
        if data.get('billing_id'):
            cursor.execute('UPDATE billing SET status = ? WHERE id = ?', ('paid', data.get('billing_id')))

        conn.commit()
        payment_id = cursor.lastrowid

        try:
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (data.get('resident_id'),))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else f"Resident ID {data.get('resident_id')}"
            amount = data.get('amount')
            method = (data.get('payment_method') or 'Cash').strip()
            ref = (data.get('reference_number') or '').strip()
            details_parts = [
                f"{resident_name}",
                f"Amount: ${float(amount):.2f}" if amount is not None else None,
                f"Method: {method}" if method else None,
                f"Ref: {ref}" if ref else None,
                f"Receipt: {receipt_number}" if receipt_number else None
            ]
            details = ' | '.join([p for p in details_parts if p])
            create_journal_entry(
                conn,
                resident_id=int(data.get('resident_id')),
                entry_type='payment',
                title='Payment Recorded',
                details=details,
                occurred_at=(data.get('payment_date') or datetime.utcnow().isoformat() + 'Z'),
                staff_id=request.current_staff['id'],
                staff_name=request.current_staff.get('full_name'),
                source_table='payments',
                source_id=payment_id
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not journal payment creation: {e}")

        # Create transaction record if bank account is specified
        if data.get('bank_account_id'):
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (data.get('resident_id'),))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else f"Resident ID {data.get('resident_id')}"
            cursor.execute('''
                INSERT INTO transactions (bank_account_id, resident_id, transaction_date, transaction_type, description, amount, check_number, payee, category, payment_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('bank_account_id'),
                data.get('resident_id'),
                data.get('payment_date'),
                'deposit',
                f"Payment from {resident_name}",
                data.get('amount'),
                data.get('reference_number', ''),
                '',  # payee
                'Payment',
                payment_id
            ))
            # Update bank account balance
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?',
                         (data.get('amount'), data.get('bank_account_id')))
            conn.commit()

        # Get the created payment with receipt number
        cursor.execute('SELECT * FROM payments WHERE id = ?', (payment_id,))
        payment = dict(cursor.fetchone())
        conn.close()
        return jsonify({'id': payment_id, 'receipt_number': receipt_number, 'payment': payment, 'message': 'Payment recorded successfully'}), 201

@app.route('/api/payments/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def payment_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE payments
            SET payment_date = ?, amount = ?, payment_method = ?, reference_number = ?, notes = ?
            WHERE id = ?
        ''', (
            data.get('payment_date'),
            data.get('amount'),
            data.get('payment_method'),
            data.get('reference_number', ''),
            data.get('notes', ''),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Payment updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM payments WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Payment deleted successfully'})

@app.route('/api/billing/balance/<int:resident_id>', methods=['GET'])
@require_auth
def get_account_balance(resident_id):
    conn = get_db()
    cursor = conn.cursor()

    # Get total billed
    cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE resident_id = ?', (resident_id,))
    total_billed = cursor.fetchone()['total'] or 0

    # Get total paid
    cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE resident_id = ?', (resident_id,))
    total_paid = cursor.fetchone()['total'] or 0

    # Get pending bills
    cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE resident_id = ? AND status = ?', (resident_id, 'pending'))
    pending_amount = cursor.fetchone()['total'] or 0

    # Get overdue bills
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total FROM billing
        WHERE resident_id = ? AND status = ? AND due_date < DATE('now')
    ''', (resident_id, 'pending'))
    overdue_amount = cursor.fetchone()['total'] or 0

    balance = total_billed - total_paid

    conn.close()
    return jsonify({
        'total_billed': total_billed,
        'total_paid': total_paid,
        'balance': balance,
        'pending_amount': pending_amount,
        'overdue_amount': overdue_amount
    })

# Bank Accounts endpoints (Admin only)
@app.route('/api/bank-accounts', methods=['GET', 'POST'])
@require_role('admin')
def bank_accounts():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM bank_accounts WHERE active = 1 ORDER BY account_name')
        accounts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(accounts)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO bank_accounts (account_name, account_number, bank_name, account_type, routing_number, opening_balance, current_balance, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('account_name'),
            data.get('account_number', ''),
            data.get('bank_name'),
            data.get('account_type', 'checking'),
            data.get('routing_number', ''),
            data.get('opening_balance', 0),
            data.get('opening_balance', 0),  # current_balance starts same as opening
            data.get('notes', '')
        ))
        conn.commit()
        account_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': account_id, 'message': 'Bank account created successfully'}), 201

@app.route('/api/bank-accounts/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_role('admin')
def bank_account_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM bank_accounts WHERE id = ?', (id,))
        account = cursor.fetchone()
        if not account:
            conn.close()
            return jsonify({'error': 'Bank account not found'}), 404
        conn.close()
        return jsonify(dict(account))

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE bank_accounts
            SET account_name = ?, account_number = ?, bank_name = ?, account_type = ?,
                routing_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('account_name'),
            data.get('account_number', ''),
            data.get('bank_name'),
            data.get('account_type', 'checking'),
            data.get('routing_number', ''),
            data.get('notes', ''),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Bank account updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('UPDATE bank_accounts SET active = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Bank account deactivated successfully'})

# Transactions endpoints (Admin only)
@app.route('/api/transactions', methods=['GET', 'POST'])
@require_role('admin')
def transactions():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        bank_account_id = request.args.get('bank_account_id')
        reconciled = request.args.get('reconciled')
        query = """
            SELECT
                t.*,
                ba.account_name,
                (r.first_name || ' ' || r.last_name) AS resident_name
            FROM transactions t
            JOIN bank_accounts ba ON t.bank_account_id = ba.id
            LEFT JOIN residents r ON t.resident_id = r.id
        """
        params = []

        if bank_account_id:
            query += ' WHERE t.bank_account_id = ?'
            params.append(bank_account_id)

        if reconciled is not None:
            if bank_account_id:
                query += ' AND t.reconciled = ?'
            else:
                query += ' WHERE t.reconciled = ?'
            params.append(1 if reconciled.lower() == 'true' else 0)

        query += ' ORDER BY t.transaction_date DESC, t.id DESC'
        cursor.execute(query, params)
        transactions_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(transactions_list)

    elif request.method == 'POST':
        data = request.json
        resident_id = data.get('resident_id')
        if not resident_id:
            conn.close()
            return jsonify({'error': 'resident_id is required'}), 400
        try:
            resident_id = int(resident_id)
        except Exception:
            conn.close()
            return jsonify({'error': 'resident_id must be a number'}), 400
        cursor.execute('SELECT id FROM residents WHERE id = ?', (resident_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Resident not found'}), 400

        cursor.execute('''
            INSERT INTO transactions (bank_account_id, resident_id, transaction_date, transaction_type, description, amount, check_number, payee, category, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('bank_account_id'),
            resident_id,
            data.get('transaction_date'),
            data.get('transaction_type'),  # 'deposit' or 'withdrawal'
            data.get('description'),
            data.get('amount'),
            data.get('check_number', ''),
            data.get('payee', ''),
            data.get('category', ''),
            data.get('notes', '')
        ))

        # Update bank account balance
        amount = data.get('amount')
        if data.get('transaction_type') == 'deposit':
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?',
                         (amount, data.get('bank_account_id')))
        else:  # withdrawal
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?',
                         (amount, data.get('bank_account_id')))

        conn.commit()
        transaction_id = cursor.lastrowid

        try:
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id,))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else f"Resident ID {resident_id}"
            cursor.execute('SELECT account_name FROM bank_accounts WHERE id = ?', (data.get('bank_account_id'),))
            ba_row = cursor.fetchone()
            account_name = ba_row['account_name'] if ba_row else 'Bank Account'
            amount = data.get('amount')
            tx_type = (data.get('transaction_type') or '').strip()
            tx_date = data.get('transaction_date')
            desc = (data.get('description') or '').strip()
            details_parts = [
                f"{resident_name}",
                f"Account: {account_name}" if account_name else None,
                f"Type: {tx_type}" if tx_type else None,
                f"Amount: ${float(amount):.2f}" if amount is not None else None,
                f"{desc}" if desc else None
            ]
            details = ' | '.join([p for p in details_parts if p])
            create_journal_entry(
                conn,
                resident_id=resident_id,
                entry_type='transaction',
                title='Transaction Recorded',
                details=details,
                occurred_at=(tx_date or datetime.utcnow().isoformat() + 'Z'),
                staff_id=request.current_staff['id'],
                staff_name=request.current_staff.get('full_name'),
                source_table='transactions',
                source_id=transaction_id
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not journal transaction creation: {e}")

        conn.close()
        return jsonify({'id': transaction_id, 'message': 'Transaction recorded successfully'}), 201

@app.route('/api/transactions/<int:id>', methods=['PUT', 'DELETE'])
@require_role('admin')
def transaction_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'PUT':
        # Get old transaction to reverse balance change
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (id,))
        old_row = cursor.fetchone()
        if not old_row:
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        old_trans = dict(old_row)

        data = request.json
        resident_id = data.get('resident_id')
        if not resident_id:
            conn.close()
            return jsonify({'error': 'resident_id is required'}), 400
        try:
            resident_id = int(resident_id)
        except Exception:
            conn.close()
            return jsonify({'error': 'resident_id must be a number'}), 400
        cursor.execute('SELECT id FROM residents WHERE id = ?', (resident_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Resident not found'}), 400

        cursor.execute('''
            UPDATE transactions
            SET resident_id = ?, transaction_date = ?, transaction_type = ?, description = ?, amount = ?,
                check_number = ?, payee = ?, category = ?, notes = ?
            WHERE id = ?
        ''', (
            resident_id,
            data.get('transaction_date'),
            data.get('transaction_type'),
            data.get('description'),
            data.get('amount'),
            data.get('check_number', ''),
            data.get('payee', ''),
            data.get('category', ''),
            data.get('notes', ''),
            id
        ))

        # Reverse old balance change and apply new one
        old_amount = old_trans['amount']
        old_type = old_trans['transaction_type']
        new_amount = data.get('amount')
        new_type = data.get('transaction_type')
        bank_account_id = old_trans['bank_account_id']

        # Reverse old
        if old_type == 'deposit':
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?',
                         (old_amount, bank_account_id))
        else:
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?',
                         (old_amount, bank_account_id))

        # Apply new
        if new_type == 'deposit':
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?',
                         (new_amount, bank_account_id))
        else:
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?',
                         (new_amount, bank_account_id))

        conn.commit()
        conn.close()
        return jsonify({'message': 'Transaction updated successfully'})

    elif request.method == 'DELETE':
        # Get transaction to reverse balance
        cursor.execute('SELECT * FROM transactions WHERE id = ?', (id,))
        trans = dict(cursor.fetchone())

        # Reverse balance change
        if trans['transaction_type'] == 'deposit':
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance - ? WHERE id = ?',
                         (trans['amount'], trans['bank_account_id']))
        else:
            cursor.execute('UPDATE bank_accounts SET current_balance = current_balance + ? WHERE id = ?',
                         (trans['amount'], trans['bank_account_id']))

        cursor.execute('DELETE FROM transactions WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Transaction deleted successfully'})

# Reconciliation endpoints (Admin only)
@app.route('/api/reconciliation', methods=['POST'])
@require_role('admin')
def reconcile_account():
    conn = get_db()
    cursor = conn.cursor()
    data = request.json

    bank_account_id = data.get('bank_account_id')
    statement_date = data.get('statement_date')
    statement_balance = data.get('statement_balance')
    transaction_ids = data.get('transaction_ids', [])  # List of transaction IDs to mark as reconciled

    # Mark transactions as reconciled
    if transaction_ids:
        placeholders = ','.join(['?'] * len(transaction_ids))
        cursor.execute(f'''
            UPDATE transactions
            SET reconciled = 1, reconciled_date = ?
            WHERE id IN ({placeholders})
        ''', [statement_date] + transaction_ids)

    # Calculate cleared balance
    cursor.execute('''
        SELECT COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END), 0) as cleared
        FROM transactions
        WHERE bank_account_id = ? AND reconciled = 1
    ''', (bank_account_id,))
    cleared_result = cursor.fetchone()
    cleared_balance = cleared_result['cleared'] if cleared_result else 0

    # Get account opening balance
    cursor.execute('SELECT opening_balance FROM bank_accounts WHERE id = ?', (bank_account_id,))
    opening_balance = cursor.fetchone()['opening_balance'] or 0
    cleared_balance += opening_balance

    # Calculate outstanding items
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE bank_account_id = ? AND transaction_type = 'deposit' AND reconciled = 0
    ''', (bank_account_id,))
    outstanding_deposits = cursor.fetchone()['total'] or 0

    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE bank_account_id = ? AND transaction_type = 'withdrawal' AND reconciled = 0
    ''', (bank_account_id,))
    outstanding_checks = cursor.fetchone()['total'] or 0

    difference = statement_balance - cleared_balance

    # Create reconciliation record
    cursor.execute('''
        INSERT INTO reconciliation_records
        (bank_account_id, statement_date, statement_balance, cleared_balance, outstanding_deposits, outstanding_checks, difference, reconciled_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        bank_account_id,
        statement_date,
        statement_balance,
        cleared_balance,
        outstanding_deposits,
        outstanding_checks,
        difference,
        request.current_staff['id'],
        data.get('notes', '')
    ))

    conn.commit()
    reconciliation_id = cursor.lastrowid
    conn.close()

    return jsonify({
        'id': reconciliation_id,
        'cleared_balance': cleared_balance,
        'outstanding_deposits': outstanding_deposits,
        'outstanding_checks': outstanding_checks,
        'difference': difference,
        'message': 'Reconciliation completed successfully'
    }), 201

@app.route('/api/reconciliation/<int:bank_account_id>', methods=['GET'])
@require_role('admin')
def get_reconciliation_history(bank_account_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM reconciliation_records
        WHERE bank_account_id = ?
        ORDER BY statement_date DESC
    ''', (bank_account_id,))
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(records)

# Payment Receipt endpoint
@app.route('/api/payments/<int:id>/receipt', methods=['GET'])
@require_auth
def get_payment_receipt(id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT p.*, r.first_name, r.last_name, r.room_number, s.full_name as staff_name
        FROM payments p
        JOIN residents r ON p.resident_id = r.id
        LEFT JOIN staff s ON p.staff_id = s.id
        WHERE p.id = ?
    ''', (id,))
    payment = cursor.fetchone()

    if not payment:
        conn.close()
        return jsonify({'error': 'Payment not found'}), 404

    payment_dict = dict(payment)
    conn.close()
    return jsonify(payment_dict)

# Calendar endpoint
@app.route('/api/calendar', methods=['GET'])
@require_auth
def calendar():
    conn = get_db()
    cursor = conn.cursor()

    resident_id = request.args.get('resident_id')
    year = request.args.get('year')
    month = request.args.get('month')

    activities = []

    # Build query with filters
    med_query = '''
        SELECT ml.*, m.name as medication_name, m.dosage, m.resident_id
            FROM medication_logs ml
            JOIN medications m ON ml.medication_id = m.id
        WHERE 1=1
    '''
    med_params = []

    appt_query = 'SELECT *, resident_id FROM appointments WHERE 1=1'
    appt_params = []

    vs_query = 'SELECT *, resident_id FROM vital_signs WHERE 1=1'
    vs_params = []

    if resident_id:
        med_query += ' AND m.resident_id = ?'
        med_params.append(resident_id)
        appt_query += ' AND resident_id = ?'
        appt_params.append(resident_id)
        vs_query += ' AND resident_id = ?'
        vs_params.append(resident_id)

    if year and month:
        med_query += ' AND strftime("%Y", ml.taken_at) = ? AND strftime("%m", ml.taken_at) = ?'
        med_params.extend([year, month.zfill(2)])
        appt_query += ' AND strftime("%Y", date) = ? AND strftime("%m", date) = ?'
        appt_params.extend([year, month.zfill(2)])
        vs_query += ' AND strftime("%Y", recorded_at) = ? AND strftime("%m", recorded_at) = ?'
        vs_params.extend([year, month.zfill(2)])

    med_query += ' ORDER BY ml.taken_at DESC'
    appt_query += ' ORDER BY date DESC, time DESC'
    vs_query += ' ORDER BY recorded_at DESC'

    cursor.execute(med_query, med_params)
    for row in cursor.fetchall():
        activities.append({
            'type': 'medication',
            'id': row['id'],
            'datetime': row['taken_at'],
            'scheduled_time': row['scheduled_time'],
            'status': row['status'],
            'name': row['medication_name'],
            'dosage': row['dosage'],
            'resident_id': row['resident_id']
        })

    cursor.execute(appt_query, appt_params)
    for row in cursor.fetchall():
        activities.append({
            'type': 'appointment',
            'id': row['id'],
            'datetime': row['date'] + ' ' + row['time'],
            'date': row['date'],
            'time': row['time'],
            'name': row['doctor_name'],
            'facility': row['facility'],
            'purpose': row['purpose'],
            'notes': row['notes'],
            'completed': row['completed'],
            'resident_id': row['resident_id']
        })

    cursor.execute(vs_query, vs_params)
    for row in cursor.fetchall():
        activities.append({
            'type': 'vital_signs',
            'id': row['id'],
            'datetime': row['recorded_at'],
            'systolic': row['systolic'],
            'diastolic': row['diastolic'],
            'glucose': row['glucose'],
            'temperature': row['temperature'],
            'heart_rate': row['heart_rate'],
            'weight': row['weight'],
            'resident_id': row['resident_id']
        })

    activities.sort(key=lambda x: x['datetime'], reverse=True)

    conn.close()
    return jsonify(activities)

# Dashboard endpoint
@app.route('/api/dashboard', methods=['GET'])
@require_auth
def dashboard():
    conn = get_db()
    cursor = conn.cursor()

    resident_id = request.args.get('resident_id')

    # Medications
    if resident_id:
        cursor.execute('SELECT COUNT(*) as count FROM medications WHERE active = 1 AND resident_id = ?', (resident_id,))
    else:
        cursor.execute('SELECT COUNT(*) as count FROM medications WHERE active = 1')
    total_meds = cursor.fetchone()['count']

    # Medications taken today
    if resident_id:
        cursor.execute('''
            SELECT COUNT(*) as count FROM medication_logs ml
            JOIN medications m ON ml.medication_id = m.id
            WHERE DATE(ml.taken_at) = DATE('now') AND ml.status = 'taken' AND m.resident_id = ?
        ''', (resident_id,))
    else:
        cursor.execute('''
            SELECT COUNT(*) as count FROM medication_logs
            WHERE DATE(taken_at) = DATE('now') AND status = 'taken'
        ''')
    meds_taken_today = cursor.fetchone()['count']

    # Appointments today
    if resident_id:
        cursor.execute('''
            SELECT COUNT(*) as count FROM appointments
            WHERE date = DATE('now') AND completed = 0 AND resident_id = ?
        ''', (resident_id,))
    else:
        cursor.execute('''
            SELECT COUNT(*) as count FROM appointments
            WHERE date = DATE('now') AND completed = 0
        ''')
    appts_today = cursor.fetchone()['count']

    # Billing summary (if resident selected)
    billing_summary = None
    if resident_id:
        cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE resident_id = ?', (resident_id,))
        total_billed = cursor.fetchone()['total'] or 0

        cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE resident_id = ?', (resident_id,))
        total_paid = cursor.fetchone()['total'] or 0

        cursor.execute('SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE resident_id = ? AND status = ?', (resident_id, 'pending'))
        pending_amount = cursor.fetchone()['total'] or 0

        balance = total_billed - total_paid

        billing_summary = {
            'total_billed': total_billed,
            'total_paid': total_paid,
            'balance': balance,
            'pending_amount': pending_amount
        }

    conn.close()

    return jsonify({
        'total_medications': total_meds,
        'medications_taken_today': meds_taken_today,
        'appointments_today': appts_today,
        'billing_summary': billing_summary
    })

# Staff management (GET: any authenticated user, POST: admin only)
@app.route('/api/staff', methods=['GET', 'POST'])
def staff():
    # GET: Allow any authenticated user (needed for dropdowns in forms)
    if request.method == 'GET':
        staff_member = get_current_staff(request)
        if not staff_member:
            return jsonify({'error': 'Authentication required'}), 401
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, full_name, role, email, phone, phone_carrier, active, created_at FROM staff ORDER BY full_name')
        staff_list = []
        for row in cursor.fetchall():
            staff_dict = dict(row)
            # Format phone number for display
            if staff_dict.get('phone'):
                staff_dict['phone_formatted'] = format_phone_number(staff_dict['phone'])
            staff_list.append(staff_dict)
        conn.close()
        return jsonify(staff_list)

    # POST: Admin only
    elif request.method == 'POST':
        staff_member = get_current_staff(request)
        if not staff_member:
            return jsonify({'error': 'Authentication required'}), 401
        if staff_member['role'] != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        conn = get_db()
        cursor = conn.cursor()
        data = request.json
        password_hash = hash_password(data.get('password', 'password123'))
        cursor.execute('''
            INSERT INTO staff (username, password_hash, full_name, role, email, phone, phone_carrier)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('username'),
            password_hash,
            data.get('full_name'),
            data.get('role', 'caregiver'),
            data.get('email'),
            data.get('phone'),
            data.get('phone_carrier')  # Carrier for SMS (e.g., 'verizon', 'att', 't-mobile')
        ))
        conn.commit()
        staff_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': staff_id, 'message': 'Staff member added successfully'}), 201

@app.route('/api/staff/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_role('admin')
def staff_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT id, username, full_name, role, email, phone, phone_carrier, active, created_at FROM staff WHERE id = ?', (id,))
        staff = cursor.fetchone()
        conn.close()
        if not staff:
            return jsonify({'error': 'Staff member not found'}), 404
        staff_dict = dict(staff)
        # Format phone number for display
        if staff_dict.get('phone'):
            staff_dict['phone_formatted'] = format_phone_number(staff_dict['phone'])
        return jsonify(staff_dict)

    elif request.method == 'PUT':
        data = request.json
        # If password is provided, hash it; otherwise keep existing password
        if data.get('password'):
            password_hash = hash_password(data.get('password'))
            cursor.execute('''
                UPDATE staff
                SET username = ?, full_name = ?, role = ?, email = ?, phone = ?, active = ?
                WHERE id = ?
            ''', (
                data.get('username'),
                data.get('full_name'),
                data.get('role', 'caregiver'),
                data.get('email'),
                data.get('phone'),
                data.get('active', True),
                id
            ))
            # Update password separately if provided
            cursor.execute('UPDATE staff SET password_hash = ? WHERE id = ?', (password_hash, id))
        else:
            cursor.execute('''
                UPDATE staff
                SET username = ?, full_name = ?, role = ?, email = ?, phone = ?, phone_carrier = ?, active = ?
                WHERE id = ?
            ''', (
                data.get('username'),
                data.get('full_name'),
                data.get('role', 'caregiver'),
                data.get('email'),
                data.get('phone'),
                data.get('phone_carrier'),  # Carrier for SMS
                data.get('active', True),
                id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Staff member updated successfully'})

    elif request.method == 'DELETE':
        # Soft delete - set active to 0
        cursor.execute('UPDATE staff SET active = 0 WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Staff member deactivated successfully'})

# Incident Reports
@app.route('/api/incidents', methods=['GET', 'POST'])
@require_auth
def incidents():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        try:
            if resident_id:
                cursor.execute('''
                    SELECT ir.*, r.first_name || ' ' || r.last_name as resident_name,
                           s.full_name as staff_name
                    FROM incident_reports ir
                    JOIN residents r ON ir.resident_id = r.id
                    JOIN staff s ON ir.staff_id = s.id
                    WHERE ir.resident_id = ?
                    ORDER BY ir.incident_date DESC
                ''', (resident_id,))
            else:
                cursor.execute('''
                    SELECT ir.*, r.first_name || ' ' || r.last_name as resident_name,
                           s.full_name as staff_name
                    FROM incident_reports ir
                    JOIN residents r ON ir.resident_id = r.id
                    JOIN staff s ON ir.staff_id = s.id
                    ORDER BY ir.incident_date DESC
                ''')
            incidents = [dict(row) for row in cursor.fetchall()]
            conn.close()
            print(f'[API] Returning {len(incidents)} incidents')
            return jsonify(incidents)
        except Exception as e:
            conn.close()
            print(f'[API ERROR] Failed to fetch incidents: {str(e)}')
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        # Check if request has JSON data
        if not request.is_json:
            print(f"❌ Request is not JSON")
            conn.close()
            return jsonify({'error': 'Request must be JSON / La solicitud debe ser JSON'}), 400

        data = request.json
        if not data:
            print(f"❌ Request JSON data is None or empty")
            conn.close()
            return jsonify({'error': 'Request data is required / Se requieren datos de solicitud'}), 400

        print(f"\n{'='*60}")
        print(f"📝 INCIDENT CREATION REQUEST RECEIVED")
        print(f"{'='*60}")
        print(f"📋 Received data: {data}")

        # Validate required fields
        if not data.get('resident_id'):
            print(f"❌ Validation failed: Missing resident_id")
            conn.close()
            return jsonify({'error': 'Resident ID is required / Se requiere ID de residente'}), 400
        if not data.get('incident_date'):
            print(f"❌ Validation failed: Missing incident_date")
            conn.close()
            return jsonify({'error': 'Incident date is required / Se requiere fecha del incidente'}), 400
        if not data.get('incident_type'):
            print(f"❌ Validation failed: Missing incident_type")
            conn.close()
            return jsonify({'error': 'Incident type is required / Se requiere tipo de incidente'}), 400
        if not data.get('description'):
            print(f"❌ Validation failed: Missing description")
            conn.close()
            return jsonify({'error': 'Description is required / Se requiere descripción'}), 400

        print(f"✅ All required fields validated")

        try:
            # Always credit the currently logged-in staff (ignore any staff_id provided by the client)
            staff_id = request.current_staff['id']
            print(f"👤 Using staff_id (logged-in): {staff_id}")

            print(f"💾 Attempting to INSERT incident into database...")
            cursor.execute('''
                INSERT INTO incident_reports (
                    resident_id, incident_date, incident_type, location, description,
                    severity, witnesses, actions_taken, family_notified,
                    family_notification_date, follow_up_required, follow_up_notes,
                    photos, residents_involved, staff_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                int(data.get('resident_id')),
                data.get('incident_date'),
                data.get('incident_type'),
                data.get('location') or '',
                data.get('description'),
                data.get('severity', 'minor'),
                data.get('witnesses') or '',
                data.get('actions_taken') or '',
                1 if data.get('family_notified') else 0,
                data.get('family_notification_date') or None,
                1 if data.get('follow_up_required') else 0,
                data.get('follow_up_notes') or '',
                data.get('photos') or '',
                data.get('residents_involved') or '',
                int(staff_id)
            ))
            print(f"✅ INSERT statement executed")

            print(f"💾 Committing transaction...")
            conn.commit()
            incident_id = cursor.lastrowid
            print(f"✅ Transaction committed successfully! Incident ID: {incident_id}")

            try:
                cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (int(data.get('resident_id')),))
                resident_row = cursor.fetchone()
                resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else 'Unknown Resident'
                incident_type = data.get('incident_type') or 'Incident'
                severity = data.get('severity', 'minor')
                description = (data.get('description') or '').strip()
                title = f"Incident Reported ({severity})"
                details = f"{resident_name} - {incident_type}" + (f" | {description[:200]}" if description else '')
                create_journal_entry(
                    conn,
                    resident_id=int(data.get('resident_id')),
                    entry_type='incident',
                    title=title,
                    details=details,
                    occurred_at=(data.get('incident_date') or datetime.utcnow().isoformat() + 'Z'),
                    staff_id=int(staff_id),
                    staff_name=request.current_staff.get('full_name'),
                    source_table='incident_reports',
                    source_id=incident_id
                )
                conn.commit()
            except Exception as e:
                print(f"⚠️ Warning: Could not journal incident report: {e}")

            # Verify the incident was saved
            cursor.execute('SELECT * FROM incident_reports WHERE id = ?', (incident_id,))
            verify_incident = cursor.fetchone()
            if verify_incident:
                print(f"✅ VERIFIED: Incident {incident_id} exists in database")
                print(f"   Description: {verify_incident['description'][:50]}...")
            else:
                print(f"❌ CRITICAL: Incident {incident_id} NOT FOUND after commit!")

            # Create notification for incident (non-critical, don't fail if this errors)
            try:
                cursor.execute('''
                    INSERT INTO notifications (resident_id, notification_type, title, message, priority)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    int(data.get('resident_id')),
                    'incident',
                    f'New Incident Report - {data.get("incident_type", "Incident")}',
                    f'Incident reported: {data.get("description", "")[:100]}',
                    'high' if data.get('severity') in ['major', 'critical'] else 'normal'
                ))
                conn.commit()
            except Exception as notif_error:
                print(f'⚠️ Warning: Could not create notification (non-critical): {notif_error}')

            # Close connection IMMEDIATELY - return response right away
            conn.close()
            print(f"✅ Database connection closed. Returning response immediately.")

            # Prepare response data AFTER closing connection
            response_data = {'id': incident_id, 'message': 'Incident report created successfully', 'email_status': 'Email processing in background'}
            print(f"📤 Returning success response immediately.")
            print(f"📦 Response data: {response_data}")
            print(f"{'='*60}\n")

            # Start email sending in background thread (AFTER connection closed)
            def send_emails_background():
                # Capture data from outer scope
                resident_id_for_email = data.get('resident_id')
                staff_id_for_email = int(staff_id)
                incident_type_for_email = data.get('incident_type', 'Unknown')
                severity_for_email = data.get('severity', 'minor')
                try:
                    print(f"🔍 [Background] Email thread started for incident", flush=True)
                    print(f"   Incident data: resident_id={resident_id_for_email}, severity='{severity_for_email}', type='{incident_type_for_email}'", flush=True)
                    print(f"   EMAIL_SERVICE_AVAILABLE: {EMAIL_SERVICE_AVAILABLE}", flush=True)

                    # Check email configuration (Resend OR SMTP)
                    import os
                    bg_resend_api_key = os.getenv('RESEND_API_KEY', '')
                    bg_resend_from_email = os.getenv('RESEND_FROM_EMAIL', '')
                    bg_sender_email = os.getenv('SENDER_EMAIL', '')
                    bg_sender_password = os.getenv('SENDER_PASSWORD', '')

                    print(f"   RESEND_API_KEY: {'SET (starts with re_)' if bg_resend_api_key else 'NOT SET'}", flush=True)
                    print(f"   RESEND_FROM_EMAIL: {'SET (' + bg_resend_from_email + ')' if bg_resend_from_email else 'NOT SET'}", flush=True)
                    print(f"   SENDER_EMAIL: {'SET (' + bg_sender_email + ')' if bg_sender_email else 'NOT SET'}", flush=True)
                    print(f"   SENDER_PASSWORD: {'SET' if bg_sender_password else 'NOT SET'}", flush=True)

                    if not EMAIL_SERVICE_AVAILABLE:
                        print(f"⚠️ [Background] Email service not available (module import failed)", flush=True)
                        return

                    # Check if either Resend OR SMTP is configured
                    has_resend = bool(bg_resend_api_key and bg_resend_from_email)
                    has_smtp = bool(bg_sender_email and bg_sender_password)

                    if not has_resend and not has_smtp:
                        print(f"⚠️ [Background] Email service not configured:", flush=True)
                        print(f"   Resend: {'✓' if has_resend else '✗'} (needs RESEND_API_KEY + RESEND_FROM_EMAIL)", flush=True)
                        print(f"   SMTP: {'✓' if has_smtp else '✗'} (needs SENDER_EMAIL + SENDER_PASSWORD)", flush=True)
                        return

                    if has_resend:
                        print(f"✅ [Background] Using Resend API for email sending", flush=True)
                    else:
                        print(f"✅ [Background] Using SMTP for email sending (Resend not configured)", flush=True)

                    raw_severity = severity_for_email
                    severity_value = raw_severity.lower() if raw_severity else ''
                    print(f"🔍 [Background] Incident severity check:", flush=True)
                    print(f"   Raw severity: '{raw_severity}'", flush=True)
                    print(f"   Normalized severity: '{severity_value}'", flush=True)

                    if severity_value not in ['major', 'critical']:
                        print(f"ℹ️ [Background] Severity '{severity_value}' does not qualify for email alert (needs 'major' or 'critical')", flush=True)
                        return

                    print(f"✅ [Background] Severity '{severity_value}' qualifies for email alert", flush=True)

                    # Create new database connection in background thread
                    bg_conn = get_db()
                    bg_cursor = bg_conn.cursor()

                    # Get resident name
                    bg_cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id_for_email,))
                    resident = bg_cursor.fetchone()
                    if not resident:
                        print(f"⚠️ [Background] Resident not found (resident_id: {resident_id_for_email})", flush=True)
                        bg_conn.close()
                        return

                    resident_name = f"{resident['first_name']} {resident['last_name']}"
                    print(f"📋 [Background] Resident: {resident_name}", flush=True)

                    # Get staff emails and phone numbers for notification (managers, admins, or assigned staff)
                    bg_cursor.execute('''
                        SELECT email, phone, phone_carrier, preferred_language FROM staff
                        WHERE (role IN ('admin', 'manager') OR id = ?)
                        AND active = 1
                    ''', (staff_id_for_email,))
                    staff_records = bg_cursor.fetchall()
                    staff_emails = [row['email'] for row in staff_records if row['email']]
                    # Filter phones: exclude NULL, empty strings, and whitespace-only strings
                    staff_phones = [(row['phone'], row['phone_carrier'], row['preferred_language'] or 'en') for row in staff_records
                                   if row['phone'] and row['phone'].strip()]
                    print(f"👥 [Background] Found {len(staff_emails)} staff email(s): {staff_emails}", flush=True)
                    print(f"📱 [Background] Found {len(staff_phones)} staff phone(s) for SMS: {[p[0] for p in staff_phones]}", flush=True)

                    # Get emergency contact email and phone for the resident
                    bg_cursor.execute('SELECT emergency_contact_email, emergency_contact_phone FROM residents WHERE id = ?', (resident_id_for_email,))
                    emergency_contact = bg_cursor.fetchone()
                    emergency_contact_email = emergency_contact['emergency_contact_email'] if emergency_contact and emergency_contact['emergency_contact_email'] else None
                    emergency_contact_phone = emergency_contact['emergency_contact_phone'] if emergency_contact and emergency_contact['emergency_contact_phone'] else None
                    print(f"📞 [Background] Emergency contact email: {emergency_contact_email if emergency_contact_email else 'None'}", flush=True)
                    print(f"📱 [Background] Emergency contact phone: {emergency_contact_phone if emergency_contact_phone else 'None'}", flush=True)

                    # Combine all recipient emails (remove duplicates)
                    all_recipients = list(set(staff_emails))  # Use set to remove duplicates
                    if emergency_contact_email and emergency_contact_email not in all_recipients:
                        all_recipients.append(emergency_contact_email)
                        print(f"📧 [Background] Will also notify emergency contact: {emergency_contact_email}", flush=True)
                    elif emergency_contact_email:
                        print(f"ℹ️ [Background] Emergency contact email {emergency_contact_email} already in staff list, skipping duplicate", flush=True)

                    # Fallback: If no recipients found, try to get ANY staff email as last resort
                    if not all_recipients:
                        print(f"⚠️ [Background] No email addresses found, trying fallback...", flush=True)
                        bg_cursor.execute('''
                            SELECT email FROM staff
                            WHERE email IS NOT NULL
                            AND email != ''
                            AND active = 1
                            LIMIT 1
                        ''')
                        fallback_staff = bg_cursor.fetchone()
                        if fallback_staff and fallback_staff['email']:
                            all_recipients.append(fallback_staff['email'])
                            print(f"⚠️ [Background] Using fallback staff email: {fallback_staff['email']}", flush=True)

                    bg_conn.close()  # Close connection before sending emails

                    if not all_recipients:
                        print(f"❌ [Background] No email addresses found to send incident alert for {resident_name}", flush=True)
                        return

                    # Default to English for language (we can't access request.current_staff in background thread)
                    language_for_email = 'en'

                    print(f"📬 [Background] Preparing to send emails to {len(all_recipients)} unique recipient(s): {all_recipients}", flush=True)

                    # Send email to all recipients (staff + emergency contact) with rate limiting
                    # Resend API allows 2 requests per second, so add 600ms delay between requests
                    emails_sent = 0
                    email_errors = []
                    for i, recipient_email in enumerate(all_recipients):
                        if i > 0:  # Wait 600ms between requests (except first one)
                            time.sleep(0.6)  # 600ms delay = ~1.67 requests/second (under 2/sec limit)
                        print(f"📤 [Background] Sending incident alert to {recipient_email}...", flush=True)
                        try:
                            email_result = send_incident_alert(
                                resident_name=resident_name,
                                incident_type=incident_type_for_email,
                                severity=severity_for_email.title(),
                                staff_email=recipient_email,
                                language=language_for_email
                            )
                            if email_result:
                                emails_sent += 1
                                print(f"✅ [Background] Email sent successfully to {recipient_email}", flush=True)
                            else:
                                error_msg = f"Email function returned False for {recipient_email}"
                                email_errors.append(error_msg)
                                print(f"❌ [Background] {error_msg}", flush=True)
                        except Exception as email_exception:
                            error_msg = f"Exception sending email to {recipient_email}: {str(email_exception)}"
                            email_errors.append(error_msg)
                            print(f"❌ [Background] {error_msg}", flush=True)
                            import traceback
                            traceback.print_exc(file=sys.stdout)

                    # Send SMS notifications (FREE via email-to-SMS gateway)
                    sms_sent = 0
                    sms_errors = []
                    if SMS_SERVICE_AVAILABLE:
                        # Get staff phones (re-fetch from database with strict filtering)
                        bg_conn_sms = get_db()
                        bg_cursor_sms = bg_conn_sms.cursor()
                        bg_cursor_sms.execute('''
                            SELECT phone, phone_carrier, preferred_language FROM staff
                            WHERE (role IN ('admin', 'manager') OR id = ?)
                            AND phone IS NOT NULL
                            AND phone != ''
                            AND active = 1
                        ''', (staff_id_for_email,))
                        staff_phone_records = bg_cursor_sms.fetchall()
                        staff_phones = [(row['phone'].strip(), row['phone_carrier'], row['preferred_language'] or 'en') for row in staff_phone_records if row['phone'] and row['phone'].strip()]
                        bg_cursor_sms.execute('SELECT emergency_contact_phone, emergency_contact_carrier FROM residents WHERE id = ?', (resident_id_for_email,))
                        emergency_contact_row = bg_cursor_sms.fetchone()
                        emergency_contact_phone = None
                        emergency_contact_carrier = None
                        if emergency_contact_row and emergency_contact_row['emergency_contact_phone']:
                            phone_str = emergency_contact_row['emergency_contact_phone'].strip() if emergency_contact_row['emergency_contact_phone'] else None
                            emergency_contact_phone = phone_str if phone_str else None
                            emergency_contact_carrier = emergency_contact_row['emergency_contact_carrier'] if emergency_contact_row['emergency_contact_carrier'] else None
                        bg_conn_sms.close()

                        print(f"📱 [Background] Preparing to send SMS alerts to {len(staff_phones)} staff phone(s) and emergency contact", flush=True)
                        if len(staff_phones) > 0:
                            print(f"   Staff phones: {[p[0] for p in staff_phones]}", flush=True)
                        if emergency_contact_phone:
                            print(f"   Emergency contact phone: {emergency_contact_phone}", flush=True)
                        else:
                            print(f"   ⚠️ No emergency contact phone found for resident {resident_id_for_email}", flush=True)

                        # Add delay before SMS (to respect rate limit after emails)
                        # We've already sent emails, so wait 600ms before starting SMS
                        time.sleep(0.6)

                        # Send SMS to staff
                        for i, (phone, carrier, language) in enumerate(staff_phones):
                            if phone:
                                # Add 600ms delay between SMS requests (except first one)
                                if i > 0:
                                    time.sleep(0.6)
                                try:
                                    sms_result = send_incident_alert_sms(
                                        resident_name=resident_name,
                                        incident_type=incident_type_for_email,
                                        severity=severity_for_email.title(),
                                        phone=phone,
                                        carrier=carrier,  # Use carrier from database
                                        language=language or 'en'
                                    )
                                    if sms_result:
                                        sms_sent += 1
                                        print(f"✅ [Background] SMS sent successfully to {phone}", flush=True)
                                    else:
                                        error_msg = f"SMS function returned False for {phone}"
                                        sms_errors.append(error_msg)
                                        print(f"❌ [Background] {error_msg}", flush=True)
                                except Exception as sms_exception:
                                    error_msg = f"Exception sending SMS to {phone}: {str(sms_exception)}"
                                    sms_errors.append(error_msg)
                                    print(f"❌ [Background] {error_msg}", flush=True)

                        # Send SMS to emergency contact (if not already sent to staff)
                        if emergency_contact_phone:
                            # Check if emergency contact phone is already in staff_phones
                            # staff_phones is a list of tuples: (phone, carrier, language)
                            emergency_phone_already_contacted = any(phone == emergency_contact_phone for phone, _, _ in staff_phones)
                            if not emergency_phone_already_contacted:
                                # Add delay before emergency contact SMS
                                time.sleep(0.6)
                                try:
                                    sms_result = send_incident_alert_sms(
                                        resident_name=resident_name,
                                        incident_type=incident_type_for_email,
                                        severity=severity_for_email.title(),
                                        phone=emergency_contact_phone,
                                        carrier=emergency_contact_carrier,  # Use carrier from database
                                        language='en'  # Default to English for emergency contacts
                                    )
                                    if sms_result:
                                        sms_sent += 1
                                        print(f"✅ [Background] SMS sent successfully to emergency contact: {emergency_contact_phone}", flush=True)
                                    else:
                                        error_msg = f"SMS function returned False for emergency contact {emergency_contact_phone}"
                                        sms_errors.append(error_msg)
                                        print(f"❌ [Background] {error_msg}", flush=True)
                                except Exception as sms_exception:
                                    error_msg = f"Exception sending SMS to emergency contact {emergency_contact_phone}: {str(sms_exception)}"
                                    sms_errors.append(error_msg)
                                    print(f"❌ [Background] {error_msg}", flush=True)
                            else:
                                print(f"ℹ️ [Background] Emergency contact phone {emergency_contact_phone} already contacted as staff, skipping duplicate SMS", flush=True)

                        if sms_sent > 0:
                            print(f"✅ [Background] Sent {sms_sent} SMS alert(s)", flush=True)
                    else:
                        print(f"ℹ️ [Background] SMS service not available, skipping SMS notifications", flush=True)

                    if emails_sent > 0:
                        print(f"✅ [Background] Sent {emails_sent}/{len(all_recipients)} incident alert email(s) for {resident_name}", flush=True)
                    else:
                        print(f"⚠️ [Background] Failed to send incident alert emails.", flush=True)
                        print(f"   Attempted to send to: {all_recipients}", flush=True)
                        print(f"   Errors: {email_errors}", flush=True)
                        print(f"   Check Render environment variables: RESEND_API_KEY + RESEND_FROM_EMAIL (or SENDER_EMAIL + SENDER_PASSWORD)", flush=True)
                except Exception as bg_error:
                    print(f"❌ [Background] Error in email sending thread: {bg_error}", flush=True)
                    import traceback
                    traceback.print_exc()
                    sys.stdout.flush()

            # Start email thread (don't wait for it - happens in background)
            try:
                print(f"🚀 Starting email background thread...", flush=True)
                email_thread = threading.Thread(target=send_emails_background, daemon=True)
                email_thread.start()
                print(f"✅ Email thread started in background (non-blocking, thread ID: {email_thread.ident})", flush=True)
            except Exception as thread_error:
                print(f"⚠️ Failed to start email thread (non-critical): {thread_error}", flush=True)
                import traceback
                traceback.print_exc()
                # Don't fail the request if thread creation fails

            # Return response IMMEDIATELY - this happens regardless of email thread
            print(f"📤 SENDING HTTP RESPONSE NOW - Status 201")
            response = jsonify(response_data)
            print(f"✅ Response object created: {response}")
            return response, 201
        except sqlite3.IntegrityError as e:
            print(f"\n❌ INTEGRITY ERROR: {e}")
            import traceback
            traceback.print_exc()
            conn.close()
            print(f"{'='*60}\n")
            return jsonify({'error': f'Database error: {str(e)}'}), 400
        except Exception as e:
            print(f"\n❌ EXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            conn.close()
            print(f"{'='*60}\n")
            return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/incidents/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def incident_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('''
            SELECT ir.*, r.first_name || ' ' || r.last_name as resident_name,
                   s.full_name as staff_name
            FROM incident_reports ir
            JOIN residents r ON ir.resident_id = r.id
            JOIN staff s ON ir.staff_id = s.id
            WHERE ir.id = ?
        ''', (id,))
        incident = cursor.fetchone()
        conn.close()
        if not incident:
            return jsonify({'error': 'Incident report not found'}), 404
        return jsonify(dict(incident))

    elif request.method == 'PUT':
        data = request.json
        # Use provided staff_id or keep existing
        staff_id = data.get('staff_id')
        update_fields = [
            data.get('incident_date'),
            data.get('incident_type'),
            data.get('location'),
            data.get('description'),
            data.get('severity'),
            data.get('witnesses'),
            data.get('actions_taken'),
            data.get('family_notified'),
            data.get('family_notification_date'),
            data.get('follow_up_required'),
            data.get('follow_up_notes'),
            data.get('photos'),
            data.get('residents_involved') or ''
        ]

        if staff_id:
            cursor.execute('''
                UPDATE incident_reports
                SET incident_date = ?, incident_type = ?, location = ?, description = ?,
                    severity = ?, witnesses = ?, actions_taken = ?, family_notified = ?,
                    family_notification_date = ?, follow_up_required = ?, follow_up_notes = ?,
                    photos = ?, residents_involved = ?, staff_id = ?
                WHERE id = ?
            ''', (*update_fields, int(staff_id), id))
        else:
            cursor.execute('''
                UPDATE incident_reports
                SET incident_date = ?, incident_type = ?, location = ?, description = ?,
                    severity = ?, witnesses = ?, actions_taken = ?, family_notified = ?,
                    family_notification_date = ?, follow_up_required = ?, follow_up_notes = ?,
                    photos = ?, residents_involved = ?
                WHERE id = ?
            ''', (*update_fields, id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Incident report updated successfully'})

    elif request.method == 'DELETE':
        try:
            # First check if the incident exists
            cursor.execute('SELECT id FROM incident_reports WHERE id = ?', (id,))
            incident = cursor.fetchone()

            if not incident:
                conn.close()
                return jsonify({'error': 'Incident report not found'}), 404

            # Delete the incident
            cursor.execute('DELETE FROM incident_reports WHERE id = ?', (id,))

            # Check if deletion was successful
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({'error': 'Failed to delete incident report'}), 500

            conn.commit()
            conn.close()
            print(f"✅ Incident {id} deleted successfully")
            return jsonify({'message': 'Incident report deleted successfully'})
        except Exception as e:
            conn.close()
            print(f"❌ Error deleting incident {id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error deleting incident: {str(e)}'}), 500

# Daily Care Notes
@app.route('/api/care-notes', methods=['GET', 'POST'])
@require_auth
def care_notes():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        try:
            resident_id = request.args.get('resident_id')
            note_date = request.args.get('date')

            query = '''
                SELECT cn.*, 
                       COALESCE(r.first_name || ' ' || r.last_name, 'Unknown Resident') as resident_name,
                       COALESCE(s.full_name, 'Unknown Staff') as staff_name
                FROM daily_care_notes cn
                LEFT JOIN residents r ON cn.resident_id = r.id
                LEFT JOIN staff s ON cn.staff_id = s.id
                WHERE 1=1
            '''
            params = []

            if resident_id:
                query += ' AND cn.resident_id = ?'
                params.append(resident_id)

            if note_date:
                query += ' AND cn.note_date = ?'
                params.append(note_date)

            query += ' ORDER BY cn.note_date DESC, cn.created_at DESC'

            cursor.execute(query, params)
            notes = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return jsonify(notes)
        except Exception as e:
            conn.close()
            print(f"❌ Error loading care notes: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error loading care notes: {str(e)}'}), 500

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO daily_care_notes (
                resident_id, note_date, note_time, shift, meal_breakfast, meal_lunch,
                meal_dinner, meal_snacks, appetite_rating, fluid_intake, bathing, hygiene,
                toileting, mobility, pain_level, pain_location, skin_condition,
                sleep_hours, sleep_quality, mood, behavior_notes, activities, general_notes, staff_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data.get('note_date'),
            data.get('note_time'),
            data.get('shift'),
            data.get('meal_breakfast'),
            data.get('meal_lunch'),
            data.get('meal_dinner'),
            data.get('meal_snacks'),
            data.get('appetite_rating'),
            data.get('fluid_intake'),
            data.get('bathing'),
            data.get('hygiene'),
            data.get('toileting'),
            data.get('mobility'),
            data.get('pain_level'),
            data.get('pain_location'),
            data.get('skin_condition'),
            data.get('sleep_hours'),
            data.get('sleep_quality'),
            data.get('mood'),
            data.get('behavior_notes'),
            data.get('activities'),
            data.get('general_notes'),
            request.current_staff['id']
        ))
        conn.commit()
        note_id = cursor.lastrowid

        try:
            cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (data.get('resident_id'),))
            resident_row = cursor.fetchone()
            resident_name = f"{resident_row['first_name']} {resident_row['last_name']}" if resident_row else 'Unknown Resident'
            note_date = data.get('note_date') or ''
            note_time = data.get('note_time') or ''
            shift = data.get('shift') or ''
            general_notes = (data.get('general_notes') or '').strip()
            details = f"{resident_name} - Care note {note_date} {note_time} {shift}".strip()
            if general_notes:
                details = details + f" | {general_notes[:200]}"
            create_journal_entry(
                conn,
                resident_id=data.get('resident_id'),
                entry_type='care_note',
                title='Care Note Created',
                details=details,
                occurred_at=datetime.utcnow().isoformat() + 'Z',
                staff_id=request.current_staff['id'],
                staff_name=request.current_staff.get('full_name'),
                source_table='daily_care_notes',
                source_id=note_id
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Warning: Could not journal care note: {e}")

        conn.close()
        return jsonify({'id': note_id, 'message': 'Care note created successfully'}), 201

@app.route('/api/care-notes/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
def care_note_detail(id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        try:
            cursor.execute('''
                SELECT cn.*, r.first_name || ' ' || r.last_name as resident_name,
                       s.full_name as staff_name
                FROM daily_care_notes cn
                JOIN residents r ON cn.resident_id = r.id
                JOIN staff s ON cn.staff_id = s.id
                WHERE cn.id = ?
            ''', (id,))
            note = cursor.fetchone()
            conn.close()
            if not note:
                return jsonify({'error': 'Care note not found'}), 404
            return jsonify(dict(note))
        except Exception as e:
            conn.close()
            print(f"❌ Error loading care note {id}: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error loading care note: {str(e)}'}), 500

    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE daily_care_notes
            SET note_date = ?, note_time = ?, shift = ?, meal_breakfast = ?, meal_lunch = ?,
                meal_dinner = ?, meal_snacks = ?, appetite_rating = ?, fluid_intake = ?,
                bathing = ?, hygiene = ?, toileting = ?, mobility = ?, pain_level = ?,
                pain_location = ?, skin_condition = ?, sleep_hours = ?, sleep_quality = ?,
                mood = ?, behavior_notes = ?, activities = ?, general_notes = ?
            WHERE id = ?
        ''', (
            data.get('note_date'),
            data.get('note_time'),
            data.get('shift'),
            data.get('meal_breakfast'),
            data.get('meal_lunch'),
            data.get('meal_dinner'),
            data.get('meal_snacks'),
            data.get('appetite_rating'),
            data.get('fluid_intake'),
            data.get('bathing'),
            data.get('hygiene'),
            data.get('toileting'),
            data.get('mobility'),
            data.get('pain_level'),
            data.get('pain_location'),
            data.get('skin_condition'),
            data.get('sleep_hours'),
            data.get('sleep_quality'),
            data.get('mood'),
            data.get('behavior_notes'),
            data.get('activities'),
            data.get('general_notes'),
            id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Care note updated successfully'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM daily_care_notes WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Care note deleted successfully'})

# Notifications
@app.route('/api/notifications', methods=['GET', 'POST'])
@require_auth
def notifications():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id')
        unread_only = request.args.get('unread_only', 'false') == 'true'

        query = 'SELECT * FROM notifications WHERE 1=1'
        params = []

        if resident_id:
            query += ' AND (resident_id = ? OR resident_id IS NULL)'
            params.append(resident_id)

        if unread_only:
            query += ' AND read = 0'

        query += ' AND (expires_at IS NULL OR expires_at > datetime("now"))'
        query += ' ORDER BY created_at DESC LIMIT 50'

        cursor.execute(query, params)
        notifications_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(notifications_list)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO notifications (
                resident_id, notification_type, title, message, priority,
                action_url, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data.get('notification_type', 'general'),
            data.get('title'),
            data.get('message'),
            data.get('priority', 'normal'),
            data.get('action_url'),
            data.get('expires_at')
        ))
        conn.commit()
        notification_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': notification_id, 'message': 'Notification created successfully'}), 201

@app.route('/api/journal', methods=['GET'])
@require_auth
def journal_entries():
    conn = get_db()
    cursor = conn.cursor()

    resident_id = request.args.get('resident_id')
    entry_type = request.args.get('entry_type')
    since = request.args.get('since')
    until = request.args.get('until')
    limit = request.args.get('limit', '200')

    try:
        limit_int = int(limit)
    except Exception:
        limit_int = 200
    if limit_int < 1:
        limit_int = 1
    if limit_int > 500:
        limit_int = 500

    query = 'SELECT * FROM journal_entries WHERE 1=1'
    params = []

    if resident_id:
        query += ' AND resident_id = ?'
        params.append(resident_id)
    if entry_type:
        query += ' AND entry_type = ?'
        params.append(entry_type)
    if since:
        query += ' AND COALESCE(occurred_at, created_at) >= ?'
        params.append(since)
    if until:
        query += ' AND COALESCE(occurred_at, created_at) <= ?'
        params.append(until)

    query += ' ORDER BY COALESCE(occurred_at, created_at) DESC'
    query += f' LIMIT {limit_int}'

    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)


def _parse_iso_datetime(value):
    if not value:
        return None
    try:
        s = str(value).strip()
        if not s:
            return None
        if s.endswith('Z'):
            s = s[:-1]
        if 'T' in s:
            return datetime.fromisoformat(s)
        if len(s) == 10:
            return datetime.fromisoformat(s + 'T00:00:00')
        return datetime.fromisoformat(s)
    except Exception:
        return None


def _build_journal_report_rows(conn, *, resident_id=None, staff_id=None, since=None, until=None, limit=500):
    cursor = conn.cursor()
    query = """
        SELECT
            je.id,
            je.resident_id,
            (r.first_name || ' ' || r.last_name) AS resident_name,
            je.entry_type,
            je.title,
            je.details,
            COALESCE(je.occurred_at, je.created_at) AS occurred_at,
            je.staff_id,
            COALESCE(je.staff_name, s.full_name) AS staff_name
        FROM journal_entries je
        JOIN residents r ON je.resident_id = r.id
        LEFT JOIN staff s ON je.staff_id = s.id
        WHERE 1=1
    """
    params = []
    if resident_id:
        query += ' AND je.resident_id = ?'
        params.append(resident_id)
    if staff_id:
        query += ' AND je.staff_id = ?'
        params.append(staff_id)
    if since:
        query += ' AND COALESCE(je.occurred_at, je.created_at) >= ?'
        params.append(since)
    if until:
        query += ' AND COALESCE(je.occurred_at, je.created_at) <= ?'
        params.append(until)
    query += ' ORDER BY COALESCE(je.occurred_at, je.created_at) DESC'
    query += f' LIMIT {int(limit)}'

    cursor.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]


def _generate_journal_report_pdf_bytes(*, title, rows, meta_lines):
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError('PDF generation not available')
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    margin_x = 0.6 * inch
    y = height - 0.75 * inch
    c.setFont('Helvetica-Bold', 14)
    c.drawString(margin_x, y, title)

    c.setFont('Helvetica', 9)
    y -= 0.3 * inch
    for line in meta_lines:
        c.drawString(margin_x, y, line)
        y -= 0.18 * inch

    y -= 0.1 * inch
    c.setFont('Helvetica-Bold', 9)
    headers = ['Date/Time', 'Resident', 'Title', 'Staff']
    col_x = [margin_x, margin_x + 2.0 * inch, margin_x + 4.4 * inch, margin_x + 6.6 * inch]
    for i, h in enumerate(headers):
        c.drawString(col_x[i], y, h)
    y -= 0.15 * inch
    c.setLineWidth(0.5)
    c.line(margin_x, y, width - margin_x, y)
    y -= 0.2 * inch

    c.setFont('Helvetica', 8)
    for r in rows:
        dt = str(r.get('occurred_at') or '')
        resident_name = str(r.get('resident_name') or '')
        title_text = str(r.get('title') or '')
        staff_name = str(r.get('staff_name') or '')

        if y < 1.0 * inch:
            c.showPage()
            y = height - 0.75 * inch
            c.setFont('Helvetica-Bold', 10)
            c.drawString(margin_x, y, title)
            y -= 0.35 * inch
            c.setFont('Helvetica', 8)

        c.drawString(col_x[0], y, dt[:19])
        c.drawString(col_x[1], y, resident_name[:28])
        c.drawString(col_x[2], y, title_text[:36])
        c.drawString(col_x[3], y, staff_name[:18])
        y -= 0.16 * inch

        details = (r.get('details') or '').strip()
        if details:
            detail_line = details.replace('\n', ' ')
            c.drawString(col_x[1], y, ('Details: ' + detail_line)[:95])
            y -= 0.18 * inch

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


@app.route('/api/reports/journal', methods=['GET'])
@require_auth
def journal_report_rows():
    conn = get_db()
    resident_id = request.args.get('resident_id')
    staff_id = request.args.get('staff_id')
    since = request.args.get('since')
    until = request.args.get('until')
    limit = request.args.get('limit', '500')

    try:
        limit_int = int(limit)
    except Exception:
        limit_int = 500
    if limit_int < 1:
        limit_int = 1
    if limit_int > 500:
        limit_int = 500

    try:
        resident_id_int = int(resident_id) if resident_id else None
    except Exception:
        resident_id_int = None
    try:
        staff_id_int = int(staff_id) if staff_id else None
    except Exception:
        staff_id_int = None

    rows = _build_journal_report_rows(
        conn,
        resident_id=resident_id_int,
        staff_id=staff_id_int,
        since=since,
        until=until,
        limit=limit_int
    )
    conn.close()
    return jsonify(rows)


@app.route('/api/reports/journal/pdf', methods=['POST'])
@require_auth
def journal_report_pdf():
    if not REPORTLAB_AVAILABLE:
        return jsonify({'error': 'PDF generation not available on server'}), 500

    payload = request.json or {}
    resident_id = payload.get('resident_id')
    staff_id = payload.get('staff_id')
    since = payload.get('since')
    until = payload.get('until')

    try:
        resident_id_int = int(resident_id) if resident_id else None
    except Exception:
        resident_id_int = None
    try:
        staff_id_int = int(staff_id) if staff_id else None
    except Exception:
        staff_id_int = None

    conn = get_db()
    rows = _build_journal_report_rows(
        conn,
        resident_id=resident_id_int,
        staff_id=staff_id_int,
        since=since,
        until=until,
        limit=500
    )

    resident_label = 'All Residents'
    if resident_id_int:
        cursor = conn.cursor()
        cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id_int,))
        rr = cursor.fetchone()
        if rr:
            resident_label = f"{rr['first_name']} {rr['last_name']}"

    staff_label = 'All Staff'
    if staff_id_int:
        cursor = conn.cursor()
        cursor.execute('SELECT full_name FROM staff WHERE id = ?', (staff_id_int,))
        sr = cursor.fetchone()
        if sr and sr['full_name']:
            staff_label = sr['full_name']

    conn.close()

    title = 'Journal Report'
    meta_lines = [
        f"Resident: {resident_label}",
        f"Staff: {staff_label}",
        f"From: {since or 'Start'}   To: {until or 'End'}",
        f"Generated: {datetime.utcnow().isoformat()}Z   Total: {len(rows)}"
    ]

    pdf_bytes = _generate_journal_report_pdf_bytes(title=title, rows=rows, meta_lines=meta_lines)
    filename = f"journal_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        pdf_bytes,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
    )


@app.route('/api/reports/journal/email', methods=['POST'])
@require_auth
def journal_report_email():
    if not EMAIL_SERVICE_AVAILABLE:
        return jsonify({'error': 'Email service not available'}), 500
    if not REPORTLAB_AVAILABLE:
        return jsonify({'error': 'PDF generation not available on server'}), 500

    payload = request.json or {}
    to_email = (payload.get('to_email') or '').strip()
    if not to_email:
        return jsonify({'error': 'to_email is required'}), 400

    resident_id = payload.get('resident_id')
    staff_id = payload.get('staff_id')
    since = payload.get('since')
    until = payload.get('until')

    try:
        resident_id_int = int(resident_id) if resident_id else None
    except Exception:
        resident_id_int = None
    try:
        staff_id_int = int(staff_id) if staff_id else None
    except Exception:
        staff_id_int = None

    conn = get_db()
    rows = _build_journal_report_rows(
        conn,
        resident_id=resident_id_int,
        staff_id=staff_id_int,
        since=since,
        until=until,
        limit=500
    )

    resident_label = 'All Residents'
    if resident_id_int:
        cursor = conn.cursor()
        cursor.execute('SELECT first_name, last_name FROM residents WHERE id = ?', (resident_id_int,))
        rr = cursor.fetchone()
        if rr:
            resident_label = f"{rr['first_name']} {rr['last_name']}"

    staff_label = 'All Staff'
    if staff_id_int:
        cursor = conn.cursor()
        cursor.execute('SELECT full_name FROM staff WHERE id = ?', (staff_id_int,))
        sr = cursor.fetchone()
        if sr and sr['full_name']:
            staff_label = sr['full_name']

    conn.close()

    title = 'Journal Report'
    meta_lines = [
        f"Resident: {resident_label}",
        f"Staff: {staff_label}",
        f"From: {since or 'Start'}   To: {until or 'End'}",
        f"Generated: {datetime.utcnow().isoformat()}Z   Total: {len(rows)}"
    ]

    pdf_bytes = _generate_journal_report_pdf_bytes(title=title, rows=rows, meta_lines=meta_lines)
    filename = f"journal_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

    subject = f"Journal Report - {resident_label}"
    html_body = f"""
    <html>
      <body style=\"font-family: Arial, sans-serif;\">
        <h2>Journal Report</h2>
        <p><strong>Resident:</strong> {resident_label}</p>
        <p><strong>Staff:</strong> {staff_label}</p>
        <p><strong>From:</strong> {since or 'Start'}<br><strong>To:</strong> {until or 'End'}</p>
        <p><strong>Total entries:</strong> {len(rows)}</p>
        <p>PDF report is attached.</p>
      </body>
    </html>
    """

    ok = send_email(
        to_email,
        subject,
        html_body,
        attachments=[(filename, pdf_bytes, 'application/pdf')]
    )
    if not ok:
        return jsonify({'error': 'Failed to send email'}), 500
    return jsonify({'message': 'Report emailed successfully'}), 200

@app.route('/api/notifications/<int:id>/read', methods=['PUT'])
@require_auth
def mark_notification_read(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE notifications SET read = 1 WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/notifications/read-all', methods=['PUT'])
@require_auth
def mark_all_notifications_read():
    conn = get_db()
    cursor = conn.cursor()
    resident_id = request.json.get('resident_id') if request.json else None

    if resident_id:
        cursor.execute('UPDATE notifications SET read = 1 WHERE resident_id = ?', (resident_id,))
    else:
        cursor.execute('UPDATE notifications SET read = 1 WHERE read = 0')

    conn.commit()
    conn.close()
    return jsonify({'message': 'All notifications marked as read'})

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

@app.route('/api/version')
def version():
    commit = (
        os.getenv('RENDER_GIT_COMMIT')
        or os.getenv('GIT_COMMIT')
        or os.getenv('COMMIT_SHA')
        or 'unknown'
    )
    return jsonify({
        'status': 'ok',
        'commit': commit,
        'server_time_utc': datetime.utcnow().isoformat() + 'Z'
    }), 200

# Simple test endpoint for POST
@app.route('/api/test-post', methods=['POST'])
@require_auth
def test_post():
    try:
        data = request.json
        return jsonify({'status': 'ok', 'message': 'POST works!', 'received': data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Static file serving
@app.route('/')
def index():
    try:
        response = send_from_directory('.', 'index.html')
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        return jsonify({'error': f'Error serving index.html: {str(e)}'}), 500

# Alert Management API Endpoints
@app.route('/api/alerts/thresholds', methods=['GET', 'POST'])
@require_auth
def alert_thresholds():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        resident_id = request.args.get('resident_id', type=int)
        if resident_id:
            cursor.execute('SELECT * FROM alert_thresholds WHERE resident_id = ?', (resident_id,))
        else:
            cursor.execute('SELECT * FROM alert_thresholds')
        thresholds = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(thresholds)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT OR REPLACE INTO alert_thresholds
            (resident_id, vital_type, min_value, max_value, enabled)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data.get('vital_type'),
            data.get('min_value'),
            data.get('max_value'),
            data.get('enabled', 1)
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Threshold updated successfully'})

@app.route('/api/alerts/history', methods=['GET'])
@require_auth
def alert_history():
    conn = get_db()
    cursor = conn.cursor()

    resident_id = request.args.get('resident_id', type=int)
    limit = request.args.get('limit', 50, type=int)

    if resident_id:
        cursor.execute('''
            SELECT ah.*, r.first_name, r.last_name, s.full_name as recipient_name
            FROM alert_history ah
            JOIN residents r ON ah.resident_id = r.id
            LEFT JOIN staff s ON ah.recipient_id = s.id
            WHERE ah.resident_id = ?
            ORDER BY ah.sent_at DESC
            LIMIT ?
        ''', (resident_id, limit))
    else:
        cursor.execute('''
            SELECT ah.*, r.first_name, r.last_name, s.full_name as recipient_name
            FROM alert_history ah
            JOIN residents r ON ah.resident_id = r.id
            LEFT JOIN staff s ON ah.recipient_id = s.id
            ORDER BY ah.sent_at DESC
            LIMIT ?
        ''', (limit,))

    alerts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(alerts)

@app.route('/api/alerts/preferences', methods=['GET', 'POST'])
@require_auth
def notification_preferences():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        staff_id = request.args.get('staff_id', type=int)
        if staff_id:
            cursor.execute('SELECT * FROM notification_preferences WHERE staff_id = ?', (staff_id,))
        else:
            cursor.execute('SELECT * FROM notification_preferences')
        preferences = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(preferences)

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT OR REPLACE INTO notification_preferences
            (staff_id, alert_type, email_enabled, whatsapp_enabled)
            VALUES (?, ?, ?, ?)
        ''', (
            data.get('staff_id') or request.current_staff['id'],
            data.get('alert_type', 'all'),
            data.get('email_enabled', 1),
            data.get('whatsapp_enabled', 0)
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Preferences updated successfully'})

# Email notification endpoints
@app.route('/api/email/test', methods=['POST'])
@require_auth
def test_email():
    """Test email notification endpoint"""
    if not EMAIL_SERVICE_AVAILABLE:
        return jsonify({'error': 'Email service not configured'}), 400

    data = request.json
    to_email = data.get('email')
    if not to_email:
        return jsonify({'error': 'Email address required'}), 400

    language = request.current_staff.get('preferred_language', 'en')

    success = send_custom_alert(
        to_email=to_email,
        subject="Test Email - Elder Care Management",
        message="This is a test email from the Elder Care Management system. If you receive this, your email notifications are working correctly!",
        language=language
    )

    if success:
        return jsonify({'message': 'Test email sent successfully'})
    else:
        return jsonify({'error': 'Failed to send test email'}), 500

@app.route('/api/email/send', methods=['POST'])
@require_auth
def send_email_notification():
    """Send custom email notification"""
    if not EMAIL_SERVICE_AVAILABLE:
        return jsonify({'error': 'Email service not configured'}), 400

    data = request.json
    to_email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    alert_type = data.get('alert_type', 'custom')
    language = request.current_staff.get('preferred_language', 'en')

    if not to_email or not subject or not message:
        return jsonify({'error': 'Email, subject, and message are required'}), 400

    # Get staff email if not provided
    if not to_email:
        to_email = request.current_staff.get('email')

    if not to_email:
        return jsonify({'error': 'No email address available'}), 400

    success = send_custom_alert(
        to_email=to_email,
        subject=subject,
        message=message,
        language=language
    )

    if success:
        return jsonify({'message': 'Email sent successfully'})
    else:
        return jsonify({'error': 'Failed to send email'}), 500

@app.route('/api/email/test-incident-alert', methods=['POST'])
@require_auth
def test_incident_alert():
    """Test incident alert email - simulates sending an incident alert"""
    if not EMAIL_SERVICE_AVAILABLE:
        return jsonify({'error': 'Email service not configured'}), 400

    data = request.json
    resident_id = data.get('resident_id')
    to_email = data.get('email')  # Optional - will use resident's emergency contact and staff emails if not provided

    conn = get_db()
    cursor = conn.cursor()

    try:
        if resident_id:
            # Get resident info
            cursor.execute('SELECT first_name, last_name, emergency_contact_email FROM residents WHERE id = ?', (resident_id,))
            resident = cursor.fetchone()
            if not resident:
                conn.close()
                return jsonify({'error': 'Resident not found'}), 404

            resident_name = f"{resident['first_name']} {resident['last_name']}"
            emergency_email = resident['emergency_contact_email'] if resident['emergency_contact_email'] else None

            # Get staff emails
            cursor.execute('''
                SELECT email FROM staff
                WHERE role IN ('admin', 'manager')
                AND email IS NOT NULL
                AND email != ''
                AND active = 1
            ''')
            staff_emails = [row['email'] for row in cursor.fetchall()]

            # Combine recipients
            recipients = list(staff_emails)
            if emergency_email:
                recipients.append(emergency_email)
        else:
            # No resident ID - just use provided email or current staff email
            if not to_email:
                to_email = request.current_staff.get('email')
            if not to_email:
                conn.close()
                return jsonify({'error': 'No email address provided'}), 400
            recipients = [to_email]
            resident_name = "Test Resident"

        if to_email and to_email not in recipients:
            recipients.append(to_email)

        if not recipients:
            conn.close()
            return jsonify({'error': 'No email addresses found'}), 400

        language = request.current_staff.get('preferred_language', 'en')
        emails_sent = 0

        for recipient in recipients:
            if send_incident_alert(
                resident_name=resident_name,
                incident_type=data.get('incident_type', 'Test Incident'),
                severity=data.get('severity', 'Major'),
                staff_email=recipient,
                language=language
            ):
                emails_sent += 1

        conn.close()

        if emails_sent > 0:
            return jsonify({
                'message': f'Test incident alert sent to {emails_sent} recipient(s)',
                'recipients': recipients,
                'emails_sent': emails_sent
            })
        else:
            return jsonify({'error': 'Failed to send test incident alert'}), 500

    except Exception as e:
        conn.close()
        print(f'❌ Error in test_incident_alert: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/<path:path>')
def static_files(path):
    try:
        # Don't serve API routes as static files
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404

        # In production, prefer minified versions if they exist
        # Check for .min.js, .min.css files first for faster loading
        use_minified_env = os.getenv('USE_MINIFIED')
        if use_minified_env is None:
            use_minified = False
        else:
            use_minified = use_minified_env.lower() == 'true'
        original_path = path
        if use_minified:
            # Check if minified version exists and use it instead
            if path.endswith('.js') and not path.endswith('.min.js'):
                min_path = path.replace('.js', '.min.js')
                if os.path.exists(min_path):
                    path = min_path
            elif path.endswith('.css') and not path.endswith('.min.css'):
                min_path = path.replace('.css', '.min.css')
                if os.path.exists(min_path):
                    path = min_path

        response = send_from_directory('.', path)
        # Add aggressive cache control for JS and CSS files to prevent caching
        if original_path.endswith('.js') or original_path.endswith('.css') or original_path.endswith('.html'):
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response
    except Exception as e:
        return jsonify({'error': f'Error serving file {path}: {str(e)}'}), 404

if __name__ == '__main__':
    ensure_db_initialized()
    # Use PORT from environment (for cloud deployment) or default to 5001
    port = int(os.environ.get('PORT', 5001))
    # Disable debug in production
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'

    # IMPORTANT: The Flask reloader can spawn a second process and cause unstable behavior
    # in IDE runners (needing multiple "Run" presses, port contention). Default OFF.
    use_reloader = os.environ.get('FLASK_USE_RELOADER', '0') == '1'

    # If debug is off, never use the reloader.
    if not debug_mode:
        use_reloader = False

    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug_mode,
            use_reloader=use_reloader,
            threaded=True
        )
    except OSError as e:
        # Common case: address already in use
        print(f"❌ Failed to start server on port {port}: {e}")
        print("   Tip: If this happens in an IDE, stop any previous run still holding the port.")
        raise
