# Monitoring Agent System - Implementation Plan

## Overview
Create an automated monitoring agent that tracks residents, medications, vital signs, and sends alerts via email/WhatsApp when dangerous values are detected.

## Features to Implement

### 1. Medication Tracking
- Monitor scheduled medication times
- Check if medications were taken on time
- Alert if medication is missed or overdue
- Track medication compliance

### 2. Vital Signs Monitoring
- Monitor blood pressure (systolic/diastolic)
- Track heart rate
- Monitor temperature
- Track oxygen saturation
- Set dangerous thresholds for each vital sign

### 3. Alert System
- Email notifications (SMTP)
- WhatsApp notifications (WhatsApp Business API or Twilio)
- Alert staff members
- Alert managers/admins
- Escalation system (if no response)

## Implementation Steps

### Phase 1: Database Schema Updates
1. Add alert thresholds table
2. Add notification preferences table
3. Add medication compliance tracking
4. Add alert history table

### Phase 2: Monitoring Service
1. Create background monitoring script
2. Check medication schedules every 15 minutes
3. Check vital signs every hour
4. Compare values against thresholds
5. Generate alerts when thresholds exceeded

### Phase 3: Notification System
1. Email integration (SMTP - Gmail, SendGrid, etc.)
2. WhatsApp integration (Twilio WhatsApp API or WhatsApp Business API)
3. Notification templates
4. Multi-language support (English/Spanish)

### Phase 4: Dashboard & Configuration
1. Alert configuration page
2. Threshold settings per resident
3. Notification preferences
4. Alert history view
5. Real-time alert dashboard

## Technical Requirements

### Email Integration
- SMTP server configuration
- Email templates
- HTML email support
- Attachment support (PDF reports)

### WhatsApp Integration
- Twilio WhatsApp API (recommended)
- OR WhatsApp Business API
- Message templates
- Media support (charts, images)

### Monitoring Service
- Python background service
- Scheduled tasks (APScheduler or Celery)
- Database queries
- Alert generation logic

## Alert Thresholds (Examples)

### Blood Pressure
- High: Systolic > 180 or Diastolic > 120
- Low: Systolic < 90 or Diastolic < 60

### Heart Rate
- High: > 100 bpm (tachycardia)
- Low: < 60 bpm (bradycardia)

### Temperature
- High: > 100.4°F (38°C) - Fever
- Low: < 96.8°F (36°C) - Hypothermia

### Oxygen Saturation
- Low: < 90% - Critical

### Medication
- Missed: Not taken within 1 hour of scheduled time
- Overdue: Not taken after 2 hours

## Notification Recipients
- Primary caregiver assigned to resident
- Backup caregiver
- Nurse on duty
- Manager/Administrator
- Emergency contact (if critical)

## Implementation Files Needed

1. `monitoring_service.py` - Background monitoring service
2. `alert_manager.py` - Alert generation and routing
3. `email_service.py` - Email notification service
4. `whatsapp_service.py` - WhatsApp notification service
5. `alert_config.py` - Configuration and thresholds
6. Database migration for new tables

## Next Steps
1. Would you like me to start implementing this?
2. Do you have email/WhatsApp API credentials?
3. What are your preferred alert thresholds?
4. Who should receive alerts (roles/permissions)?

