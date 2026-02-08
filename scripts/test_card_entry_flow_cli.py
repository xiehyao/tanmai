#!/usr/bin/env python3
"""
card-entry 完整流程 CLI 测试
模拟：登录 -> 拉取 data -> 保存 step1 -> 再次拉取 data 验证

AI 可执行：python scripts/test_card_entry_flow_cli.py
或：cd tanmai && python scripts/test_card_entry_flow_cli.py
"""
import os
import sys

# 确保能导入 backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import requests

BASE = os.getenv("TANMAI_API_BASE", "http://127.0.0.1:8000")


def main():
    print("=== card-entry 流程 CLI 测试 ===\n")
    ok = True

    # 1. 登录
    print("1. 登录...")
    r = requests.post(f"{BASE}/api/auth/login", json={"code": "test_cli_flow_001"}, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL 登录: {r.status_code} {r.text}")
        return 1
    token = r.json()["token"]
    user_id = r.json()["user"]["id"]
    print(f"   OK user_id={user_id}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET /data（无 target_user_id，普通模式）
    print("2. GET /api/card-entry/data (普通模式)...")
    r = requests.get(f"{BASE}/api/card-entry/data", headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code} {r.text}")
        ok = False
    else:
        d = r.json()
        print(f"   OK step1.name={d.get('step1', {}).get('name', '') or '(空)'}")

    # 3. 保存 step1
    print("3. POST /api/card-entry/save-step/1...")
    r = requests.post(
        f"{BASE}/api/card-entry/save-step/1?target_user_id={user_id}",
        headers=headers,
        json={
            "name": "CLI测试用户",
            "nickname": "cli",
            "company": "CLI测试公司",
        },
        timeout=10,
    )
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code} {r.text}")
        ok = False
    else:
        print("   OK")

    # 4. 再次拉取 data 验证
    print("4. 再次 GET /data 验证保存...")
    r = requests.get(f"{BASE}/api/card-entry/data", headers=headers, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code} {r.text}")
        ok = False
    else:
        name = r.json().get("step1", {}).get("name", "")
        if name == "CLI测试用户":
            print("   OK 数据已持久化")
        else:
            print(f"   FAIL 期望 name=CLI测试用户, 实际={name}")
            ok = False

    print("\n" + ("=== 全部通过 ===" if ok else "=== 有失败 ==="))
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except requests.exceptions.ConnectionError:
        print("连接失败，请确保后端已启动: cd backend && uvicorn app.main:app --port 8000")
        sys.exit(1)
    except Exception as e:
        print(f"异常: {e}")
        sys.exit(1)
