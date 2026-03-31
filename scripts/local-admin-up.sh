#!/bin/bash
# Mac 本地管理后台一键启动：
# 1) 保障 SSH 隧道可用（本地 3307 -> 服务器 3306）
# 2) 重启后端并固定走隧道 DB
# 3) 输出健康检查结果

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
GUARD_SCRIPT="$ROOT_DIR/scripts/local-admin-tunnel-guard.sh"

TUNNEL_HOST="www.pengyoo.com"
TUNNEL_USER="root"
TUNNEL_LOCAL_PORT=3307
TUNNEL_REMOTE_HOST="127.0.0.1"
TUNNEL_REMOTE_PORT=3306

BACKEND_PORT=8000
DB_URL="mysql+pymysql://apache:pengyoo123@127.0.0.1:${TUNNEL_LOCAL_PORT}/tanmai"

TUNNEL_LOG="/tmp/tanmai-ssh-tunnel.log"
GUARD_LOG="/tmp/tanmai-ssh-tunnel-guard.log"
UVICORN_LOG="/tmp/tanmai-uvicorn-admin-current.log"

echo ">>> [1/4] Ensure SSH tunnel on :${TUNNEL_LOCAL_PORT}"
if lsof -iTCP:${TUNNEL_LOCAL_PORT} -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "    Tunnel already listening on ${TUNNEL_LOCAL_PORT}"
else
  nohup ssh -N \
    -L ${TUNNEL_LOCAL_PORT}:${TUNNEL_REMOTE_HOST}:${TUNNEL_REMOTE_PORT} \
    -o ExitOnForwardFailure=yes \
    -o BatchMode=yes \
    "${TUNNEL_USER}@${TUNNEL_HOST}" >"${TUNNEL_LOG}" 2>&1 &
  sleep 1
  if ! lsof -iTCP:${TUNNEL_LOCAL_PORT} -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    echo "    ERROR: tunnel failed. Check log: ${TUNNEL_LOG}"
    exit 1
  fi
  echo "    Tunnel started."
fi

echo ">>> [1.5/4] Ensure tunnel auto-reconnect guard"
if pgrep -f "${GUARD_SCRIPT}" >/dev/null 2>&1; then
  echo "    Guard already running."
else
  chmod +x "${GUARD_SCRIPT}"
  nohup "${GUARD_SCRIPT}" >"${GUARD_LOG}" 2>&1 &
  sleep 1
  if pgrep -f "${GUARD_SCRIPT}" >/dev/null 2>&1; then
    echo "    Guard started."
  else
    echo "    ERROR: guard failed to start."
    exit 1
  fi
fi

echo ">>> [2/4] Restart backend on :${BACKEND_PORT}"
pids="$(lsof -tiTCP:${BACKEND_PORT} -sTCP:LISTEN -n -P 2>/dev/null || true)"
if [ -n "${pids}" ]; then
  # shellcheck disable=SC2086
  kill ${pids} 2>/dev/null || true
  sleep 1
fi

cd "${BACKEND_DIR}"
nohup env DATABASE_URL="${DB_URL}" .venv-test/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT} >"${UVICORN_LOG}" 2>&1 &
sleep 1

echo ">>> [3/4] Health check"
health="$(curl -s "http://127.0.0.1:${BACKEND_PORT}/health" || true)"
if [[ "${health}" != *"ok"* ]]; then
  echo "    ERROR: backend health check failed."
  echo "    Check log: ${UVICORN_LOG}"
  exit 1
fi
echo "    Health OK: ${health}"

echo ">>> [4/4] Done"
echo "    Admin web:  http://127.0.0.1:5174/index.html"
echo "    Backend API: http://127.0.0.1:${BACKEND_PORT}"
