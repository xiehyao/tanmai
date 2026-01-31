# 探脉小程序 - 详细需求与实现方案设计

## 目录

1. [项目概述](#项目概述)
2. [核心需求](#核心需求)
3. [技术架构](#技术架构)
4. [功能模块详细设计](#功能模块详细设计)
5. [数据库设计](#数据库设计)
6. [API设计](#api设计)
7. [前端设计](#前端设计)
8. [安全设计](#安全设计)
9. [部署方案](#部署方案)
10. [开发计划](#开发计划)

---

## 项目概述

### 1.1 项目定位

探脉是一个基于AI智能匹配的社交小程序，旨在帮助用户建立有价值的人脉关系。通过隐藏信息匹配、地理位置服务、AI助手等功能，让用户能够更精准地找到志同道合的伙伴、合作伙伴或朋友。

### 1.2 核心价值

- **隐私保护**：隐藏信息加密存储，仅好友可见
- **智能匹配**：AI驱动的多维度匹配算法
- **实时反馈**：录入信息时实时显示匹配结果，激励用户完善信息
- **场景适配**：多场景简介卡片，适应不同社交场合
- **位置服务**：基于地理位置的好友发现和约见
- **人脉维护**：AI助手自动提醒维护人脉关系

---

## 核心需求

### 2.1 名片系统

**需求描述**：
- 用户拥有公开名片和隐藏信息
- 公开名片：姓名、职位、公司、联系方式等基础信息
- 隐藏信息：个人信息、教育背景、自然属性、商务项目等（加密存储）

**功能要求**：
- 支持编辑公开名片
- 支持通过AI语音互动录入隐藏信息
- 支持二维码生成和扫描交换名片
- 交换名片后自动建立好友关系

### 2.2 AI语音互动录入系统

**需求描述**：
用户通过语音或文字与AI助手对话，系统自动提取结构化信息并存储。

**功能要求**：
- **对话式引导模式**：AI主动提问，逐步引导用户填写
- **自由输入模式**：用户自由描述，AI自动提取信息
- **实时匹配反馈**：每输入一条信息，立即显示匹配到的用户数量
- **信息分类存储**：自动分类存储到个人信息/教育背景/自然属性/商务项目

**交互流程**：
1. 用户选择录入模式
2. 开始对话/输入
3. AI提取信息并展示确认
4. 实时匹配并显示反馈
5. 用户确认/修改
6. 加密存储

### 2.3 自我简介卡片系统

**需求描述**：
生成非正式的自我介绍卡片，适用于群组分享等场景。

**功能要求**：
- 支持多张卡片，针对不同场景（校友群/行业群/兴趣群）
- AI自动生成，用户可编辑
- 支持场景模板和自定义生成
- 支持分享链接和二维码

**场景模板**：
- **校友群模板**：突出届数、学校、专业、当前工作
- **行业群模板**：突出行业、职位、项目经验、资源
- **兴趣群模板**：突出兴趣爱好、性格特点、社交偏好

### 2.4 周边朋友分布地图系统

**需求描述**：
基于地理位置的好友分布地图，出差时智能匹配约见。

**功能要求**：
- 在地图上标记所有好友位置
- 支持实时定位
- 智能匹配推荐（距离+需求匹配+历史匹配度）
- 支持约见功能
- 出差模式：到达好友城市时自动提醒

**匹配算法**：
- 地理位置匹配（30%权重）
- 当前需求匹配（40%权重）
- 历史匹配度（30%权重）

### 2.5 智能匹配引擎

**需求描述**：
基于隐藏信息进行AI匹配，计算匹配度并推荐。

**功能要求**：
- 交换名片时自动匹配
- 支持精确匹配、语义匹配、模糊匹配
- 返回匹配度分数和匹配理由
- 支持多维度匹配（兴趣/教育/项目/性格等）

### 2.6 AI助手系统

**需求描述**：
付费AI小助手，根据需求在好友中智能匹配推荐。

**功能要求**：
- 用户输入需求（交友/相亲/项目等）
- AI分析需求并匹配相关好友
- 生成推荐列表（Top N）
- 积分消耗机制

### 2.7 AI人脉维护小助理

**需求描述**：
智能提醒生日、纪念日、出差、长时间未交流等，帮助用户维护人脉。

**功能要求**：
- **生日提醒**：提前3天和当天提醒
- **纪念日提醒**：认识纪念日、自定义纪念日
- **出差提醒**：到达好友城市时提醒
- **未交流提醒**：智能判断间隔，建议交流主题
- **礼品建议**：AI推荐合适的礼品

**智能判断**：
- 根据关系亲密度动态调整提醒间隔
- 高匹配度好友：30天
- 一般好友：60天
- 新好友：90天

### 2.8 好友信息更新智能提醒

**需求描述**：
当好友信息更新时，AI分析联动机会并提醒用户。

**功能要求**：
- 监控好友信息更新
- 实时匹配分析
- AI判断是否有明显联动机会
- 匹配度变化>15%时提醒
- 显示更新详情和联动建议

### 2.9 探脉个人商务秘书（企业微信）

**需求描述**：
通过企业微信添加的个人助理，支持所有功能的对话式操作。

**功能要求**：
- 用户在企业微信中添加"探脉个人商务秘书"
- 通过自然语言对话进行操作
- 支持查询、推荐、约见、提醒等所有功能
- 复杂操作跳转小程序

**支持的操作**：
- 好友查询："帮我找一下XX"
- 匹配推荐："找一下做XX项目的朋友"
- 约见管理："帮我约XX一起喝咖啡"
- 提醒查询："最近有什么提醒吗"
- 信息更新查询："XX最近有什么更新吗"

---

## 技术架构

### 3.1 前端技术栈

```
uni-app (Vue 3)
├── UI框架: uView UI
├── 状态管理: Vuex
├── HTTP请求: uni.request封装
├── 语音功能: 微信小程序录音API + 阿里云ASR
├── 地图服务: 腾讯地图（微信小程序原生支持）
└── 推送通知: 微信小程序订阅消息
```

**技术选型理由**：
- uni-app：支持微信小程序，一套代码多端运行
- Vue 3：现代化框架，性能优秀
- uView UI：成熟的UI组件库
- 腾讯地图：微信小程序原生支持，无需额外SDK

### 3.2 后端技术栈

```
Python FastAPI
├── 数据库: PostgreSQL + Redis
├── ORM: SQLAlchemy
├── 加密: cryptography (AES-256)
├── AI服务: 阿里云通义千问API
├── 语音服务: 阿里云ASR + TTS
├── 地图服务: 腾讯地图API
├── 定时任务: Celery + Redis
├── 企业微信: 企业微信API
└── 支付: 微信支付API
```

**技术选型理由**：
- FastAPI：高性能、现代化、自动文档生成
- PostgreSQL：关系型数据库，支持复杂查询
- Redis：缓存、会话管理、任务队列
- Celery：异步任务处理，适合定时任务

### 3.3 系统架构图

```
┌─────────────────┐
│   微信小程序     │
│   (uni-app)     │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│   FastAPI后端   │
│                 │
│  ┌──────────┐  │
│  │ API路由   │  │
│  └────┬─────┘  │
│       │        │
│  ┌────▼─────┐  │
│  │ 业务逻辑  │  │
│  └────┬─────┘  │
│       │        │
│  ┌────▼─────┐  │
│  │ 数据访问  │  │
│  └────┬─────┘  │
└───────┼────────┘
        │
        ├──────────┬──────────┬──────────┐
        │          │          │          │
┌───────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌──▼──────┐
│PostgreSQL│ │  Redis  │ │ 阿里云  │ │腾讯地图 │
│          │ │         │ │ 通义千问 │ │  API   │
└──────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 3.4 数据流

**用户录入信息流程**：
```
用户输入 → 语音识别(ASR) → 信息提取(NLU) → 实时匹配 → 反馈展示 → 加密存储
```

**匹配推荐流程**：
```
用户需求 → AI分析 → 查询好友信息 → 匹配计算 → 排序推荐 → 结果展示
```

**提醒流程**：
```
定时任务 → 检查提醒事项 → 生成提醒消息 → 推送通知(小程序+企业微信)
```

---

## 功能模块详细设计

### 4.1 AI语音互动录入系统

#### 4.1.1 对话式引导引擎

**状态机设计**：
```python
CONVERSATION_STATES = {
    'greeting': '欢迎并询问基本信息',
    'basic_info': '收集姓名、职位、公司',
    'education': '收集教育背景',
    'personal': '收集个人信息',
    'natural': '收集自然属性',
    'business': '收集商务项目',
    'confirmation': '确认信息完整性',
    'completed': '完成录入'
}
```

**状态转换规则**：
- greeting → basic_info：用户提供姓名或职位
- basic_info → education：用户提供公司或联系方式
- education → personal：用户提供学校或专业
- personal → natural：用户提供兴趣或性格
- natural → business：用户提供年龄或居住地
- business → confirmation：用户提供项目或技能
- confirmation → completed：用户确认信息

#### 4.1.2 信息提取算法

**Prompt设计**：
```
请从以下用户输入中提取结构化信息，并按照JSON格式返回：

用户输入：{user_input}

请提取以下字段（如果存在）：
- 姓名、职位、公司、电话、邮箱
- 学校、专业、学历
- 兴趣爱好、性格特点
- 年龄、籍贯、居住地、生日
- 项目经验、技能

返回JSON格式，不存在的字段返回null。
```

**提取流程**：
1. 调用通义千问API进行NLU
2. 解析JSON响应
3. 验证数据格式
4. 分类存储（personal/education/natural/business）

#### 4.1.3 实时匹配反馈机制

**匹配触发时机**：
- 用户输入/确认每一条信息后
- 用户修改已有信息后
- 用户完成一个信息类别后

**匹配算法**：
```python
def calculate_match_score(user_info, other_info):
    score = 0.0
    total_weight = 0.0
    
    # 精确匹配（30分）
    if user_info["学校"] == other_info["学校"]:
        score += 30.0
    total_weight += 30.0
    
    # 语义匹配（20分）
    similarity = semantic_similarity(
        user_info["兴趣"], 
        other_info["兴趣"]
    )
    score += similarity * 20.0
    total_weight += 20.0
    
    # 模糊匹配（10分）
    if fuzzy_match(user_info["居住地"], other_info["居住地"]):
        score += 10.0
    total_weight += 10.0
    
    return (score / total_weight) * 100
```

**反馈展示**：
- 匹配数量："已发现X位与您有共同点的用户"
- 匹配维度："在教育背景方面有X位匹配用户"
- 进度激励："完善XX信息可发现更多匹配"

### 4.2 自我简介卡片生成系统

#### 4.2.1 场景模板设计

**校友群模板Prompt**：
```
基于以下用户信息，生成一份适合校友群的自我介绍：

用户信息：{user_info}

要求：
1. 突出届数、学校、专业
2. 简要介绍当前工作
3. 提及兴趣爱好，便于找到共同话题
4. 语气轻松亲切，不要太正式
5. 控制在100字以内

生成格式：
"我是{届数}{专业}的{姓名}，目前在{公司}做{职位}。平时喜欢{兴趣1}和{兴趣2}，希望能和校友们多交流。"
```

**行业群模板Prompt**：
```
基于以下用户信息，生成一份适合行业群的自我介绍：

用户信息：{user_info}

要求：
1. 突出行业、职位、项目经验
2. 提及资源需求和合作意向
3. 风格专业务实，便于业务合作
4. 控制在100字以内
```

#### 4.2.2 生成流程

```
用户选择场景 → AI分析场景特点 → 提取用户相关信息 → 
根据模板生成 → 用户确认/编辑 → 保存卡片
```

### 4.3 周边朋友地图系统

#### 4.3.1 地理位置匹配算法

**距离计算**（Haversine公式）：
```python
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # 地球半径（公里）
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + \
        cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c
```

**综合匹配度计算**：
```python
def calculate_map_match_score(user, friend, user_location, friend_location, user_requirement):
    # 距离分数（30%权重）
    distance = calculate_distance(user_location, friend_location)
    distance_score = max(0, 100 - distance * 10)  # 10km内满分
    
    # 需求匹配分数（40%权重）
    if user_requirement:
        requirement_score = ai_match_requirement(user_requirement, friend)
    else:
        requirement_score = 50
    
    # 历史匹配度（30%权重）
    history_score = get_history_match_score(user.id, friend.id)
    
    # 综合加权
    final_score = (
        distance_score * 0.3 +
        requirement_score * 0.4 +
        history_score * 0.3
    )
    return final_score
```

#### 4.3.2 约见功能设计

**约见请求流程**：
```
用户选择好友 → 填写约见目的 → 选择时间地点 → 
发送请求 → 对方收到通知 → 接受/拒绝/修改 → 
确认约见 → 提醒通知
```

**约见状态**：
- pending：待确认
- accepted：已接受
- rejected：已拒绝
- cancelled：已取消

### 4.4 AI人脉维护小助理

#### 4.4.1 提醒类型

**生日提醒**：
- 提前3天提醒："XX的生日还有3天，记得送上祝福"
- 生日当天提醒："今天是XX的生日，快去送上祝福吧"
- AI生成个性化祝福语

**纪念日提醒**：
- 认识纪念日（交换名片日期）
- 重要项目合作纪念日
- 用户自定义纪念日

**出差提醒**：
- 检测用户位置变化
- 到达好友城市时立即提醒
- 显示该城市的好友列表

**未交流提醒**：
- 智能判断间隔（根据关系亲密度）
- 生成交流主题建议
- 提供快速操作（发送消息/约见）

#### 4.4.2 智能判断算法

```python
def calculate_contact_interval(user_id, friend_id):
    # 获取关系数据
    match_score = get_history_match_score(user_id, friend_id)
    contact_frequency = get_contact_frequency(user_id, friend_id)
    friend_age = get_friend_relation_age(user_id, friend_id)
    
    # 基础间隔（根据匹配度）
    if match_score > 80:
        base_interval = 30  # 高匹配度：30天
    elif match_score > 60:
        base_interval = 60  # 中匹配度：60天
    else:
        base_interval = 90  # 低匹配度：90天
    
    # 根据交流频率调整
    if contact_frequency > 0.5:  # 经常交流
        base_interval *= 1.5
    elif contact_frequency < 0.1:  # 很少交流
        base_interval *= 0.8
    
    # 根据关系时长调整
    if friend_age < 30:  # 新好友
        base_interval *= 1.2
    
    return base_interval
```

#### 4.4.3 定时任务设计

**Celery任务配置**：
```python
@celery_app.task
def check_reminders():
    """每日检查提醒事项"""
    # 检查生日提醒
    check_birthday_reminders()
    
    # 检查纪念日提醒
    check_anniversary_reminders()
    
    # 检查出差提醒
    check_travel_reminders()
    
    # 检查未交流提醒
    check_no_contact_reminders()
```

**任务调度**：
- 每日凌晨2点执行
- 重要事项实时推送
- 一般事项汇总推送

### 4.5 好友信息更新智能提醒

#### 4.5.1 更新监控机制

**监控触发**：
- 好友更新隐藏信息时触发事件
- 记录更新前后对比
- 立即触发AI匹配分析

**更新类型**：
- project：项目更新
- work：工作更新
- skill：技能更新
- resource：资源需求更新

#### 4.5.2 联动分析算法

```python
def analyze_friend_update(user_id, friend_id, update_data):
    # 获取用户和好友的当前信息
    user_info = get_user_hidden_info(user_id)
    friend_old_info = get_friend_old_info(friend_id)
    friend_new_info = update_data
    
    # 计算匹配度变化
    old_match_score = calculate_match_score(user_info, friend_old_info)
    new_match_score = calculate_match_score(user_info, friend_new_info)
    score_change = new_match_score - old_match_score
    
    # AI分析联动机会
    opportunity_analysis = ai_analyze_opportunity(
        user_info=user_info,
        friend_old_info=friend_old_info,
        friend_new_info=friend_new_info,
        update_type=update_data['type']
    )
    
    # 判断是否需要提醒
    should_notify = (
        score_change > 15 or  # 匹配度明显提升
        opportunity_analysis['has_opportunity'] or  # AI判断有机会
        update_data['type'] in ['project', 'resource', 'skill']  # 重要更新类型
    )
    
    if should_notify:
        generate_update_notification(
            user_id=user_id,
            friend_id=friend_id,
            score_change=score_change,
            opportunity=opportunity_analysis
        )
```

#### 4.5.3 AI机会分析Prompt

```
分析以下用户和好友的信息更新，判断是否有明显的联动机会：

用户信息：{user_info}
好友更新信息：{friend_info}
更新类型：{update_type}

请分析：
1. 是否有明显的合作机会？
2. 匹配度是否有显著提升？
3. 是否有资源互补？

返回JSON格式：
{
    "has_opportunity": true/false,
    "opportunity_type": "项目合作/资源互补/技能匹配",
    "match_score_change": "提升/下降/不变",
    "reason": "分析理由"
}
```

### 4.6 探脉个人商务秘书（企业微信）

#### 4.6.1 消息处理流程

```
企业微信接收用户消息
  ↓
解析消息内容（文本/图片等）
  ↓
识别用户身份（work_wechat_id）
  ↓
关联小程序用户（user_id）
  ↓
NLU分析用户意图（通义千问API）
  ↓
识别操作类型和参数
  ↓
调用对应的业务API
  ↓
处理业务逻辑
  ↓
生成回复消息（文本/卡片）
  ↓
发送回复到企业微信
```

#### 4.6.2 意图识别

**意图类型**：
- 查询好友：find_friend
- 匹配推荐：match_recommend
- 约见管理：meeting_manage
- 提醒查询：reminder_query
- 信息更新：info_update
- 其他：other

**NLU Prompt**：
```
用户消息：{user_message}
用户上下文：{context}

请识别用户意图，并返回JSON格式：
{
    "intent": "查询好友/匹配推荐/约见管理/提醒查询/信息更新/其他",
    "action": "具体操作",
    "parameters": {
        "好友姓名": "XX",
        "城市": "XX",
        "项目类型": "XX",
        ...
    },
    "confidence": 0.95
}
```

#### 4.6.3 会话管理

**会话上下文**：
```python
class WorkWeChatSession:
    def __init__(self, user_id, work_wechat_id):
        self.user_id = user_id
        self.work_wechat_id = work_wechat_id
        self.context = {}  # 上下文数据
        self.last_intent = None  # 上次意图
        self.conversation_history = []  # 对话历史
```

**多轮对话支持**：
- 支持上下文理解
- 支持澄清问题
- 支持确认操作
- 支持取消操作

---

## 数据库设计

### 5.1 核心表结构

#### 5.1.1 用户表（users）

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar VARCHAR(500),
    work_wechat_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.2 名片表（user_cards）

```sql
CREATE TABLE user_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255),
    title VARCHAR(255),
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    bio TEXT,
    qr_code VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.3 隐藏信息表（user_hidden_info）

```sql
CREATE TABLE user_hidden_info (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(50) NOT NULL,  -- personal/education/natural/business
    encrypted_data TEXT NOT NULL,   -- AES加密的JSON数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.4 好友关系表（friend_relations）

```sql
CREATE TABLE friend_relations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    exchanged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',  -- active/blocked
    last_contact_at TIMESTAMP,
    contact_frequency FLOAT DEFAULT 0.0
);
```

#### 5.1.5 匹配记录表（match_records）

```sql
CREATE TABLE match_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    target_user_id INTEGER REFERENCES users(id),
    match_score FLOAT NOT NULL,
    match_details JSONB,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.6 位置信息表（user_locations）

```sql
CREATE TABLE user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    location_type VARCHAR(50) NOT NULL,  -- residence/work/other
    address VARCHAR(500) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    is_realtime BOOLEAN DEFAULT FALSE,
    visible_range VARCHAR(50) DEFAULT 'friends',  -- friends/specific/none
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.7 简介卡片表（intro_cards）

```sql
CREATE TABLE intro_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    card_name VARCHAR(255) NOT NULL,
    scene_type VARCHAR(50),  -- alumni/industry/interest/custom
    content JSONB NOT NULL,
    style_settings JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.8 约见请求表（meeting_requests）

```sql
CREATE TABLE meeting_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    purpose VARCHAR(50),  -- coffee/dinner/project/interest
    suggested_time TIMESTAMP,
    suggested_location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',  -- pending/accepted/rejected/cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.9 提醒记录表（reminders）

```sql
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    reminder_type VARCHAR(50) NOT NULL,  -- birthday/anniversary/travel/no_contact
    reminder_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/completed/skipped
    content JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.10 信息更新记录表（friend_info_updates）

```sql
CREATE TABLE friend_info_updates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    update_type VARCHAR(50) NOT NULL,  -- project/work/skill/resource
    old_data JSONB,
    new_data JSONB,
    match_score_change VARCHAR(50),
    has_opportunity BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.11 企业微信会话表（work_wechat_sessions）

```sql
CREATE TABLE work_wechat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    work_wechat_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    context_data JSONB,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 索引设计

```sql
-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_work_wechat_id ON users(work_wechat_id);

-- 好友关系索引
CREATE INDEX idx_friend_relations_user_id ON friend_relations(user_id);
CREATE INDEX idx_friend_relations_friend_id ON friend_relations(friend_id);
CREATE INDEX idx_friend_relations_status ON friend_relations(status);

-- 匹配记录索引
CREATE INDEX idx_match_records_user_id ON match_records(user_id);
CREATE INDEX idx_match_records_target_user_id ON match_records(target_user_id);
CREATE INDEX idx_match_records_match_score ON match_records(match_score);

-- 位置信息索引
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_coordinates ON user_locations(latitude, longitude);

-- 提醒记录索引
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_status ON reminders(status);
```

### 5.3 数据加密

**加密方案**：
- 算法：AES-256
- 密钥生成：基于用户ID + 盐值（PBKDF2）
- 存储：加密后的JSON字符串存储在encrypted_data字段

**加密流程**：
```python
def encrypt_data(user_id: int, data: dict) -> str:
    # 生成用户专属密钥
    key = generate_key(user_id)
    
    # 转换为JSON
    json_data = json.dumps(data, ensure_ascii=False)
    
    # AES加密
    encrypted = fernet.encrypt(json_data.encode())
    
    # Base64编码
    return base64.b64encode(encrypted).decode()
```

---

## API设计

### 6.1 认证API

#### POST /api/auth/login
微信登录

**请求**：
```json
{
  "code": "微信code"
}
```

**响应**：
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": 1,
    "openid": "xxx",
    "nickname": "xxx",
    "avatar": "xxx"
  }
}
```

#### GET /api/auth/me
获取当前用户信息

**Headers**：
```
Authorization: Bearer {token}
```

**响应**：
```json
{
  "id": 1,
  "openid": "xxx",
  "nickname": "xxx",
  "avatar": "xxx"
}
```

### 6.2 语音录入API

#### POST /api/voice/process
处理语音/文字输入

**请求**：
```json
{
  "text": "用户输入的文字",
  "mode": "guided"  // guided or free
}
```

**响应**：
```json
{
  "success": true,
  "reply": "AI回复",
  "extractedInfo": {
    "姓名": "张三",
    "职位": "产品经理",
    "公司": "腾讯"
  },
  "matchFeedback": "已发现5位与您有共同点的用户"
}
```

#### POST /api/voice/upload
上传音频文件进行识别

**请求**：
- Content-Type: multipart/form-data
- audio: 音频文件

**响应**：
```json
{
  "success": true,
  "transcript": "识别出的文字"
}
```

### 6.3 简介卡片API

#### POST /api/intro-cards/generate
生成简介卡片

**请求**：
```json
{
  "card_name": "校友群简介",
  "scene_type": "alumni",  // alumni/industry/interest/custom
  "user_requirement": "自定义需求（可选）"
}
```

**响应**：
```json
{
  "success": true,
  "card": {
    "id": 1,
    "card_name": "校友群简介",
    "content": "我是2015届计算机专业的张三...",
    "scene_type": "alumni"
  }
}
```

#### GET /api/intro-cards/my
获取我的所有简介卡片

**响应**：
```json
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "card_name": "校友群简介",
      "scene_type": "alumni",
      "content": "...",
      "is_default": true,
      "share_count": 10
    }
  ]
}
```

### 6.4 地图API

#### POST /api/map/update-location
更新用户位置

**请求**：
```json
{
  "address": "北京市朝阳区XX路XX号",
  "location_type": "residence"  // residence/work/other
}
```

**响应**：
```json
{
  "success": true,
  "location": {
    "address": "北京市朝阳区XX路XX号",
    "latitude": 39.908823,
    "longitude": 116.397470
  }
}
```

#### GET /api/map/nearby-friends
获取附近的好友

**查询参数**：
- latitude: 纬度（可选，默认用户位置）
- longitude: 经度（可选，默认用户位置）
- radius: 半径（公里，默认10）

**响应**：
```json
{
  "success": true,
  "friends": [
    {
      "user_id": 2,
      "nickname": "李四",
      "avatar": "xxx",
      "address": "北京市朝阳区XX路",
      "latitude": 39.910000,
      "longitude": 116.400000,
      "distance": 0.5
    }
  ]
}
```

### 6.5 约见API

#### POST /api/meeting/create
创建约见请求

**请求**：
```json
{
  "receiver_id": 2,
  "purpose": "coffee",  // coffee/dinner/project/interest
  "suggested_time": "2024-01-01T14:00:00",
  "suggested_location": "XX咖啡厅",
  "notes": "备注信息"
}
```

**响应**：
```json
{
  "success": true,
  "meeting": {
    "id": 1,
    "status": "pending"
  }
}
```

#### GET /api/meeting/my
获取我的约见

**响应**：
```json
{
  "success": true,
  "sent": [
    {
      "id": 1,
      "receiver_id": 2,
      "purpose": "coffee",
      "suggested_time": "2024-01-01T14:00:00",
      "status": "pending"
    }
  ],
  "received": [
    {
      "id": 2,
      "requester_id": 3,
      "purpose": "dinner",
      "suggested_time": "2024-01-02T18:00:00",
      "status": "pending"
    }
  ]
}
```

#### POST /api/meeting/{meeting_id}/accept
接受约见

#### POST /api/meeting/{meeting_id}/reject
拒绝约见

### 6.6 匹配API

#### GET /api/match/realtime
获取实时匹配结果

**查询参数**：
- user_info: 用户当前输入的信息（JSON）

**响应**：
```json
{
  "success": true,
  "total_matches": 10,
  "matches": [
    {
      "user_id": 2,
      "match_score": 85.5,
      "match_details": {
        "exact_matches": ["学校", "专业"],
        "common_interests": ["篮球", "阅读"]
      }
    }
  ],
  "dimension_stats": {
    "education": 5,
    "interest": 8,
    "project": 3
  }
}
```

### 6.7 AI助手API

#### POST /api/assistant/query
AI助手查询

**请求**：
```json
{
  "query": "我想找做AI项目的朋友",
  "request_type": "project_match"
}
```

**响应**：
```json
{
  "success": true,
  "recommendations": [
    {
      "user_id": 2,
      "nickname": "李四",
      "match_score": 90,
      "match_reason": "在AI领域有丰富经验，与您的项目需求高度匹配"
    }
  ],
  "points_cost": 10
}
```

### 6.8 提醒API

#### GET /api/reminders/my
获取我的提醒

**响应**：
```json
{
  "success": true,
  "reminders": [
    {
      "id": 1,
      "friend_id": 2,
      "friend_nickname": "李四",
      "reminder_type": "birthday",
      "reminder_date": "2024-01-15T00:00:00",
      "status": "pending",
      "content": {
        "message": "李四的生日还有3天"
      }
    }
  ]
}
```

#### POST /api/reminders/{reminder_id}/complete
完成提醒

### 6.9 信息更新API

#### GET /api/updates/my
获取我的信息更新提醒

**响应**：
```json
{
  "success": true,
  "updates": [
    {
      "id": 1,
      "friend_id": 2,
      "friend_nickname": "李四",
      "update_type": "project",
      "match_score_change": "+20%",
      "has_opportunity": true,
      "opportunity_analysis": {
        "opportunity_type": "项目合作",
        "reason": "新增AI项目，与您的项目需求高度匹配"
      },
      "created_at": "2024-01-10T10:00:00"
    }
  ]
}
```

### 6.10 企业微信API

#### POST /api/work-wechat/message
接收企业微信消息（Webhook）

**请求**：
```json
{
  "work_wechat_id": "xxx",
  "message": "帮我找一下张三",
  "message_type": "text"
}
```

**响应**：
```json
{
  "success": true,
  "reply": "找到了张三，他是您的校友，目前在XX公司做XX。需要我帮您做什么？"
}
```

---

## 前端设计

### 7.1 页面结构

```
pages/
├── index/              # 首页
├── card/              # 名片页
├── voice-input/       # AI语音录入页
├── intro-card/        # 自我简介卡片页
├── map/               # 周边朋友地图页
├── meeting/           # 约见管理页
├── reminders/         # 提醒管理页
├── updates/           # 信息更新提醒页
├── exchange/          # 交换名片页
├── match/             # 匹配结果页
├── assistant/         # AI助手页
└── profile/           # 个人中心页
```

### 7.2 组件设计

```
components/
├── voice-recorder/    # 语音录制组件
├── ai-chat/           # AI对话组件
├── info-card/         # 信息确认卡片
├── match-feedback/    # 实时匹配反馈组件
├── intro-card-display/# 简介卡片展示组件
├── map-marker/        # 地图标记组件
├── meeting-card/      # 约见卡片组件
├── reminder-card/     # 提醒卡片组件
└── update-notification/# 更新通知组件
```

### 7.3 状态管理

**Vuex Store结构**：
```javascript
{
  state: {
    user: null,           // 当前用户
    token: null,          // JWT token
    isLoggedIn: false,    // 登录状态
    conversationState: null,  // 对话状态
    nearbyFriends: [],    // 附近好友
    reminders: []         // 提醒列表
  },
  mutations: {
    SET_USER,
    SET_TOKEN,
    LOGOUT,
    UPDATE_CONVERSATION_STATE,
    SET_NEARBY_FRIENDS,
    SET_REMINDERS
  },
  actions: {
    login,
    logout,
    loadUserInfo,
    processVoiceInput,
    loadNearbyFriends,
    loadReminders
  }
}
```

### 7.4 UI/UX设计原则

1. **简洁明了**：界面简洁，信息层次清晰
2. **实时反馈**：操作后立即显示反馈
3. **引导明确**：重要操作有明确引导
4. **错误处理**：友好的错误提示
5. **加载状态**：异步操作显示加载状态

---

## 安全设计

### 8.1 数据安全

1. **加密存储**：
   - 隐藏信息使用AES-256加密
   - 每个用户独立密钥
   - 密钥基于用户ID + 盐值生成

2. **传输安全**：
   - 所有API使用HTTPS
   - JWT Token认证
   - 敏感数据不在URL中传递

3. **访问控制**：
   - 仅好友可见隐藏信息
   - 用户可设置位置信息可见性
   - 约见请求需双方确认

### 8.2 隐私保护

1. **信息可见性**：
   - 用户可设置简介卡片可见范围
   - 位置信息支持模糊显示
   - 匹配反馈仅显示统计信息

2. **数据最小化**：
   - 仅收集必要信息
   - 定期清理过期数据
   - 用户可删除自己的数据

3. **合规性**：
   - 符合《个人信息保护法》
   - 遵循微信小程序开发规范
   - 用户协议和隐私政策

### 8.3 安全措施

1. **API安全**：
   - 请求频率限制
   - 参数验证
   - SQL注入防护
   - XSS防护

2. **认证安全**：
   - Token过期机制
   - 刷新Token机制
   - 异常登录检测

3. **数据备份**：
   - 定期数据备份
   - 加密备份文件
   - 灾难恢复方案

---

## 部署方案

### 9.1 环境要求

**后端**：
- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Celery（异步任务）

**前端**：
- Node.js 16+
- HBuilderX（开发工具）

### 9.2 部署架构

```
┌─────────────┐
│   CDN       │  (静态资源)
└─────────────┘
        │
┌───────▼───────┐
│  微信小程序    │
│   (前端)      │
└───────┬───────┘
        │
┌───────▼───────┐
│  Nginx        │  (反向代理)
└───────┬───────┘
        │
┌───────▼───────┐
│  FastAPI      │  (应用服务器)
│  (Gunicorn)   │
└───────┬───────┘
        │
    ┌───┴───┬──────────┬──────────┐
    │       │          │          │
┌───▼───┐ ┌─▼────┐ ┌──▼────┐ ┌───▼────┐
│PostgreSQL│ │Redis │ │Celery │ │对象存储│
└─────────┘ └──────┘ └───────┘ └────────┘
```

### 9.3 部署步骤

1. **环境准备**：
   ```bash
   # 安装Python依赖
   cd backend
   pip install -r requirements.txt
   
   # 配置环境变量
   cp .env.example .env
   # 编辑.env文件，填入配置
   ```

2. **数据库初始化**：
   ```bash
   # 创建数据库
   createdb tanmai
   
   # 初始化表结构
   python app/db/init_db.py
   ```

3. **启动服务**：
   ```bash
   # 启动FastAPI
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   
   # 启动Celery Worker
   celery -A app.tasks.celery_app worker --loglevel=info
   
   # 启动Celery Beat（定时任务）
   celery -A app.tasks.celery_app beat --loglevel=info
   ```

4. **前端部署**：
   - 使用HBuilderX打开frontend目录
   - 配置小程序AppID
   - 发行到微信小程序

### 9.4 监控与日志

1. **应用监控**：
   - 使用Prometheus监控指标
   - 使用Grafana可视化
   - 设置告警规则

2. **日志管理**：
   - 结构化日志（JSON格式）
   - 日志分级（DEBUG/INFO/WARNING/ERROR）
   - 日志轮转和归档

3. **性能监控**：
   - API响应时间
   - 数据库查询性能
   - Redis缓存命中率

---

## 开发计划

### 10.1 开发阶段

#### Phase 1: 基础框架（已完成）
- ✅ 项目初始化
- ✅ 数据库设计
- ✅ 认证系统
- ✅ 加密模块

#### Phase 2: 核心功能（已完成）
- ✅ AI语音录入系统
- ✅ 实时匹配反馈
- ✅ 自我简介卡片
- ✅ 地图系统
- ✅ 约见功能

#### Phase 3: 高级功能（待实现）
- ⏳ AI人脉维护小助理
- ⏳ 好友信息更新智能提醒
- ⏳ 探脉个人商务秘书（企业微信）
- ⏳ 完整匹配引擎
- ⏳ AI助手完整功能
- ⏳ 积分支付系统

#### Phase 4: 优化与测试
- ⏳ 性能优化
- ⏳ 安全加固
- ⏳ 全面测试
- ⏳ 上线准备

### 10.2 开发优先级

**P0（核心功能）**：
1. 用户认证
2. 信息录入
3. 基础匹配
4. 名片交换

**P1（重要功能）**：
1. 实时匹配反馈
2. 地图功能
3. 约见功能
4. 简介卡片

**P2（增强功能）**：
1. 人脉维护
2. 信息更新提醒
3. AI助手
4. 企业微信机器人

**P3（优化功能）**：
1. 性能优化
2. UI/UX优化
3. 数据分析
4. 运营工具

### 10.3 里程碑

- **M1（2周）**：基础框架完成
- **M2（4周）**：核心功能完成
- **M3（6周）**：高级功能完成
- **M4（8周）**：测试与优化
- **M5（10周）**：正式上线

---

## 附录

### A. 技术栈版本

- Python: 3.11+
- FastAPI: 0.104.1
- PostgreSQL: 14+
- Redis: 6+
- uni-app: 3.0+
- Vue: 3.3+
- 阿里云通义千问: 最新版本
- 腾讯地图API: 最新版本

### B. 第三方服务

1. **阿里云**：
   - 通义千问API（NLU）
   - ASR（语音识别）
   - TTS（语音合成）

2. **腾讯地图**：
   - 地理编码API
   - 逆地理编码API

3. **微信**：
   - 小程序API
   - 支付API
   - 企业微信API

### C. 参考资料

- [FastAPI文档](https://fastapi.tiangolo.com/)
- [uni-app文档](https://uniapp.dcloud.net.cn/)
- [阿里云通义千问文档](https://help.aliyun.com/zh/model-studio/)
- [腾讯地图API文档](https://lbs.qq.com/service/webService/webServiceGuide/webServiceOverview)

---

**文档版本**: v1.0  
**最后更新**: 2024-01-10  
**维护者**: 探脉开发团队

