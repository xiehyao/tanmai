"""
实时匹配引擎
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.card import UserHiddenInfo
from app.models.friend import MatchRecord
from app.core.encryption import decrypt_data
from app.core.ai_service import call_qwen_api
import json
import redis
from app.core.config import settings


class RealtimeMatcher:
    """实时匹配引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB
        )
    
    def match_user_info(self, user_id: int, user_info: dict) -> dict:
        """
        匹配用户信息
        
        Args:
            user_id: 用户ID
            user_info: 用户输入的信息
        
        Returns:
            匹配结果
        """
        # 获取所有其他用户的隐藏信息
        all_users = self.db.query(User).filter(User.id != user_id).all()
        
        matches = []
        for other_user in all_users:
            # 获取其他用户的隐藏信息
            hidden_infos = self.db.query(UserHiddenInfo).filter(
                UserHiddenInfo.user_id == other_user.id
            ).all()
            
            if not hidden_infos:
                continue
            
            # 解密并合并信息
            other_user_info = {}
            for hidden_info in hidden_infos:
                try:
                    decrypted = decrypt_data(other_user.id, hidden_info.encrypted_data)
                    other_user_info.update(decrypted)
                except:
                    continue
            
            # 计算匹配度
            match_score = self._calculate_match_score(user_info, other_user_info)
            
            if match_score > 0:
                matches.append({
                    "user_id": other_user.id,
                    "match_score": match_score,
                    "match_details": self._get_match_details(user_info, other_user_info)
                })
        
        # 按匹配度排序
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        # 统计匹配维度
        dimension_stats = self._get_dimension_stats(matches, user_info)
        
        return {
            "total_matches": len(matches),
            "matches": matches[:10],  # 返回前10个
            "dimension_stats": dimension_stats
        }
    
    def _calculate_match_score(self, user_info: dict, other_info: dict) -> float:
        """计算匹配度分数"""
        score = 0.0
        total_weight = 0.0
        
        # 精确匹配（学校、公司、专业）
        exact_fields = ["学校", "公司", "专业"]
        for field in exact_fields:
            if field in user_info and field in other_info:
                if user_info[field] == other_info[field]:
                    score += 30.0
                total_weight += 30.0
        
        # 语义匹配（兴趣、技能、项目）
        semantic_fields = ["兴趣", "技能", "项目"]
        for field in semantic_fields:
            if field in user_info and field in other_info:
                # 使用AI进行语义相似度计算
                similarity = self._semantic_similarity(
                    str(user_info[field]),
                    str(other_info[field])
                )
                score += similarity * 20.0
                total_weight += 20.0
        
        # 模糊匹配（地域、行业）
        fuzzy_fields = ["居住地", "籍贯"]
        for field in fuzzy_fields:
            if field in user_info and field in other_info:
                if self._fuzzy_match(
                    str(user_info[field]),
                    str(other_info[field])
                ):
                    score += 10.0
                total_weight += 10.0
        
        if total_weight == 0:
            return 0.0
        
        return (score / total_weight) * 100
    
    def _semantic_similarity(self, text1: str, text2: str) -> float:
        """计算语义相似度"""
        try:
            prompt = f"""
请计算以下两段文本的相似度（0-1之间）：

文本1：{text1}
文本2：{text2}

只返回一个0-1之间的数字，表示相似度。
"""
            messages = [
                {"role": "system", "content": "你是一个文本相似度计算助手，只返回0-1之间的数字。"},
                {"role": "user", "content": prompt}
            ]
            
            response = call_qwen_api(messages)
            # 尝试提取数字
            import re
            numbers = re.findall(r'0\.\d+|1\.0|0|1', response)
            if numbers:
                return float(numbers[0])
            return 0.5
        except:
            return 0.5
    
    def _fuzzy_match(self, text1: str, text2: str) -> bool:
        """模糊匹配"""
        # 简单的包含匹配
        return text1 in text2 or text2 in text1
    
    def _get_match_details(self, user_info: dict, other_info: dict) -> dict:
        """获取匹配详情"""
        details = {}
        
        # 精确匹配
        exact_matches = []
        for field in ["学校", "公司", "专业"]:
            if field in user_info and field in other_info:
                if user_info[field] == other_info[field]:
                    exact_matches.append(field)
        if exact_matches:
            details["exact_matches"] = exact_matches
        
        # 共同兴趣
        if "兴趣" in user_info and "兴趣" in other_info:
            user_interests = str(user_info["兴趣"]).split("、")
            other_interests = str(other_info["兴趣"]).split("、")
            common = set(user_interests) & set(other_interests)
            if common:
                details["common_interests"] = list(common)
        
        return details
    
    def _get_dimension_stats(self, matches: list, user_info: dict) -> dict:
        """获取匹配维度统计"""
        stats = {
            "education": 0,
            "interest": 0,
            "project": 0,
            "location": 0
        }
        
        for match in matches:
            details = match.get("match_details", {})
            if "exact_matches" in details:
                if "学校" in details["exact_matches"] or "专业" in details["exact_matches"]:
                    stats["education"] += 1
            if "common_interests" in details:
                stats["interest"] += 1
            # 可以添加更多维度统计
        
        return stats

