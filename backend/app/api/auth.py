from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_token
from app.core.config import settings
from app.models.user import User

router = APIRouter()


class LoginRequest(BaseModel):
    code: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None


def _display_avatar(user: User) -> Optional[str]:
    """优先使用用户选择头像，其次微信头像。"""
    return user.selected_avatar or user.avatar


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "openid": user.openid,
        "name": user.name,
        "nickname": user.nickname,
        "avatar": _display_avatar(user),
        "wechat_avatar": user.avatar,
        "gender": user.gender,
        "wechat_id": user.wechat_id,
        "selected_avatar": user.selected_avatar,
        "is_staff": bool(user.is_staff),
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    小程序登录接口（简化版）：
    - 使用 code 作为 openid 的稳定来源（不再调用微信服务端，用于当前环境恢复功能）。
    - 首次登录创建用户，之后复用。
    """
    code = body.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="code 不能为空")

    # 简化：使用 code 映射为 openid（之前通过 wechat 服务端换取）
    openid = f"wx_{code}"

    user = db.query(User).filter(User.openid == openid).first()
    if not user:
        user = User(openid=openid)
        db.add(user)

    # 更新昵称和头像（如果前端有传）
    if body.nickname:
        user.nickname = body.nickname
    if body.avatar:
        user.avatar = body.avatar

    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    # JWT 要求 sub 为字符串，这里显式转成 str，使用时再转回 int
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )

    return {
        "success": True,
        "token": token,
        "data": _user_to_dict(user),
    }


@router.get("/me")
async def me(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """获取当前登录用户信息。"""
    user_id = token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    return {
        "success": True,
        "data": _user_to_dict(user),
    }

