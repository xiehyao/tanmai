#!/usr/bin/env python3
"""
删除指定 user id 及其关联数据（先删子表再删 users）。
用法：在 backend 目录下
  PYTHONPATH=. python scripts/delete_user_by_id.py 306
"""
import sys
from sqlalchemy import text

sys.path.insert(0, ".")
from app.core.database import SessionLocal
from app.models.user import User


def main():
    uid = int(sys.argv[1].strip()) if len(sys.argv) > 1 else None
    if not uid or uid < 1:
        print("用法: python scripts/delete_user_by_id.py <user_id>")
        sys.exit(1)
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            print(f"用户 id={uid} 不存在，无需删除。")
            return
        name = u.name or u.nickname or "(无姓名)"
        # 按外键依赖顺序删除子表
        tables = [
            "user_education",
            "user_needs",
            "user_resources",
            "user_association_info",
            "user_locations",
            "user_cards",
        ]
        for table in tables:
            try:
                r = db.execute(text(f"DELETE FROM {table} WHERE user_id = :uid"), {"uid": uid})
                n = r.rowcount
                if n:
                    print(f"  已删 {table}: {n} 条")
            except Exception as e:
                print(f"  {table} 跳过或不存在: {e}")
        db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": uid})
        db.commit()
        print(f"已删除用户 id={uid}（{name}）及其关联数据。")
    except Exception as e:
        db.rollback()
        print(f"删除失败: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
