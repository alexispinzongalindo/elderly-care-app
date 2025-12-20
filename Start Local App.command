#!/bin/bash

# Double-clickable launcher - Start Local Elder Care App

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Dev defaults (can be overridden by env vars)
export PORT="${PORT:-5002}"
export FLASK_ENV="${FLASK_ENV:-development}"
export USE_MINIFIED="${USE_MINIFIED:-false}"

APP_URL="http://localhost:${PORT}"

echo "📁 Project: $SCRIPT_DIR"
echo "🚀 Starting server on: $APP_URL"
echo ""

# Open the browser right away (server will be ready within a second or two)
open "$APP_URL" >/dev/null 2>&1

echo "🖥️ Browser opened (or will open shortly)."
echo "🛑 Stop server: Ctrl+C"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

python3 server.py

echo ""
read -p "Press Enter to close this window..."
