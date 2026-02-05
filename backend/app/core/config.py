"""
应用配置 - 从环境变量读取
"""
import os
from typing import Optional

try:
    # 优先从 .env 加载（若安装了 python-dotenv）
    from dotenv import load_dotenv  # type: ignore

    load_dotenv()
except Exception:
    # 未安装或加载失败时静默跳过，继续使用系统环境变量
    pass


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://apache:pengyoo123@localhost:3306/tanmai")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tanmai-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7天
    WECHAT_SECRET: Optional[str] = os.getenv("WECHAT_SECRET")
    ALIYUN_ACCESS_KEY_ID: Optional[str] = os.getenv("ALIYUN_ACCESS_KEY_ID")
    ALIYUN_ACCESS_KEY_SECRET: Optional[str] = os.getenv("ALIYUN_ACCESS_KEY_SECRET")
    DASHSCOPE_API_KEY: Optional[str] = os.getenv("DASHSCOPE_API_KEY")
    TENCENT_MAP_KEY: Optional[str] = os.getenv("TENCENT_MAP_KEY")
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    # 默认走腾讯云 DeepSeek OpenAI 接口网关，而不是直连官方 DeepSeek
    # 参考文档：https://cloud.tencent.com/document/product/1772/115969
    DEEPSEEK_BASE_URL: str = os.getenv(
        "DEEPSEEK_BASE_URL",
        "https://api.lkeap.cloud.tencent.com/v1",
    )
    # 默认模型，可通过环境变量 DEEPSEEK_MODEL 覆盖
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-r1-0528")
    WORK_WECHAT_CORP_SECRET: Optional[str] = os.getenv("WORK_WECHAT_CORP_SECRET")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "tanmai-encryption-key-32bytes!!")
    UPLOAD_URL_BASE: Optional[str] = os.getenv("UPLOAD_URL_BASE")


settings = Settings()
