from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint

from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(64), unique=True, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    author_name = Column(String(100), nullable=True)
    author_subtitle = Column(String(200), nullable=True)
    author_avatar = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    images_json = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    activity_key = Column(String(32), nullable=False, default="plaza", index=True)
    enable_signup = Column(Boolean, default=False, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)


class PostSignup(Base):
    __tablename__ = "post_signups"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_signup_post_user"),)

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="confirmed")  # confirmed | pending
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)
