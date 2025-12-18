# Email Diagnostic Instructions

## Quick Diagnostic

Run this command to check your email configuration:

```bash
python3 diagnose_email_issue.py
```

This will check:
- ✅ Environment variables (SENDER_EMAIL, SENDER_PASSWORD)
- ✅ Database configuration (staff emails, admin/manager emails)
- ✅ Recent incidents and their severity
- ✅ Email service import status
- ✅ Test email sending (optional)

## What to Look For

After running the diagnostic, check:

1. **Environment Variables**: Both should show "✅ SET"
   - If not, add them to `~/.zshrc`:
     ```bash
     export SENDER_EMAIL="your-email@gmail.com"
     export SENDER_PASSWORD="your-app-password"
     ```
   - Then reload: `source ~/.zshrc`

2. **Admin/Manager Emails**: Should show at least one active admin/manager with email
   - If not, edit staff records to add email addresses

3. **Recent Incidents**: Check if severity is "Major" or "Critical"
   - Only Major/Critical incidents trigger email alerts

## After Running Diagnostic

1. If everything looks OK but emails still don't work:
   - Check the server terminal output when creating an incident
   - Look for debug messages (🔍, ✅, ❌)
   - Check spam folder in your email

2. If issues are found:
   - Fix them based on the diagnostic recommendations
   - Restart the server
   - Test again by creating a new incident with "Major" or "Critical" severity

