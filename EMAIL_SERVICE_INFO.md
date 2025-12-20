# 📧 Email Service - Who's Handling Your Email?

## Quick Answer

**ClickSend does NOT handle email** - it only handles SMS and WhatsApp messages.

Your email is handled by a **separate email service** that is configured in your system.

---

## Current Email Configuration

Your system supports **TWO** email services (it automatically chooses one):

### 1. **Resend API** (RECOMMENDED - Works on Render)
- **Service**: Resend (https://resend.com)
- **Status**: Active if `RESEND_API_KEY` is set
- **Cost**: Free tier available, then paid
- **Why**: Works reliably on Render (HTTP-based, not SMTP)

**Environment Variables Needed:**
```bash
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@yourdomain.com
```

### 2. **SMTP/Gmail** (Fallback for Local Development)
- **Service**: Gmail SMTP (or any SMTP server)
- **Status**: Active if `SENDER_EMAIL` and `SENDER_PASSWORD` are set
- **Cost**: Free (with Gmail account)
- **Why**: Works locally but may be blocked on Render free tier

**Environment Variables Needed:**
```bash
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_gmail_app_password
```

---

## How It Works

1. **System checks for Resend first** (if `RESEND_API_KEY` is set)
2. **Falls back to SMTP** (if `SENDER_EMAIL` and `SENDER_PASSWORD` are set)
3. **Email disabled** if neither is configured

---

## How to Check What's Currently Configured

### Check Render Environment Variables:
1. Go to your Render dashboard
2. Click on your service
3. Go to **Environment** tab
4. Look for these variables:

**For Resend (recommended):**
- `RESEND_API_KEY` - Should be set
- `RESEND_FROM_EMAIL` - Should be set

**For SMTP (fallback):**
- `SENDER_EMAIL` - May be set
- `SENDER_PASSWORD` - May be set

### Check Server Logs:
When your app starts, you should see:
- ✅ `Email service configured and ready` - Email is working
- ⚠️ `Email service available but not configured` - Email variables not set
- ⚠️ `Email service not available` - Email module not found

---

## Summary: Who Handles What?

| Service | Handles | Provider |
|---------|---------|----------|
| **ClickSend** | SMS & WhatsApp only | ClickSend.com |
| **Email** | Email notifications | Resend API OR Gmail SMTP |

**They are completely separate!**

- ClickSend = SMS/WhatsApp ($0.09 per SMS)
- Email = Email notifications (Resend or Gmail)

---

## Current Status Check

To see what's currently handling your email:

**Option 1: Check Render Environment Variables**
- Look for `RESEND_API_KEY` (Resend)
- OR look for `SENDER_EMAIL` (SMTP/Gmail)

**Option 2: Check Server Logs**
- Look for startup messages about email configuration
- Should show which service is being used

**Option 3: Check Email Service Code**
- File: `email_service.py`
- Uses Resend API if `RESEND_API_KEY` is set
- Falls back to SMTP if `SENDER_EMAIL` is set

---

## Recommendation

**For Production (Render):**
✅ Use **Resend API** - it's more reliable on Render

**For Local Development:**
✅ Use **Gmail SMTP** - easier to set up locally

---

## Questions?

**Q: Does ClickSend handle email?**
A: No, ClickSend only handles SMS and WhatsApp. Email is separate.

**Q: Who is handling my email right now?**
A: Check your Render environment variables - either Resend API or Gmail SMTP.

**Q: Can I use ClickSend for email?**
A: No, ClickSend doesn't offer email service. Use Resend API or SMTP.

**Q: How do I switch email services?**
A: Set the appropriate environment variables in Render:
- For Resend: Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- For Gmail: Set `SENDER_EMAIL` and `SENDER_PASSWORD`

