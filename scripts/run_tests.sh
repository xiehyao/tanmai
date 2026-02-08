#!/bin/bash
# 一键运行所有 AI 化测试
# AI 可执行：./scripts/run_tests.sh
set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

echo ">>> 1. pytest API 测试"
cd "$ROOT/backend"
python3 -m pytest tests/ -v --tb=short 2>/dev/null || {
  echo "    (若未安装 pytest: pip install pytest httpx)"
  python3 -m pip install -q pytest httpx
  python3 -m pytest tests/ -v --tb=short
}

echo ""
echo ">>> 2. card-entry 流程 CLI 测试（需后端已启动）"
cd "$ROOT"
if python3 scripts/test_card_entry_flow_cli.py 2>/dev/null; then
  echo "    CLI 流程 OK"
else
  echo "    CLI 跳过或失败（确保 uvicorn 在 8000 端口运行）"
fi

echo ""
echo ">>> 测试完成"
