#!/bin/bash
# 执行双人连连看库表迁移，并重启后端 uvicorn + 重载 Apache（前端反向代理）
# 用法：在 tanmai 根目录 ./scripts/deploy-pair-llm-migration-restart.sh
# 可通过环境变量覆盖数据库：MYSQL_HOST MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$ROOT/docs/sql/20260404_user_pair_llm.sql"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_USER="${MYSQL_USER:-apache}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-pengyoo123}"
MYSQL_DATABASE="${MYSQL_DATABASE:-tanmai}"

if [ ! -f "$SQL_FILE" ]; then
  echo "缺少 SQL 文件: $SQL_FILE"
  exit 1
fi

echo ">>> 应用 MySQL 迁移: $SQL_FILE -> $MYSQL_DATABASE @ $MYSQL_HOST"
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$SQL_FILE"
echo ">>> MySQL 迁移完成"

echo ">>> 重启 uvicorn (8000)"
pkill -f "uvicorn app.main:app.*8000" 2>/dev/null || true
sleep 2
cd "$ROOT/backend"
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 >> /tmp/tanmai-uvicorn.log 2>&1 &
sleep 2
if curl -s -m 5 http://127.0.0.1:8000/health | grep -q ok; then
  echo ">>> uvicorn 健康检查通过"
else
  echo ">>> 警告: uvicorn 健康检查失败，请查看 /tmp/tanmai-uvicorn.log"
fi

if command -v systemctl >/dev/null 2>&1; then
  echo ">>> 重载 Apache (httpd)"
  sudo systemctl reload httpd 2>/dev/null && echo ">>> httpd reload OK" || echo ">>> 跳过重载 httpd（无权限或非 systemd）"
fi

echo ">>> 完成"
