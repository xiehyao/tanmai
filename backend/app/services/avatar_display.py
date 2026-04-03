from typing import Optional

from app.models.card import UserCard
from app.models.user import User


def display_avatar_url(user: User, card: Optional[UserCard]) -> Optional[str]:
    if card is not None:
        c = (getattr(card, "avatar_photo_cartoon_url", None) or "").strip()
        if c:
            return c
        o = (getattr(card, "avatar_photo_original_url", None) or "").strip()
        if o:
            return o
    if user.selected_avatar:
        return user.selected_avatar
    return user.avatar
