"""
微信小程序：code2Session（jscode2session）
"""
import asyncio
import json
import urllib.parse
import urllib.request

from fastapi import HTTPException

from app.core.config import settings

WECHAT_JSCODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session"


async def jscode2session(js_code: str) -> dict:
    """
    用 wx.login 返回的 code 向微信换取 openid、session_key。
    成功时返回微信 JSON（含 openid、session_key，可能含 unionid）。
    """
    appid = settings.WECHAT_APPID
    secret = settings.WECHAT_SECRET
    if not appid or not secret:
        raise HTTPException(
            status_code=503,
            detail=(
                "微信登录未配置：请设置环境变量 WECHAT_APPID 与 WECHAT_SECRET；"
                "或在服务器 backend 目录创建 .env 文件写入上述两项后重启 uvicorn。"
            ),
        )

    params = {
        "appid": appid,
        "secret": secret,
        "js_code": js_code,
        "grant_type": "authorization_code",
    }
    url = WECHAT_JSCODE2SESSION_URL + "?" + urllib.parse.urlencode(params)

    def _fetch() -> dict:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())

    data = await asyncio.to_thread(_fetch)

    errcode = data.get("errcode")
    if errcode is not None and errcode != 0:
        errmsg = data.get("errmsg", "微信接口错误")
        raise HTTPException(status_code=400, detail=f"微信登录失败: {errmsg}")

    openid = data.get("openid")
    if not openid:
        raise HTTPException(status_code=400, detail="微信未返回 openid")

    return data
