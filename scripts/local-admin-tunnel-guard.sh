#!/bin/bash
# 守护 SSH 隧道：本地 3307 -> 服务器 3306
# 断线自动重连，避免后台连库失败。

set -euo pipefail

TUNNEL_HOST="www.pengyoo.com"
TUNNEL_USER="root"
TUNNEL_LOCAL_PORT=3307
TUNNEL_REMOTE_HOST="127.0.0.1"
TUNNEL_REMOTE_PORT=3306

CHECK_INTERVAL=5
TUNNEL_LOG="/tmp/tanmai-ssh-tunnel.log"
GUARD_LOG="/tmp/tanmai-ssh-tunnel-guard.log"

start_tunnel() {
  nohup ssh -N \
    -L ${TUNNEL_LOCAL_PORT}:${TUNNEL_REMOTE_HOST}:${TUNNEL_REMOTE_PORT} \
    -o ExitOnForwardFailure=yes \
    -o BatchMode=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    "${TUNNEL_USER}@${TUNNEL_HOST}" >"${TUNNEL_LOG}" 2>&1 &
}

echo "[$(date '+%F %T')] guard started" >>"${GUARD_LOG}"

while true; do
  if ! lsof -iTCP:${TUNNEL_LOCAL_PORT} -sTCP:LISTEN -n -P >/dev/null 2>&1; then
    echo "[$(date '+%F %T')] tunnel down, reconnecting..." >>"${GUARD_LOG}"
    start_tunnel
    sleep 1
    if lsof -iTCP:${TUNNEL_LOCAL_PORT} -sTCP:LISTEN -n -P >/dev/null 2>&1; then
      echo "[$(date '+%F %T')] tunnel reconnected" >>"${GUARD_LOG}"
    else
      echo "[$(date '+%F %T')] reconnect failed, retry later" >>"${GUARD_LOG}"
    fi
  fi
  sleep "${CHECK_INTERVAL}"
done
