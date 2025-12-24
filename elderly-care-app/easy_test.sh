#!/usr/bin/env bash
set -euo pipefail

# One-command local test runner for Elderly Care App
# - Restarts the local Flask server
# - Waits until /health is OK
# - Opens the app in your default browser

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-5001}"
MAX_SECONDS="${MAX_SECONDS:-30}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-1}"

echo "🔄 Restarting local server (PORT=${PORT})..."

# Stop any existing server processes
pkill -f "python3 server.py" >/dev/null 2>&1 || true

# Start server in background
export PORT
export FLASK_ENV="${FLASK_ENV:-development}"
nohup python3 server.py > server.log 2>&1 &
SERVER_PID=$!

echo "✅ Started server (PID=${SERVER_PID})"

echo -n "⏳ Waiting for http://127.0.0.1:${PORT}/health "
start_epoch="$(date +%s)"
while true; do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    echo "OK"
    break
  fi

  now_epoch="$(date +%s)"
  elapsed=$(( now_epoch - start_epoch ))
  if (( elapsed >= MAX_SECONDS )); then
    echo "TIMEOUT"
    echo "--- Last 40 lines of server.log ---"
    tail -40 server.log || true
    echo "----------------------------------"
    echo "Tip: run 'tail -f server.log' to watch logs"
    exit 1
  fi

  printf "."
  sleep "${INTERVAL_SECONDS}"
done

echo "🌐 Opening app: http://127.0.0.1:${PORT}"
open "http://127.0.0.1:${PORT}" || true

echo ""
echo "DONE."
echo "- Logs: $SCRIPT_DIR/server.log"
echo "- Stop server: pkill -f 'python3 server.py'"
