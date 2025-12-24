# How to Start the Server

## Option 1: Using the Script (Recommended)

Simply run:
```bash
./start_server.sh
```

Or from anywhere:
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
./start_server.sh
```

## Option 2: Manual Start

1. Open Terminal
2. Navigate to the project folder:
   ```bash
   cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
   ```
3. Start the server:
   ```bash
   python3 server.py
   ```

## Important Notes

- The server will run on `http://localhost:5000`
- Press `Ctrl+C` to stop the server
- Make sure your environment variables are set:
  - `SENDER_EMAIL` (for email notifications)
  - `SENDER_PASSWORD` (Gmail App Password)
  
If environment variables are not set, add them to your `~/.zshrc`:
```bash
export SENDER_EMAIL="your-email@gmail.com"
export SENDER_PASSWORD="your-app-password"
```

Then reload:
```bash
source ~/.zshrc
```

## Running in Background (Optional)

To run the server in the background and keep it running after closing terminal:

```bash
nohup python3 server.py > server.log 2>&1 &
```

To stop a background server:
```bash
pkill -f "python3 server.py"
```

