from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token

router = APIRouter()


@router.post("/recharge")
async def recharge_points(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """积分充值"""
    # TODO: 实现积分充值
    return {"message": "积分充值"}

