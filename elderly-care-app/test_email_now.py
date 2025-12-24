#!/usr/bin/env python3
"""
Quick test to send an incident alert email right now
"""

import os
from email_service import send_incident_alert

# Check environment
sender_email = os.getenv('SENDER_EMAIL', '')
sender_password = os.getenv('SENDER_PASSWORD', '')

if not sender_email or not sender_password:
    print("❌ SENDER_EMAIL or SENDER_PASSWORD not set")
    exit(1)

print(f"✅ Sender: {sender_email}")
print()

# Test sending incident alert
recipient = "apinzon@elderlycare.tech"
print(f"📤 Sending test incident alert to {recipient}...")
print()

success = send_incident_alert(
    resident_name="PEPE TEST",
    incident_type="Test Incident",
    severity="Major",
    staff_email=recipient,
    language="en"
)

if success:
    print()
    print("✅ Email sent successfully!")
    print(f"   Check {recipient} inbox (and spam folder)")
else:
    print()
    print("❌ Email failed to send")
    print("   Check error messages above")
















