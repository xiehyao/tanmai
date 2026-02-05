from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()


def _display_avatar(user: User) -> Optional[str]:
    return user.selected_avatar or user.avatar


def _friend_from_user(user: User, card: Optional[UserCard]) -> dict:
    """将用户+名片映射为附近校友卡片结构。"""
    name = (card.name if card and card.name else None) or user.name or user.nickname
    return {
        "id": user.id,
        "user_id": user.id,
        "name": name,
        "nickname": user.nickname,
        "avatar": _display_avatar(user),
        "gender": user.gender,
        "wechat_id": user.wechat_id,
    }


@router.get("/nearby-friends")
async def nearby_friends(
    latitude: float,
    longitude: float,
    radius: float = 50,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    附近校友列表：
    - 目前没有真实地理位置数据，先返回所有预置校友（openid 以 alumni_ 开头）作为候选，
      让小程序首页的「附近校友」能够展示真实头像与姓名。
    """
    # 选取 openid 以 alumni_ 开头的“真实校友”，并连同名片信息
    rows: List[User] = (
        db.query(User)
        .outerjoin(UserCard, User.id == UserCard.user_id)
        .filter(User.openid.like("alumni_%"))
        .order_by(User.id.asc())
        .all()
    )

    friends: List[dict] = []
    for u in rows:
        # 找到对应名片（如果有）
        card = (
            db.query(UserCard)
            .filter(UserCard.user_id == u.id)
            .order_by(UserCard.id.asc())
            .first()
        )
        friends.append(_friend_from_user(u, card))

    return {
        "success": True,
        "friends": friends,
    }

