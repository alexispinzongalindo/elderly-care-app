# Resend Email Setup (Works on Render!)

## Why Resend?
Render's free tier **blocks all SMTP connections**. Resend uses HTTP API, which works perfectly on Render.

## Setup Steps

### 1. Create Resend Account (FREE - 100 emails/day)
1. Go to https://resend.com
2. Sign up for free account
3. Verify your email

### 2. Get Your API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "ElderCare App")
4. Copy the API key (starts with `re_`)

### 3. Set Up Your "From" Email
**Option A: Use Resend's Test Domain (Easiest - for testing)**
- Resend provides: `onboarding@resend.dev`
- You can use this for testing immediately
- **Note**: This only works for sending, replies go nowhere

**Option B: Use Your Own Domain (Recommended - for production)**
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add your domain (e.g., `elderlycare.tech`)
4. Follow DNS setup instructions:
   - Add the TXT records they provide to your domain's DNS
   - Wait for verification (usually 5-10 minutes)
5. Once verified, you can send from any email on that domain (e.g., `notifications@elderlycare.tech`)

### 4. Configure in Render
1. Go to your Render service dashboard
2. Click "Environment" tab
3. Add these environment variables:

```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

(Or use your verified domain email: `notifications@yourdomain.com`)

### 5. Deploy
The code will automatically use Resend if `RESEND_API_KEY` is set!

## How It Works
- **If `RESEND_API_KEY` is set**: Uses Resend API (HTTP, works on Render) ✅
- **If not set**: Falls back to SMTP (works locally, blocked on Render free tier)

## Testing
1. After setting environment variables in Render, redeploy
2. Create a test incident with "major" or "critical" severity
3. Check Render logs for:
   - `✅ Email sent successfully via Resend to ...`
   - Or error messages if something's wrong

## Troubleshooting
- **"Resend API key not configured"**: Check `RESEND_API_KEY` is set in Render
- **"RESEND_FROM_EMAIL not configured"**: Set `RESEND_FROM_EMAIL` in Render
- **"Domain not verified"**: Wait for DNS propagation or use `onboarding@resend.dev` for testing

## Free Tier Limits
- **100 emails per day** (free tier)
- Perfect for incident alerts and notifications!
- Upgrade if you need more

## Benefits
✅ Works on Render free tier (HTTP API)  
✅ No SMTP blocking issues  
✅ Reliable delivery  
✅ Email analytics in Resend dashboard  
✅ Free tier: 100 emails/day  
✅ Easy setup (5 minutes)
