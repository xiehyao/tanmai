from app.models.card import UserCard
from app.models.user import User
from app.services.avatar_display import display_avatar_url


def test_display_prefers_cartoon_then_original_then_selected():
    u = User(openid="x", selected_avatar="https://preset/a.png", avatar="https://wx/q.jpg")
    c = UserCard(user_id=1)
    c.avatar_photo_original_url = "https://cos/orig.jpg"
    c.avatar_photo_cartoon_url = "https://cos/toon.jpg"
    assert display_avatar_url(u, c) == "https://cos/toon.jpg"

    c.avatar_photo_cartoon_url = None
    assert display_avatar_url(u, c) == "https://cos/orig.jpg"

    c.avatar_photo_original_url = None
    assert display_avatar_url(u, c) == "https://preset/a.png"

    assert display_avatar_url(u, None) == "https://preset/a.png"
