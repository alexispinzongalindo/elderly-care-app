#!/usr/bin/env bash
set -euo pipefail

# One-command deploy wait script for Elderly Care App
# - Waits for /health to be reachable
# - Waits for /api/version to respond
# - If EXPECTED_COMMIT is available, waits until deployed commit matches

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

URL="${1:-https://elderly-care-app-t8dz.onrender.com}"
MAX_SECONDS="${MAX_SECONDS:-600}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-5}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"

if [[ -z "${EXPECTED_COMMIT}" ]]; then
  if command -v git >/dev/null 2>&1; then
    EXPECTED_COMMIT="$(git rev-parse HEAD 2>/dev/null || true)"
  fi
fi

now_epoch() { date +%s; }

echo "URL: ${URL}"
if [[ -n "${EXPECTED_COMMIT}" ]]; then
  echo "Expected commit: ${EXPECTED_COMMIT}"
else
  echo "Expected commit: (none)"
fi

echo ""

echo -n "[1/3] Checking /health "
start="$(now_epoch)"
while true; do
  if curl -fsS "${URL}/health" >/dev/null 2>&1; then
    echo "OK"
    break
  fi
  elapsed=$(( $(now_epoch) - start ))
  if (( elapsed >= MAX_SECONDS )); then
    echo "TIMEOUT"
    exit 1
  fi
  printf "."
  sleep "${INTERVAL_SECONDS}"
done

echo -n "[2/3] Checking /api/version "
start="$(now_epoch)"
version_json=""
while true; do
  if version_json="$(curl -fsS "${URL}/api/version" 2>/dev/null)"; then
    echo "OK"
    break
  fi
  elapsed=$(( $(now_epoch) - start ))
  if (( elapsed >= MAX_SECONDS )); then
    echo "TIMEOUT"
    exit 1
  fi
  printf "."
  sleep "${INTERVAL_SECONDS}"
done

running_commit="$(printf '%s' "${version_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("commit",""))')"
server_time="$(printf '%s' "${version_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("server_time_utc",""))')"

echo "Running commit: ${running_commit}"
echo "Server time:   ${server_time}"

if [[ -z "${EXPECTED_COMMIT}" ]]; then
  echo "[3/3] Commit match SKIPPED (no expected commit)"
  echo "READY ✅"
  exit 0
fi

echo -n "[3/3] Waiting for commit match "
start="$(now_epoch)"
while true; do
  if [[ "${running_commit}" == "${EXPECTED_COMMIT}" ]]; then
    echo "YES"
    echo "READY ✅"
    exit 0
  fi

  elapsed=$(( $(now_epoch) - start ))
  if (( elapsed >= MAX_SECONDS )); then
    echo "TIMEOUT"
    echo "Expected commit: ${EXPECTED_COMMIT}"
    echo "Running commit:  ${running_commit}"
    exit 1
  fi

  printf "."
  sleep "${INTERVAL_SECONDS}"

  version_json="$(curl -fsS "${URL}/api/version" 2>/dev/null || true)"
  if [[ -n "${version_json}" ]]; then
    running_commit="$(printf '%s' "${version_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("commit",""))')"
  fi
done
