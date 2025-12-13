# How to Start the Server

## Method 1: Using Terminal (Recommended)

1. **Open Terminal** (Applications > Utilities > Terminal)

2. **Navigate to your project folder:**
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   ```

3. **Start the server:**
   ```bash
   ./start_server_background.sh
   ```

4. **Stop the server:**
   ```bash
   ./stop_server.sh
   ```

## Method 2: Double-Click (If it doesn't work)

If double-clicking the `.sh` file doesn't work:

1. **Right-click** on `start_server_background.sh`
2. Select **"Open With"** > **"Terminal"** (or "Other" and choose Terminal)
3. Or drag the file into Terminal window and press Enter

## Method 3: Run from Any Location

You can run the script from anywhere if you use the full path:

```bash
"/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/start_server_background.sh"
```

## Troubleshooting

### "Permission denied"
Make the script executable:
```bash
chmod +x "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/start_server_background.sh"
```

### "No such file or directory"
Make sure you're in the correct directory. Check with:
```bash
ls -la server.py
```
If you see `server.py`, you're in the right place.

### "Port 5001 already in use"
Stop any existing server:
```bash
./stop_server.sh
```

### Check if server is running
```bash
lsof -ti:5001
```
If you see a number, the server is running.

### View server logs
```bash
tail -f "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE/server.log"
```

## Quick Test

Test if everything works:
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
./start_server_background.sh
sleep 5
curl http://127.0.0.1:5001
```

If you see HTML output, the server is working! 🎉

