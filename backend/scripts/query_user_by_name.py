#!/usr/bin/env python3
"""
一次性脚本：按姓名查询用户数据，重点输出社会团体（user_association_info）相关字段。
用法：在 backend 目录下执行
  PYTHONPATH=. python scripts/query_user_by_name.py 陈冬龙
"""
import json
import sys
from sqlalchemy import text
from sqlalchemy.orm import Session

# 让 app 可被导入
sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.user import User


def main():
    name = sys.argv[1].strip() if len(sys.argv) > 1 else "陈冬龙"
    db: Session = SessionLocal()
    try:
        users = db.query(User).filter(User.name == name).all()
        if not users:
            # 模糊匹配
            users = db.query(User).filter(User.name.like(f"%{name}%")).all()
        if not users:
            print(f"未找到姓名包含「{name}」的用户。")
            return
        for u in users:
            print("=" * 60)
            print(f"用户 id={u.id}  name={u.name}  nickname={u.nickname}")
            print("=" * 60)
            # user_cards
            r = db.execute(
                text("SELECT id, user_id, name, title, company, phone, email, bio, association_title, industry, field_visibility, field_source FROM user_cards WHERE user_id = :uid ORDER BY id LIMIT 1"),
                {"uid": u.id},
            )
            row = r.fetchone()
            keys = list(r.keys()) if hasattr(r, "keys") else []
            if row:
                card = dict(zip(keys, row)) if keys else dict(row._mapping)
                print("\n【user_cards 名片】")
                for k in ["name", "title", "company", "association_title", "industry", "phone", "email", "bio"]:
                    if k in card:
                        v = card[k]
                        print(f"  {k}: {repr(v)}")
                for k, v in card.items():
                    if k in ("name", "title", "company", "association_title", "industry", "phone", "email", "bio"):
                        continue
                    if v is not None and str(v).strip():
                        print(f"  {k}: {v}")
            else:
                print("\n【user_cards】无记录")
            # user_association_info（社会团体相关）
            r2 = db.execute(
                text("SELECT * FROM user_association_info WHERE user_id = :uid ORDER BY id DESC LIMIT 1"),
                {"uid": u.id},
            )
            row2 = r2.fetchone()
            keys2 = list(r2.keys()) if hasattr(r2, "keys") else []
            if row2:
                assoc = dict(zip(keys2, row2)) if keys2 else dict(row2._mapping)
                print("\n【user_association_info 社会团体/校友会】")
                for k, v in assoc.items():
                    if k == "id":
                        continue
                    if v is not None and str(v).strip():
                        if k in ("association_positions", "support_offerings", "association_needs_detail") and isinstance(v, str):
                            try:
                                v = json.loads(v)
                            except Exception:
                                pass
                        print(f"  {k}: {v}")
            else:
                print("\n【user_association_info】无记录")
            print()
    finally:
        db.close()


if __name__ == "__main__":
    main()
