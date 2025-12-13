# Server Connection Troubleshooting Guide

## ✅ Server is Currently Running!

Your server is running on port 5001. Here's how to access it and troubleshoot issues.

## Quick Access

1. **Local access**: http://127.0.0.1:5001
2. **Localhost**: http://localhost:5001
3. **Network access**: Use your Mac's IP address (see below)

## Common Issues & Solutions

### Issue 1: "Cannot connect" or "Connection refused"

**Solution:**
1. Check if server is running:
   ```bash
   lsof -ti:5001
   ```
   If nothing shows, the server isn't running.

2. Start the server:
   ```bash
   ./start_server.sh
   ```
   **IMPORTANT**: Keep the terminal window open! If you close it or press Ctrl+C, the server stops.

3. Wait 3-5 seconds after starting before opening the browser.

### Issue 2: Server stops when you press Ctrl+C

**This is normal!** When you press Ctrl+C in the terminal running the server, it stops the server.

**Solution:**
- Use `start_server_background.sh` to run the server in the background:
  ```bash
  ./start_server_background.sh
  ```
- Or keep the terminal window open when using `start_server.sh`

### Issue 3: "Port 5001 already in use"

**Solution:**
```bash
# Stop the existing server
./stop_server.sh

# Or manually:
lsof -ti:5001 | xargs kill -9

# Then start again
./start_server.sh
```

### Issue 4: Browser shows old/cached page

**Solution:**
1. **Hard refresh**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

2. **Clear browser cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Safari: Develop → Empty Caches

3. **Try incognito/private mode**

### Issue 5: Can't access from phone/tablet

**Solution:**
1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like `192.168.1.xxx`

2. Use that IP instead:
   ```
   http://192.168.1.xxx:5001
   ```

3. Make sure your phone/tablet is on the same Wi-Fi network

## Server Management Commands

### Start Server (Foreground - see logs)
```bash
./start_server.sh
```
- Server runs in this terminal
- You'll see all logs
- Press Ctrl+C to stop
- **Keep terminal open!**

### Start Server (Background - runs independently)
```bash
./start_server_background.sh
```
- Server runs in background
- Terminal can be closed
- Check logs: `tail -f server.log`
- Stop with: `./stop_server.sh`

### Stop Server
```bash
./stop_server.sh
```

### Check if Server is Running
```bash
lsof -ti:5001
```
If you see a number, server is running. If empty, it's not.

### View Server Logs (Background Mode)
```bash
tail -f server.log
```

## Step-by-Step: Starting the Server

### Method 1: Foreground (Recommended for Development)

1. Open Terminal
2. Navigate to project:
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   ```
3. Start server:
   ```bash
   ./start_server.sh
   ```
4. **Keep terminal window open**
5. Wait 3-5 seconds
6. Open browser: http://127.0.0.1:5001

### Method 2: Background (Recommended for Long Sessions)

1. Open Terminal
2. Navigate to project:
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   ```
3. Start server in background:
   ```bash
   ./start_server_background.sh
   ```
4. You'll see: "✅ Server is running!"
5. Open browser: http://127.0.0.1:5001
6. You can close the terminal (server keeps running)
7. To stop later: `./stop_server.sh`

## Testing Server Connection

### Test 1: Check if server responds
```bash
curl http://127.0.0.1:5001/
```
Should return HTML content.

### Test 2: Check port is listening
```bash
lsof -ti:5001
```
Should return a process ID number.

### Test 3: Check in browser
1. Open: http://127.0.0.1:5001
2. Should see login page
3. If you see "Cannot connect", server isn't running

## Still Not Working?

### Check Python Installation
```bash
python3 --version
```
Should show Python 3.x

### Check Flask Installation
```bash
pip3 list | grep Flask
```
Should show Flask and Flask-CORS

### Check for Errors
If using background mode:
```bash
cat server.log
```

If using foreground mode, check the terminal output for error messages.

### Common Error Messages

**"Address already in use"**
- Port 5001 is taken
- Solution: `./stop_server.sh` then start again

**"ModuleNotFoundError: No module named 'flask'"**
- Flask not installed
- Solution: `pip3 install flask flask-cors`

**"Permission denied"**
- Scripts not executable
- Solution: `chmod +x *.sh`

## Quick Checklist

Before reporting issues, check:
- [ ] Server is running (`lsof -ti:5001` shows a number)
- [ ] Waited 3-5 seconds after starting
- [ ] Using correct URL: http://127.0.0.1:5001
- [ ] Tried hard refresh (Cmd+Shift+R)
- [ ] Terminal window is still open (if using foreground mode)
- [ ] No firewall blocking port 5001
- [ ] Python3 and Flask are installed

## Need More Help?

If server still won't start:
1. Check `server.log` for errors
2. Try running directly: `python3 server.py`
3. Check terminal output for error messages
4. Verify you're in the correct directory



