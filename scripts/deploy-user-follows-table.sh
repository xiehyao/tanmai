#!/bin/bash
# 在服务器 MySQL 上创建 user_follows 表（关注功能）。可重复执行（CREATE TABLE IF NOT EXISTS）。
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/docs/sql/20260405_user_follows.sql"
[ -f "$SQL" ] || { echo "Missing $SQL"; exit 1; }
# 与 backend/app/core/config.py 默认一致；生产请用环境变量或 .env
: "${MYSQL_USER:=apache}"
: "${MYSQL_PWD:=pengyoo123}"
: "${MYSQL_DB:=tanmai}"
export MYSQL_PWD
mysql -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" -u "$MYSQL_USER" "$MYSQL_DB" < "$SQL"
echo "OK: user_follows table ensured."
