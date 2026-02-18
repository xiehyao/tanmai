#!/bin/bash
# 守护脚本：检测 /etc/httpd/conf.d 下 pengyoo 相关配置是否被篡改，
# 若与 repo 中 canonical 不一致则告警并恢复。
# 需 root 运行，建议 crontab: */5 * * * * /var/www/html/moodle/tanmai/deploy/guard-apache-config.sh

set -e
REPO_ROOT="${REPO_ROOT:-/var/www/html/moodle}"
DEPLOY="$REPO_ROOT/tanmai/deploy/apache"
ETC="/etc/httpd/conf.d"
TAG="pengyoo-apache-guard"
ALERT=0

log_alert() {
  echo "$*" >&2
  logger -t "$TAG" "$*"
}

restore_and_reload() {
  local name="$1"
  local src="$2"
  local dst="$3"
  if [[ ! -f "$src" ]]; then
    log_alert "ALERT: canonical missing $src, skip restore"
    return 1
  fi
  log_alert "ALERT: $name changed; restoring from repo and reloading httpd"
  cp -f "$src" "$dst"
  systemctl reload httpd
}

# 检查 pengyoo-ssl.conf
if [[ -f "$ETC/pengyoo-ssl.conf" ]] && [[ -f "$DEPLOY/pengyoo-ssl.conf" ]]; then
  if ! diff -q "$DEPLOY/pengyoo-ssl.conf" "$ETC/pengyoo-ssl.conf" >/dev/null 2>&1; then
    ALERT=1
    restore_and_reload "pengyoo-ssl.conf" "$DEPLOY/pengyoo-ssl.conf" "$ETC/pengyoo-ssl.conf"
  fi
fi

# 检查 http-redirect.conf
if [[ -f "$ETC/http-redirect.conf" ]] && [[ -f "$DEPLOY/http-redirect.conf" ]]; then
  if ! diff -q "$DEPLOY/http-redirect.conf" "$ETC/http-redirect.conf" >/dev/null 2>&1; then
    ALERT=1
    restore_and_reload "http-redirect.conf" "$DEPLOY/http-redirect.conf" "$ETC/http-redirect.conf"
  fi
fi

[[ $ALERT -eq 1 ]] && exit 1
exit 0
