# 🚀 Quick Start Guide

## Start the Server (3 Easy Ways)

### ✅ Method 1: Use the Simple Launcher (Easiest)
```bash
"/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/start.sh"
```
**Works from anywhere!** Just copy and paste this into Terminal.

### ✅ Method 2: Navigate to Folder First
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
./start_server_background.sh
```

### ✅ Method 3: Double-Click in Finder
1. Open Finder
2. Navigate to your project folder
3. Right-click `start_server_background.sh`
4. Choose "Open With" > "Terminal"

---

## Stop the Server
```bash
"/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/stop_server.sh"
```

Or navigate to folder first:
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
./stop_server.sh
```

---

## ⚠️ If Scripts Don't Work After Moving

### Fix 1: Make Scripts Executable
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
chmod +x *.sh
```

### Fix 2: Update Path in start.sh
If you moved the project to a new location, edit `start.sh` and update this line:
```bash
PROJECT_PATH="/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
```
Change it to your new location.

### Fix 3: Check Current Location
```bash
pwd
```
Make sure you're in the right folder before running scripts.

---

## 📍 Access Your App

Once the server starts, open in your browser:
- **http://127.0.0.1:5001**
- **http://localhost:5001**

---

## 🔍 Check if Server is Running

```bash
lsof -ti:5001
```
If you see a number, the server is running!

---

## 📋 View Server Logs

```bash
tail -f "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/server.log"
```

---

## ❓ Still Having Problems?

1. **Check the log file:**
   ```bash
   cat "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/server.log"
   ```

2. **Try running server directly:**
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   python3 server.py
   ```
   (Press Ctrl+C to stop)

3. **Check Python/Flask:**
   ```bash
   python3 --version
   python3 -c "import flask; print('Flask OK')"
   ```

