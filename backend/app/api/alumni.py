from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token

router = APIRouter()


@router.get("/matched")
async def matched_alumni(
    category: str = "discover",
    db: Session = Depends(get_db),  # 预留，未来可接真实匹配
    token: dict = Depends(verify_token),
):
    """
    今日匹配校友列表（当前返回空列表，前端会自动用占位头像填充）。
    category: dating / soulmate / event / career / resource / discover
    """
    return {
        "success": True,
        "category": category,
        "list": [],
    }

