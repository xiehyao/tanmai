# 用户信息字段填写清单

## 角色1：谢怀遥（普通用户）- 需要填写的字段

### 📋 基本信息（users 表）
|--------|------|----------|--------|
| **name** | 真实姓名 |  谢怀遥 |
| **nickname** | 微信昵称 |  hyman |
| **avatar** | 头像URL |  https://example.com/avatar.png |
| **birth_place** | 出生地点 |  福建省泉州市惠安县 |

---

### 💼 名片信息（user_cards 表）

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **name** | 姓名（名片上的） | 可选 | 谢怀遥 |
| **title** | 职位/头衔 | 可选 | 腾讯金融消保部副总经理&产品专家；北邮深港澳校友会执行秘书长；北邮新加坡校友会副秘书长 |
| **company** | 公司名称 | ✅ 推荐 | 腾讯公司 |
| **phone** | 电话号码 | 可选 | (+86)13534179243; (+65)82289397 |
| **email** | 邮箱地址 | 可选 | xiehyao@qq.com |
| **bio** | 个人简介 | 可选 | 爱家乡，爱读书，爱拼搏 |

---

### 🎓 教育信息（user_education 表）

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **primary_school** | 小学学校 | 可选 | 惠安县八二三小学 |
| **primary_graduation_year** | 小学毕业年份 | 可选 | 1994 |
| **middle_school** | 初中学校 | 可选 | 福建省惠安第一中学 |
| **middle_graduation_year** | 初中毕业年份 | 可选 | 1997 |
| **high_school** | 高中学校 | ✅ 推荐 | 福建省惠安第一中学 |
| **high_graduation_year** | 高中毕业年份 | ✅ 推荐 | 2000 |
| **bachelor_university** | 本科大学 | ✅ 推荐 | 北京邮电大大学 |
| **bachelor_major** | 本科专业 | 可选 | 通信工程；工业设计 |
| **bachelor_graduation_year** | 本科毕业年份 | 可选 | 2004 |
| **master_university** | 硕士大学 | 可选 | 北京邮电大学 |
| **master_major** | 硕士专业 | 可选 | 移动通信技术 |
| **master_graduation_year** | 硕士毕业年份 | 可选 | 2007 |
| **doctor_university** | 博士大学 | 可选 | 无 |
| **doctor_major** | 博士专业 | 可选 | 无 |
| **doctor_graduation_year** | 博士毕业年份 | 可选 | 无 |
| **highest_degree** | 最高学历 | ✅ 推荐 | 硕士 |

---

### 💑 需求信息（user_needs 表）

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **marital_status** | 婚姻状况 | 可选 | married |
| **dating_need** | 是否有相亲需求 | 可选 | false |
| **dating_preferences** | 相亲偏好描述 | 可选 | 找个年轻的人一起吃饭聊天 |
| **job_seeking** | 是否在找工作 | 可选 | false |
| **job_target_position** | 目标职位 | 可选 | 产品总监；运营总监；总经理助理 |
| **job_target_industry** | 目标行业 | 可选 | 互联网 / 人工智能 |
| **job_preferences** | 工作偏好描述 | 可选 | 希望在一线城市，薪资面议 |
| **entrepreneurship_need** | 是否有创业需求 | 可选 | true |
| **entrepreneurship_type** | 创业需求类型 | 可选 | resource / partner / both |
| **entrepreneurship_description** | 创业需求描述 | 可选 | 寻找技术合伙人，准备做AI相关的创业项目 |

---

### 📍 位置信息（user_locations 表）

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **location_type** | 位置类型 | ✅ 必填 | residence / work / other |
| **address** | 详细地址 | ✅ 必填 | 深圳市南山区锦隆花园锦虹阁 |
| **latitude** | 纬度 | 自动 | 22.5400（系统自动获取） |
| **longitude** | 经度 | 自动 | 113.9400（系统自动获取） |
| **visible_range** | 可见范围 | 可选 | friends / specific / none |

---

### 💡 资源分享信息（user_resources 表）- 可多条

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **resource_type** | 资源类型 | ✅ 必填 | experience / knowledge / resource / connection / other |
| **resource_title** | 资源标题 | ✅ 必填 | 互联网创业经验分享；国家部委工作对接；腾讯人脉圈；北邮人脉圈 |
| **resource_description** | 资源描述 | ✅ 必填 | 在互联网行业19年的经验教训，包括团队管理、产品策划&运营经验等；国家部分对接工作经验；腾讯、北邮等校友会人脉圈组织经验 |
| **sharing_mode** | 分享方式 | ✅ 必填 | free / collaboration / both |


---

### 🏛️ 校友会参与信息（user_association_info 表）

| 字段名 | 说明 | 是否必填 | 示例值 |
|--------|------|----------|--------|
| **willing_to_serve** | 是否愿意为校友会做工作 | 可选 | true |
| **contribution_types** | 能为校友会做什么 | 可选 | effor - money / effort / resource / all（可多个，用逗号分隔） |
| **contribution_description** | 具体贡献能力描述 | 可选 | 可以提供技术支持和活动场地资源 |
| **desired_position** | 希望担任的职务 | 可选 | 会长或秘书长 - 技术顾问 / 副会长 / 秘书长 |
| **position_preferences** | 职务偏好和说明 | 可选 | 希望能在科技委员会任职 |
| **association_needs** | 对校友会有何需求 | 可选 | 希望能有更多行业交流活动和创业资源对接 |