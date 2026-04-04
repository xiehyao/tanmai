"""
校友关注：user_follows 表。后续资料变更通知可查询「关注某人的所有 follower_user_id」。
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_token

router = APIRouter()


def _decode_optional_token(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    if not token:
        return None
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


@router.get("/status/{followee_id}")
async def follow_status(
    followee_id: int,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    关注状态（无需登录也可查粉丝数；已登录时返回是否已关注）。
    """
    if followee_id <= 0:
        raise HTTPException(status_code=400, detail="无效的用户")

    follower_count = 0
    try:
        r = db.execute(
            text("SELECT COUNT(*) FROM user_follows WHERE followee_user_id = :fid"),
            {"fid": followee_id},
        )
        row = r.fetchone()
        follower_count = int(row[0]) if row is not None else 0
    except Exception:
        follower_count = 0

    payload = _decode_optional_token(authorization)
    following = False
    if payload and payload.get("sub"):
        try:
            uid = int(payload["sub"])
        except (TypeError, ValueError):
            uid = None
        if uid and uid != followee_id:
            try:
                r2 = db.execute(
                    text(
                        """
                        SELECT 1 FROM user_follows
                        WHERE follower_user_id = :me AND followee_user_id = :peer
                        LIMIT 1
                        """
                    ),
                    {"me": uid, "peer": followee_id},
                )
                following = r2.fetchone() is not None
            except Exception:
                following = False

    return {
        "success": True,
        "following": following,
        "follower_count": follower_count,
    }


@router.post("/{followee_id}")
async def follow_user(
    followee_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """关注某校友。"""
    try:
        follower_id = int(token.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="未登录")

    if followee_id <= 0 or follower_id <= 0:
        raise HTTPException(status_code=400, detail="无效的用户")
    if follower_id == followee_id:
        raise HTTPException(status_code=400, detail="不能关注自己")

    ex = db.execute(
        text(
            """
            SELECT 1 FROM user_follows
            WHERE follower_user_id = :a AND followee_user_id = :b
            LIMIT 1
            """
        ),
        {"a": follower_id, "b": followee_id},
    ).fetchone()
    if ex:
        return {"success": True, "already": True}

    try:
        db.execute(
            text(
                """
                INSERT INTO user_follows (follower_user_id, followee_user_id, created_at)
                VALUES (:a, :b, :ts)
                """
            ),
            {"a": follower_id, "b": followee_id, "ts": datetime.utcnow()},
        )
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="关注失败，请稍后重试")

    return {"success": True}


@router.delete("/{followee_id}")
async def unfollow_user(
    followee_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """取消关注。"""
    try:
        follower_id = int(token.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="未登录")

    if followee_id <= 0:
        raise HTTPException(status_code=400, detail="无效的用户")

    try:
        db.execute(
            text(
                """
                DELETE FROM user_follows
                WHERE follower_user_id = :a AND followee_user_id = :b
                """
            ),
            {"a": follower_id, "b": followee_id},
        )
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="取消关注失败")

    return {"success": True}
