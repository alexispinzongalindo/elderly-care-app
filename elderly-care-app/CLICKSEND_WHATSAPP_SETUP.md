# 📱 ClickSend WhatsApp Setup Guide

## What You Need to Do for WhatsApp Messages in ClickSend

To enable WhatsApp messaging through ClickSend, you need to complete these steps:

---

## ✅ Step 1: Enable WhatsApp in Your Code (Already Done!)

The code already supports WhatsApp! You just need to enable it:

### Set Environment Variable on Render:
```bash
CLICKSEND_WHATSAPP_ENABLED=true
```

**Where to set it:**
1. Go to your Render dashboard
2. Click on your service
3. Go to **Environment** tab
4. Add new variable: `CLICKSEND_WHATSAPP_ENABLED` = `true`
5. Save and redeploy

---

## ✅ Step 2: Set Up WhatsApp Business API in ClickSend Dashboard

**IMPORTANT:** WhatsApp requires additional setup in ClickSend. You can't just enable it with a flag - you need to configure WhatsApp Business API in your ClickSend account.

### 2.1. Log into ClickSend Dashboard
- Go to https://dashboard.clicksend.com
- Log in with your account

### 2.2. Navigate to WhatsApp Settings
1. In the ClickSend dashboard, look for **"WhatsApp"** or **"Messaging"** menu
2. Go to **WhatsApp Business API** section
3. Click **"Set Up WhatsApp"** or **"Enable WhatsApp"**

### 2.3. WhatsApp Business API Requirements

ClickSend's WhatsApp integration requires:
- ✅ **WhatsApp Business Account** - You need to have or create a WhatsApp Business account
- ✅ **Business Verification** - Your business needs to be verified with Meta (Facebook)
- ✅ **Phone Number** - A dedicated phone number for WhatsApp Business
- ✅ **Message Templates** - For automated messages (required for business messages)

---

## ⚠️ Important Notes About WhatsApp Business API

### What is WhatsApp Business API?
- It's different from regular WhatsApp - it's for **business messaging only**
- It requires **Meta (Facebook) Business Account** setup
- You can't use your personal WhatsApp number
- **Message Templates** are required for most messages (except replies within 24 hours)

### Cost:
- ClickSend WhatsApp pricing: Check ClickSend dashboard (usually similar to SMS ~$0.09 per message)
- WhatsApp Business API may have Meta fees too (varies)
- **Total cost**: ~$0.09-0.10 per WhatsApp message (or higher depending on Meta fees)

### Message Types:
1. **Template Messages** - Pre-approved message templates (for initial messages)
2. **Session Messages** - Replies within 24 hours of user message (free)

---

## 🔄 Alternative: Use SMS Instead (Simpler!)

**If WhatsApp setup is too complex, you can use SMS:**

✅ **SMS is already working** with ClickSend (you confirmed it works!)

SMS advantages:
- ✅ Already configured and working
- ✅ No additional setup needed
- ✅ Cheaper (~$0.09/SMS vs ~$0.09-0.10/WhatsApp)
- ✅ Works on all phones (not just WhatsApp users)
- ✅ Instant delivery

---

## 📋 Quick Setup Checklist

### For WhatsApp (Complex):
- [ ] Enable `CLICKSEND_WHATSAPP_ENABLED=true` in Render
- [ ] Log into ClickSend dashboard
- [ ] Navigate to WhatsApp section
- [ ] Complete WhatsApp Business API setup
- [ ] Verify business with Meta/Facebook
- [ ] Set up phone number for WhatsApp Business
- [ ] Create message templates (if needed)
- [ ] Test WhatsApp sending
- [ ] Redeploy your app

### For SMS Only (Simple - Already Working!):
- [x] ✅ Already configured with `CLICKSEND_API_KEY` and `CLICKSEND_USERNAME`
- [x] ✅ SMS is working (you confirmed it!)
- [ ] No additional setup needed!

---

## 🎯 Recommendation

**If you just need reliable messaging:**

✅ **Use SMS** - It's already working, simpler, and cheaper!

**Only use WhatsApp if:**
- You specifically need WhatsApp messaging
- Your users prefer WhatsApp over SMS
- You're willing to go through Meta business verification
- You need WhatsApp's read receipts and delivery status

---

## 🔍 How to Check WhatsApp Status in ClickSend

1. Log into ClickSend dashboard: https://dashboard.clicksend.com
2. Look for **"WhatsApp"** in the menu
3. Check if it shows:
   - ✅ **"Active"** or **"Enabled"** - WhatsApp is ready
   - ⚠️ **"Setup Required"** - You need to complete setup
   - ❌ **"Not Available"** - WhatsApp not available for your account

---

## 📞 Need Help?

**ClickSend Support:**
- Support Email: support@clicksend.com
- Documentation: https://developers.clicksend.com/docs/
- WhatsApp Setup Guide: Check ClickSend dashboard help section

**For Your Code:**
- The WhatsApp function is already implemented in `clicksend_sms.py`
- It will automatically use WhatsApp when `CLICKSEND_WHATSAPP_ENABLED=true`
- Falls back to SMS if WhatsApp fails

---

## 🚀 Testing WhatsApp

Once WhatsApp is enabled in ClickSend:

1. Set `CLICKSEND_WHATSAPP_ENABLED=true` in Render
2. Redeploy your app
3. Trigger a notification (incident alert, medication alert, etc.)
4. Check if message is sent via WhatsApp
5. Check Render logs for WhatsApp delivery confirmation

---

## Summary

**What you need to do:**
1. ✅ Set `CLICKSEND_WHATSAPP_ENABLED=true` in Render (5 minutes)
2. ⚠️ Complete WhatsApp Business API setup in ClickSend dashboard (1-2 hours, requires Meta verification)
3. ✅ Test and verify

**OR just use SMS (which is already working!)** ✅

