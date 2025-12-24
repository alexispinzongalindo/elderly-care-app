# Email Solution for Render

## Problem
Render's free tier **blocks all outbound SMTP connections** (ports 25, 587, 465). This means Gmail SMTP will NOT work on Render free tier.

## Solution Options

### Option 1: Use Resend (Recommended - FREE, HTTP API)
Resend is a modern email service with a free tier that works via HTTP API (not SMTP).

1. **Sign up**: Go to https://resend.com and create a free account (100 emails/day free)
2. **Get API Key**: 
   - Go to API Keys in Resend dashboard
   - Create a new API key
   - Copy the key (starts with `re_`)
3. **Set in Render**:
   - Go to your Render service → Environment
   - Add: `RESEND_API_KEY` = your API key
   - Add: `USE_RESEND=true`
4. **Update email_service.py** (see below)

### Option 2: Use SendGrid (FREE, HTTP API)
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create API key
3. Set in Render: `SENDGRID_API_KEY` and `USE_SENDGRID=true`

### Option 3: Upgrade Render Plan
Render's paid plans allow SMTP connections. This costs money though.

## Quick Fix: Add Resend Support

I can update `email_service.py` to support Resend. It's a simple HTTP API call instead of SMTP.

Would you like me to:
1. Add Resend support to email_service.py?
2. Keep Gmail SMTP as fallback for local development?

Let me know and I'll implement it!
