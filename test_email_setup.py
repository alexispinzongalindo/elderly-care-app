#!/usr/bin/env python3
"""
Quick Email Setup Test Script
Run this to check if email is configured correctly
"""

import os
import sys

print("=" * 60)
print("EMAIL SETUP DIAGNOSTIC")
print("=" * 60)
print()

# Check environment variables
sender_email = os.getenv('SENDER_EMAIL', '')
sender_password = os.getenv('SENDER_PASSWORD', '')

print("1. Environment Variables:")
print(f"   SENDER_EMAIL: {'✅ SET' if sender_email else '❌ NOT SET'}")
if sender_email:
    print(f"      Value: {sender_email}")
else:
    print("      ⚠️  Set this with: export SENDER_EMAIL='your-email@gmail.com'")

print(f"   SENDER_PASSWORD: {'✅ SET' if sender_password else '❌ NOT SET'}")
if sender_password:
    print(f"      Value: {'*' * len(sender_password)} ({len(sender_password)} characters)")
    if len(sender_password) != 16:
        print("      ⚠️  Warning: App Password should be 16 characters")
else:
    print("      ⚠️  Set this with: export SENDER_PASSWORD='your-16-char-password'")

print()

# Check if email_service can be imported
print("2. Email Service Module:")
try:
    from email_service import send_email, EMAIL_SERVICE_AVAILABLE
    print("   ✅ email_service.py found and can be imported")
except ImportError as e:
    print(f"   ❌ Cannot import email_service: {e}")
    sys.exit(1)

print()

# Test email function
print("3. Email Function Test:")
if not sender_email or not sender_password:
    print("   ⚠️  Cannot test - environment variables not set")
    print()
    print("=" * 60)
    print("QUICK SETUP:")
    print("=" * 60)
    print()
    print("1. Get Gmail App Password:")
    print("   - Go to: https://myaccount.google.com/security")
    print("   - Enable 2-Step Verification")
    print("   - Go to App Passwords")
    print("   - Create new app password for 'Mail'")
    print("   - Copy the 16-character password")
    print()
    print("2. Set environment variables:")
    print("   export SENDER_EMAIL='your-email@gmail.com'")
    print("   export SENDER_PASSWORD='your-16-char-password'")
    print()
    print("3. Run this test again:")
    print("   python3 test_email_setup.py")
    print()
    sys.exit(1)

# Try to send a test email
test_recipient = input("Enter test email address (or press Enter to skip): ").strip()
if test_recipient:
    print()
    print("4. Sending Test Email:")
    try:
        success = send_email(
            to_email=test_recipient,
            subject="Test Email - Elder Care Management",
            html_body="""
            <html>
            <body>
                <h2>Test Email</h2>
                <p>If you receive this, your email setup is working correctly!</p>
            </body>
            </html>
            """
        )
        if success:
            print(f"   ✅ Test email sent successfully to {test_recipient}")
            print("   ⚠️  Check your inbox (and spam folder)")
        else:
            print(f"   ❌ Failed to send test email")
            print("   ⚠️  Check the error messages above")
    except Exception as e:
        print(f"   ❌ Error sending test email: {e}")
else:
    print("   ⏭️  Skipped - no test email sent")

print()
print("=" * 60)
print("SETUP COMPLETE" if (sender_email and sender_password) else "SETUP INCOMPLETE")
print("=" * 60)

