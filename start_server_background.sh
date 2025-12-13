#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Kill any existing server on port 5001
echo "🔄 Stopping any existing server on port 5001..."
EXISTING_PID=$(lsof -ti:5001 2>/dev/null)
if [ ! -z "$EXISTING_PID" ]; then
    kill -9 $EXISTING_PID 2>/dev/null
    echo "   Stopped process $EXISTING_PID"
    sleep 2
else
    echo "   No existing server found"
fi

# Check if Python3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found in PATH"
    echo "   Please install Python 3 or add it to your PATH"
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "❌ Error: Flask not installed"
    echo "   Run: pip3 install flask flask-cors"
    exit 1
fi

# Check if server.py exists
if [ ! -f "server.py" ]; then
    echo "❌ Error: server.py not found in current directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Start the Flask server in the background
echo "🚀 Starting Flask server in the background on port 5001..."
echo "   Working directory: $(pwd)"
echo "   Python: $(which python3)"
echo "   Python version: $(python3 --version)"

# Use absolute path for log file
LOG_FILE="$SCRIPT_DIR/server.log"
nohup python3 "$SCRIPT_DIR/server.py" > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "   Started process with PID: $SERVER_PID"
echo "   Log file: $LOG_FILE"

# Wait a moment for server to start
echo "⏳ Waiting for server to start..."
sleep 4

# Check if server started successfully
if lsof -ti:5001 > /dev/null 2>&1; then
    echo ""
    echo "✅ Server is running!"
    echo "   Process ID: $(lsof -ti:5001)"
    echo "   Port: 5001"
    echo ""
    echo "📍 Access your app at:"
    echo "   http://127.0.0.1:5001"
    echo "   http://localhost:5001"
    echo ""
    echo "📋 View server logs:"
    echo "   tail -f \"$LOG_FILE\""
    echo ""
    echo "🛑 To stop the server:"
    echo "   ./stop_server.sh"
    echo ""
else
    echo ""
    echo "❌ Server failed to start!"
    echo ""
    echo "Checking for errors..."
    if [ -f "$LOG_FILE" ]; then
        echo "Last 30 lines of server.log:"
        echo "----------------------------------------"
        tail -30 "$LOG_FILE"
        echo "----------------------------------------"
    else
        echo "No log file found at: $LOG_FILE"
    fi
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if port 5001 is already in use: lsof -ti:5001"
    echo "2. Try running server directly: python3 server.py"
    echo "3. Check Python/Flask installation: python3 -c 'import flask; print(flask.__version__)'"
    exit 1
fi


