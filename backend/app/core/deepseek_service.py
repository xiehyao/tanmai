"""
DeepSeek API 流式调用服务
使用 OpenAI 兼容接口
"""
import json
from typing import AsyncGenerator, List, Dict
from app.core.config import settings


async def call_deepseek_stream(
    messages: List[Dict[str, str]],
    model: str = "deepseek-chat"
) -> AsyncGenerator[str, None]:
    """
    流式调用 DeepSeek API，逐块 yield 内容
    兼容 OpenAI API 格式
    """
    try:
        from openai import AsyncOpenAI
    except ImportError:
        yield _sse_data({"error": "请安装 openai: pip install openai"})
        return

    api_key = settings.DEEPSEEK_API_KEY
    if not api_key:
        yield _sse_data({"error": "未配置 DEEPSEEK_API_KEY"})
        return

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=settings.DEEPSEEK_BASE_URL
    )

    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
        async for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield _sse_data({"content": delta.content})
    except Exception as e:
        yield _sse_data({"error": str(e)})
    finally:
        yield _sse_data("[DONE]")


def _sse_data(obj) -> str:
    """格式化为 SSE data 行"""
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"
