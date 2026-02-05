"""
校友连连看 AI 助手 API
llm-match: 流式校友匹配推荐
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deepseek_service import call_deepseek_stream
from sqlalchemy.orm import Session

router = APIRouter()


class LLMMatchRequest(BaseModel):
    prompt: str
    mode: str = "发现"
    strategy: str = "deepthink"  # deepthink / knowledge


# 新提示词：先自由发挥，最后再收敛到结构（见 docs/LLM_MATCH_PROMPT_SPEC.md）
SYSTEM_PROMPT = """你是校友连连看 AI 匹配助手，基于校友网络做智能推荐。

在回答时：

1. 主体部分：自由发挥，充分展开
   - 根据用户问题深度分析、畅想、推理
   - 可包含：共创思路、资源互补方案、人脉推荐、活动建议等
   - 不限制篇幅和结构，以「有价值、有洞察」为准

2. 结尾部分：在回答最后，用以下格式收束：
   ---
   【推荐理由】简要说明为什么推荐 / 为什么这样建议
   【相关校友】如有具体校友，可列出 1-3 位
   【下一步建议】用户可采取的具体行动（如：交换名片、发起约见等）

若主体内容已足够完整，结尾可简化为「下一步建议」即可。

约束：只推荐真实校友，不虚构；尊重隐私，不透露敏感信息。

模式理解：
- 脱单：性格、兴趣、价值观
- 事业：行业、岗位、合作可能
- 资源：互补、互助、可交换
- 找局：活动类型、时间、地点
- 知己：共同话题、兴趣
- 发现：探索性、有趣

策略：deepthink=复杂需求多步推理；knowledge=快速查人查活动。"""


@router.post("/llm-match")
async def llm_match(
    body: LLMMatchRequest,
    db: Session = Depends(get_db)
):
    """
    校友连连看流式匹配
    POST body: { prompt, mode, strategy }
    返回: SSE 流，data: {"content": "..."} 或 {"error": "..."} 或 "[DONE]"
    """
    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt 不能为空")

    mode = body.mode or "发现"
    strategy = body.strategy or "deepthink"

    user_content = f"[模式: {mode}] [策略: {strategy}]\n\n用户需求：{prompt}"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]

    async def event_generator():
        async for chunk in call_deepseek_stream(messages):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
