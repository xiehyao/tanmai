"""
自我简介卡片AI生成器
"""
from app.core.ai_service import call_qwen_api
from app.core.encryption import decrypt_data
from app.models.card import UserHiddenInfo
import json


class IntroCardGenerator:
    """简介卡片生成器"""
    
    def __init__(self, user_id: int, db):
        self.user_id = user_id
        self.db = db
    
    def generate_card(self, scene_type: str, user_requirement: str = None) -> dict:
        """
        生成简介卡片
        
        Args:
            scene_type: 场景类型（alumni/industry/interest/custom）
            user_requirement: 用户自定义需求
        
        Returns:
            生成的卡片内容
        """
        # 获取用户隐藏信息
        user_info = self._get_user_info()
        
        if scene_type == "custom" and user_requirement:
            return self._generate_custom(user_info, user_requirement)
        else:
            return self._generate_by_template(user_info, scene_type)
    
    def _get_user_info(self) -> dict:
        """获取用户所有隐藏信息"""
        hidden_infos = self.db.query(UserHiddenInfo).filter(
            UserHiddenInfo.user_id == self.user_id
        ).all()
        
        user_info = {}
        for hidden_info in hidden_infos:
            try:
                decrypted = decrypt_data(self.user_id, hidden_info.encrypted_data)
                user_info.update(decrypted)
            except:
                continue
        
        return user_info
    
    def _generate_by_template(self, user_info: dict, scene_type: str) -> dict:
        """基于模板生成"""
        templates = {
            "alumni": """
基于以下用户信息，生成一份适合校友群的自我介绍：

用户信息：{user_info}

要求：
1. 突出届数、学校、专业
2. 简要介绍当前工作
3. 提及兴趣爱好，便于找到共同话题
4. 语气轻松亲切，不要太正式
5. 控制在100字以内

生成格式：
"我是{{届数}}{{专业}}的{{姓名}}，目前在{{公司}}做{{职位}}。平时喜欢{{兴趣1}}和{{兴趣2}}，希望能和校友们多交流。"
""",
            "industry": """
基于以下用户信息，生成一份适合行业群的自我介绍：

用户信息：{user_info}

要求：
1. 突出行业、职位、项目经验
2. 提及资源需求和合作意向
3. 风格专业务实，便于业务合作
4. 控制在100字以内
""",
            "interest": """
基于以下用户信息，生成一份适合兴趣群的自我介绍：

用户信息：{user_info}

要求：
1. 突出兴趣爱好、性格特点
2. 提及社交偏好
3. 风格轻松活泼，便于兴趣社交
4. 控制在100字以内
"""
        }
        
        template = templates.get(scene_type, templates["alumni"])
        prompt = template.format(user_info=json.dumps(user_info, ensure_ascii=False))
        
        messages = [
            {"role": "system", "content": "你是一个专业的自我介绍生成助手。"},
            {"role": "user", "content": prompt}
        ]
        
        content = call_qwen_api(messages)
        
        return {
            "content": content,
            "scene_type": scene_type
        }
    
    def _generate_custom(self, user_info: dict, requirement: str) -> dict:
        """自定义生成"""
        prompt = f"""
用户需求：{requirement}
用户信息：{json.dumps(user_info, ensure_ascii=False)}

请根据用户需求，生成一份符合要求的自我介绍。
要求：
- 符合指定场景特点
- 突出用户指定的重点信息
- 使用指定的语气风格
- 控制内容长度
"""
        
        messages = [
            {"role": "system", "content": "你是一个专业的自我介绍生成助手。"},
            {"role": "user", "content": prompt}
        ]
        
        content = call_qwen_api(messages)
        
        return {
            "content": content,
            "scene_type": "custom"
        }

