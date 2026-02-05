from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean

from app.core.database import Base


class User(Base):
    """用户表（根据当前 MySQL schema 重建的最小模型）"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    openid = Column(String(64), unique=True, index=True, nullable=False)
    nickname = Column(String(100), nullable=True)
    avatar = Column(String(500), nullable=True)  # 微信头像
    work_wechat_id = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    name = Column(String(100), nullable=True)
    birth_place = Column(String(200), nullable=True)
    is_staff = Column(Boolean, default=False)
    last_updated_by = Column(Integer, nullable=True)
    last_updated_role = Column(String(20), nullable=True)
    field_source = Column(Text, nullable=True)
    gender = Column(String(20), nullable=True)
    wechat_id = Column(String(100), nullable=True)
    selected_avatar = Column(String(500), nullable=True)


