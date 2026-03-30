#!/usr/bin/env python3
"""
为 user_cards 表增加 association_title、industry 字段（若不存在）。
在 backend 目录下执行: PYTHONPATH=. python scripts/add_user_cards_association_industry.py
"""
import sys
from sqlalchemy import text

sys.path.insert(0, ".")
from app.core.database import SessionLocal


def main():
    db = SessionLocal()
    try:
        for col, spec in [("association_title", "VARCHAR(500) NULL"), ("industry", "VARCHAR(200) NULL")]:
            try:
                db.execute(text(f"ALTER TABLE user_cards ADD COLUMN {col} {spec}"))
                db.commit()
                print(f"  Added column user_cards.{col}")
            except Exception as e:
                db.rollback()
                if "Duplicate column" in str(e) or "already exists" in str(e).lower():
                    print(f"  Column user_cards.{col} already exists, skip")
                else:
                    raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
