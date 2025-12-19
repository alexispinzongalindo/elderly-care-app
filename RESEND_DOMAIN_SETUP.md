# Resend Domain Verification Setup

## Problem
Resend's free tier only allows sending emails to your own email address (alexis_pinzon@yahoo.com) unless you verify a domain.

## Solution: Verify Your Domain in Resend

### Step 1: Go to Resend Domains
1. Log into your Resend account: https://resend.com
2. Go to **Domains** section (in the sidebar)
3. Click **"Add Domain"** or **"Verify Domain"**

### Step 2: Add Your Domain
1. Enter: `elderlycare.tech`
2. Resend will show you DNS records to add

### Step 3: Add DNS Records
You need to add DNS records to your domain's DNS settings (wherever you manage DNS for `elderlycare.tech`):

**Example DNS records Resend will provide:**
```
Type: TXT
Name: @
Value: (provided by Resend - something like "resend-domain-verification=...")

Type: MX
Name: @
Priority: 10
Value: (provided by Resend - something like "feedback-smtp.resend.com")

Type: TXT
Name: resend._domainkey
Value: (provided by Resend - DKIM key)
```

### Step 4: Wait for Verification
- DNS changes can take 5 minutes to 48 hours to propagate
- Resend will show status: "Pending" → "Verified"

### Step 5: Update Render Environment Variables
Once verified, update in Render:
- **RESEND_FROM_EMAIL**: Change from `onboarding@resend.dev` to `notifications@elderlycare.tech` (or any email @elderlycare.tech)

---

## Alternative: Temporary Workaround
If you want to test immediately, send test emails only to `alexis_pinzon@yahoo.com`:
- Update the recipient email in your staff/resident records to `alexis_pinzon@yahoo.com` temporarily

---

## Full Resend Setup Guide
See: https://resend.com/docs/dashboard/domains/introduction


