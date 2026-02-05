from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard
from app.api.cards import _user_card_to_dict

router = APIRouter()


@router.get("/matched")
async def matched_alumni(
    category: str = "discover",
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    今日匹配校友列表：
    - 暂时使用所有预置校友（openid 以 alumni_ 开头）作为候选，
      未来可按 category 进行更精细的匹配。
    - 前端只关心 id / name / nickname / avatar 等基础信息。
    """
    rows: List[User] = (
        db.query(User)
        .outerjoin(UserCard, User.id == UserCard.user_id)
        .filter(User.openid.like("alumni_%"))
        .order_by(User.id.asc())
        .all()
    )

    result: List[dict] = []
    for u in rows:
        card = (
            db.query(UserCard)
            .filter(UserCard.user_id == u.id)
            .order_by(UserCard.id.asc())
            .first()
        )
        result.append(_user_card_to_dict(u, card))

    return {
        "success": True,
        "category": category,
        "list": result,
    }

