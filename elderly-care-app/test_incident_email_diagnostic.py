#!/usr/bin/env python3
"""
Diagnostic script to test incident email sending
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from email_service import send_incident_alert
    import os
    
    print("=" * 60)
    print("INCIDENT EMAIL DIAGNOSTIC TEST")
    print("=" * 60)
    print()
    
    # Check if email is configured
    sender_email = os.getenv('SENDER_EMAIL', '')
    sender_password = os.getenv('SENDER_PASSWORD', '')
    
    if not sender_email or not sender_password:
        print("❌ Email not configured. Set SENDER_EMAIL and SENDER_PASSWORD")
        sys.exit(1)
    
    print("✅ Email service is configured")
    print()
    
    # Test email address (from environment or use default)
    test_email = os.getenv('SENDER_EMAIL', 'apinzon@elderlycare.tech')
    
    print(f"📧 Testing incident alert email to: {test_email}")
    print()
    
    # Test with different severity levels
    test_cases = [
        {'severity': 'critical', 'should_send': True},
        {'severity': 'major', 'should_send': True},
        {'severity': 'moderate', 'should_send': False},
        {'severity': 'minor', 'should_send': False},
    ]
    
    for test_case in test_cases:
        severity = test_case['severity']
        print(f"Testing severity: {severity}")
        
        result = send_incident_alert(
            resident_name="TEST RESIDENT",
            incident_type="Test Incident",
            severity=severity.title(),
            staff_email=test_email,
            language='en'
        )
        
        if result:
            print(f"  ✅ Email sent successfully for {severity}")
        else:
            print(f"  ❌ Failed to send email for {severity}")
        print()
    
    print("=" * 60)
    print("Test complete!")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

