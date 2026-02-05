from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token

router = APIRouter()


@router.get("/nearby-friends")
async def nearby_friends(
    latitude: float,
    longitude: float,
    radius: float = 50,
    db: Session = Depends(get_db),  # 预留，未来可接真实定位
    token: dict = Depends(verify_token),
):
    """
    附近校友列表（当前返回空列表，前端会自动用占位头像填充）。
    """
    return {
        "success": True,
        "friends": [],
    }

