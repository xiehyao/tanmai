# tanmai 测试说明（AI 化、自动化）

## 设计原则

- **API 测试**：pytest 直接测 FastAPI，无需手动点小程序
- **CLI 流程**：关键用户流通过 CLI 脚本验证，AI 可执行
- **修改后必跑**：改 backend 后运行测试，确保不引入回归

## 1. API 测试（pytest）

```bash
cd tanmai/backend
pytest tests/ -v
```

首次需安装：`pip install pytest httpx`（若未安装）

**覆盖**：

- `GET /api/card-entry/data`：无 token 401、有 token 用当前用户、target_user_id
- `POST /api/card-entry/save-step/1`：保存 step1
- `/health` 健康检查

## 2. 流程 CLI 测试

模拟完整用户流：登录 → 拉 data → 保存 step1 → 再拉 data 验证

```bash
# 需后端已启动（uvicorn）
cd tanmai
python scripts/test_card_entry_flow_cli.py
```

或指定 API 地址：`TANMAI_API_BASE=http://localhost:8000 python scripts/test_card_entry_flow_cli.py`

## 3. 一键运行

```bash
./scripts/run_tests.sh
```

会依次执行 pytest 和 CLI 流程测试。

## 4. 新增测试

- **API 测试**：在 `backend/tests/` 新增 `test_xxx_api.py`，使用 `client`、`auth_headers` fixture
- **CLI 流程**：在 `scripts/` 新增 `test_xxx_flow_cli.py`，可被 `run_tests.sh` 调用

## 5. 规则要求

修改 `backend/` 后，应在提交前运行 `pytest tests/`，确保无回归。
