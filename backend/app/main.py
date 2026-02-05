"""
探脉 FastAPI 主应用
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="探脉 API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "探脉 API"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# 路由注册
def _include_routers():
    """按需注册路由，缺失的模块跳过"""
    routers = [
        # 核心业务路由（按模块分组）
        ("app.api.auth", "router", "/api/auth", "auth"),
        ("app.api.users", "router", "/api/users", "users"),
        ("app.api.cards", "router", "/api/cards", "cards"),
        ("app.api.map", "router", "/api/map", "map"),
        ("app.api.alumni", "router", "/api/alumni", "alumni"),
        # 新增的 LLM 助手与配套模块
        ("app.api.assistant", "router", "/api/assistant", "assistant"),
        ("app.api.match", "router", "/api/match", "match"),
        ("app.api.meeting", "router", "/api/meeting", "meeting"),
        ("app.api.payment", "router", "/api/payment", "payment"),
        ("app.api.config", "router", "/api/config", "config"),
    ]
    for mod_path, attr, prefix, tag in routers:
        try:
            mod = __import__(mod_path, fromlist=[attr])
            router = getattr(mod, attr, None)
            if router:
                app.include_router(router, prefix=prefix, tags=[tag])
        except ImportError as e:
            print(f"跳过路由 {mod_path}: {e}")


_include_routers()
