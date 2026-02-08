#!/bin/bash
# tanmai 三备份同步脚本
# 用法: ./scripts/git-sync.sh push | pull [branch]
# push: 推送到 本地Gitea + 新加坡Gitea，能连GitHub时也推
# pull:  能连GitHub则从GitHub拉，否则从新加坡拉
#
# GitHub 需配置 PAT: git remote set-url github https://xiehyao:你的PAT@github.com/xiehyao/tanmai.git

set -e
cd "$(dirname "$0")/.."
BRANCH="${2:-master}"

push_all() {
  echo ">>> Push to origin (local Gitea)..."
  git push origin "$BRANCH"
  echo ">>> Push to sgp (Singapore Gitea)..."
  git push sgp "$BRANCH"
  echo ">>> Try push to github..."
  if git push github "$BRANCH" 2>/dev/null; then
    echo "    GitHub OK"
  else
    echo "    GitHub failed (expected if blocked) - Singapore will sync when mirror configured"
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
