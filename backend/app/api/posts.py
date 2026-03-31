import json
from datetime import datetime
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, Base, engine
from app.core.security import verify_token
from app.models.post import Post, PostSignup
from app.models.user import User

router = APIRouter()

_tables_ready = False


class CreatePostRequest(BaseModel):
    content: str
    images: list[str] = []
    location: Optional[str] = None
    activity_key: Literal["plaza", "tea", "innovation", "sport", "food"] = "plaza"
    enable_signup: bool = False


class SignupRequest(BaseModel):
    status: Literal["confirmed", "pending", "none"]


def _ensure_tables_and_seed(db: Session):
    global _tables_ready
    if not _tables_ready:
        Base.metadata.create_all(bind=engine, tables=[Post.__table__, PostSignup.__table__])
        _tables_ready = True

    defaults = [
        {
            "external_id": "mock-tea-1",
            "author_name": "于涛",
            "author_subtitle": "00通信工程",
            "author_avatar": "https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png",
            "content": "本周六下午 3 点，南山喝茶局，欢迎大家来聊近况和合作方向。",
            "images_json": json.dumps(["https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop"], ensure_ascii=False),
            "location": "深圳 南山科技园",
            "activity_key": "tea",
            "enable_signup": True,
            "like_count": 18,
            "comment_count": 3,
            "share_count": 1,
        },
        {
            "external_id": "mock-innovation-1",
            "author_name": "孟楠",
            "author_subtitle": "北邮深圳研究院",
            "author_avatar": "https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png",
            "content": "下周组织科创研学，计划参访两家 AI 创业团队，欢迎报名。",
            "images_json": json.dumps(["https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop"], ensure_ascii=False),
            "location": "深圳 南山区",
            "activity_key": "innovation",
            "enable_signup": True,
            "like_count": 26,
            "comment_count": 6,
            "share_count": 2,
        },
        {
            "external_id": "mock-sport-1",
            "author_name": "周杨",
            "author_subtitle": "12电子工程",
            "author_avatar": "https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-3.jpeg",
            "content": "周日早上 8 点深圳湾慢跑 8 公里，欢迎不同配速校友加入。",
            "images_json": json.dumps(["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&auto=format&fit=crop"], ensure_ascii=False),
            "location": "深圳湾公园",
            "activity_key": "sport",
            "enable_signup": True,
            "like_count": 33,
            "comment_count": 9,
            "share_count": 4,
        },
        {
            "external_id": "mock-food-1",
            "author_name": "李静",
            "author_subtitle": "09工商管理",
            "author_avatar": "https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-10.jpeg",
            "content": "泉州菜走起！周五晚 7 点，南山海岸城集合，欢迎带朋友。",
            "images_json": json.dumps(["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop"], ensure_ascii=False),
            "location": "深圳 海岸城",
            "activity_key": "food",
            "enable_signup": True,
            "like_count": 41,
            "comment_count": 12,
            "share_count": 6,
        },
    ]
    for item in defaults:
        exists = db.query(Post).filter(Post.external_id == item["external_id"]).first()
        if not exists:
            db.add(Post(**item))
    db.commit()


def _time_text(dt: datetime) -> str:
    now = datetime.utcnow()
    delta = now - dt
    minutes = int(delta.total_seconds() // 60)
    if minutes < 1:
        return "刚刚"
    if minutes < 60:
        return f"{minutes}分钟前"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}小时前"
    days = hours // 24
    return f"{days}天前"


def _post_to_dict(p: Post) -> dict:
    images = []
    if p.images_json:
        try:
            images = json.loads(p.images_json)
            if not isinstance(images, list):
                images = []
        except Exception:
            images = []
    pid = p.external_id or str(p.id)
    return {
        "id": pid,
        "author": {
            "id": p.user_id,
            "name": p.author_name or "校友",
            "subtitle": p.author_subtitle or "",
            "avatar": p.author_avatar,
            "followerCount": 0,
        },
        "content": p.content,
        "images": images,
        "location": p.location or "",
        "timeText": _time_text(p.created_at),
        "likeCount": p.like_count or 0,
        "commentCount": p.comment_count or 0,
        "shareCount": p.share_count or 0,
        "activityKey": p.activity_key,
        "enableSignup": bool(p.enable_signup),
    }


def _resolve_post(db: Session, post_id: str) -> Optional[Post]:
    by_external = db.query(Post).filter(Post.external_id == post_id).first()
    if by_external:
        return by_external
    if post_id.isdigit():
        return db.query(Post).filter(Post.id == int(post_id)).first()
    return None


@router.get("")
async def list_posts(
    tab: str = "plaza",
    keyword: str = "",
    db: Session = Depends(get_db),
):
    _ensure_tables_and_seed(db)
    q = db.query(Post)
    if tab and tab != "plaza":
        q = q.filter(Post.activity_key == tab)
    if keyword:
        like_kw = f"%{keyword.strip()}%"
        q = q.filter((Post.content.like(like_kw)) | (Post.location.like(like_kw)))
    rows = q.order_by(Post.created_at.desc()).all()
    return {"success": True, "list": [_post_to_dict(p) for p in rows]}


@router.post("")
async def create_post(
    body: CreatePostRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    _ensure_tables_and_seed(db)
    content = (body.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="content 不能为空")
    uid = token.get("sub")
    user = db.query(User).filter(User.id == int(uid)).first() if uid else None
    post = Post(
        user_id=user.id if user else None,
        author_name=(user.name if user and user.name else (user.nickname if user else "我")),
        author_subtitle="校友",
        author_avatar=(user.selected_avatar if user and user.selected_avatar else (user.avatar if user else None)),
        content=content,
        images_json=json.dumps(body.images or [], ensure_ascii=False),
        location=(body.location or "").strip(),
        activity_key=body.activity_key,
        enable_signup=bool(body.enable_signup),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"success": True, "data": _post_to_dict(post)}


@router.get("/{post_id}")
async def get_post(post_id: str, db: Session = Depends(get_db)):
    _ensure_tables_and_seed(db)
    post = _resolve_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="post 不存在")
    return {"success": True, "data": _post_to_dict(post)}


@router.get("/{post_id}/signups")
async def get_signups(post_id: str, db: Session = Depends(get_db)):
    _ensure_tables_and_seed(db)
    post = _resolve_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="post 不存在")
    rows = db.query(PostSignup).filter(PostSignup.post_id == post.id).order_by(PostSignup.created_at.desc()).all()
    confirmed = []
    pending = []
    for r in rows:
        u = db.query(User).filter(User.id == r.user_id).first()
        item = {
            "id": r.user_id,
            "name": (u.name if u and u.name else (u.nickname if u else "校友")),
            "avatar": (u.selected_avatar if u and u.selected_avatar else (u.avatar if u else None)),
            "status": r.status,
        }
        if r.status == "confirmed":
            confirmed.append(item)
        else:
            pending.append(item)
    return {"success": True, "confirmed": confirmed, "pending": pending}


@router.post("/{post_id}/signup")
async def signup_post(
    post_id: str,
    body: SignupRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    _ensure_tables_and_seed(db)
    post = _resolve_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="post 不存在")
    uid = token.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="未登录")
    user_id = int(uid)
    row = db.query(PostSignup).filter(PostSignup.post_id == post.id, PostSignup.user_id == user_id).first()
    if body.status == "none":
        if row:
            db.delete(row)
            db.commit()
        return {"success": True}
    if row:
        row.status = body.status
        row.updated_at = datetime.utcnow()
    else:
        db.add(PostSignup(post_id=post.id, user_id=user_id, status=body.status))
    db.commit()
    return {"success": True}
