#!/bin/bash

# Script to start the Elder Care Management server

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the project directory
cd "$SCRIPT_DIR"

# Print current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH"
    exit 1
fi

# Check if server.py exists
if [ ! -f "server.py" ]; then
    echo "❌ Error: server.py not found in $(pwd)"
    exit 1
fi

# Print environment check
echo "🔍 Environment check:"
echo "   Python: $(python3 --version)"
echo "   SENDER_EMAIL: ${SENDER_EMAIL:+SET}${SENDER_EMAIL:-NOT SET}"
echo "   SENDER_PASSWORD: ${SENDER_PASSWORD:+SET}${SENDER_PASSWORD:-NOT SET}"
echo ""

# Start the server
echo "🚀 Starting Elder Care Management Server..."
echo "   Server will be available at: http://localhost:${PORT:-5001}"
echo "   Press Ctrl+C to stop the server"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

python3 server.py

