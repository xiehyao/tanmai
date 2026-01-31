#!/usr/bin/env python3
"""更新指定校友的位置信息"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.location import UserLocation
from add_alumni_data import get_coordinates

updates = [
    {"name": "刘奕栋", "address": "深圳市宝安区龙光世纪大厦"},
    {"name": "黄诗盈", "address": "深圳市福田区福建大厦"},
]

def main():
    db: Session = SessionLocal()
    try:
        for item in updates:
            name = item["name"]
            address = item["address"]
            user = db.query(User).filter(User.nickname == name).first()
            if not user:
                print(f"未找到用户: {name}")
                continue
            
            print(f"处理 {name} (ID={user.id}) -> {address}")
            coords = get_coordinates(address)
            
            location = db.query(UserLocation).filter(
                UserLocation.user_id == user.id,
                UserLocation.location_type == "residence",
            ).first()
            
            if not location:
                location = UserLocation(
                    user_id=user.id,
                    location_type="residence",
                    address=address,
                    latitude=coords.get("latitude") or coords.get("lat"),
                    longitude=coords.get("longitude") or coords.get("lng"),
                )
                db.add(location)
                print(f"  ✓ 新建位置: {address} ({location.latitude}, {location.longitude})")
            else:
                location.address = address
                location.latitude = coords.get("latitude") or coords.get("lat")
                location.longitude = coords.get("longitude") or coords.get("lng")
                print(f"  ✓ 更新位置: {address} ({location.latitude}, {location.longitude})")
            
            db.commit()
        
        print("更新完成")
    except Exception as e:
        print("错误:", e)
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
