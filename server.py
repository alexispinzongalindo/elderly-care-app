from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
import os

app = Flask(__name__, static_folder='.')
CORS(app)

DATABASE = 'elder_care.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

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
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
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
            start_date DATETIME,
            end_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active BOOLEAN DEFAULT 1,
            FOREIGN KEY (resident_id) REFERENCES residents (id)
        )
    ''')
    
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (billing_id) REFERENCES billing (id),
            FOREIGN KEY (resident_id) REFERENCES residents (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
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
    
    # Create default admin user if no staff exists
    cursor.execute('SELECT COUNT(*) as count FROM staff')
    if cursor.fetchone()['count'] == 0:
        default_password = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute('''
            INSERT INTO staff (username, password_hash, full_name, role, email)
            VALUES (?, ?, ?, ?, ?)
        ''', ('admin', default_password, 'Administrator', 'admin', 'admin@eldercare.pr'))
    
    conn.commit()
    conn.close()

# Authentication helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    return hash_password(password) == password_hash

def generate_session_token():
    return secrets.token_urlsafe(32)

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
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM staff WHERE username = ? AND active = 1', (username,))
    staff = cursor.fetchone()
    
    if not staff or not verify_password(password, staff['password_hash']):
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create session
    session_token = generate_session_token()
    expires_at = datetime.now() + timedelta(days=1)
    
    cursor.execute('''
        INSERT INTO sessions (staff_id, session_token, expires_at)
        VALUES (?, ?, ?)
    ''', (staff['id'], session_token, expires_at))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'token': session_token,
        'staff': {
            'id': staff['id'],
            'username': staff['username'],
            'full_name': staff['full_name'],
            'role': staff['role'],
            'email': staff['email']
        }
    })

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
    return jsonify({
        'id': request.current_staff['id'],
        'username': request.current_staff['username'],
        'full_name': request.current_staff['full_name'],
        'role': request.current_staff['role'],
        'email': request.current_staff['email']
    })

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
        residents_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(residents_list)
    
    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO residents (
                first_name, last_name, date_of_birth, room_number, bed_number,
                gender, emergency_contact_name, emergency_contact_phone,
                emergency_contact_relation, insurance_provider, insurance_number,
                medical_conditions, allergies, dietary_restrictions, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('first_name'),
            data.get('last_name'),
            data.get('date_of_birth'),
            data.get('room_number'),
            data.get('bed_number'),
            data.get('gender'),
            data.get('emergency_contact_name'),
            data.get('emergency_contact_phone'),
            data.get('emergency_contact_relation'),
            data.get('insurance_provider'),
            data.get('insurance_number'),
            data.get('medical_conditions'),
            data.get('allergies'),
            data.get('dietary_restrictions'),
            data.get('notes')
        ))
        conn.commit()
        resident_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': resident_id, 'message': 'Resident added successfully'}), 201

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
        conn.close()
        return jsonify(dict(resident))
    
    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE residents 
            SET first_name = ?, last_name = ?, date_of_birth = ?, room_number = ?,
                bed_number = ?, gender = ?, emergency_contact_name = ?,
                emergency_contact_phone = ?, emergency_contact_relation = ?,
                insurance_provider = ?, insurance_number = ?, medical_conditions = ?,
                allergies = ?, dietary_restrictions = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('first_name'),
            data.get('last_name'),
            data.get('date_of_birth'),
            data.get('room_number'),
            data.get('bed_number'),
            data.get('gender'),
            data.get('emergency_contact_name'),
            data.get('emergency_contact_phone'),
            data.get('emergency_contact_relation'),
            data.get('insurance_provider'),
            data.get('insurance_number'),
            data.get('medical_conditions'),
            data.get('allergies'),
            data.get('dietary_restrictions'),
            data.get('notes'),
            id
        ))
        conn.commit()
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
            INSERT INTO medications (resident_id, name, dosage, frequency, time_slots, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data['name'],
            data['dosage'],
            data['frequency'],
            json.dumps(data['time_slots']),
            data.get('start_date'),
            data.get('end_date')
        ))
        conn.commit()
        med_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': med_id, 'message': 'Medication added successfully'}), 201

@app.route('/api/medications/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def medication_detail(id):
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE medications 
            SET name = ?, dosage = ?, frequency = ?, time_slots = ?, start_date = ?, end_date = ?
            WHERE id = ?
        ''', (
            data['name'],
            data['dosage'],
            data['frequency'],
            json.dumps(data['time_slots']),
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
    
    cursor.execute('''
        INSERT INTO medication_logs (medication_id, scheduled_time, status, staff_id)
        VALUES (?, ?, ?, ?)
    ''', (id, data['scheduled_time'], data['status'], request.current_staff['id']))
    conn.commit()
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

@app.route('/api/appointments/<int:id>', methods=['PUT', 'DELETE'])
@require_auth
def appointment_detail(id):
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'PUT':
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
        cursor.execute('''
            INSERT INTO vital_signs (resident_id, recorded_at, systolic, diastolic, glucose, weight, temperature, heart_rate, notes, staff_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('resident_id'),
            data.get('recorded_at'),
            data.get('systolic'),
            data.get('diastolic'),
            data.get('glucose'),
            data.get('weight'),
            data.get('temperature'),
            data.get('heart_rate'),
            data.get('notes', ''),
            request.current_staff['id']
        ))
        conn.commit()
        sign_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': sign_id, 'message': 'Vital signs recorded successfully'}), 201

@app.route('/api/vital-signs/<int:sign_id>', methods=['PUT', 'DELETE'])
@require_auth
def vital_sign_detail(sign_id):
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'PUT':
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
            data.get('category', 'Monthly Fee'),
            data.get('status', 'pending'),
            data.get('notes', '')
        ))
        conn.commit()
        bill_id = cursor.lastrowid
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
        cursor.execute('''
            INSERT INTO payments (billing_id, resident_id, payment_date, amount, payment_method, reference_number, notes, staff_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('billing_id'),
            data.get('resident_id'),
            data.get('payment_date'),
            data.get('amount'),
            data.get('payment_method', 'Cash'),
            data.get('reference_number', ''),
            data.get('notes', ''),
            request.current_staff['id']
        ))
        
        # Update billing status if linked
        if data.get('billing_id'):
            cursor.execute('UPDATE billing SET status = ? WHERE id = ?', ('paid', data.get('billing_id')))
        
        conn.commit()
        payment_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': payment_id, 'message': 'Payment recorded successfully'}), 201

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

# Staff management (admin only)
@app.route('/api/staff', methods=['GET', 'POST'])
@require_role('admin')
def staff():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT id, username, full_name, role, email, phone, active, created_at FROM staff ORDER BY full_name')
        staff_list = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(staff_list)
    
    elif request.method == 'POST':
        data = request.json
        password_hash = hash_password(data.get('password', 'password123'))
        cursor.execute('''
            INSERT INTO staff (username, password_hash, full_name, role, email, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data.get('username'),
            password_hash,
            data.get('full_name'),
            data.get('role', 'caregiver'),
            data.get('email'),
            data.get('phone')
        ))
        conn.commit()
        staff_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': staff_id, 'message': 'Staff member added successfully'}), 201

# Static file serving
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    init_db()
    # Use PORT from environment (for cloud deployment) or default to 5001
    port = int(os.environ.get('PORT', 5001))
    # Disable debug in production
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
