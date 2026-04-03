"""
pytest  fixtures：TestClient、登录 Token
AI 可直接运行：cd tanmai/backend && pytest tests/ -v
"""
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

if not os.getenv("DATABASE_URL"):
    # 测试本地兜底：当前环境没有 MySQL 可连接时，自动切 sqlite 并创建最小表结构。
    db_file = Path(__file__).resolve().parent / ".tanmai_test.sqlite"
    os.environ["DATABASE_URL"] = f"sqlite:///{db_file}"

from sqlalchemy import text as sql_text

from app.main import app
from app.core.database import Base, engine


def _init_sqlite_test_db() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # card_entry/data 需要的原生 SQL 表（即使没有插入记录也要存在）
        conn.execute(
            sql_text(
                """
                CREATE TABLE IF NOT EXISTS user_locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    location_type TEXT,
                    address TEXT,
                    latitude REAL,
                    longitude REAL,
                    location_visibility TEXT,
                    source TEXT
                )
                """
            )
        )
        conn.execute(
            sql_text(
                """
                CREATE TABLE IF NOT EXISTS user_education (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    highest_degree TEXT,
                    primary_school TEXT,
                    primary_graduation_year INTEGER,
                    middle_school TEXT,
                    middle_graduation_year INTEGER,
                    high_school TEXT,
                    high_graduation_year INTEGER,
                    bachelor_university TEXT,
                    bachelor_major TEXT,
                    bachelor_graduation_year INTEGER,
                    master_university TEXT,
                    master_major TEXT,
                    master_graduation_year INTEGER,
                    doctor_university TEXT,
                    doctor_major TEXT,
                    doctor_graduation_year INTEGER
                )
                """
            )
        )
        conn.execute(
            sql_text(
                """
                CREATE TABLE IF NOT EXISTS user_needs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    marital_status TEXT,
                    dating_need INTEGER,
                    dating_preferences TEXT,
                    job_seeking INTEGER,
                    job_target_position TEXT,
                    job_target_industry TEXT,
                    job_preferences TEXT,
                    entrepreneurship_need INTEGER,
                    entrepreneurship_type TEXT,
                    entrepreneurship_description TEXT
                )
                """
            )
        )
        conn.execute(
            sql_text(
                """
                CREATE TABLE IF NOT EXISTS user_resources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    resource_type TEXT,
                    resource_title TEXT,
                    resource_description TEXT,
                    sharing_mode TEXT
                )
                """
            )
        )
        # 兼容旧 sqlite 文件：补充 user_cards 新列
        for stmt in (
            "ALTER TABLE user_cards ADD COLUMN avatar_photo_original_url VARCHAR(500)",
            "ALTER TABLE user_cards ADD COLUMN avatar_photo_cartoon_url VARCHAR(500)",
        ):
            try:
                conn.execute(sql_text(stmt))
            except Exception:
                pass
        conn.execute(
            sql_text(
                """
                CREATE TABLE IF NOT EXISTS user_association_info (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    willing_to_serve INTEGER,
                    contribution_types TEXT,
                    contribution_description TEXT,
                    desired_position TEXT,
                    position_preferences TEXT,
                    association_needs TEXT,
                    board_position TEXT,
                    association_positions TEXT,
                    support_offerings TEXT,
                    association_needs_detail TEXT
                )
                """
            )
        )


if os.getenv("DATABASE_URL", "").startswith("sqlite:"):
    _init_sqlite_test_db()


@pytest.fixture(autouse=True)
def _mock_wechat_jscode2session(monkeypatch):
    """单元测试不请求真实微信接口；按 code 生成稳定 mock openid。"""
    import app.api.auth as auth_mod

    async def fake_jscode2session(js_code: str) -> dict:
        return {
            "openid": f"wx_test_{js_code}",
            "session_key": "mock_session_key",
        }

    monkeypatch.setattr(auth_mod, "jscode2session", fake_jscode2session)


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
