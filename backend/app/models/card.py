from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base


class UserCard(Base):
    """用户名片表（根据当前 MySQL schema 重建的最小模型）"""

    __tablename__ = "user_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=True)
    title = Column(String(200), nullable=True)
    company = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    qr_code = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    field_visibility = Column(Text, nullable=True)
    last_updated_by = Column(Integer, nullable=True)
    last_updated_role = Column(String(20), nullable=True)
    field_source = Column(Text, nullable=True)
    personal_photos = Column(Text, nullable=True)  # JSON 字符串


