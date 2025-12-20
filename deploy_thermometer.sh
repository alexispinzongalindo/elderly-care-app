#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://elderly-care-app-t8dz.onrender.com}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
MAX_SECONDS="${MAX_SECONDS:-300}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-3}"

if [[ -z "${EXPECTED_COMMIT}" ]]; then
  if command -v git >/dev/null 2>&1; then
    EXPECTED_COMMIT="$(git rev-parse HEAD 2>/dev/null || true)"
  fi
fi

now_epoch() { date +%s; }

json_get() {
  python3 - <<'PY'
import json,sys
obj=json.load(sys.stdin)
key=sys.argv[1]
val=obj.get(key,"")
print(val if val is not None else "")
PY
}

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
version_json=""
start="$(now_epoch)"
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

echo -n "[3/3] Commit match "
if [[ -z "${EXPECTED_COMMIT}" ]]; then
  echo "SKIPPED (no expected commit)"
  exit 0
fi

if [[ "${running_commit}" == "${EXPECTED_COMMIT}" ]]; then
  echo "YES"
  echo "READY TO TEST ✅"
  exit 0
fi

echo -n "WAIT"
start="$(now_epoch)"
while true; do
  version_json="$(curl -fsS "${URL}/api/version" 2>/dev/null || true)"
  if [[ -n "${version_json}" ]]; then
    running_commit="$(printf '%s' "${version_json}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("commit",""))')"
    if [[ "${running_commit}" == "${EXPECTED_COMMIT}" ]]; then
      echo " -> YES"
      echo "READY TO TEST ✅"
      exit 0
    fi
  fi

  elapsed=$(( $(now_epoch) - start ))
  if (( elapsed >= MAX_SECONDS )); then
    echo " -> TIMEOUT"
    echo "Last running commit: ${running_commit}"
    exit 1
  fi

  printf "."
  sleep "${INTERVAL_SECONDS}"
done
