#!/usr/bin/env python3
"""
Comprehensive Email Diagnostic Script
Checks all aspects of email configuration and sending
"""

import os
import sqlite3
import sys

# Check environment variables
print("=" * 70)
print("EMAIL DIAGNOSTIC REPORT")
print("=" * 70)
print()

# 1. Check Environment Variables
print("1️⃣ ENVIRONMENT VARIABLES CHECK")
print("-" * 70)
SENDER_EMAIL = os.getenv('SENDER_EMAIL', '')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')

print(f"SENDER_EMAIL: {'✅ SET' if SENDER_EMAIL else '❌ NOT SET'}")
if SENDER_EMAIL:
    print(f"   Value: {SENDER_EMAIL}")
else:
    print("   ⚠️ Email service will not work without this!")

print(f"SENDER_PASSWORD: {'✅ SET' if SENDER_PASSWORD else '❌ NOT SET'}")
if SENDER_PASSWORD:
    print(f"   Value: {'*' * len(SENDER_PASSWORD)} (hidden)")
else:
    print("   ⚠️ Email service will not work without this!")
print()

# 2. Check Database Configuration
print("2️⃣ DATABASE CONFIGURATION CHECK")
print("-" * 70)
DATABASE = 'elder_care.db'

if not os.path.exists(DATABASE):
    print(f"❌ Database file not found: {DATABASE}")
    print("   Make sure you're running this from the project directory")
    sys.exit(1)

print(f"✅ Database found: {DATABASE}")
print()

try:
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check staff emails
    print("   Staff Members with Emails:")
    cursor.execute('''
        SELECT id, username, full_name, role, email, active 
        FROM staff 
        WHERE email IS NOT NULL AND email != ''
        ORDER BY role, full_name
    ''')
    staff_with_emails = cursor.fetchall()
    
    if not staff_with_emails:
        print("   ❌ NO STAFF MEMBERS HAVE EMAIL ADDRESSES!")
        print("   ⚠️ Add email addresses to staff records (especially admins/managers)")
    else:
        for staff in staff_with_emails:
            status = "✅ ACTIVE" if staff['active'] else "❌ INACTIVE"
            print(f"   - {staff['full_name']} ({staff['role']}) - {staff['email']} [{status}]")
    print()
    
    # Check for admin/manager roles specifically
    print("   Admin/Manager Staff:")
    cursor.execute('''
        SELECT id, username, full_name, role, email, active 
        FROM staff 
        WHERE role IN ('admin', 'manager') AND email IS NOT NULL AND email != '' AND active = 1
    ''')
    admin_managers = cursor.fetchall()
    
    if not admin_managers:
        print("   ❌ NO ACTIVE ADMIN/MANAGER WITH EMAIL ADDRESSES!")
        print("   ⚠️ This is required for incident alerts to work")
    else:
        for staff in admin_managers:
            print(f"   ✅ {staff['full_name']} ({staff['role']}) - {staff['email']}")
    print()
    
    # Check residents with emergency contacts
    print("   Residents with Emergency Contact Emails:")
    cursor.execute('''
        SELECT id, first_name, last_name, emergency_contact_email 
        FROM residents 
        WHERE emergency_contact_email IS NOT NULL AND emergency_contact_email != ''
    ''')
    residents_with_emails = cursor.fetchall()
    
    if not residents_with_emails:
        print("   ⚠️ No residents have emergency contact emails set")
        print("   (This is optional, staff emails will be used)")
    else:
        for resident in residents_with_emails:
            print(f"   ✅ {resident['first_name']} {resident['last_name']} - {resident['emergency_contact_email']}")
    print()
    
    # Check recent incidents
    print("   Recent Incidents (Last 5):")
    cursor.execute('''
        SELECT i.id, i.resident_id, i.incident_type, i.severity, i.created_at,
               r.first_name, r.last_name
        FROM incident_reports i
        LEFT JOIN residents r ON i.resident_id = r.id
        ORDER BY i.created_at DESC
        LIMIT 5
    ''')
    recent_incidents = cursor.fetchall()
    
    if not recent_incidents:
        print("   ⚠️ No incidents found in database")
    else:
        for incident in recent_incidents:
            resident_name = f"{incident['first_name']} {incident['last_name']}" if incident['first_name'] else f"Resident ID: {incident['resident_id']}"
            severity = incident['severity'] or 'Unknown'
            qualifies = severity.lower() in ['major', 'critical']
            status = "✅ SHOULD SEND EMAIL" if qualifies else "ℹ️ No email (severity: " + severity + ")"
            print(f"   - {incident['created_at']}: {resident_name} - {incident['incident_type']} [{severity}] {status}")
    print()
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error checking database: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 3. Test Email Service Import
print("3️⃣ EMAIL SERVICE CHECK")
print("-" * 70)
try:
    from email_service import send_email, send_incident_alert
    print("✅ Email service module imported successfully")
    print("✅ Email service functions are available")
    
    print()
    
    # Test sending a simple email
    if SENDER_EMAIL and SENDER_PASSWORD:
        print("4️⃣ TEST EMAIL SEND")
        print("-" * 70)
        test_recipient = input("Enter email address to send test email (or press Enter to skip): ").strip()
        
        if test_recipient:
            print(f"📤 Sending test email to {test_recipient}...")
            test_subject = "Elder Care App - Email Diagnostic Test"
            test_body = """
            <html>
            <body>
                <h2>Email Diagnostic Test</h2>
                <p>If you receive this email, your email service is working correctly!</p>
                <p>Time: """ + str(__import__('datetime').datetime.now()) + """</p>
            </body>
            </html>
            """
            if send_email(test_recipient, test_subject, test_body):
                print("✅ Test email sent successfully!")
                print(f"   Please check {test_recipient} inbox (and spam folder)")
            else:
                print("❌ Test email failed to send")
                print("   Check error messages above")
        else:
            print("⏭️ Test email skipped")
    else:
        print("4️⃣ TEST EMAIL SEND")
        print("-" * 70)
        print("⏭️ Skipped - SENDER_EMAIL or SENDER_PASSWORD not set")
    
except ImportError as e:
    print(f"❌ Error importing email service: {e}")
    print("   Make sure email_service.py exists in the project directory")

print()
print("=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
print()
print("RECOMMENDATIONS:")
print()

if not SENDER_EMAIL or not SENDER_PASSWORD:
    print("❌ CRITICAL: Set SENDER_EMAIL and SENDER_PASSWORD environment variables")
    print("   Add to ~/.zshrc:")
    print('   export SENDER_EMAIL="your-email@gmail.com"')
    print('   export SENDER_PASSWORD="your-app-password"')
    print("   Then run: source ~/.zshrc")
    print()

if not admin_managers:
    print("❌ CRITICAL: No active admin/manager staff with email addresses")
    print("   Update staff records to add email addresses")
    print()

if staff_with_emails and SENDER_EMAIL and SENDER_PASSWORD:
    print("✅ Configuration looks good!")
    print("   If emails still don't work:")
    print("   1. Check server terminal output when creating an incident")
    print("   2. Look for debug messages starting with 🔍, ✅, or ❌")
    print("   3. Make sure incident severity is 'Major' or 'Critical'")
    print("   4. Check spam folder")
    print()

