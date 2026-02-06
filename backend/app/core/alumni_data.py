"""
校友完整数据获取（含隐藏字段，供 AI 匹配用）
仅用于 assistant 内部，严禁在输出中暴露隐私字段。
"""
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.user import User
from app.models.card import UserCard


def _row_to_dict(row, keys) -> dict:
    if row is None:
        return {}
    if hasattr(row, "_mapping"):
        return dict(row._mapping)
    return dict(zip(keys, row)) if keys else {}


def _get_education(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    try:
        r = db.execute(
            text("SELECT * FROM user_education WHERE user_id = :uid ORDER BY id DESC LIMIT 1"),
            {"uid": user_id}
        )
        row = r.fetchone()
        if not row:
            return None
        return _row_to_dict(row, list(r.keys()))
    except Exception:
        return None


def _get_needs(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    try:
        r = db.execute(
            text("SELECT * FROM user_needs WHERE user_id = :uid ORDER BY id DESC LIMIT 1"),
            {"uid": user_id}
        )
        row = r.fetchone()
        if not row:
            return None
        return _row_to_dict(row, list(r.keys()))
    except Exception:
        return None


def _get_resources(db: Session, user_id: int) -> List[Dict[str, Any]]:
    try:
        r = db.execute(
            text("""
                SELECT resource_type, resource_title, resource_description, sharing_mode
                FROM user_resources WHERE user_id = :uid
            """),
            {"uid": user_id}
        )
        rows = r.fetchall()
        keys = list(r.keys())
        return [_row_to_dict(row, keys) for row in rows]
    except Exception:
        return []


def _get_association_info(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    try:
        r = db.execute(
            text("SELECT * FROM user_association_info WHERE user_id = :uid ORDER BY id DESC LIMIT 1"),
            {"uid": user_id}
        )
        row = r.fetchone()
        if not row:
            return None
        return _row_to_dict(row, list(r.keys()))
    except Exception:
        return None


def _user_to_dict(u: User, card: Optional[UserCard]) -> Dict[str, Any]:
    """完整用户数据（含隐私字段，供 AI 匹配）"""
    d: Dict[str, Any] = {
        "id": u.id,
        "name": u.name or u.nickname,
        "nickname": u.nickname,
        "gender": u.gender,
        "birth_place": u.birth_place,
        "title": None,
        "company": None,
        "phone": None,
        "email": None,
        "wechat_id": u.wechat_id,
        "bio": None,
        "education": {},
        "needs": {},
        "resources": [],
        "association": {},
    }
    if card:
        d["title"] = card.title
        d["company"] = card.company
        d["phone"] = card.phone
        d["email"] = card.email
        d["bio"] = card.bio
    return d


def fetch_full_alumni(db: Session) -> List[Dict[str, Any]]:
    """
    获取全部校友的完整数据（含隐藏信息），供 AI 匹配推荐。
    返回结构便于 LLM 解析，格式为可读的文本块。
    """
    rows: List[User] = (
        db.query(User)
        .outerjoin(UserCard, User.id == UserCard.user_id)
        .filter(User.openid.like("alumni_%"))
        .order_by(User.id.asc())
        .all()
    )

    result: List[Dict[str, Any]] = []
    for u in rows:
        card = (
            db.query(UserCard)
            .filter(UserCard.user_id == u.id)
            .order_by(UserCard.id.asc())
            .first()
        )
        item = _user_to_dict(u, card)
        item["education"] = _get_education(db, u.id) or {}
        item["needs"] = _get_needs(db, u.id) or {}
        item["resources"] = _get_resources(db, u.id)
        item["association"] = _get_association_info(db, u.id) or {}
        result.append(item)

    return result


def format_alumni_for_llm(
    alumni_list: List[Dict[str, Any]],
    max_chars: int = 25000,
    include_hidden: bool = True,
) -> str:
    """
    将校友数据格式化为 LLM 可用的文本块。
    include_hidden=False 时剔除：电话、邮箱、微信ID、出生地、校友会敏感信息等。
    """
    lines: List[str] = []
    for a in alumni_list:
        parts: List[str] = []
        parts.append(f"[id={a.get('id')}] 姓名:{a.get('name') or ''} 昵称:{a.get('nickname') or ''}")
        if a.get("gender"):
            parts.append(f"性别:{a['gender']}")
        if include_hidden and a.get("birth_place"):
            parts.append(f"出生地:{a['birth_place']}")
        if a.get("title"):
            parts.append(f"职位:{a['title']}")
        if a.get("company"):
            parts.append(f"公司:{a['company']}")
        if include_hidden and a.get("phone"):
            parts.append(f"电话:{a['phone']}")
        if include_hidden and a.get("email"):
            parts.append(f"邮箱:{a['email']}")
        if include_hidden and a.get("wechat_id"):
            parts.append(f"微信:{a['wechat_id']}")
        if a.get("bio"):
            parts.append(f"简介:{a['bio'][:200]}")

        ed = a.get("education") or {}
        ed_parts = []
        if ed.get("high_school") or ed.get("high_graduation_year"):
            ed_parts.append(f"高中:{ed.get('high_school','')} {ed.get('high_graduation_year','')}届")
        if ed.get("bachelor_university") or ed.get("bachelor_graduation_year"):
            ed_parts.append(f"本科:{ed.get('bachelor_university','')} {ed.get('bachelor_graduation_year','')}届 {ed.get('bachelor_major','')}")
        if ed.get("master_university") or ed.get("master_graduation_year"):
            ed_parts.append(f"硕士:{ed.get('master_university','')} {ed.get('master_graduation_year','')}届 {ed.get('master_major','')}")
        if ed_parts:
            parts.append("教育:" + " ".join(ed_parts))

        needs = a.get("needs") or {}
        need_parts = []
        # 婚姻状况与脱单需求（脱单模式必备；未填写时显式标注）
        ms = needs.get("marital_status") if needs else None
        dn = needs.get("dating_need") if needs else None
        if ms:
            need_parts.append(f"婚姻状况:{ms}")
        else:
            need_parts.append("婚姻状况:未填写")
        if dn is not None and dn != 0:
            need_parts.append("有脱单需求")
        elif dn == 0:
            need_parts.append("无脱单需求")
        else:
            need_parts.append("脱单需求:未填写")
        if needs.get("dating_preferences"):
            need_parts.append(f"脱单偏好:{needs['dating_preferences'][:80]}")
        if needs.get("job_seeking"):
            need_parts.append("求职")
        if needs.get("job_target_position"):
            need_parts.append(f"目标职位:{needs['job_target_position']}")
        if needs.get("entrepreneurship_need"):
            need_parts.append("创业需求")
        if needs.get("entrepreneurship_description"):
            need_parts.append(needs["entrepreneurship_description"][:100])
        if need_parts:
            parts.append("需求:" + " ".join(need_parts))

        ress = a.get("resources") or []
        if ress:
            titles = [r.get("resource_title", "") for r in ress if r.get("resource_title")]
            if titles:
                parts.append("资源:" + " ".join(titles[:5]))

        assoc = a.get("association") or {}
        if include_hidden and assoc.get("association_needs"):
            parts.append(f"校友会需求:{assoc['association_needs'][:80]}")

        lines.append(" | ".join(p for p in parts if p))

    text_block = "\n".join(lines)
    if len(text_block) > max_chars:
        text_block = text_block[:max_chars] + "\n...[已截断]"
    return text_block
