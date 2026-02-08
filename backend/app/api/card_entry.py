"""
名片录入 API（card-entry）
支持工作人员代填、新增校友（create_new）等
"""
import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard
from app.core.alumni_data import (
    _get_education,
    _get_needs,
    _get_resources,
    _get_association_info,
)

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
        _save_locations(db, user.id, body.get("locations") or [], None)
        db.commit()
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
    持久化到 user_education、user_needs、user_resources、user_association_info 等表。
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
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的 JSON")

    try:
        if step == 2:
            _save_education(db, target_user_id, body)
        elif step == 3:
            _save_needs(db, target_user_id, body)
        elif step == 4:
            _save_resources(db, target_user_id, body)
        elif step == 5:
            _save_association_info(db, target_user_id, body)
        elif step == 6:
            _save_hidden_info(db, target_user_id, body)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}


def _save_education(db: Session, uid: int, b: dict) -> None:
    db.execute(text("DELETE FROM user_education WHERE user_id = :uid"), {"uid": uid})
    db.execute(
        text("""
            INSERT INTO user_education (user_id, primary_school, primary_graduation_year, middle_school,
                middle_graduation_year, high_school, high_graduation_year, bachelor_university, bachelor_major,
                bachelor_graduation_year, master_university, master_major, master_graduation_year,
                doctor_university, doctor_major, doctor_graduation_year, highest_degree)
            VALUES (:uid, :ps, :py, :ms, :my, :hs, :hy, :bu, :bm, :by, :mu, :mm, :my2, :du, :dm, :dy, :hd)
        """),
        {"uid": uid, "ps": b.get("primary_school"), "py": b.get("primary_graduation_year"),
         "ms": b.get("middle_school"), "my": b.get("middle_graduation_year"),
         "hs": b.get("high_school"), "hy": b.get("high_graduation_year"),
         "bu": b.get("bachelor_university"), "bm": b.get("bachelor_major"), "by": b.get("bachelor_graduation_year"),
         "mu": b.get("master_university"), "mm": b.get("master_major"), "my2": b.get("master_graduation_year"),
         "du": b.get("doctor_university"), "dm": b.get("doctor_major"), "dy": b.get("doctor_graduation_year"),
         "hd": b.get("highest_degree")},
    )


def _save_needs(db: Session, uid: int, b: dict) -> None:
    db.execute(
        text("""
            INSERT INTO user_needs (user_id, marital_status, dating_need, dating_preferences,
                job_seeking, job_target_position, job_target_industry, job_preferences,
                entrepreneurship_need, entrepreneurship_type, entrepreneurship_description)
            VALUES (:uid, :ms, :dn, :dp, :js, :jtp, :jti, :jp, :en, :et, :ed)
            ON DUPLICATE KEY UPDATE
                marital_status=VALUES(marital_status), dating_need=VALUES(dating_need),
                dating_preferences=VALUES(dating_preferences), job_seeking=VALUES(job_seeking),
                job_target_position=VALUES(job_target_position), job_target_industry=VALUES(job_target_industry),
                job_preferences=VALUES(job_preferences), entrepreneurship_need=VALUES(entrepreneurship_need),
                entrepreneurship_type=VALUES(entrepreneurship_type), entrepreneurship_description=VALUES(entrepreneurship_description)
        """),
        {"uid": uid, "ms": b.get("marital_status"), "dn": b.get("dating_need"), "dp": b.get("dating_preferences"),
         "js": b.get("job_seeking"), "jtp": b.get("job_target_position"), "jti": b.get("job_target_industry"),
         "jp": b.get("job_preferences"), "en": b.get("entrepreneurship_need"), "et": b.get("entrepreneurship_type"),
         "ed": b.get("entrepreneurship_description")},
    )


def _save_resources(db: Session, uid: int, b: dict) -> None:
    db.execute(text("DELETE FROM user_resources WHERE user_id = :uid"), {"uid": uid})
    for r in b.get("resources") or []:
        if not isinstance(r, dict):
            continue
        rt = r.get("resource_type") or ""
        rtitle = r.get("resource_title") or ""
        rdesc = r.get("resource_description") or ""
        sm = r.get("sharing_mode") or "free"
        if rt and rtitle:
            db.execute(
                text("INSERT INTO user_resources (user_id, resource_type, resource_title, resource_description, sharing_mode) VALUES (:uid, :rt, :rtitle, :rdesc, :sm)"),
                {"uid": uid, "rt": rt, "rtitle": rtitle, "rdesc": rdesc, "sm": sm},
            )


def _save_association_info(db: Session, uid: int, b: dict) -> None:
    ad = b.get("association_needs_detail")
    ad_json = json.dumps(ad) if isinstance(ad, (dict, list)) else None
    ap = b.get("association_positions")
    ap_json = json.dumps(ap) if isinstance(ap, list) else (json.dumps([ap]) if ap else None)
    so = b.get("support_offerings")
    so_json = json.dumps(so) if isinstance(so, list) else (json.dumps([so]) if so else None)
    db.execute(
        text("""
            INSERT INTO user_association_info (user_id, willing_to_serve, contribution_types, contribution_description,
                desired_position, position_preferences, association_needs, board_position,
                association_positions, support_offerings, association_needs_detail)
            VALUES (:uid, :wts, :ct, :cd, :dp, :pp, :an, :bp, :ap, :so, :ad)
            ON DUPLICATE KEY UPDATE
                willing_to_serve=VALUES(willing_to_serve), contribution_types=VALUES(contribution_types),
                contribution_description=VALUES(contribution_description), desired_position=VALUES(desired_position),
                position_preferences=VALUES(position_preferences), association_needs=VALUES(association_needs),
                board_position=VALUES(board_position), association_positions=VALUES(association_positions),
                support_offerings=VALUES(support_offerings), association_needs_detail=VALUES(association_needs_detail)
        """),
        {"uid": uid, "wts": int(bool(b.get("willing_to_serve"))), "ct": b.get("contribution_types"),
         "cd": b.get("contribution_description"), "dp": b.get("desired_position"),
         "pp": b.get("position_preferences"), "an": b.get("association_needs"),
         "bp": b.get("board_position"), "ap": ap_json, "so": so_json, "ad": ad_json},
    )


def _save_hidden_info(db: Session, uid: int, b: dict) -> None:
    """step6 存到 user_cards.field_source，与 step1 的 field_source 合并"""
    card = db.query(UserCard).filter(UserCard.user_id == uid).first()
    if not card:
        return
    hi = b.get("hidden_info") or {}
    fv = b.get("field_visibility") or {}
    step6_data = {"hidden_info": hi, "field_visibility": fv}
    merged: dict = {}
    if card.field_source:
        try:
            merged = json.loads(card.field_source) if isinstance(card.field_source, str) else dict(card.field_source)
        except Exception:
            pass
    if not isinstance(merged, dict):
        merged = {}
    merged["step6"] = step6_data
    card.field_source = json.dumps(merged)


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


def _get_hidden_info(db: Session, user_id: int) -> dict:
    """step6 隐藏信息，暂从 user_cards 或专用表读取，无则返回空"""
    try:
        r = db.execute(
            text("SELECT field_source FROM user_cards WHERE user_id = :uid ORDER BY id LIMIT 1"),
            {"uid": user_id},
        )
        row = r.fetchone()
        if not row:
            return {"hidden_info": {}, "field_visibility": {}}
        fs = row[0] if hasattr(row, "__getitem__") else getattr(row, "field_source", None)
        if not fs:
            return {"hidden_info": {}, "field_visibility": {}}
        data = json.loads(fs) if isinstance(fs, str) else fs
        if isinstance(data, dict) and "step6" in data:
            return data["step6"]
    except Exception:
        pass
    return {"hidden_info": {}, "field_visibility": {}}


def _get_locations(db: Session, user_id: int) -> list:
    try:
        r = db.execute(
            text("SELECT location_type, address, latitude, longitude, location_visibility, source FROM user_locations WHERE user_id = :uid ORDER BY id"),
            {"uid": user_id},
        )
        rows = r.fetchall()
        keys = list(r.keys()) if hasattr(r, "keys") else ["location_type", "address", "latitude", "longitude", "location_visibility", "source"]
        return [dict(zip(keys, row)) if keys else dict(row._mapping) for row in rows]
    except Exception:
        return []


def _build_step1_from_user_card(db: Session, user: User, card: Optional[UserCard], user_id: int) -> dict:
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
    locations = _get_locations(db, user_id)
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
        "locations": locations,
    }


@router.get("/data")
async def get_card_entry_data(
    request: Request,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """获取名片录入数据。无 target_user_id 时使用当前登录用户（普通模式填写自己名片）"""
    target_user_id = _parse_target_user_id(request)
    if not target_user_id:
        target_user_id = token.get("sub")
        if target_user_id is not None:
            try:
                target_user_id = int(target_user_id)
            except (ValueError, TypeError):
                target_user_id = None
    if not target_user_id:
        raise HTTPException(status_code=400, detail="需要 target_user_id 或已登录用户")
    user = db.query(User).filter(User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    card = (
        db.query(UserCard).filter(UserCard.user_id == target_user_id).order_by(UserCard.id.asc()).first()
    )
    step1 = _build_step1_from_user_card(db, user, card, target_user_id)
    step2 = _get_education(db, target_user_id) or {}
    step3 = _get_needs(db, target_user_id) or {}
    step4 = {"resources": _get_resources(db, target_user_id)}
    step5 = _get_association_info(db, target_user_id) or {}
    step6 = _get_hidden_info(db, target_user_id)
    return {
        "step1": step1,
        "step2": step2,
        "step3": step3,
        "step4": step4,
        "step5": step5,
        "step6": step6,
    }
