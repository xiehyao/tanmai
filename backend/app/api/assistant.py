"""
校友连连看 AI 助手 API
llm-match: 流式校友匹配推荐
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deepseek_service import call_deepseek_stream
from app.core.alumni_data import fetch_full_alumni, format_alumni_for_llm
from sqlalchemy.orm import Session

router = APIRouter()


class LLMMatchRequest(BaseModel):
    prompt: str
    mode: str = "发现"
    strategy: str = "deepthink"  # deepthink / knowledge


# 系统提示词（校友数据动态注入）
SYSTEM_PROMPT_BASE = """你是校友连连看 AI 匹配助手。系统会提供真实校友数据库供你匹配推荐。

【重要】隐私保护（必须严格遵守）：
- 以下校友数据包含电话、邮箱、微信ID、出生地等用户可能设为隐藏的字段，仅用于你内部匹配分析。
- 严禁在思考过程或最终输出中暴露：电话、邮箱、微信ID(wechat_id)、出生地 等隐私信息。
- 推荐时只能写出：姓名、昵称、职位、公司、教育背景、简介、资源/需求概况等可公开信息。

在回答时：

1. 主体部分：自由发挥，充分展开
   - 根据用户问题深度分析、畅想、推理
   - 可包含但不限于：共创思路、资源互补方案、人脉推荐、活动建议等
   - 不限制篇幅和结构，以「有价值、有洞察」为准
   - 除了推理过程，主体部分的内容不少于1000字，需要尽量丰满

2. 结尾部分：在回答最后，仅当用户有明确推荐校友需求时，从系统提供的真实校友中筛选 1-3 位匹配者，使用以下格式收束（用换行分隔，不要用 ---）：
   【推荐理由】简要说明为什么推荐
   【相关校友】只写姓名、职位、公司、教育、简介等公开信息，每行一位
   【下一步建议】用户可采取的具体行动

若主体内容已足够完整，结尾可简化为「下一步建议」即可。

约束：
- 只从系统提供的真实校友列表中推荐，不得虚构任何校友。
- **格式约束**：严禁使用 markdown，包括 ###、**、---、```、表格、代码块等。全部用纯文字、换行和标点表达，不要出现任何 markdown 符号。
- 不要输出代码块、伪代码或任何编程语言示例。

模式理解：
- **脱单**：性格、兴趣、价值观。必须检查校友的婚姻状况(marital_status)和脱单需求(dating_need)。仅当 marital_status 为 single 且 dating_need 为 1 时才可推荐；若无人符合，如实说明「当前数据库中暂无符合脱单条件的校友」。
- 事业：行业、岗位、合作可能
- 资源：互补、互助、可交换
- 找局：活动类型、时间、地点
- 知己：共同话题、兴趣
- 发现：探索性、有趣

策略：deepthink=复杂需求多步推理；knowledge=快速查人查活动。"""


def _build_system_prompt(alumni_block: str, mode: str = "") -> str:
    base = SYSTEM_PROMPT_BASE + "\n\n【真实校友数据库】（仅用于匹配，严禁在输出中暴露电话/邮箱/微信/出生地）\n" + alumni_block
    if mode == "脱单":
        base += "\n\n【脱单模式特别提醒】校友数据中已包含婚姻状况(marital_status)、脱单需求(dating_need)、脱单偏好(dating_preferences)。仅推荐 marital_status 为 single 且 dating_need 为 1 的校友；若无符合者，明确告知用户。"
    return base


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

    # 从数据库抓取完整校友数据（含隐藏字段），供 AI 匹配
    alumni_list = fetch_full_alumni(db)
    alumni_block = format_alumni_for_llm(alumni_list)
    system_prompt = _build_system_prompt(alumni_block, mode)

    user_content = f"[模式: {mode}] [策略: {strategy}]\n\n用户需求：{prompt}"

    messages = [
        {"role": "system", "content": system_prompt},
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
