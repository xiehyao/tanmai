import json
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()


def _display_avatar(user: User) -> Optional[str]:
    return user.selected_avatar or user.avatar


def _user_card_to_dict(user: User, card: Optional[UserCard]) -> dict:
    """将用户 + 名片合并为前端需要的结构。"""
    personal_photos = []
    if card and card.personal_photos:
        try:
            personal_photos = json.loads(card.personal_photos)
        except Exception:
            personal_photos = []

    return {
        "id": user.id,
        "user_id": user.id,
        "name": card.name if card and card.name else (user.name or user.nickname),
        "nickname": user.nickname,
        "title": card.title if card else None,
        "company": card.company if card else None,
        "phone": card.phone if card else None,
        "email": card.email if card else None,
        "bio": card.bio if card else None,
        "avatar": _display_avatar(user),
        "wechat_avatar": user.avatar,
        "gender": user.gender,
        "wechat_id": user.wechat_id,
        "selected_avatar": user.selected_avatar,
        "personal_photos": personal_photos,
    }


@router.get("/my")
async def get_my_card(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    获取当前用户的名片信息。
    - 合并 users + user_cards 表字段
    - 返回结构供 `/pages/profile`、`/pages/card`、`/pages/alumni-link` 使用
    """
    user_id_raw = token.get("sub")
    try:
        user_id = int(user_id_raw)
    except (TypeError, ValueError):
        return {"success": False, "error": "无效的用户令牌"}
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"success": False, "error": "用户不存在"}

    card = (
        db.query(UserCard)
        .filter(UserCard.user_id == user.id)
        .order_by(UserCard.id.asc())
        .first()
    )

    return {
        "success": True,
        "data": _user_card_to_dict(user, card),
    }

