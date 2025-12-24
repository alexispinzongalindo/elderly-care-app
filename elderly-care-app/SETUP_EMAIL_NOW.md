# Set Up Email - Copy These Commands

## Step 1: Open Terminal
Press `Ctrl + ~` in Cursor, or open Terminal app

## Step 2: Run These Commands

**Replace `your-email@gmail.com` with YOUR actual Gmail address!**

```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="tgaqjckztrczklvh"
```

**Important:** 
- Replace `your-email@gmail.com` with YOUR actual email
- Password I'm using: `tgaqjckztrczklvh` (without spaces - that's fine!)

## Step 3: Test It

```bash
python3 test_email_setup.py
```

When it asks for a test email, enter your email address!

---

## ⚠️ NOTE:
These environment variables only last for THIS terminal session.

**To make them permanent** (so you don't have to set them every time), add to `~/.zshrc`:

```bash
echo 'export SENDER_EMAIL="your-email@gmail.com"' >> ~/.zshrc
echo 'export SENDER_PASSWORD="tgaqjckztrczklvh"' >> ~/.zshrc
source ~/.zshrc
```

But first, let's test if it works!





























