"""
自然语言理解信息提取器
"""
from app.core.ai_service import extract_info_from_text, call_qwen_api
import json


class ConversationState:
    """对话状态枚举"""
    GREETING = "greeting"
    BASIC_INFO = "basic_info"
    EDUCATION = "education"
    PERSONAL = "personal"
    NATURAL = "natural"
    BUSINESS = "business"
    CONFIRMATION = "confirmation"
    COMPLETED = "completed"


class ConversationEngine:
    """对话式引导引擎"""
    
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.current_state = ConversationState.GREETING
        self.collected_info = {}
        self.conversation_history = []
    
    def get_next_question(self) -> str:
        """根据当前状态获取下一个问题"""
        questions = {
            ConversationState.GREETING: "您好！我是探脉AI助手，请告诉我您的姓名和职位",
            ConversationState.BASIC_INFO: "请告诉我您的公司名称和联系方式",
            ConversationState.EDUCATION: "您毕业于哪所学校？专业是什么？",
            ConversationState.PERSONAL: "能介绍一下您的兴趣爱好和性格特点吗？",
            ConversationState.NATURAL: "请告诉我您的年龄、籍贯和居住地",
            ConversationState.BUSINESS: "您有哪些项目经验或专业技能？",
            ConversationState.CONFIRMATION: "信息已收集完成，请确认是否正确"
        }
        return questions.get(self.current_state, "还有其他需要补充的信息吗？")
    
    def process_user_input(self, user_input: str) -> dict:
        """处理用户输入"""
        # 提取信息
        extracted_info = extract_info_from_text(user_input, self.user_id)
        
        # 更新已收集信息
        self.collected_info.update(extracted_info)
        
        # 记录对话历史
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        
        # 判断下一步状态
        self._update_state(extracted_info)
        
        # 生成回复
        reply = self._generate_reply(extracted_info)
        
        self.conversation_history.append({
            "role": "assistant",
            "content": reply
        })
        
        return {
            "reply": reply,
            "extractedInfo": extracted_info,
            "currentState": self.current_state,
            "collectedInfo": self.collected_info
        }
    
    def _update_state(self, extracted_info: dict):
        """更新对话状态"""
        if self.current_state == ConversationState.GREETING:
            if "姓名" in extracted_info or "职位" in extracted_info:
                self.current_state = ConversationState.BASIC_INFO
        elif self.current_state == ConversationState.BASIC_INFO:
            if "公司" in extracted_info or "电话" in extracted_info:
                self.current_state = ConversationState.EDUCATION
        elif self.current_state == ConversationState.EDUCATION:
            if "学校" in extracted_info or "专业" in extracted_info:
                self.current_state = ConversationState.PERSONAL
        elif self.current_state == ConversationState.PERSONAL:
            if "兴趣" in str(extracted_info) or "性格" in str(extracted_info):
                self.current_state = ConversationState.NATURAL
        elif self.current_state == ConversationState.NATURAL:
            if "年龄" in extracted_info or "居住地" in extracted_info:
                self.current_state = ConversationState.BUSINESS
        elif self.current_state == ConversationState.BUSINESS:
            if "项目" in str(extracted_info) or "技能" in str(extracted_info):
                self.current_state = ConversationState.CONFIRMATION
        elif self.current_state == ConversationState.CONFIRMATION:
            self.current_state = ConversationState.COMPLETED
    
    def _generate_reply(self, extracted_info: dict) -> str:
        """生成回复"""
        if self.current_state == ConversationState.COMPLETED:
            return "信息收集完成！感谢您的配合。"
        
        # 使用AI生成自然回复
        messages = [
            {"role": "system", "content": "你是探脉AI助手，正在引导用户填写信息。根据用户输入和当前状态，生成自然友好的回复，并继续提问。"},
            {"role": "user", "content": f"用户输入：{json.dumps(extracted_info, ensure_ascii=False)}\n当前状态：{self.current_state}\n下一个问题：{self.get_next_question()}"}
        ]
        
        try:
            reply = call_qwen_api(messages)
            return reply
        except Exception as e:
            return self.get_next_question()

