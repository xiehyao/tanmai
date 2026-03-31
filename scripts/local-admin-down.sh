#!/bin/bash
# Mac 本地管理后台一键停止：
# - 停后端 8000
# - 停本地 MySQL SSH 隧道（3307）

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GUARD_SCRIPT="$ROOT_DIR/scripts/local-admin-tunnel-guard.sh"

BACKEND_PORT=8000
TUNNEL_LOCAL_PORT=3307

echo ">>> Stop backend :${BACKEND_PORT}"
backend_pids="$(lsof -tiTCP:${BACKEND_PORT} -sTCP:LISTEN -n -P 2>/dev/null || true)"
if [ -n "${backend_pids}" ]; then
  # shellcheck disable=SC2086
  kill ${backend_pids} 2>/dev/null || true
  echo "    Killed: ${backend_pids}"
else
  echo "    No backend listener."
fi

echo ">>> Stop tunnel guard"
guard_pids="$(pgrep -f "${GUARD_SCRIPT}" || true)"
if [ -n "${guard_pids}" ]; then
  # shellcheck disable=SC2086
  kill ${guard_pids} 2>/dev/null || true
  echo "    Killed: ${guard_pids}"
else
  echo "    No tunnel guard process."
fi

echo ">>> Stop tunnel :${TUNNEL_LOCAL_PORT}"
tunnel_pids="$(lsof -tiTCP:${TUNNEL_LOCAL_PORT} -sTCP:LISTEN -n -P 2>/dev/null || true)"
if [ -n "${tunnel_pids}" ]; then
  # shellcheck disable=SC2086
  kill ${tunnel_pids} 2>/dev/null || true
  echo "    Killed: ${tunnel_pids}"
else
  echo "    No tunnel listener."
fi

echo ">>> Done"
