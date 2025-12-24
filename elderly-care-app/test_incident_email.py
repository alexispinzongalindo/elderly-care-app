#!/usr/bin/env python3
"""
Test script to send an incident alert email directly
This bypasses the web server and tests the email sending directly
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from email_service import send_incident_alert

# Test configuration
RESIDENT_NAME = "PEPE TEST"
INCIDENT_TYPE = "Fall"
SEVERITY = "Major"
RECIPIENT_EMAIL = "apinzon@elderlycare.tech"
LANGUAGE = "en"

print("🧪 Testing incident alert email...")
print(f"   Resident: {RESIDENT_NAME}")
print(f"   Incident Type: {INCIDENT_TYPE}")
print(f"   Severity: {SEVERITY}")
print(f"   Recipient: {RECIPIENT_EMAIL}")
print(f"   Language: {LANGUAGE}")
print()

success = send_incident_alert(
    resident_name=RESIDENT_NAME,
    incident_type=INCIDENT_TYPE,
    severity=SEVERITY,
    staff_email=RECIPIENT_EMAIL,
    language=LANGUAGE
)

if success:
    print()
    print("✅ SUCCESS: Incident alert email sent!")
    print(f"   Check your inbox at {RECIPIENT_EMAIL}")
else:
    print()
    print("❌ FAILED: Could not send incident alert email")
    print("   Check your email configuration (SENDER_EMAIL and SENDER_PASSWORD)")


























