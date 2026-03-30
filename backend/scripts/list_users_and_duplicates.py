#!/usr/bin/env python3
"""
列出所有用户的 id、name，并标出重复姓名；对比指定 id 的详细来源（是否工作人员代填等）。
用法：在 backend 目录下
  PYTHONPATH=. python scripts/list_users_and_duplicates.py
"""
import sys
from collections import defaultdict
from sqlalchemy import text

sys.path.insert(0, ".")
from app.core.database import SessionLocal
from app.models.user import User


def main():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id).all()
        # 全部 id, name
        print("========== 全部用户 id / name ==========")
        by_name = defaultdict(list)
        for u in users:
            by_name[u.name or "(空)"].append(u.id)
            print(f"  id={u.id:4d}  name={u.name or '(空)'}  openid={getattr(u, 'openid', '')[:40]}...  created_at={getattr(u, 'created_at', '')}  last_updated_by={getattr(u, 'last_updated_by', '')}  last_updated_role={getattr(u, 'last_updated_role', '')}")
        # 重复姓名
        print("\n========== 重复的 name（同一姓名多条用户）==========")
        for name, ids in sorted(by_name.items(), key=lambda x: -len(x[1])):
            if len(ids) > 1:
                print(f"  「{name}」 -> user_id 列表: {ids}")
        # 对比 id=5 与 id=306 的完整信息
        print("\n========== 对比 id=5 与 id=306 详情（判断是否工作人员代填/重复）==========")
        for uid in [5, 306]:
            u = db.query(User).filter(User.id == uid).first()
            if not u:
                print(f"  id={uid} 不存在")
                continue
            print(f"\n--- user_id={uid} ---")
            print(f"  openid: {u.openid}")
            print(f"  name: {u.name}, nickname: {u.nickname}")
            print(f"  created_at: {u.created_at}, updated_at: {getattr(u, 'updated_at', None)}")
            print(f"  last_updated_by: {getattr(u, 'last_updated_by', None)}  last_updated_role: {getattr(u, 'last_updated_role', None)}")
            print(f"  field_source: {getattr(u, 'field_source', None)}")
            r = db.execute(text("SELECT id, user_id, last_updated_by, last_updated_role, field_source FROM user_cards WHERE user_id = :uid LIMIT 1"), {"uid": uid})
            row = r.fetchone()
            if row:
                keys = list(r.keys()) if hasattr(r, "keys") else []
                card = dict(zip(keys, row)) if keys else dict(row._mapping)
                print(f"  card: last_updated_by={card.get('last_updated_by')}  last_updated_role={card.get('last_updated_role')}  field_source={str(card.get('field_source', ''))[:80]}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
