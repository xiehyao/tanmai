"""
Tencent COS upload helpers.
"""
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException

from app.core.config import settings

try:
    from qcloud_cos import CosConfig, CosS3Client  # type: ignore
    from qcloud_cos.cos_exception import CosClientError, CosServiceError  # type: ignore
except Exception:  # pragma: no cover
    CosConfig = None  # type: ignore
    CosS3Client = None  # type: ignore
    CosClientError = Exception  # type: ignore
    CosServiceError = Exception  # type: ignore


def _guess_ext(filename: Optional[str], content_type: Optional[str]) -> str:
    name = (filename or "").lower()
    if "." in name:
        ext = name.rsplit(".", 1)[-1]
        if ext in {"jpg", "jpeg", "png", "webp", "gif", "bmp", "heic"}:
            return ".jpg" if ext == "jpeg" else f".{ext}"
    ctype = (content_type or "").lower()
    if "png" in ctype:
        return ".png"
    if "webp" in ctype:
        return ".webp"
    if "gif" in ctype:
        return ".gif"
    if "bmp" in ctype:
        return ".bmp"
    return ".jpg"


def upload_post_image_to_cos(file_bytes: bytes, filename: str, content_type: str) -> dict:
    if CosConfig is None or CosS3Client is None:
        raise HTTPException(status_code=503, detail="缺少 qcloud-cos-sdk，请先安装依赖")

    secret_id = os.getenv("COS_SECRET_ID")
    secret_key = os.getenv("COS_SECRET_KEY")
    region = os.getenv("COS_REGION", "ap-guangzhou")
    bucket = os.getenv("COS_BUCKET")
    if not secret_id or not secret_key or not bucket:
        raise HTTPException(
            status_code=503,
            detail="COS 未配置：请设置 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET",
        )

    ext = _guess_ext(filename, content_type)
    yyyymm = datetime.utcnow().strftime("%Y%m")
    key = f"posts/{yyyymm}/{uuid.uuid4().hex}{ext}"

    config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key)
    client = CosS3Client(config)
    try:
        client.put_object(
            Bucket=bucket,
            Body=file_bytes,
            Key=key,
            ContentType=content_type or "application/octet-stream",
            ACL="public-read",
        )
    except CosServiceError as e:
        code = getattr(e, "get_error_code", lambda: "")() or ""
        # Most common production issue: stale/incorrect secret for current bucket account.
        if code == "SignatureDoesNotMatch":
            raise HTTPException(
                status_code=502,
                detail="COS 鉴权失败：签名不匹配，请检查 COS_SECRET_ID/COS_SECRET_KEY 是否与桶账号一致",
            )
        raise HTTPException(status_code=502, detail=f"COS 服务异常：{code or 'unknown'}")
    except CosClientError:
        raise HTTPException(status_code=502, detail="COS 客户端异常：网络或配置错误")

    base_url = settings.UPLOAD_URL_BASE or f"https://{bucket}.cos.{region}.myqcloud.com"
    return {"key": key, "url": f"{base_url.rstrip('/')}/{key}"}
