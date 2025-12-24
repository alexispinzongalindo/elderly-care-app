#!/bin/bash

# Script to stop, restart, and exit
# This script: 1) Stops server, 2) Changes directory, 3) Restarts server, 4) Exits

# Define the project directory
PROJECT_DIR="/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

echo "🔄 Restarting Elder Care Management Server..."
echo ""

# Step 1: Kill any existing server processes FIRST
echo "🛑 STEP 1: Stopping any running server processes..."
SERVER_PIDS=$(ps aux | grep "[p]ython.*server.py" | awk '{print $2}')

if [ -z "$SERVER_PIDS" ]; then
    echo "ℹ️  No running server processes found"
else
    echo "📋 Found server process(es): $SERVER_PIDS"
    for PID in $SERVER_PIDS; do
        echo "   Stopping process $PID..."
        kill $PID 2>/dev/null || echo "   ⚠️  Could not stop process $PID"
    done
    # Wait for graceful shutdown
    sleep 2
    # Force kill if still running
    for PID in $SERVER_PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            echo "   Force killing process $PID..."
            kill -9 $PID 2>/dev/null || true
        fi
    done
    echo "✅ All server processes stopped"
fi
echo ""

# Step 2: Change to project directory
echo "📁 STEP 2: Changing to project directory..."
cd "$PROJECT_DIR" || { 
    echo "❌ Error: Failed to change directory to $PROJECT_DIR"
    exit 1
}
echo "✅ Current directory: $(pwd)"
echo ""

# Step 3: Verify prerequisites
echo "🔍 STEP 3: Checking prerequisites..."

# Check for Python
if command -v python3 &> /dev/null; then
    echo "✅ Python 3: $(python3 --version)"
else
    echo "❌ Python 3 is not installed. Please install it to run the server."
    exit 1
fi

# Check for server.py
if [ -f "server.py" ]; then
    echo "✅ server.py found"
else
    echo "❌ server.py not found in $PROJECT_DIR"
    exit 1
fi
echo ""

# Step 4: Check email configuration (informational)
echo "📧 Email configuration status:"
if [ -z "$SENDER_EMAIL" ]; then
    echo "⚠️  SENDER_EMAIL: NOT SET"
else
    echo "✅ SENDER_EMAIL: SET"
fi

if [ -z "$SENDER_PASSWORD" ]; then
    echo "⚠️  SENDER_PASSWORD: NOT SET"
else
    echo "✅ SENDER_PASSWORD: SET"
fi
echo ""

# Step 5: Start the server in background
echo "🚀 STEP 4: Starting Flask server in background..."
echo ""

# Start server in background and redirect output to server.log
nohup python3 server.py > server.log 2>&1 &
SERVER_PID=$!

# Wait a moment to check if server started successfully
sleep 3

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "✅✅✅ Server started successfully! ✅✅✅"
    echo ""
    echo "📊 Server Information:"
    echo "   Process ID (PID): $SERVER_PID"
    echo "   Log file: server.log"
    echo "   Directory: $(pwd)"
    echo ""
    echo "📝 Quick Commands:"
    echo "   View logs:        tail -f server.log"
    echo "   Stop server:      pkill -f 'python.*server.py'"
    echo "   Check status:     ps aux | grep '[p]ython.*server.py'"
    echo ""
    echo "🎉 Server is now running in the background!"
else
    echo "❌ Server failed to start. Checking logs..."
    echo ""
    if [ -f "server.log" ]; then
        echo "Last 30 lines of server.log:"
        echo "----------------------------------------"
        tail -30 server.log
        echo "----------------------------------------"
    else
        echo "   (server.log not found)"
    fi
    exit 1
fi

echo ""
echo "✅ Script completed successfully. Exiting..."
exit 0


