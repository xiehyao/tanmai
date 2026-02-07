"""
名片录入 API（card-entry）
支持工作人员代填、新增校友（create_new）等
"""
import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()

# 允许的工作人员工号（可配置）
ALLOWED_STAFF_IDS = {"362100"}


def _require_staff(x_staff_id: Optional[str] = Header(None, alias="X-Staff-Id")) -> str:
    """校验 X-Staff-Id 头，必须是已授权工作人员"""
    if not x_staff_id or x_staff_id.strip() not in ALLOWED_STAFF_IDS:
        raise HTTPException(status_code=403, detail="需要工作人员权限")
    return x_staff_id.strip()


def _parse_target_user_id(request: Request) -> Optional[int]:
    tid = request.query_params.get("target_user_id")
    if not tid:
        return None
    try:
        return int(tid)
    except ValueError:
        return None


@router.post("/save-step/1")
async def save_step_1(
    request: Request,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
    x_staff_id: Optional[str] = Header(None, alias="X-Staff-Id"),
):
    """
    保存第一步（基础信息与名片）。
    - 若 body 含 create_new: true 且无 target_user_id：创建新用户+名片，返回 { user_id }
    - 若有 target_user_id：更新已有用户
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的 JSON")
    create_new = body.get("create_new", False)
    target_user_id = _parse_target_user_id(request)

    if create_new:
        # 工作人员新增校友：必须有 X-Staff-Id
        staff_id = _require_staff(x_staff_id)
        if target_user_id:
            raise HTTPException(status_code=400, detail="create_new 模式下不应传 target_user_id")

        name = (body.get("name") or "").strip()
        company = (body.get("company") or "").strip()
        if not name or not company:
            raise HTTPException(status_code=400, detail="请填写真实姓名和公司名称")

        openid = f"staff_created_{uuid.uuid4().hex}"
        user = User(
            openid=openid,
            name=name,
            nickname=body.get("nickname") or "",
            birth_place=body.get("birth_place") or None,
            gender=body.get("gender") or None,
            wechat_id=body.get("wechat_id") or None,
            selected_avatar=body.get("selected_avatar") or None,
            last_updated_by=None,  # 可存 staff 对应 user_id，暂不关联
            last_updated_role="staff",
            field_source=json.dumps({"name": "staff", "company": "staff"}) if body else None,
        )
        db.add(user)
        db.flush()
        card = UserCard(
            user_id=user.id,
            name=name,
            title=body.get("title") or None,
            company=company,
            phone=body.get("phone") or None,
            email=body.get("email") or None,
            bio=body.get("bio") or None,
            field_visibility=json.dumps(body.get("field_visibility") or {}),
            last_updated_by=None,
            last_updated_role="staff",
            field_source=json.dumps({"name": "staff", "company": "staff"}),
        )
        personal_photos = body.get("personal_photos")
        if isinstance(personal_photos, list):
            card.personal_photos = json.dumps(personal_photos)
        db.add(card)
        db.commit()
        db.refresh(user)
        return {"user_id": user.id}

    if not target_user_id:
        raise HTTPException(status_code=400, detail="需要 target_user_id 或 create_new")

    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    card = (
        db.query(UserCard).filter(UserCard.user_id == target_user_id).order_by(UserCard.id.asc()).first()
    )
    if not card:
        card = UserCard(user_id=target_user_id)
        db.add(card)
        db.flush()

    user.name = body.get("name") or user.name
    user.nickname = body.get("nickname") or user.nickname
    user.birth_place = body.get("birth_place") or user.birth_place
    user.gender = body.get("gender") or user.gender
    user.wechat_id = body.get("wechat_id") or user.wechat_id
    user.selected_avatar = body.get("selected_avatar") or user.selected_avatar
    card.name = body.get("name") or card.name
    card.title = body.get("title") or card.title
    card.company = body.get("company") or card.company
    card.phone = body.get("phone") or card.phone
    card.email = body.get("email") or card.email
    card.bio = body.get("bio") or card.bio
    fv = body.get("field_visibility")
    if fv is not None:
        card.field_visibility = json.dumps(fv) if isinstance(fv, dict) else str(fv)
    photos = body.get("personal_photos")
    if isinstance(photos, list):
        card.personal_photos = json.dumps(photos)
    db.commit()
    return {"ok": True}


@router.post("/save-step/{step}")
async def save_step_n(
    step: int,
    request: Request,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    保存步骤 2-6。步骤 1 由 save_step_1 处理。
    步骤 2-6 暂返回成功，后续可持久化到 user_education 等表。
    """
    if step == 1:
        raise HTTPException(status_code=404, detail="请使用 POST /save-step/1")
    target_user_id = _parse_target_user_id(request)
    if not target_user_id:
        raise HTTPException(status_code=400, detail="需要 target_user_id")
    if step < 2 or step > 6:
        raise HTTPException(status_code=400, detail="step 应为 2-6")
    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    try:
        await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的 JSON")
    return {"ok": True}


# 进度存储：使用内存 dict，生产环境建议用 Redis
_progress_store: dict[int, dict] = {}


@router.get("/progress")
async def get_progress(
    request: Request,
    token: dict = Depends(verify_token),
):
    """获取录入进度"""
    target_user_id = _parse_target_user_id(request)
    if not target_user_id:
        target_user_id = int(token.get("sub", 0))
    data = _progress_store.get(target_user_id, {"current_step": 1, "completed_steps": []})
    return data


@router.put("/progress")
async def put_progress(
    request: Request,
    token: dict = Depends(verify_token),
):
    """更新录入进度"""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的 JSON")
    target_user_id = _parse_target_user_id(request)
    if not target_user_id:
        target_user_id = int(token.get("sub", 0))
    current = body.get("current_step", 1)
    completed = body.get("completed_steps", [])
    _progress_store[target_user_id] = {"current_step": current, "completed_steps": completed}
    return {"ok": True}


def _build_step1_from_user_card(user: User, card: Optional[UserCard]) -> dict:
    fv = {}
    fs = {}
    if card and card.field_visibility:
        try:
            fv = json.loads(card.field_visibility) if isinstance(card.field_visibility, str) else card.field_visibility
        except Exception:
            pass
    if card and card.field_source:
        try:
            fs = json.loads(card.field_source) if isinstance(card.field_source, str) else card.field_source
        except Exception:
            pass
    photos = []
    if card and card.personal_photos:
        try:
            photos = json.loads(card.personal_photos) if isinstance(card.personal_photos, str) else card.personal_photos
        except Exception:
            pass
    return {
        "name": (card.name if card else None) or user.name,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "gender": user.gender,
        "wechat_id": user.wechat_id,
        "selected_avatar": user.selected_avatar,
        "personal_photos": photos,
        "birth_place": user.birth_place,
        "title": card.title if card else None,
        "company": card.company if card else None,
        "phone": card.phone if card else None,
        "email": card.email if card else None,
        "bio": card.bio if card else None,
        "field_visibility": fv,
        "field_source": fs,
        "locations": [],
    }


@router.get("/data")
async def get_card_entry_data(
    request: Request,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """获取名片录入数据（供校友详情页等使用）"""
    target_user_id = _parse_target_user_id(request)
    if not target_user_id:
        raise HTTPException(status_code=400, detail="需要 target_user_id")
    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    card = (
        db.query(UserCard).filter(UserCard.user_id == target_user_id).order_by(UserCard.id.asc()).first()
    )
    step1 = _build_step1_from_user_card(user, card)
    return {
        "step1": step1,
        "step2": {},
        "step3": {},
        "step4": {"resources": []},
        "step5": {},
        "step6": {"hidden_info": {}},
    }
