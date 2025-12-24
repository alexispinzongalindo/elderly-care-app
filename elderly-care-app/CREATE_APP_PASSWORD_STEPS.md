# Create Gmail App Password - Step by Step

## ✅ You're Already Here!
You're on the Google Account Security page and 2-Step Verification is enabled. Perfect!

## 📝 Next Steps:

### Step 1: Find "App passwords"
You can find it in TWO ways:

**Option A: Click on "2-Step Verification"**
1. Click on the "2-Step Verification" entry (the one that says "On since Aug 4, 2019")
2. Scroll down on the next page
3. Look for "App passwords" section (usually at the bottom)

**Option B: Use the Search Bar**
1. In the search bar at the top (says "Search Google Account"), type: `app passwords`
2. Click on the "App passwords" result

### Step 2: Create the App Password
Once you're on the App passwords page:

1. **Select App:** Choose "Mail"
2. **Select Device:** Choose "Other (Custom name)"
3. **Enter name:** Type `Elder Care App` (or any name you want)
4. Click **"Generate"** button
5. **Copy the 16-character password** that appears
   - It looks like: `abcd efgh ijkl mnop`
   - You can copy it with or without spaces (both work)

### Step 3: Set Environment Variables
Open Terminal and run these commands (replace with YOUR values):

```bash
export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="your-16-char-password"
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `your-16-char-password` with the password you just copied

### Step 4: Test It!
Run the test script again:
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
python3 test_email_setup.py
```

When it asks for a test email, enter your email address. It should send a test email!

---

## 💡 Quick Tip
The App Password page URL is usually:
`https://myaccount.google.com/apppasswords`

You can also go there directly if you can't find it!





























