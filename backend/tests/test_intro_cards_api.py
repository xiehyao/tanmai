"""GET /api/intro-cards/my 与 /api/intro-cards/user/{id}"""


class TestIntroCardsMy:
    def test_my_without_token_401(self, client):
        r = client.get("/api/intro-cards/my")
        assert r.status_code == 401

    def test_my_returns_cards(self, client, auth_headers, user_id):
        r = client.get("/api/intro-cards/my", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("cards"), list)


class TestIntroCardsUser:
    def test_user_without_token_401(self, client):
        r = client.get("/api/intro-cards/user/1")
        assert r.status_code == 401

    def test_user_not_found_404(self, client, auth_headers):
        r = client.get("/api/intro-cards/user/999999999", headers=auth_headers)
        assert r.status_code == 404

    def test_user_ok(self, client, auth_headers, user_id):
        r = client.get(f"/api/intro-cards/user/{user_id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert isinstance(data.get("cards"), list)
