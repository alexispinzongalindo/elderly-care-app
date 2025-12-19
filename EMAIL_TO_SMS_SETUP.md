# Email-to-SMS Gateway Setup Guide

## FREE SMS Notifications - No Account Approval Needed!

This system uses **email-to-SMS gateways** to send text messages. It's completely FREE and works immediately - no Twilio account approval needed!

## How It Works

Instead of using expensive SMS APIs, we send SMS messages by emailing to special carrier addresses:
- `7875551234@vtext.com` = Verizon SMS
- `7875551234@txt.att.net` = AT&T SMS
- `7875551234@tmomail.net` = T-Mobile SMS

The carrier converts the email to an SMS text message and delivers it to the phone.

## Supported Carriers (US/PR)

✅ **Verizon** - `@vtext.com` (Default)
✅ **AT&T** - `@txt.att.net`
✅ **T-Mobile** - `@tmomail.net`
✅ **Sprint** - `@messaging.sprintpcs.com`
✅ **US Cellular** - `@email.uscc.net`
✅ **Cricket** - `@sms.cricketwireless.net`
✅ **Boost Mobile** - `@sms.myboostmobile.com`
✅ **Virgin Mobile** - `@vmobl.com`
✅ **MetroPCS** - `@mymetropcs.com`

## Setup Instructions

### Step 1: Ensure Email Service is Working

The SMS service uses your existing email service (Resend or SMTP). Make sure email notifications are working first.

**Check your email configuration:**
- Resend API: `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (recommended)
- OR SMTP: `SENDER_EMAIL` + `SENDER_PASSWORD`

### Step 2: Add Phone Numbers to Staff/Residents

1. **For Staff**: Edit staff member → Enter phone number in "Phone" field
2. **For Residents**: Edit resident → Enter phone number in "Emergency Contact Phone" field

**Phone Number Format:**
- Any format works: `(787) 555-1234`, `787-555-1234`, `7875551234`
- 10 digits required (US/PR numbers)
- Can include country code `1`: `17875551234`

### Step 3: Default Carrier

By default, the system uses **Verizon** (`@vtext.com`) for all SMS messages. This works for most US/PR carriers.

If you need to specify a different carrier for specific numbers, you can modify the code in `sms_service.py` or contact support.

### Step 4: Test SMS

1. Create a test incident with "Major" or "Critical" severity
2. Make sure staff member or resident has a phone number entered
3. Check the server logs to see SMS sending status
4. Check the phone for the SMS message

## How SMS is Sent

### Automatic SMS Triggers:

1. **Incident Alerts** (Major/Critical only)
   - Sent to staff with phone numbers (admins, managers, assigned staff)
   - Sent to resident's emergency contact phone

2. **Medication Alerts** (coming soon)
   - Sent when medication is marked as "missed"

3. **Vital Signs Alerts** (coming soon)
   - Sent when critical vital sign values are detected

## Message Format

SMS messages are automatically truncated to 160 characters for best compatibility:

**Example Incident Alert:**
```
⚠️ Alert: John Doe - Fall (Severity: Critical)
```

**Example Medication Alert:**
```
⚠️ Alert: Jane Smith - Medication 'Aspirin' not taken at 08:00
```

## Troubleshooting

### SMS Not Received?

1. **Check Email Service**: SMS uses email, so email must be working
   - Verify Resend API or SMTP is configured correctly
   - Test by creating an incident and checking if email is sent

2. **Check Phone Number Format**:
   - Must be 10 digits
   - Try removing spaces, dashes, parentheses
   - Example: `7875551234` (correct)

3. **Check Carrier**:
   - Default is Verizon (`@vtext.com`)
   - If phone is on different carrier, SMS might not work
   - Some carriers block email-to-SMS or require opt-in

4. **Check Server Logs**:
   - Look for `📱 [Background] SMS sent successfully` messages
   - Check for error messages in server logs

5. **Carrier Blocking**:
   - Some carriers block email-to-SMS
   - Some require phone to opt-in first
   - Try testing with a different carrier phone

### Testing SMS Service Directly

You can test the SMS service from command line:

```bash
python3 sms_service.py
```

This will prompt for a phone number and send a test SMS.

## Cost

**FREE!** 🎉

- No per-message charges
- No monthly fees
- No account approval needed
- Works with your existing email service

The only "cost" is using your email quota, which is usually very generous.

## Limitations

1. **160 Character Limit**: Messages are truncated to 160 characters for compatibility
2. **Carrier Dependent**: Some carriers may block or delay email-to-SMS
3. **No Delivery Confirmation**: Unlike Twilio, we can't confirm SMS delivery
4. **Carrier Restrictions**: Some carriers require opt-in or limit email-to-SMS

## Alternative: Twilio (If Email-to-SMS Doesn't Work)

If email-to-SMS doesn't work well for your carriers, you can upgrade to Twilio:
- ~$0.0075 per SMS
- Better reliability
- Delivery confirmations
- Requires account approval

But try email-to-SMS first - it's FREE and works for most people!

