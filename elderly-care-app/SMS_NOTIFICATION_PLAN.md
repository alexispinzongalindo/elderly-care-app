# SMS/Text Message Notification Implementation Plan

## Current Status
✅ **Email notifications** - Fully implemented and working
❌ **SMS/Text messages** - Not implemented (phone numbers are stored but not used)
❌ **Push notifications** - Not implemented

## Available Phone Number Data

The database already stores phone numbers:
- **Staff**: `staff.phone` field
- **Residents**: `residents.emergency_contact_phone` field

## SMS Implementation Options

### Option 1: Twilio SMS API (Recommended)
**Pros:**
- Reliable and widely used
- Works on Render (HTTP-based API)
- ~$0.0075 per SMS in US/PR
- Supports WhatsApp Business API too
- Good documentation

**Cons:**
- Requires paid account (pay-as-you-go)
- Need to verify phone numbers for WhatsApp

**Cost:** ~$0.0075 per text message (roughly $0.75 per 100 messages)

**Setup Required:**
1. Sign up for Twilio account
2. Get API credentials (Account SID, Auth Token)
3. Get a Twilio phone number (~$1/month)
4. Add environment variables to Render

### Option 2: SendGrid SMS
**Pros:**
- Good email provider, also has SMS
- Simple integration

**Cons:**
- Slightly more expensive than Twilio
- Less flexible

### Option 3: Free SMS via Email-to-SMS Gateways
**Pros:**
- Completely free
- No API setup needed

**Cons:**
- Less reliable (carrier-dependent)
- Format: `phonenumber@carrier.com` (e.g., `7875551234@vtext.com`)
- Requires carrier mapping

## Recommended Implementation: Twilio SMS

### Features to Add:
1. **SMS Notification Service** (`sms_service.py`)
   - Send SMS via Twilio API
   - Similar structure to `email_service.py`
   - Support English/Spanish messages

2. **Alert Functions**:
   - `send_medication_alert_sms()` - Send SMS for missed medications
   - `send_vital_signs_alert_sms()` - Send SMS for critical vital signs
   - `send_incident_alert_sms()` - Send SMS for major/critical incidents

3. **Configuration Options**:
   - Per-staff preference: Email only, SMS only, or Both
   - Per-resident: Notify emergency contact via SMS
   - Configurable in staff/resident settings

4. **Integration Points**:
   - Medication missed alerts (already trigger emails)
   - Vital signs critical alerts (already trigger emails)
   - Incident reports (major/critical) (already trigger emails)

## Push Notifications (Future)

### Web Push Notifications
- Requires Service Worker
- Browser permission prompt
- Works on desktop and mobile browsers
- Free (no per-notification cost)

### Mobile App Push
- Requires native mobile app (iOS/Android)
- Apple Push Notification Service (APNs) for iOS
- Firebase Cloud Messaging (FCM) for Android
- Free (up to certain limits)

## Implementation Priority

1. **High Priority**: SMS for critical alerts (incidents, vital signs)
2. **Medium Priority**: SMS for medication reminders
3. **Low Priority**: Push notifications (requires more development)

## Cost Estimate (Twilio)

**Monthly estimates for a small facility:**
- 50 incidents/month (critical only) = $0.38
- 100 medication alerts/month = $0.75
- 50 vital signs alerts/month = $0.38
- **Total: ~$1.50/month** (very affordable)

**For larger facilities:**
- 500 alerts/month = ~$3.75/month
- Still very reasonable

## Next Steps

If you want SMS implemented, I can:
1. Create `sms_service.py` with Twilio integration
2. Add SMS sending to all critical alert functions
3. Add UI settings for staff to enable/disable SMS notifications
4. Add emergency contact SMS notification option
5. Update documentation with setup instructions

Would you like me to proceed with SMS implementation using Twilio?

