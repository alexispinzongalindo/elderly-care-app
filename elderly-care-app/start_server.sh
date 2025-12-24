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

# Dev defaults (can be overridden by env vars)
export PORT="${PORT:-5002}"
export FLASK_ENV="${FLASK_ENV:-development}"
export USE_MINIFIED="${USE_MINIFIED:-false}"

# IDE-friendly defaults:
# - FLASK_DEBUG controls Flask debug mode
# - FLASK_USE_RELOADER controls Werkzeug reloader (spawns multiple processes; can be unstable in IDE runners)
export FLASK_DEBUG="${FLASK_DEBUG:-0}"
export FLASK_USE_RELOADER="${FLASK_USE_RELOADER:-0}"

# Start the server
echo "🚀 Starting Elder Care Management Server..."
echo "   Server will be available at: http://localhost:${PORT}"
echo "   Mode: ${FLASK_ENV} (debug=${FLASK_DEBUG}, reloader=${FLASK_USE_RELOADER})"
echo "   USE_MINIFIED: ${USE_MINIFIED}"
echo "   Press Ctrl+C to stop the server"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

python3 server.py

