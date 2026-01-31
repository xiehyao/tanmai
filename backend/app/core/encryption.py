"""
数据加密模块
使用AES-256加密隐藏信息
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import json
from app.core.config import settings


def generate_key(user_id: int) -> bytes:
    """基于用户ID生成加密密钥"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=settings.ENCRYPTION_KEY.encode(),
        iterations=100000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(
        kdf.derive(f"{user_id}_{settings.ENCRYPTION_KEY}".encode())
    )
    return key


def encrypt_data(user_id: int, data: dict) -> str:
    """加密数据"""
    key = generate_key(user_id)
    f = Fernet(key)
    
    # 将字典转换为JSON字符串
    json_data = json.dumps(data, ensure_ascii=False)
    
    # 加密
    encrypted = f.encrypt(json_data.encode())
    
    # 返回base64编码的加密数据
    return base64.b64encode(encrypted).decode()


def decrypt_data(user_id: int, encrypted_data: str) -> dict:
    """解密数据"""
    key = generate_key(user_id)
    f = Fernet(key)
    
    try:
        # base64解码
        encrypted_bytes = base64.b64decode(encrypted_data.encode())
        
        # 解密
        decrypted = f.decrypt(encrypted_bytes)
        
        # 转换为字典
        return json.loads(decrypted.decode())
    except Exception as e:
        raise ValueError(f"解密失败: {str(e)}")

