# ClickSend SMS Integration Guide

## Overview
ClickSend is a paid SMS/WhatsApp service that provides more reliable delivery than the free email-to-SMS gateways. It costs approximately **$0.09 per SMS** (~$90 per 1,000 messages).

## Why Use ClickSend?
- ✅ **More reliable** - Direct SMS API delivery (no carrier email gateways)
- ✅ **WhatsApp support** - Can send WhatsApp messages too
- ✅ **Delivery tracking** - Better delivery confirmation than email-to-SMS
- ✅ **International support** - Better international SMS delivery
- ⚠️ **Costs money** - ~$0.09/SMS vs FREE for email-to-SMS

## Current System Behavior

The system will automatically:
1. **Try ClickSend first** if `CLICKSEND_API_KEY` and `CLICKSEND_USERNAME` are set
2. **Fall back to email-to-SMS** (free) if ClickSend is not configured or fails

## Setup Instructions

### 1. Create ClickSend Account
1. Go to https://clicksend.com
2. Sign up for a free account
3. Add credits to your account (minimum $10 recommended)
4. Go to Settings → API Settings

### 2. Get Your Credentials
1. **API Key**: Copy your API key from the dashboard
2. **Username**: Your ClickSend username (usually your email)

### 3. Set Environment Variables on Render

In your Render dashboard:
1. Go to your service → Environment
2. Add these variables:

```bash
CLICKSEND_API_KEY=your_api_key_here
CLICKSEND_USERNAME=your_email@example.com
```

### 4. (Optional) Enable WhatsApp
If you want WhatsApp support:
```bash
CLICKSEND_WHATSAPP_ENABLED=true
```

**Note**: WhatsApp requires additional setup with ClickSend (WhatsApp Business API registration).

### 5. Deploy

After setting environment variables:
1. Click "Manual Deploy" in Render or wait for auto-deploy
2. Check logs - you should see: `✅ SMS service available via ClickSend API`

## Testing

### Test SMS Sending
You can test the integration locally:

```bash
# Set environment variables
export CLICKSEND_API_KEY=your_key
export CLICKSEND_USERNAME=your_email@example.com

# Run test
python clicksend_sms.py
```

### Test in Production
1. Create a test resident with your phone number
2. Trigger an alert (create an incident, medication alert, etc.)
3. Check your phone for the SMS
4. Check Render logs for delivery confirmation

## Cost Comparison

### Email-to-SMS (Current - FREE)
- **Cost**: $0 per SMS
- **Reliability**: Depends on carrier email gateways
- **Delivery confirmation**: No
- **WhatsApp**: No

### ClickSend (Paid)
- **Cost**: ~$0.09 per SMS (~$90 per 1,000)
- **Reliability**: High (direct SMS API)
- **Delivery confirmation**: Yes
- **WhatsApp**: Yes (additional setup required)

### Example Monthly Cost
- 100 SMS alerts/month: **$9.00**
- 500 SMS alerts/month: **$45.00**
- 1,000 SMS alerts/month: **$90.00**

## Switching Back to Free Email-to-SMS

If you want to go back to the free method:
1. Remove or clear these environment variables in Render:
   - `CLICKSEND_API_KEY`
   - `CLICKSEND_USERNAME`
2. Redeploy
3. System will automatically fall back to email-to-SMS

## Troubleshooting

### "ClickSend API key not configured"
- Make sure `CLICKSEND_API_KEY` is set in Render environment variables
- Redeploy after adding variables

### "ClickSend username not configured"
- Make sure `CLICKSEND_USERNAME` is set in Render environment variables
- Use your ClickSend account email or username

### SMS not sending
- Check ClickSend dashboard for credits/balance
- Check Render logs for error messages
- Verify phone numbers are in correct format (10 digits)

### Still using email-to-SMS
- Check Render logs - should show "SMS service available via ClickSend API"
- Verify environment variables are set correctly
- Make sure you redeployed after setting variables

## Support

- ClickSend Documentation: https://developers.clicksend.com/docs/
- ClickSend Support: support@clicksend.com
- ClickSend Dashboard: https://dashboard.clicksend.com

## Files

- `clicksend_sms.py` - ClickSend integration code
- `sms_service.py` - Email-to-SMS fallback (FREE)
- `server.py` - Automatically chooses ClickSend or email-to-SMS
