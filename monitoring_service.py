#!/usr/bin/env python3
"""
Monitoring Service for Elder Care Tracker
Continuously monitors medications and vital signs, sends alerts when thresholds are exceeded
"""

import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import time
import os
from twilio.rest import Client as TwilioClient
import json

DATABASE = 'elder_care.db'

# Default alert thresholds
DEFAULT_THRESHOLDS = {
    'blood_pressure_systolic': {'min': 90, 'max': 180},
    'blood_pressure_diastolic': {'min': 60, 'max': 120},
    'heart_rate': {'min': 60, 'max': 100},
    'temperature': {'min': 96.8, 'max': 100.4},  # Fahrenheit
    'oxygen_saturation': {'min': 90, 'max': 100},
}

# Medication alert times (in minutes)
MEDICATION_ALERT_DELAY = 60  # Alert if not taken within 60 minutes
MEDICATION_CRITICAL_DELAY = 120  # Critical alert after 120 minutes

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_alert_thresholds(resident_id, vital_type):
    """Get alert threshold for a resident and vital type"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT min_value, max_value, enabled 
        FROM alert_thresholds 
        WHERE resident_id = ? AND vital_type = ? AND enabled = 1
    ''', (resident_id, vital_type))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {'min': result['min_value'], 'max': result['max_value']}
    else:
        # Return default thresholds
        return DEFAULT_THRESHOLDS.get(vital_type, {'min': None, 'max': None})

def check_vital_signs():
    """Check recent vital signs against thresholds"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get vital signs from last 24 hours
    cursor.execute('''
        SELECT vs.*, r.first_name, r.last_name, r.room_number
        FROM vital_signs vs
        JOIN residents r ON vs.resident_id = r.id
        WHERE vs.recorded_at >= datetime('now', '-24 hours')
        AND r.active = 1
        ORDER BY vs.recorded_at DESC
    ''')
    
    vital_signs = cursor.fetchall()
    alerts = []
    
    for vs in vital_signs:
        resident_id = vs['resident_id']
        resident_name = f"{vs['first_name']} {vs['last_name']}"
        room = vs['room_number'] or 'N/A'
        
        # Check blood pressure
        if vs['systolic'] and vs['diastolic']:
            thresholds = get_alert_thresholds(resident_id, 'blood_pressure_systolic')
            if thresholds['min'] and vs['systolic'] < thresholds['min']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'critical',
                    'vital_type': 'blood_pressure',
                    'message': f'⚠️ CRITICAL: Low Blood Pressure - {vs["systolic"]}/{vs["diastolic"]} mmHg (Normal: {thresholds["min"]}-{thresholds["max"]})',
                    'vital_value': vs['systolic'],
                    'recorded_at': vs['recorded_at']
                })
            elif thresholds['max'] and vs['systolic'] > thresholds['max']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'critical',
                    'vital_type': 'blood_pressure',
                    'message': f'⚠️ CRITICAL: High Blood Pressure - {vs["systolic"]}/{vs["diastolic"]} mmHg (Normal: {thresholds["min"]}-{thresholds["max"]})',
                    'vital_value': vs['systolic'],
                    'recorded_at': vs['recorded_at']
                })
            
            thresholds = get_alert_thresholds(resident_id, 'blood_pressure_diastolic')
            if thresholds['min'] and vs['diastolic'] < thresholds['min']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'warning',
                    'vital_type': 'blood_pressure',
                    'message': f'⚠️ WARNING: Low Diastolic Pressure - {vs["systolic"]}/{vs["diastolic"]} mmHg',
                    'vital_value': vs['diastolic'],
                    'recorded_at': vs['recorded_at']
                })
            elif thresholds['max'] and vs['diastolic'] > thresholds['max']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'critical',
                    'vital_type': 'blood_pressure',
                    'message': f'⚠️ CRITICAL: High Diastolic Pressure - {vs["systolic"]}/{vs["diastolic"]} mmHg',
                    'vital_value': vs['diastolic'],
                    'recorded_at': vs['recorded_at']
                })
        
        # Check heart rate
        if vs['heart_rate']:
            thresholds = get_alert_thresholds(resident_id, 'heart_rate')
            if thresholds['min'] and vs['heart_rate'] < thresholds['min']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'warning',
                    'vital_type': 'heart_rate',
                    'message': f'⚠️ WARNING: Low Heart Rate - {vs["heart_rate"]} bpm (Normal: {thresholds["min"]}-{thresholds["max"]} bpm)',
                    'vital_value': vs['heart_rate'],
                    'recorded_at': vs['recorded_at']
                })
            elif thresholds['max'] and vs['heart_rate'] > thresholds['max']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'warning',
                    'vital_type': 'heart_rate',
                    'message': f'⚠️ WARNING: High Heart Rate - {vs["heart_rate"]} bpm (Normal: {thresholds["min"]}-{thresholds["max"]} bpm)',
                    'vital_value': vs['heart_rate'],
                    'recorded_at': vs['recorded_at']
                })
        
        # Check temperature
        if vs['temperature']:
            thresholds = get_alert_thresholds(resident_id, 'temperature')
            if thresholds['min'] and vs['temperature'] < thresholds['min']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'critical',
                    'vital_type': 'temperature',
                    'message': f'⚠️ CRITICAL: Low Temperature - {vs["temperature"]}°F (Normal: {thresholds["min"]}-{thresholds["max"]}°F)',
                    'vital_value': vs['temperature'],
                    'recorded_at': vs['recorded_at']
                })
            elif thresholds['max'] and vs['temperature'] > thresholds['max']:
                alerts.append({
                    'resident_id': resident_id,
                    'resident_name': resident_name,
                    'room': room,
                    'alert_type': 'vital_sign',
                    'alert_level': 'critical',
                    'vital_type': 'temperature',
                    'message': f'⚠️ CRITICAL: Fever Detected - {vs["temperature"]}°F (Normal: {thresholds["min"]}-{thresholds["max"]}°F)',
                    'vital_value': vs['temperature'],
                    'recorded_at': vs['recorded_at']
                })
        
        # Check oxygen saturation (if available)
        # Note: oxygen_saturation might be stored differently, adjust as needed
    
    conn.close()
    return alerts

def check_medications():
    """Check for missed or overdue medications"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get active medications with their schedules
    cursor.execute('''
        SELECT m.*, r.first_name, r.last_name, r.room_number
        FROM medications m
        JOIN residents r ON m.resident_id = r.id
        WHERE m.active = 1 
        AND r.active = 1
        AND (m.end_date IS NULL OR m.end_date >= date('now'))
        AND (m.start_date IS NULL OR m.start_date <= date('now'))
    ''')
    
    medications = cursor.fetchall()
    alerts = []
    now = datetime.now()
    
    for med in medications:
        resident_id = med['resident_id']
        resident_name = f"{med['first_name']} {med['last_name']}"
        room = med['room_number'] or 'N/A'
        medication_name = med['name']
        time_slots = med['time_slots'].split(',') if med['time_slots'] else []
        
        # Check each scheduled time for today
        for time_slot in time_slots:
            time_slot = time_slot.strip()
            if not time_slot:
                continue
            
            try:
                # Parse time (format: HH:MM)
                scheduled_time = datetime.strptime(time_slot, '%H:%M').time()
                scheduled_datetime = datetime.combine(now.date(), scheduled_time)
                
                # If scheduled time has passed today
                if scheduled_datetime < now:
                    # Check if medication was taken
                    cursor.execute('''
                        SELECT * FROM medication_logs 
                        WHERE medication_id = ? 
                        AND scheduled_time = ?
                        AND DATE(taken_at) = DATE('now')
                        AND status = 'taken'
                    ''', (med['id'], time_slot))
                    
                    log = cursor.fetchone()
                    
                    if not log:
                        # Medication not taken - check how late
                        delay_minutes = (now - scheduled_datetime).total_seconds() / 60
                        
                        if delay_minutes >= MEDICATION_CRITICAL_DELAY:
                            alerts.append({
                                'resident_id': resident_id,
                                'resident_name': resident_name,
                                'room': room,
                                'alert_type': 'medication',
                                'alert_level': 'critical',
                                'medication_id': med['id'],
                                'medication_name': medication_name,
                                'message': f'🚨 CRITICAL: Medication Missed - {medication_name} ({med["dosage"]}) was due at {time_slot} ({int(delay_minutes)} minutes ago)',
                                'scheduled_time': time_slot,
                                'delay_minutes': delay_minutes
                            })
                        elif delay_minutes >= MEDICATION_ALERT_DELAY:
                            alerts.append({
                                'resident_id': resident_id,
                                'resident_name': resident_name,
                                'room': room,
                                'alert_type': 'medication',
                                'alert_level': 'warning',
                                'medication_id': med['id'],
                                'medication_name': medication_name,
                                'message': f'⚠️ WARNING: Medication Overdue - {medication_name} ({med["dosage"]}) was due at {time_slot} ({int(delay_minutes)} minutes ago)',
                                'scheduled_time': time_slot,
                                'delay_minutes': delay_minutes
                            })
            except ValueError:
                # Invalid time format, skip
                continue
    
    conn.close()
    return alerts

def get_notification_recipients(alert_type, alert_level):
    """Get staff members who should receive notifications"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get staff with notification preferences enabled
    cursor.execute('''
        SELECT s.*, np.email_enabled, np.whatsapp_enabled
        FROM staff s
        LEFT JOIN notification_preferences np ON s.id = np.staff_id AND np.alert_type = ?
        WHERE s.active = 1
        AND (np.email_enabled = 1 OR np.whatsapp_enabled = 1 OR np.id IS NULL)
    ''', (alert_type,))
    
    staff = cursor.fetchall()
    conn.close()
    
    # Filter by alert level - critical alerts go to all, warnings to assigned staff
    recipients = []
    for s in staff:
        # For critical alerts, notify all staff
        if alert_level == 'critical':
            recipients.append({
                'id': s['id'],
                'name': s['full_name'],
                'email': s['email'],
                'phone': s['phone'],
                'email_enabled': s['email_enabled'] if s['email_enabled'] is not None else True,
                'whatsapp_enabled': s['whatsapp_enabled'] if s['whatsapp_enabled'] is not None else False
            })
        # For warnings, only notify if they have preferences set
        elif alert_level == 'warning' and (s['email_enabled'] or s['whatsapp_enabled']):
            recipients.append({
                'id': s['id'],
                'name': s['full_name'],
                'email': s['email'],
                'phone': s['phone'],
                'email_enabled': s['email_enabled'] if s['email_enabled'] is not None else True,
                'whatsapp_enabled': s['whatsapp_enabled'] if s['whatsapp_enabled'] is not None else False
            })
    
    return recipients

def send_email_alert(recipient, alert):
    """Send email alert"""
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', '')
        smtp_password = os.getenv('SMTP_PASSWORD', '')
        
        if not smtp_user or not smtp_password:
            print(f"⚠️ Email not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = recipient['email']
        msg['Subject'] = f"🚨 Alert: {alert['alert_level'].upper()} - {alert['resident_name']}"
        
        body = f"""
        <html>
        <body>
            <h2 style="color: {'red' if alert['alert_level'] == 'critical' else 'orange'};">
                {alert['alert_level'].upper()} ALERT
            </h2>
            <p><strong>Resident:</strong> {alert['resident_name']}</p>
            <p><strong>Room:</strong> {alert['room']}</p>
            <p><strong>Alert Type:</strong> {alert['alert_type']}</p>
            <p><strong>Message:</strong> {alert['message']}</p>
            <p><strong>Time:</strong> {alert.get('recorded_at', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Elder Care Tracker - Automated Monitoring System</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent to {recipient['email']}")
        return True
    except Exception as e:
        print(f"❌ Error sending email to {recipient['email']}: {e}")
        return False

def send_whatsapp_alert(recipient, alert):
    """Send WhatsApp alert via Twilio"""
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        whatsapp_from = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
        
        if not account_sid or not auth_token:
            print(f"⚠️ WhatsApp not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.")
            return False
        
        client = TwilioClient(account_sid, auth_token)
        
        # Format phone number (add country code if needed)
        phone = recipient['phone']
        if not phone.startswith('+'):
            phone = f"+1{phone}"  # Default to US, adjust as needed
        
        whatsapp_to = f"whatsapp:{phone}"
        
        message_body = f"""
🚨 {alert['alert_level'].upper()} ALERT

Resident: {alert['resident_name']}
Room: {alert['room']}
Type: {alert['alert_type']}

{alert['message']}

Time: {alert.get('recorded_at', datetime.now().strftime('%Y-%m-%d %H:%M'))}

Elder Care Tracker
        """.strip()
        
        message = client.messages.create(
            body=message_body,
            from_=whatsapp_from,
            to=whatsapp_to
        )
        
        print(f"✅ WhatsApp sent to {phone} (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ Error sending WhatsApp to {recipient['phone']}: {e}")
        return False

def log_alert(alert, recipient_id, notification_method, success):
    """Log alert to database"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO alert_history 
        (resident_id, alert_type, alert_level, message, vital_value, medication_id, notification_method, recipient_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        alert['resident_id'],
        alert['alert_type'],
        alert['alert_level'],
        alert['message'],
        alert.get('vital_value'),
        alert.get('medication_id'),
        notification_method if success else f"{notification_method}_failed",
        recipient_id
    ))
    
    conn.commit()
    conn.close()

def process_alerts():
    """Main function to check and process all alerts"""
    print(f"\n🔍 Checking alerts at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check vital signs
    vital_alerts = check_vital_signs()
    print(f"📊 Found {len(vital_alerts)} vital sign alerts")
    
    # Check medications
    medication_alerts = check_medications()
    print(f"💊 Found {len(medication_alerts)} medication alerts")
    
    all_alerts = vital_alerts + medication_alerts
    
    # Process each alert
    for alert in all_alerts:
        recipients = get_notification_recipients(alert['alert_type'], alert['alert_level'])
        
        for recipient in recipients:
            # Send email if enabled
            if recipient.get('email') and recipient.get('email_enabled'):
                success = send_email_alert(recipient, alert)
                log_alert(alert, recipient['id'], 'email', success)
            
            # Send WhatsApp if enabled
            if recipient.get('phone') and recipient.get('whatsapp_enabled'):
                success = send_whatsapp_alert(recipient, alert)
                log_alert(alert, recipient['id'], 'whatsapp', success)
    
    print(f"✅ Processed {len(all_alerts)} alerts\n")

def run_monitoring_service():
    """Run the monitoring service continuously"""
    print("🚀 Starting Monitoring Service...")
    print("📧 Email: Configure SMTP_USER, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT")
    print("📱 WhatsApp: Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM")
    print("⏰ Checking every 15 minutes...\n")
    
    while True:
        try:
            process_alerts()
        except Exception as e:
            print(f"❌ Error in monitoring service: {e}")
            import traceback
            traceback.print_exc()
        
        # Wait 15 minutes before next check
        time.sleep(15 * 60)

if __name__ == '__main__':
    run_monitoring_service()

