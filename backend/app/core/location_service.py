"""
位置服务
处理地址地理编码、位置管理
"""
import requests
from app.core.config import settings


def geocode_address(address: str) -> dict:
    """
    将地址转换为经纬度（地理编码）
    
    Args:
        address: 地址字符串
    
    Returns:
        {"latitude": float, "longitude": float}
    """
    url = "https://apis.map.qq.com/ws/geocoder/v1/"
    params = {
        "address": address,
        "key": settings.TENCENT_MAP_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get("status") == 0:
            location = data["result"]["location"]
            return {
                "latitude": location["lat"],
                "longitude": location["lng"]
            }
        else:
            raise Exception(f"地理编码失败: {data.get('message', '未知错误')}")
    except Exception as e:
        raise Exception(f"地理编码失败: {str(e)}")


def reverse_geocode(latitude: float, longitude: float) -> str:
    """
    将经纬度转换为地址（逆地理编码）
    
    Args:
        latitude: 纬度
        longitude: 经度
    
    Returns:
        地址字符串
    """
    url = "https://apis.map.qq.com/ws/geocoder/v1/"
    params = {
        "location": f"{latitude},{longitude}",
        "key": settings.TENCENT_MAP_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get("status") == 0:
            return data["result"]["address"]
        else:
            raise Exception(f"逆地理编码失败: {data.get('message', '未知错误')}")
    except Exception as e:
        raise Exception(f"逆地理编码失败: {str(e)}")


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    计算两点间距离（公里）
    使用Haversine公式
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # 地球半径（公里）
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + \
        cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c
    return distance

