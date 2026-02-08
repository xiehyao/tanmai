"""
pytest  fixtures：TestClient、登录 Token
AI 可直接运行：cd tanmai/backend && pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """FastAPI TestClient"""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """
    通过 /api/auth/login 获取真实 token，用于需要认证的请求。
    使用固定 code 保证可重复执行（同一 code 映射同一用户）。
    """
    r = client.post("/api/auth/login", json={"code": "test_pytest_001"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    assert data.get("token"), "No token in login response"
    token = data["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_id(client, auth_headers):
    """当前登录用户 ID"""
    r = client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    return r.json()["id"]
