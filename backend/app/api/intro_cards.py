"""
简介卡片（intro_cards）：存于 user_cards.field_source JSON，供校友页 / intro-card 页读取。
"""
import json
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()


def _intro_cards_from_card(card: Optional[UserCard]) -> List[Any]:
    if not card or not card.field_source:
        return []
    try:
        fs = json.loads(card.field_source) if isinstance(card.field_source, str) else card.field_source
    except Exception:
        return []
    if not isinstance(fs, dict):
        return []
    ic = fs.get("intro_cards")
    return ic if isinstance(ic, list) else []


@router.get("/my")
async def get_my_intro_cards(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """当前登录用户在名片录入中保存的 intro_cards 列表。"""
    sub = token.get("sub")
    try:
        uid = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="未登录")
    card = (
        db.query(UserCard)
        .filter(UserCard.user_id == uid)
        .order_by(UserCard.id.asc())
        .first()
    )
    return {"success": True, "cards": _intro_cards_from_card(card)}


@router.get("/user/{user_id}")
async def get_user_intro_cards(
    user_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """指定用户的 intro_cards（需登录；与校友名片展示一致的数据源）。"""
    if not token.get("sub"):
        raise HTTPException(status_code=401, detail="未登录")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    card = (
        db.query(UserCard)
        .filter(UserCard.user_id == user_id)
        .order_by(UserCard.id.asc())
        .first()
    )
    return {"success": True, "cards": _intro_cards_from_card(card)}
