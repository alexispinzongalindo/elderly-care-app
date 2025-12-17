# Email Notification Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords** (search for it in the security page)
5. Select app: **Mail**
6. Select device: **Other (Custom name)**
7. Enter name: **Elder Care App**
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this)

### Step 2: Set Environment Variables

Create a `.env` file in your project root (or set environment variables):

```bash
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-16-char-app-password
```

Or set them directly in your system:

**On Mac/Linux:**
```bash
export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="your-16-char-app-password"
```

**On Windows:**
```cmd
set SENDER_EMAIL=your-email@gmail.com
set SENDER_PASSWORD=your-16-char-app-password
```

### Step 3: Test Email

You can test the email service by running:

```python
from email_service import send_custom_alert

# Test email
send_custom_alert(
    to_email="your-test-email@gmail.com",
    subject="Test Email from Elder Care App",
    message="This is a test email. If you receive this, your email service is working!",
    language='en'
)
```

## Usage Examples

### Send Medication Alert

```python
from email_service import send_medication_alert

send_medication_alert(
    resident_name="John Doe",
    medication_name="Aspirin 100mg",
    scheduled_time="2024-12-17 14:00",
    staff_email="nurse@example.com",
    language='en'  # or 'es' for Spanish
)
```

### Send Vital Signs Alert

```python
from email_service import send_vital_signs_alert

send_vital_signs_alert(
    resident_name="John Doe",
    vital_type="Blood Pressure",
    value="190/110",
    threshold="140/90",
    staff_email="nurse@example.com",
    language='en'
)
```

### Send Incident Alert

```python
from email_service import send_incident_alert

send_incident_alert(
    resident_name="John Doe",
    incident_type="Fall",
    severity="High",
    staff_email="manager@example.com",
    language='en'
)
```

## Cost

**$0/month** - Gmail SMTP is completely FREE forever! ✅

## Troubleshooting

### "Email not configured" error
- Make sure `SENDER_EMAIL` and `SENDER_PASSWORD` are set
- Check that you're using the App Password, not your regular Gmail password

### "Authentication failed" error
- Make sure 2-Step Verification is enabled
- Use the App Password, not your regular password
- Make sure the App Password is exactly 16 characters (no spaces)

### Emails not arriving
- Check spam folder
- Make sure the recipient email is correct
- Check server logs for error messages

## Next Steps

1. Set up your Gmail App Password
2. Configure environment variables
3. Test with a simple email
4. Integrate with your monitoring agent

That's it! You now have FREE email notifications working! 🎉

