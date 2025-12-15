# Monitoring Agent Setup Guide

## 🎯 Overview
The monitoring agent automatically tracks residents' medications and vital signs, sending alerts via email or WhatsApp when dangerous values are detected.

## 📋 Prerequisites

### 1. Email Configuration (SMTP)
You need SMTP credentials. Options:
- **Gmail**: Use App Password (recommended for testing)
- **SendGrid**: Professional email service
- **Other SMTP**: Any SMTP server

### 2. WhatsApp Configuration (Optional)
- **Twilio Account**: Sign up at https://www.twilio.com
- Get Account SID and Auth Token
- Enable WhatsApp Sandbox (free for testing)
- **Note**: New accounts may require verification - see `twilio_response_template.md` if your account is suspended

## 🔧 Setup Instructions

### Step 1: Install Dependencies
```bash
pip install twilio
```

### Step 2: Configure Environment Variables

Create a `.env` file or set environment variables:

**Email Configuration:**
```bash
export SMTP_SERVER=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
```

**WhatsApp Configuration (Twilio):**
```bash
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
export TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Step 3: Start the Monitoring Service

**Option A: Run directly**
```bash
python3 monitoring_service.py
```

**Option B: Run as background service**
```bash
nohup python3 monitoring_service.py > monitoring.log 2>&1 &
```

**Option C: Use systemd (Linux)**
Create `/etc/systemd/system/eldercare-monitoring.service`:
```ini
[Unit]
Description=Elder Care Monitoring Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/elder-care-app
Environment="SMTP_USER=your-email@gmail.com"
Environment="SMTP_PASSWORD=your-password"
Environment="TWILIO_ACCOUNT_SID=your_sid"
Environment="TWILIO_AUTH_TOKEN=your_token"
ExecStart=/usr/bin/python3 monitoring_service.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable eldercare-monitoring
sudo systemctl start eldercare-monitoring
```

## 📊 Default Alert Thresholds

The system uses these default thresholds:

- **Blood Pressure (Systolic)**: 90-180 mmHg
- **Blood Pressure (Diastolic)**: 60-120 mmHg
- **Heart Rate**: 60-100 bpm
- **Temperature**: 96.8-100.4°F
- **Oxygen Saturation**: 90-100%

You can customize thresholds per resident via the API.

## 🔔 Alert Types

### Medication Alerts
- **Warning**: Medication overdue by 60+ minutes
- **Critical**: Medication missed by 120+ minutes

### Vital Signs Alerts
- **Warning**: Value outside normal range
- **Critical**: Value in dangerous range

## 📱 Notification Methods

### Email
- Sends HTML formatted emails
- Includes resident info, alert details, timestamp
- Works with any SMTP server

### WhatsApp
- Sends via Twilio WhatsApp API
- Requires phone number in format: +1XXXXXXXXXX
- Free sandbox for testing

## 🎛️ Configuration via API

### Set Alert Thresholds
```bash
POST /api/alerts/thresholds
{
  "resident_id": 1,
  "vital_type": "blood_pressure_systolic",
  "min_value": 90,
  "max_value": 180,
  "enabled": true
}
```

### Set Notification Preferences
```bash
POST /api/alerts/preferences
{
  "staff_id": 1,
  "alert_type": "all",
  "email_enabled": true,
  "whatsapp_enabled": false
}
```

### View Alert History
```bash
GET /api/alerts/history?resident_id=1&limit=50
```

## 🔍 Monitoring Schedule

- **Medications**: Checked every 15 minutes
- **Vital Signs**: Checked every hour
- **Alerts**: Sent immediately when detected

## 🚨 Alert Recipients

- **Critical Alerts**: All active staff members
- **Warning Alerts**: Staff with notification preferences enabled
- **Escalation**: Can be configured for no-response scenarios

## 📝 Logs

The monitoring service logs:
- Alert checks
- Alerts generated
- Notifications sent
- Errors

Check logs for troubleshooting.

## 🔒 Security Notes

- Store credentials in environment variables, not in code
- Use App Passwords for Gmail (not your main password)
- Keep Twilio credentials secure
- Regularly rotate passwords

## 🆘 Troubleshooting

### Email not sending
- Check SMTP credentials
- Verify firewall allows SMTP port
- Check spam folder
- Test SMTP connection manually

### WhatsApp not sending
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure WhatsApp sandbox is activated
- Check Twilio console for errors

### Alerts not triggering
- Verify monitoring service is running
- Check database connection
- Review alert thresholds
- Check notification preferences

## 📞 Support

For issues or questions, check:
1. Monitoring service logs
2. Alert history in database
3. API endpoint responses
4. Environment variable configuration

