#!/bin/bash
# tanmai 三备份同步脚本
# 用法: ./scripts/git-sync.sh push | pull [branch]
# push: 推送到 本地Gitea + 新加坡Gitea，能连GitHub时也推
# pull:  能连GitHub则从GitHub拉，否则从新加坡拉
#
# GitHub 需配置 PAT: git remote set-url github https://xiehyao:你的PAT@github.com/xiehyao/tanmai.git

set -e
cd "$(dirname "$0")/.."
[ -d .git ] || { echo "Not a git repo"; exit 1; }
BRANCH="${2:-master}"

push_all() {
  echo ">>> Push to origin (local Gitea)..."
  git push origin "$BRANCH"
  echo ">>> Push to sgp (Singapore Gitea)..."
  if git remote get-url sgp >/dev/null 2>&1; then
    git push sgp "$BRANCH"
  else
    # remote 可能未配置：按 docs/SYNC_BACKUP.md 的默认路径兜底推送
    echo "    Remote 'sgp' not configured, fallback push URL..."
    git push "http://43.160.245.130:3000/root/tanmai.git" "$BRANCH" || true
  fi
  echo ">>> Try push to github..."
  if git remote get-url github >/dev/null 2>&1; then
    if git push github "$BRANCH" 2>/dev/null; then
      echo "    GitHub OK"
    else
      echo "    GitHub failed (expected if blocked) - Singapore will sync when mirror configured"
    fi
  else
    # GitHub remote 未配置时，直接按 docs 的 URL 尝试推送（可能因 PAT/网络策略失败）
    if git push "https://github.com/xiehyao/tanmai.git" "$BRANCH" 2>/dev/null; then
      echo "    GitHub OK"
    else
      echo "    GitHub failed (expected if blocked) - Singapore will sync when mirror configured"
    fi
  fi
  echo ">>> Done"
}

pull_smart() {
  echo ">>> Try pull from github..."
  if git pull github "$BRANCH" 2>/dev/null; then
    echo "    GitHub OK"
  else
    echo "    GitHub failed, pulling from sgp (Singapore)..."
    git pull sgp "$BRANCH"
  fi
  echo ">>> Done"
}

case "$1" in
  push) push_all ;;
  pull)  pull_smart ;;
  *)    echo "Usage: $0 push|pull [branch]"; exit 1 ;;
esac
