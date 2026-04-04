"""
名片录入 API（card-entry）
支持工作人员代填、新增校友（create_new）等
"""
import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard
from app.services.avatar_display import display_avatar_url
from app.core.alumni_data import (
    _get_education,
    _get_needs,
    _get_resources,
    _get_association_info,
)
from app.services.cos import upload_card_personal_photo_to_cos

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


def _merge_intro_cards_into_card_field_source(card: UserCard, body: dict) -> None:
    """将 body.intro_cards 合并进 user_cards.field_source（保留 step6 等已有键）。"""
    if "intro_cards" not in body:
        return
    ic = body.get("intro_cards")
    merged: dict = {}
    if card.field_source:
        try:
            merged = json.loads(card.field_source) if isinstance(card.field_source, str) else dict(card.field_source)
        except Exception:
            merged = {}
    if not isinstance(merged, dict):
        merged = {}
    if ic is None:
        merged.pop("intro_cards", None)
    else:
        merged["intro_cards"] = ic
    card.field_source = json.dumps(merged, ensure_ascii=False)


def _apply_avatar_photo_urls_from_body(card: UserCard, body: dict) -> None:
    """step1：可选写入 COS 原图与混元风格化图 URL。"""
    if "avatar_photo_original_url" in body:
        v = body.get("avatar_photo_original_url")
        card.avatar_photo_original_url = (str(v).strip() or None) if v is not None else None
    if "avatar_photo_cartoon_url" in body:
        v = body.get("avatar_photo_cartoon_url")
        card.avatar_photo_cartoon_url = (str(v).strip() or None) if v is not None else None


def _save_locations(db: Session, user_id: int, locations: list, source_default: Optional[str]) -> None:
    """用 body.locations 全量替换 user_locations（与 GET step1.locations 结构一致）。"""
    db.execute(text("DELETE FROM user_locations WHERE user_id = :uid"), {"uid": user_id})
    default_src = (source_default or "card_entry").strip() or "card_entry"
    for loc in locations or []:
        if not isinstance(loc, dict):
            continue
        addr = (loc.get("address") or "").strip()
        if not addr:
            continue
        lt = (str(loc.get("location_type") or "work")).strip() or "work"
        if len(lt) > 50:
            lt = lt[:50]
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        if lat is not None and lat != "":
            try:
                lat = float(lat)
            except (TypeError, ValueError):
                lat = None
        else:
            lat = None
        if lng is not None and lng != "":
            try:
                lng = float(lng)
            except (TypeError, ValueError):
                lng = None
        else:
            lng = None
        lv = (str(loc.get("location_visibility") or "public")).strip() or "public"
        if len(lv) > 50:
            lv = lv[:50]
        src = (str(loc.get("source") or default_src)).strip() or default_src
        if len(src) > 100:
            src = src[:100]
        db.execute(
            text(
                """
                INSERT INTO user_locations (user_id, location_type, address, latitude, longitude, location_visibility, source)
                VALUES (:uid, :lt, :addr, :lat, :lng, :lv, :src)
                """
            ),
            {"uid": user_id, "lt": lt, "addr": addr[:500], "lat": lat, "lng": lng, "lv": lv, "src": src},
        )


@router.post("/stylize-avatar-photo")
async def stylize_avatar_photo(
    request: Request,
    token: dict = Depends(verify_token),
):
    """
    将已上传到 COS 的相片 URL 经混元 ImageToImage 风格化，再上传 COS，返回 cartoon_url。
    任一步失败时 success=false，前端可仅展示原图。
    """
    if not token.get("sub"):
        raise HTTPException(status_code=401, detail="未登录")
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="无效的 JSON")
    input_url = (body.get("input_url") or "").strip()
    if not input_url:
        raise HTTPException(status_code=400, detail="需要 input_url")

    try:
        import httpx

        from app.services.cos import upload_bytes_to_cos
        from app.services.tencent_aiart import image_to_image_url

        temp_url = image_to_image_url(input_url)
        with httpx.Client(timeout=120.0) as client:
            r = client.get(temp_url)
            r.raise_for_status()
            raw = r.content
        ctype = (r.headers.get("content-type") or "").lower()
        if "png" in ctype:
            ct = "image/png"
        elif "webp" in ctype:
            ct = "image/webp"
        else:
            ct = "image/jpeg"
        uploaded = upload_bytes_to_cos(raw, ct, "avatars/aiart")
        return {"success": True, "data": {"cartoon_url": uploaded["url"]}}
    except HTTPException as he:
        return {"success": False, "detail": str(he.detail)}
    except Exception as e:
        return {"success": False, "detail": str(e)}


@router.post("/upload-photo")
async def upload_card_personal_photo(
    file: UploadFile = File(...),
    token: dict = Depends(verify_token),
):
    """编辑资料页个人相片：multipart 上传至 COS，返回公网 URL（与动态发帖 upload-image 响应结构一致）。"""
    if not token.get("sub"):
        raise HTTPException(status_code=401, detail="未登录")
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持图片文件")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="空文件")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="单张图片不能超过 10MB")
    uploaded = upload_card_personal_photo_to_cos(
        file_bytes=data,
        filename=file.filename or "",
        content_type=content_type,
    )
    return {"success": True, "data": uploaded}


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
    # 调试：观察前端是否传入 association_title / industry
    try:
        print("save_step_1 body keys:", sorted(list(body.keys())))
        if "association_title" in body:
            print("  association_title =", repr(body.get("association_title")))
        if "industry" in body:
            print("  industry =", repr(body.get("industry")))
    except Exception:
        pass
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
            association_title=body.get("association_title") or None,
            industry=body.get("industry") or None,
        )
        personal_photos = body.get("personal_photos")
        if isinstance(personal_photos, list):
            card.personal_photos = json.dumps(personal_photos)
        _apply_avatar_photo_urls_from_body(card, body)
        _merge_intro_cards_into_card_field_source(card, body)
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
    if "bio" in body:
        card.bio = body.get("bio")
    else:
        card.bio = body.get("bio") or card.bio
    card.association_title = (body.get("association_title") or "").strip() or None
    card.industry = (body.get("industry") or "").strip() or None
    fv = body.get("field_visibility")
    if fv is not None:
        card.field_visibility = json.dumps(fv) if isinstance(fv, dict) else str(fv)
    photos = body.get("personal_photos")
    if isinstance(photos, list):
        card.personal_photos = json.dumps(photos)
    _apply_avatar_photo_urls_from_body(card, body)
    _merge_intro_cards_into_card_field_source(card, body)
    _save_locations(db, target_user_id, body.get("locations") or [], None)
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


def _int_or_none(v):
    if v is None:
        return None
    if isinstance(v, int):
        return v
    try:
        return int(v) if v != "" else None
    except (TypeError, ValueError):
        return None


def _str_or_none(v):
    if v is None:
        return None
    return str(v).strip() or None


# 前端传中文（小学/初中/高中/本科/硕士/博士），DB 可能为 ENUM/短 VARCHAR，统一存英文
DEGREE_ZH_TO_EN = {
    "小学": "primary",
    "初中": "junior",
    "高中": "high_school",
    "本科": "bachelor",
    "硕士": "master",
    "博士": "doctor",
}
DEGREE_EN_TO_ZH = {v: k for k, v in DEGREE_ZH_TO_EN.items()}


def _save_education(db: Session, uid: int, b: dict) -> None:
    db.execute(text("DELETE FROM user_education WHERE user_id = :uid"), {"uid": uid})
    hd_raw = _str_or_none(b.get("highest_degree"))
    hd = DEGREE_ZH_TO_EN.get(hd_raw, hd_raw) if hd_raw else None
    params = {
        "uid": uid,
        "ps": _str_or_none(b.get("primary_school")),
        "py": _int_or_none(b.get("primary_graduation_year")),
        "ms": _str_or_none(b.get("middle_school")),
        "my": _int_or_none(b.get("middle_graduation_year")),
        "hs": _str_or_none(b.get("high_school")),
        "hy": _int_or_none(b.get("high_graduation_year")),
        "bu": _str_or_none(b.get("bachelor_university")),
        "bm": _str_or_none(b.get("bachelor_major")),
        "by": _int_or_none(b.get("bachelor_graduation_year")),
        "mu": _str_or_none(b.get("master_university")),
        "mm": _str_or_none(b.get("master_major")),
        "my2": _int_or_none(b.get("master_graduation_year")),
        "du": _str_or_none(b.get("doctor_university")),
        "dm": _str_or_none(b.get("doctor_major")),
        "dy": _int_or_none(b.get("doctor_graduation_year")),
        "hd": hd,
    }
    db.execute(
        text("""
            INSERT INTO user_education (user_id, primary_school, primary_graduation_year, middle_school,
                middle_graduation_year, high_school, high_graduation_year, bachelor_university, bachelor_major,
                bachelor_graduation_year, master_university, master_major, master_graduation_year,
                doctor_university, doctor_major, doctor_graduation_year, highest_degree)
            VALUES (:uid, :ps, :py, :ms, :my, :hs, :hy, :bu, :bm, :by, :mu, :mm, :my2, :du, :dm, :dy, :hd)
        """),
        params,
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
    card = (
        db.query(UserCard)
        .filter(UserCard.user_id == uid)
        .order_by(UserCard.id.desc())
        .first()
    )
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
    display_av = display_avatar_url(user, card)
    return {
        "name": (card.name if card else None) or user.name,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "gender": user.gender,
        "wechat_id": user.wechat_id,
        "selected_avatar": user.selected_avatar,
        "display_avatar": display_av,
        "avatar_photo_original_url": (card.avatar_photo_original_url if card else None),
        "avatar_photo_cartoon_url": (card.avatar_photo_cartoon_url if card else None),
        "personal_photos": photos,
        "birth_place": user.birth_place,
        "title": card.title if card else None,
        "company": card.company if card else None,
        "phone": card.phone if card else None,
        "email": card.email if card else None,
        "bio": card.bio if card else None,
        "association_title": card.association_title if card else None,
        "industry": card.industry if card else None,
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
    step2_raw = _get_education(db, target_user_id) or {}
    step2 = dict(step2_raw)
    if step2.get("highest_degree") and step2["highest_degree"] in DEGREE_EN_TO_ZH:
        step2["highest_degree"] = DEGREE_EN_TO_ZH[step2["highest_degree"]]
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
