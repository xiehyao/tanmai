"""
关注 API：GET /api/follows/status/{id}、POST/DELETE /api/follows/{id}
"""
import pytest


@pytest.fixture
def second_user_token(client):
    """第二个登录用户（与 auth_headers 不同 openid）"""
    r = client.post("/api/auth/login", json={"code": "test_follow_peer_001"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def second_user_id(client, second_user_token):
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {second_user_token}"})
    assert r.status_code == 200
    return r.json()["id"]


class TestFollowsStatus:
    def test_status_public_count(self, client, second_user_id):
        """未登录也可查粉丝数"""
        r = client.get(f"/api/follows/status/{second_user_id}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert "follower_count" in data
        assert data.get("following") is False

    def test_follow_and_unfollow(self, client, auth_headers, second_user_id):
        """当前用户关注 / 取消另一用户"""
        r = client.post(f"/api/follows/{second_user_id}", headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("success") is True

        r = client.get(f"/api/follows/status/{second_user_id}", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert d.get("following") is True
        assert d.get("follower_count", 0) >= 1

        r = client.delete(f"/api/follows/{second_user_id}", headers=auth_headers)
        assert r.status_code == 200

        r = client.get(f"/api/follows/status/{second_user_id}", headers=auth_headers)
        assert r.json().get("following") is False

    def test_cannot_follow_self(self, client, auth_headers, user_id):
        r = client.post(f"/api/follows/{user_id}", headers=auth_headers)
        assert r.status_code == 400
