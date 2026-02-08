"""
card-entry API 自动化测试
AI 可运行：cd tanmai/backend && pytest tests/test_card_entry_api.py -v
"""
import pytest


class TestCardEntryData:
    """GET /api/card-entry/data"""

    def test_data_without_token_returns_401(self, client):
        """无 token 应返回 401"""
        r = client.get("/api/card-entry/data")
        assert r.status_code == 401

    def test_data_with_token_no_target_uses_current_user(self, client, auth_headers):
        """普通模式：无 target_user_id 时使用当前登录用户，应返回 200"""
        r = client.get("/api/card-entry/data", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "step1" in data
        assert "step2" in data
        assert "step3" in data
        assert "step4" in data
        assert "step5" in data
        assert "step6" in data

    def test_data_with_target_user_id(self, client, auth_headers, user_id):
        """传 target_user_id 时加载指定用户数据"""
        r = client.get(f"/api/card-entry/data?target_user_id={user_id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "step1" in data

    def test_data_invalid_target_user_returns_404(self, client, auth_headers):
        """不存在的 target_user_id 应返回 404"""
        r = client.get("/api/card-entry/data?target_user_id=999999999", headers=auth_headers)
        assert r.status_code == 404


class TestCardEntrySave:
    """POST /api/card-entry/save-step/*"""

    def test_save_step1_minimal(self, client, auth_headers, user_id):
        """保存 step1 最少字段"""
        r = client.post(
            f"/api/card-entry/save-step/1?target_user_id={user_id}",
            headers=auth_headers,
            json={
                "name": "测试用户",
                "nickname": "测试",
                "company": "测试公司",
            },
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_save_step1_without_target_returns_400(self, client, auth_headers):
        """无 target_user_id 且非 create_new 应返回 400"""
        r = client.post(
            "/api/card-entry/save-step/1",
            headers=auth_headers,
            json={"name": "x", "company": "y"},
        )
        assert r.status_code == 400


class TestHealth:
    """基础健康检查"""

    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"
