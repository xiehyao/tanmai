"""
校友连连看 AI 助手 API
llm-match: 流式校友匹配推荐
"""
import json
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
    deepthink: bool = True   # 是否开启推理过程
    use_knowledge_base: bool = False  # 是否引用校友信息库（含私密信息、校友会评价等）


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
- **严禁在输出中写出 id=数字、[id=X]、- id=3: 等内部数据库标识，更不能用「id=7」「id=3」来代替校友姓名**。
  - 不允许出现类似「id=7：xxx」「- id=5: xxx」「(id=3)」这类内容；
  - 在回答和推荐中**只能直接写校友姓名**（以及职位、公司等），不得用任何编号代称。
- 不要输出代码块、伪代码或任何编程语言示例。

模式理解：
- **脱单**：性格、兴趣、价值观。必须检查婚姻状况(marital_status)和脱单需求(dating_need)。满足以下任一即可推荐，但必须在推荐时指出风险：① single 或 dating_need=1；② 两者均为未填写。风险提示：已婚且有约会需求→「虽有约会需求，但当前已婚，请谨慎沟通」；单身但无约会需求→「暂无约会需求，但当前单身，可主动交流试试」；两者均未填写→「婚姻状况与约会需求未填写，建议沟通时主动了解」。
- 事业：行业、岗位、合作可能
- 资源：互补、互助、可交换
- 找局：活动类型、时间、地点
- 知己：共同话题、兴趣
- 发现：探索性、有趣

策略：deepthink=开推理过程；use_knowledge_base=引用完整校友信息（含私密、校友会评价）时需做好隐私处理。"""


def _build_system_prompt(alumni_block: str, mode: str = "") -> str:
    base = SYSTEM_PROMPT_BASE + "\n\n【真实校友数据库】（仅用于匹配，严禁在输出中暴露电话/邮箱/微信/出生地）\n" + alumni_block
    if mode == "脱单":
        base += "\n\n【脱单模式特别提醒】校友数据中已包含婚姻状况、脱单需求、脱单偏好。满足以下任一即可推荐：① single 或 dating_need=1；② 婚姻状况与约会需求均未填写。推荐时必须指出风险：已婚且有约会需求→「虽有约会需求，但当前已婚，请谨慎沟通」；单身但无约会需求→「暂无约会需求，但当前单身，可主动交流试试」；两者均未填写→「婚姻状况与约会需求未填写，建议沟通时主动了解」。"
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
    deepthink = getattr(body, "deepthink", True)
    use_kb = getattr(body, "use_knowledge_base", False)

    # 从数据库抓取校友数据；use_knowledge_base=True 时含隐藏字段
    alumni_list = fetch_full_alumni(db)
    alumni_block = format_alumni_for_llm(alumni_list, include_hidden=use_kb)
    system_prompt = _build_system_prompt(alumni_block, mode)

    user_content = f"[模式: {mode}] [deepthink:{deepthink}] [知识库:{use_kb}]\n\n用户需求：{prompt}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]

    # 精简校友名单供前端匹配答案中的姓名
    alumni_for_match = [
        {"id": a.get("id"), "user_id": a.get("id"), "name": (a.get("name") or a.get("nickname") or "").strip(), "nickname": (a.get("nickname") or "").strip()}
        for a in alumni_list
    ]

    async def event_generator():
        yield f"data: {json.dumps({'alumni': alumni_for_match}, ensure_ascii=False)}\n\n"
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
