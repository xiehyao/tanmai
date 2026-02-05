"""
SQLAlchemy ORM 模型包

注意：
- 早期版本的模型源码丢失，只剩下数据库表结构和 .pyc。
- 这里重建最核心的几个模型（User, UserCard），只覆盖我们当前需要的字段。
"""

from app.core.database import Base  # noqa: F401

