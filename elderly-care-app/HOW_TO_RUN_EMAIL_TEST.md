# How to Run the Email Test Script

## 📍 Where to Run It

Run it in the **same directory where your `server.py` file is located**.

That's:
```
/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE
```

## 🖥️ Step-by-Step Instructions

### Option 1: Using Terminal (Mac)

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   ```

3. **Run the test script:**
   ```bash
   python3 test_email_setup.py
   ```

### Option 2: Using VS Code / Cursor Terminal

1. **Open your project in Cursor/VS Code**

2. **Open the integrated terminal:**
   - Press: `Ctrl + ~` (or `Cmd + ~` on Mac)
   - OR: View → Terminal

3. **Make sure you're in the right directory:**
   ```bash
   pwd
   ```
   Should show: `/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE`

4. **Run the script:**
   ```bash
   python3 test_email_setup.py
   ```

## ✅ What You'll See

The script will show:
- ✅ Whether environment variables are set
- ✅ Whether email service can be imported
- ✅ Instructions if something is missing
- ✅ Option to send a test email

## 🔧 If Script Doesn't Run

**If you get "command not found":**
```bash
python test_email_setup.py
```

**If you get "permission denied":**
```bash
chmod +x test_email_setup.py
python3 test_email_setup.py
```

## 📝 Quick Command Summary

```bash
# 1. Go to project folder
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

# 2. Run the test
python3 test_email_setup.py

# 3. Follow the instructions it gives you!
```

That's it! The script will tell you exactly what to do next. 🎯





























