from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token

router = APIRouter()


@router.get("/realtime")
async def get_realtime_match(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """获取实时匹配结果"""
    # TODO: 实现实时匹配
    return {"message": "实时匹配"}

