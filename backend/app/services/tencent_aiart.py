"""
腾讯混元生图 — 图像风格化（图生图）ImageToImage
文档：https://cloud.tencent.com/document/product/1668/88066
"""
import os
from typing import Optional, Tuple

try:
    from tencentcloud.common import credential
    from tencentcloud.common.profile.client_profile import ClientProfile
    from tencentcloud.common.profile.http_profile import HttpProfile
    from tencentcloud.aiart.v20221229 import aiart_client, models
except Exception:  # pragma: no cover
    credential = None  # type: ignore
    aiart_client = None  # type: ignore
    models = None  # type: ignore


def _secret_pair() -> Tuple[Optional[str], Optional[str]]:
    sid = os.getenv("TENCENTCLOUD_SECRET_ID") or os.getenv("COS_SECRET_ID")
    sk = os.getenv("TENCENTCLOUD_SECRET_KEY") or os.getenv("COS_SECRET_KEY")
    return sid, sk


def image_to_image_url(input_url: str) -> str:
    """
    调用 ImageToImage，返回混元返回的临时图片 URL（约 1 小时有效）。
    失败时抛出异常（含腾讯云业务错误信息）。
    """
    if credential is None or aiart_client is None or models is None:
        raise RuntimeError("缺少 tencentcloud-sdk-python，请 pip install tencentcloud-sdk-python")

    sid, sk = _secret_pair()
    if not sid or not sk:
        raise RuntimeError("未配置 TENCENTCLOUD_SECRET_ID/TENCENTCLOUD_SECRET_KEY（或 COS_SECRET_ID/COS_SECRET_KEY）")

    region = os.getenv("TENCENT_AIART_REGION", "ap-guangzhou")
    cred = credential.Credential(sid, sk)
    http_profile = HttpProfile()
    http_profile.endpoint = "aiart.tencentcloudapi.com"
    client_profile = ClientProfile()
    client_profile.httpProfile = http_profile
    client = aiart_client.AiartClient(cred, region, client_profile)

    req = models.ImageToImageRequest()
    req.InputUrl = input_url.strip()
    req.Prompt = os.getenv(
        "TENCENT_AIART_PROMPT",
        "立体3D卡通风格头像，可爱明亮，正面肖像",
    )
    neg = os.getenv("TENCENT_AIART_NEGATIVE_PROMPT", "")
    if neg:
        req.NegativePrompt = neg
    styles_raw = os.getenv("TENCENT_AIART_STYLES", "201")
    req.Styles = [s.strip() for s in styles_raw.split(",") if s.strip()]
    req.RspImgType = "url"
    rc = models.ResultConfig()
    rc.Resolution = os.getenv("TENCENT_AIART_RESOLUTION", "768:768")
    req.ResultConfig = rc
    try:
        req.Strength = float(os.getenv("TENCENT_AIART_STRENGTH", "0.7"))
    except ValueError:
        req.Strength = 0.7

    resp = client.ImageToImage(req)
    out = getattr(resp, "ResultImage", None) or ""
    out = (out or "").strip()
    if not out:
        raise RuntimeError("混元未返回 ResultImage")
    return out
