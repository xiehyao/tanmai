from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()


def _display_avatar(user: User) -> Optional[str]:
    return user.selected_avatar or user.avatar


def _user_with_card(user: User, card: Optional[UserCard], db: Session) -> dict:
    from .cards import _user_card_to_dict  # 重用同一结构

    d = _user_card_to_dict(user, card)
    # 补充地址（从 user_locations 取第一条）
    try:
        r = db.execute(text("""
            SELECT address FROM user_locations
            WHERE user_id = :uid AND address IS NOT NULL AND address != ''
            ORDER BY CASE location_type WHEN 'residence' THEN 1 WHEN 'work' THEN 2 ELSE 3 END
            LIMIT 1
        """), {"uid": user.id})
        row = r.fetchone()
        if row:
            d["address"] = row[0] if isinstance(row, (tuple, list)) else getattr(row, 'address', None)
    except Exception:
        pass
    return d


@router.get("/{user_id}")
async def get_user_card(
    user_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    获取某个用户的名片信息，用于 `/pages/card` 查看他人名片。
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    card = (
        db.query(UserCard)
        .filter(UserCard.user_id == user.id)
        .order_by(UserCard.id.asc())
        .first()
    )

    return {
        "success": True,
        "data": _user_with_card(user, card, db),
    }

