#!/bin/bash

 # Double-clickable launcher - Restart Local Elder Care App

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Dev defaults (can be overridden by env vars)
export PORT="${PORT:-5002}"
export FLASK_ENV="${FLASK_ENV:-development}"
export USE_MINIFIED="${USE_MINIFIED:-false}"

# IDE-friendly defaults:
# - FLASK_DEBUG controls Flask debug mode
# - FLASK_USE_RELOADER controls Werkzeug reloader (spawns multiple processes; can be unstable in IDE runners)
export FLASK_DEBUG="${FLASK_DEBUG:-0}"
export FLASK_USE_RELOADER="${FLASK_USE_RELOADER:-0}"

APP_URL="http://localhost:${PORT}"
APP_URL_BUSTED="${APP_URL}/?v=$(date +%s)"

echo "📁 Project: $SCRIPT_DIR"
echo "🔄 Restarting server on: $APP_URL"
echo ""

echo "🛑 Stopping any existing server on port ${PORT}..."
if command -v lsof >/dev/null 2>&1; then
    PIDS_ON_PORT=$(lsof -ti tcp:${PORT} 2>/dev/null)
    if [ -n "$PIDS_ON_PORT" ]; then
        echo "   Found PID(s) on port ${PORT}: $PIDS_ON_PORT"
        for PID in $PIDS_ON_PORT; do
            kill "$PID" 2>/dev/null || true
        done
        sleep 1
        # Force kill if still running
        for PID in $PIDS_ON_PORT; do
            if ps -p "$PID" >/dev/null 2>&1; then
                kill -9 "$PID" 2>/dev/null || true
            fi
        done
    else
        echo "   No process found on port ${PORT}."
    fi
else
    echo "   ⚠️ lsof not found; skipping port-based stop."
fi

echo "🛑 Stopping any server.py process running from this project..."
SERVER_PIDS=$(ps aux | grep "[p]ython.*server.py" | grep "$SCRIPT_DIR" | awk '{print $2}')
if [ -n "$SERVER_PIDS" ]; then
    echo "   Found PID(s): $SERVER_PIDS"
    for PID in $SERVER_PIDS; do
        kill "$PID" 2>/dev/null || true
    done
    sleep 1
    for PID in $SERVER_PIDS; do
        if ps -p "$PID" >/dev/null 2>&1; then
            kill -9 "$PID" 2>/dev/null || true
        fi
    done
else
    echo "   No matching server.py process found."
fi

echo "🧹 Clearing lightweight caches (__pycache__ / *.pyc)..."
find "$SCRIPT_DIR" -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null
find "$SCRIPT_DIR" -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete 2>/dev/null

echo "🚀 Starting server on: $APP_URL"
echo "   Mode: ${FLASK_ENV} (debug=${FLASK_DEBUG}, reloader=${FLASK_USE_RELOADER})"
echo "   USE_MINIFIED: ${USE_MINIFIED}"
echo ""

echo "🖥️ Opening browser (cache-busting URL)..."
open "$APP_URL_BUSTED" >/dev/null 2>&1

echo "🖥️ Browser opened (or will open shortly)."
echo "🛑 Stop server: Ctrl+C"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

python3 server.py

echo ""
read -p "Press Enter to close this window..."
