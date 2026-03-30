"""
管理后台（Web Admin）API
用于展示/新增/编辑/删除数据库相关数据。
当前实现 MVP：管理 users、user_cards、以及 alumni（users.openid 以 alumni_ 开头）。
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.card import UserCard
from app.models.user import User

router = APIRouter()


def _paginate(page: int, page_size: int) -> Dict[str, int]:
    page = max(1, int(page))
    page_size = min(100, max(1, int(page_size)))
    return {"page": page, "page_size": page_size, "offset": (page - 1) * page_size}


def _parse_json_maybe(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return None
        try:
            return json.loads(s)
        except Exception:
            return v
    return v


def _user_card_to_item(user: User, card: Optional[UserCard]) -> dict:
    # personal_photos/field_visibility 可能为 JSON 字符串或实际结构（取决于上次写入方式）
    personal_photos = []
    if card and card.personal_photos:
        try:
            personal_photos = json.loads(card.personal_photos) if isinstance(card.personal_photos, str) else card.personal_photos
        except Exception:
            personal_photos = []

    return {
        "id": user.id,
        "openid": user.openid,
        "name": user.name,
        "nickname": user.nickname,
        "avatar": user.selected_avatar or user.avatar,
        "wechat_id": user.wechat_id,
        "birth_place": user.birth_place,
        "gender": user.gender,
        "is_staff": bool(user.is_staff),
        "created_at": user.created_at.isoformat() if isinstance(user.created_at, datetime) else user.created_at,
        "updated_at": user.updated_at.isoformat() if isinstance(user.updated_at, datetime) else user.updated_at,
        "card": {
            "id": card.id if card else None,
            "user_id": user.id,
            "name": card.name if card else None,
            "title": card.title if card else None,
            "company": card.company if card else None,
            "phone": card.phone if card else None,
            "email": card.email if card else None,
            "bio": card.bio if card else None,
            "industry": card.industry if card else None,
            "association_title": card.association_title if card else None,
            "personal_photos": personal_photos,
        },
    }


def _get_first_card(db: Session, user_id: int) -> Optional[UserCard]:
    return (
        db.query(UserCard)
        .filter(UserCard.user_id == user_id)
        .order_by(UserCard.id.asc())
        .first()
    )


class AdminLoginRequired(BaseModel):
    # 占位：仅为了让接口文档更清晰
    pass


class UserCardPayload(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    association_title: Optional[str] = None
    personal_photos: Optional[Any] = None  # list or string(JSON)
    field_visibility: Optional[Any] = None  # dict(JSON)


class UserPayload(BaseModel):
    openid: Optional[str] = None
    name: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    selected_avatar: Optional[str] = None
    work_wechat_id: Optional[str] = None
    gender: Optional[str] = None
    birth_place: Optional[str] = None
    wechat_id: Optional[str] = None
    is_staff: Optional[bool] = None


class UserUpsertRequest(BaseModel):
    user: UserPayload
    card: Optional[UserCardPayload] = None


class CardUpsertRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    payload: UserCardPayload


def _apply_user_patch(u: User, payload: UserPayload) -> None:
    # openid 不允许直接修改（用 id 作为主键更安全）
    if payload.name is not None:
        u.name = payload.name
    if payload.nickname is not None:
        u.nickname = payload.nickname
    if payload.avatar is not None:
        u.avatar = payload.avatar
    if payload.selected_avatar is not None:
        u.selected_avatar = payload.selected_avatar
    if payload.work_wechat_id is not None:
        u.work_wechat_id = payload.work_wechat_id
    if payload.gender is not None:
        u.gender = payload.gender
    if payload.birth_place is not None:
        u.birth_place = payload.birth_place
    if payload.wechat_id is not None:
        u.wechat_id = payload.wechat_id
    if payload.is_staff is not None:
        u.is_staff = bool(payload.is_staff)


def _apply_card_patch(card: UserCard, payload: UserCardPayload) -> None:
    if payload.name is not None:
        card.name = payload.name
    if payload.title is not None:
        card.title = payload.title
    if payload.company is not None:
        card.company = payload.company
    if payload.phone is not None:
        card.phone = payload.phone
    if payload.email is not None:
        card.email = payload.email
    if payload.bio is not None:
        card.bio = payload.bio
    if payload.industry is not None:
        card.industry = payload.industry
    if payload.association_title is not None:
        card.association_title = payload.association_title

    # JSON 字段：允许 list/dict 直接传入，或传 JSON 字符串
    if payload.personal_photos is not None:
        pp = _parse_json_maybe(payload.personal_photos)
        card.personal_photos = json.dumps(pp) if pp is not None else None

    if payload.field_visibility is not None:
        fv = _parse_json_maybe(payload.field_visibility)
        card.field_visibility = json.dumps(fv) if fv is not None else None


@router.get("/users")
async def admin_list_users(
    keyword: str = Query(default="", description="搜索姓名/昵称/公司"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    kw = (keyword or "").strip()
    total_q = db.query(User)
    if kw:
        card = UserCard
        total_q = total_q.outerjoin(card, User.id == card.user_id).filter(
            or_(
                User.name.like(f"%{kw}%"),
                User.nickname.like(f"%{kw}%"),
                card.company.like(f"%{kw}%"),
            )
        )
    total = total_q.count()

    pag = _paginate(page, page_size)
    q = db.query(User).order_by(User.id.desc())
    if kw:
        q = (
            q.outerjoin(UserCard, User.id == UserCard.user_id)
            .filter(
                or_(
                    User.name.like(f"%{kw}%"),
                    User.nickname.like(f"%{kw}%"),
                    UserCard.company.like(f"%{kw}%"),
                )
            )
        )
    rows = q.offset(pag["offset"]).limit(pag["page_size"]).all()

    items: List[dict] = []
    for u in rows:
        c = _get_first_card(db, u.id)
        items.append(_user_card_to_item(u, c))

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": pag["page"],
            "page_size": pag["page_size"],
        },
    }


@router.post("/users")
async def admin_create_user(
    body: UserUpsertRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    payload = body.user
    openid = (payload.openid or "").strip()
    if not openid:
        openid = f"user_{uuid.uuid4().hex}"

    exists = db.query(User).filter(User.openid == openid).first()
    if exists:
        raise HTTPException(status_code=400, detail="openid 已存在")

    u = User(
        openid=openid,
        name=payload.name,
        nickname=payload.nickname,
        avatar=payload.avatar,
        selected_avatar=payload.selected_avatar,
        work_wechat_id=payload.work_wechat_id,
        gender=payload.gender,
        birth_place=payload.birth_place,
        wechat_id=payload.wechat_id,
        is_staff=bool(payload.is_staff) if payload.is_staff is not None else False,
        last_updated_by=None,
        last_updated_role=None,
        field_source=None,
    )
    db.add(u)
    db.flush()

    c_payload = body.card
    card_obj: Optional[UserCard] = None
    if c_payload:
        card_obj = UserCard(user_id=u.id)
        db.add(card_obj)
        db.flush()
        _apply_card_patch(card_obj, c_payload)

    db.commit()
    db.refresh(u)
    return {"success": True, "data": _user_card_to_item(u, card_obj)}


@router.put("/users/{user_id}")
async def admin_update_user(
    user_id: int,
    body: UserUpsertRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="用户不存在")

    _apply_user_patch(u, body.user)

    if body.card is not None:
        card_obj = _get_first_card(db, u.id)
        if not card_obj:
            card_obj = UserCard(user_id=u.id)
            db.add(card_obj)
            db.flush()
        _apply_card_patch(card_obj, body.card)

    db.commit()
    card_obj = _get_first_card(db, u.id)
    return {"success": True, "data": _user_card_to_item(u, card_obj)}


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 删除子表再删 users，尽量避免外键约束阻塞
    tables = [
        "user_education",
        "user_needs",
        "user_resources",
        "user_association_info",
        "user_locations",
        "user_cards",
    ]
    try:
        for table in tables:
            try:
                db.execute(text(f"DELETE FROM {table} WHERE user_id = :uid"), {"uid": user_id})
            except Exception:
                # 子表可能不存在（不同环境/历史版本），允许跳过
                pass
        db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": {"deleted_user_id": user_id}}


# ------------------ Cards ------------------


@router.get("/cards")
async def admin_list_cards(
    keyword: str = Query(default="", description="搜索姓名/昵称/名片标题/公司"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    kw = (keyword or "").strip()

    pag = _paginate(page, page_size)

    q = db.query(UserCard).order_by(UserCard.id.desc())
    if kw:
        q = (
            q.join(User, User.id == UserCard.user_id, isouter=True)
            .filter(
                or_(
                    User.name.like(f"%{kw}%"),
                    User.nickname.like(f"%{kw}%"),
                    UserCard.title.like(f"%{kw}%"),
                    UserCard.company.like(f"%{kw}%"),
                )
            )
        )

    rows = q.offset(pag["offset"]).limit(pag["page_size"]).all()
    total_q = db.query(UserCard)
    if kw:
        total_q = (
            total_q.join(User, User.id == UserCard.user_id, isouter=True)
            .filter(
                or_(
                    User.name.like(f"%{kw}%"),
                    User.nickname.like(f"%{kw}%"),
                    UserCard.title.like(f"%{kw}%"),
                    UserCard.company.like(f"%{kw}%"),
                )
            )
        )
    total = total_q.count()

    items: List[dict] = []
    for c in rows:
        u = db.query(User).filter(User.id == c.user_id).first()
        personal_photos: list = []
        if c.personal_photos:
            try:
                personal_photos = (
                    json.loads(c.personal_photos)
                    if isinstance(c.personal_photos, str)
                    else c.personal_photos
                )
            except Exception:
                personal_photos = []
        items.append(
            {
                "id": c.id,
                "user_id": c.user_id,
                "name": (c.name if c.name else (u.name if u else None)) or (u.nickname if u else None),
                "nickname": u.nickname if u else None,
                "title": c.title,
                "company": c.company,
                "phone": c.phone,
                "email": c.email,
                "bio": c.bio,
                "industry": c.industry,
                "association_title": c.association_title,
                "personal_photos": personal_photos,
                "created_at": c.created_at.isoformat() if isinstance(c.created_at, datetime) else c.created_at,
                "updated_at": c.updated_at.isoformat() if isinstance(c.updated_at, datetime) else c.updated_at,
            }
        )

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": pag["page"],
            "page_size": pag["page_size"],
        },
    }


@router.post("/cards")
async def admin_upsert_card(
    body: CardUpsertRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    u = db.query(User).filter(User.id == body.user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="user_id 对应用户不存在")

    card_obj = _get_first_card(db, body.user_id)
    created = False
    if not card_obj:
        card_obj = UserCard(user_id=body.user_id)
        db.add(card_obj)
        created = True
        db.flush()

    _apply_card_patch(card_obj, body.payload)
    db.commit()

    db.refresh(card_obj)
    return {"success": True, "data": {"card_id": card_obj.id, "created": created}}


@router.put("/cards/{card_id}")
async def admin_update_card(
    card_id: int,
    body: UserCardPayload,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    card_obj = db.query(UserCard).filter(UserCard.id == card_id).first()
    if not card_obj:
        raise HTTPException(status_code=404, detail="名片不存在")
    _apply_card_patch(card_obj, body)
    db.commit()
    return {"success": True, "data": {"card_id": card_id}}


@router.delete("/cards/{card_id}")
async def admin_delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    card_obj = db.query(UserCard).filter(UserCard.id == card_id).first()
    if not card_obj:
        raise HTTPException(status_code=404, detail="名片不存在")
    db.delete(card_obj)
    db.commit()
    return {"success": True, "data": {"deleted_card_id": card_id}}


# ------------------ Alumni ------------------


class AlumniUpsertRequest(UserUpsertRequest):
    # 复用同样结构，只是让服务端默认 openid alumni_ 前缀
    pass


@router.get("/alumni")
async def admin_list_alumni(
    keyword: str = Query(default="", description="搜索姓名/昵称/公司"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    kw = (keyword or "").strip()
    pag = _paginate(page, page_size)

    total_q = db.query(User).filter(User.openid.like("alumni_%"))
    if kw:
        total_q = total_q.outerjoin(UserCard, User.id == UserCard.user_id).filter(
            or_(
                User.name.like(f"%{kw}%"),
                User.nickname.like(f"%{kw}%"),
                UserCard.company.like(f"%{kw}%"),
            )
        )
    total = total_q.count()

    q = db.query(User).filter(User.openid.like("alumni_%")).order_by(User.id.desc())
    if kw:
        q = (
            q.outerjoin(UserCard, User.id == UserCard.user_id)
            .filter(
                or_(
                    User.name.like(f"%{kw}%"),
                    User.nickname.like(f"%{kw}%"),
                    UserCard.company.like(f"%{kw}%"),
                )
            )
        )
    rows = q.offset(pag["offset"]).limit(pag["page_size"]).all()

    items: List[dict] = []
    for u in rows:
        c = _get_first_card(db, u.id)
        items.append(_user_card_to_item(u, c))

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": pag["page"],
            "page_size": pag["page_size"],
        },
    }


@router.post("/alumni")
async def admin_create_alumni(
    body: AlumniUpsertRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    payload = body.user
    openid = (payload.openid or "").strip()
    if not openid:
        openid = f"alumni_{uuid.uuid4().hex}"
    if not openid.startswith("alumni_"):
        openid = f"alumni_{openid}"

    exists = db.query(User).filter(User.openid == openid).first()
    if exists:
        raise HTTPException(status_code=400, detail="openid 已存在")

    u = User(
        openid=openid,
        name=payload.name,
        nickname=payload.nickname,
        avatar=payload.avatar,
        selected_avatar=payload.selected_avatar,
        work_wechat_id=payload.work_wechat_id,
        gender=payload.gender,
        birth_place=payload.birth_place,
        wechat_id=payload.wechat_id,
        is_staff=bool(payload.is_staff) if payload.is_staff is not None else False,
        last_updated_by=None,
        last_updated_role=None,
        field_source=None,
    )
    db.add(u)
    db.flush()

    card_obj: Optional[UserCard] = None
    if body.card is not None:
        card_obj = UserCard(user_id=u.id)
        db.add(card_obj)
        db.flush()
        _apply_card_patch(card_obj, body.card)

    db.commit()
    db.refresh(u)
    return {"success": True, "data": _user_card_to_item(u, card_obj)}


@router.put("/alumni/{user_id}")
async def admin_update_alumni(
    user_id: int,
    body: AlumniUpsertRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="用户不存在")
    if not u.openid.startswith("alumni_"):
        raise HTTPException(status_code=400, detail="该用户不是校友（openid 非 alumni_ 前缀）")

    _apply_user_patch(u, body.user)
    if body.card is not None:
        card_obj = _get_first_card(db, u.id)
        if not card_obj:
            card_obj = UserCard(user_id=u.id)
            db.add(card_obj)
            db.flush()
        _apply_card_patch(card_obj, body.card)
    db.commit()

    card_obj = _get_first_card(db, u.id)
    return {"success": True, "data": _user_card_to_item(u, card_obj)}


@router.delete("/alumni/{user_id}")
async def admin_delete_alumni(
    user_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="用户不存在")
    if not u.openid.startswith("alumni_"):
        raise HTTPException(status_code=400, detail="该用户不是校友（openid 非 alumni_ 前缀）")

    tables = [
        "user_education",
        "user_needs",
        "user_resources",
        "user_association_info",
        "user_locations",
        "user_cards",
    ]
    try:
        for table in tables:
            try:
                db.execute(text(f"DELETE FROM {table} WHERE user_id = :uid"), {"uid": user_id})
            except Exception:
                pass
        db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": {"deleted_user_id": user_id}}

