# ⚡ Quick Email Setup (5 Minutes)

## ❌ PROBLEM: Emails Not Sending

Your email notifications aren't working because **environment variables are not set**.

## ✅ SOLUTION: 3 Simple Steps

### Step 1: Get Gmail App Password (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Click **App passwords** (search for it if needed)
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)**
   - Name: `Elder Care App`
5. Click **Generate**
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Set Environment Variables (1 minute)

**On Mac/Linux (Terminal):**
```bash
export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="abcdefghijklmnop"
```

**⚠️ IMPORTANT:** These settings only last for the current terminal session!

**To make them permanent, add to `~/.zshrc` or `~/.bashrc`:**
```bash
echo 'export SENDER_EMAIL="your-email@gmail.com"' >> ~/.zshrc
echo 'export SENDER_PASSWORD="your-16-char-password"' >> ~/.zshrc
source ~/.zshrc
```

**On Windows (Command Prompt):**
```cmd
set SENDER_EMAIL=your-email@gmail.com
set SENDER_PASSWORD=abcdefghijklmnop
```

### Step 3: Test It (2 minutes)

**Option A: Run the test script**
```bash
python3 test_email_setup.py
```

**Option B: Test via API**
1. Start your server: `python3 server.py`
2. Login to the app
3. Go to browser console and run:
```javascript
fetch('/api/email/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    },
    body: JSON.stringify({ email: 'your-test-email@gmail.com' })
})
.then(r => r.json())
.then(console.log)
```

## ✅ Success Indicators

You'll know it's working when:
- ✅ Test script says "SETUP COMPLETE"
- ✅ Test email arrives in your inbox
- ✅ Creating high-severity incidents sends emails

## 🔍 Troubleshooting

### "Email not configured" error
- ✅ Check: `echo $SENDER_EMAIL` (should show your email)
- ✅ Check: `echo $SENDER_PASSWORD` (should show your password)
- ✅ Make sure you restarted your server after setting variables

### "Authentication failed" error
- ✅ Make sure 2-Step Verification is enabled
- ✅ Use the App Password, NOT your regular Gmail password
- ✅ Make sure password is exactly 16 characters (remove spaces if any)

### "No staff emails found" warning
- ✅ Add email addresses to staff records in the app
- ✅ Make sure staff with 'admin' or 'manager' role have emails
- ✅ Check that staff are marked as 'active'

## 🎯 After Setup

Once configured:
- ✅ High-severity incidents automatically send emails
- ✅ Future monitoring agent will send medication/vital alerts
- ✅ All email notifications work automatically

**Cost: $0/month forever!** 🎉

