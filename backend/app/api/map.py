import math
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """简单位置距离估算（km）"""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)
from app.core.security import verify_token
from app.models.user import User
from app.models.card import UserCard

router = APIRouter()


def _display_avatar(user: User) -> Optional[str]:
    return user.selected_avatar or user.avatar


def _friend_from_user(user: User, card: Optional[UserCard], lat: Optional[float] = None, lng: Optional[float] = None, address: Optional[str] = None) -> dict:
    """将用户+名片+位置映射为附近校友卡片结构。地图标注需要 latitude/longitude。"""
    name = (card.name if card and card.name else None) or user.name or user.nickname
    d = {
        "id": user.id,
        "user_id": user.id,
        "name": name,
        "nickname": user.nickname,
        "avatar": _display_avatar(user),
        "gender": user.gender,
        "wechat_id": user.wechat_id,
    }
    if lat is not None and lng is not None:
        d["latitude"] = lat
        d["longitude"] = lng
    if address:
        d["address"] = address
    return d


@router.get("/nearby-friends")
async def nearby_friends(
    latitude: float,
    longitude: float,
    radius: float = 50,
    all_alumni: bool = False,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    """
    附近校友列表：
    - 从 user_locations 获取经纬度，供地图展示头像/标注
    - 优先取 residence，其次 work
    """
    # 获取 alumni 用户
    rows: List[User] = (
        db.query(User)
        .filter(User.openid.like("alumni_%"))
        .order_by(User.id.asc())
        .all()
    )

    # 批量查 user_locations，优先 residence
    loc_r = db.execute(text("""
        SELECT user_id, latitude, longitude, address, location_type
        FROM user_locations
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY user_id, CASE location_type WHEN 'residence' THEN 1 WHEN 'work' THEN 2 ELSE 3 END
    """))
    loc_rows = loc_r.fetchall()
    loc_keys = list(loc_r.keys()) if hasattr(loc_r, 'keys') else []
    loc_by_user: dict[int, dict] = {}
    for row in loc_rows:
        rdict = dict(zip(loc_keys, row)) if loc_keys else (dict(row._mapping) if hasattr(row, '_mapping') else {})
        uid = rdict.get('user_id')
        if uid and uid not in loc_by_user:
            loc_by_user[uid] = rdict

    friends: List[dict] = []
    for u in rows:
        card = db.query(UserCard).filter(UserCard.user_id == u.id).order_by(UserCard.id.asc()).first()
        loc = loc_by_user.get(u.id)
        lat = float(loc['latitude']) if loc else None
        lng = float(loc['longitude']) if loc else None
        addr = loc.get('address') if loc else None
        f = _friend_from_user(u, card, lat, lng, addr)
        if lat is not None and lng is not None:
            f["distance"] = _haversine_km(latitude, longitude, lat, lng)
        friends.append(f)

    return {
        "success": True,
        "friends": friends,
    }

