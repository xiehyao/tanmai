# API文档

## 认证

### POST /api/auth/login
微信登录

请求：
```json
{
  "code": "微信code"
}
```

响应：
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": 1,
    "openid": "xxx",
    "nickname": "xxx"
  }
}
```

## 语音录入

### POST /api/voice/process
处理语音/文字输入

请求：
```json
{
  "text": "用户输入的文字",
  "mode": "guided"  // guided or free
}
```

响应：
```json
{
  "success": true,
  "reply": "AI回复",
  "extractedInfo": {},
  "matchFeedback": "匹配反馈"
}
```

## 简介卡片

### POST /api/intro-cards/generate
生成简介卡片

请求：
```json
{
  "card_name": "卡片名称",
  "scene_type": "alumni",  // alumni/industry/interest/custom
  "user_requirement": "自定义需求（可选）"
}
```

### GET /api/intro-cards/my
获取我的所有简介卡片

## 地图

### POST /api/map/update-location
更新用户位置

请求：
```json
{
  "address": "地址",
  "location_type": "residence"  // residence/work/other
}
```

### GET /api/map/nearby-friends
获取附近的好友

参数：
- latitude: 纬度
- longitude: 经度
- radius: 半径（公里）

## 约见

### POST /api/meeting/create
创建约见请求

请求：
```json
{
  "receiver_id": 2,
  "purpose": "coffee",
  "suggested_time": "2024-01-01T14:00:00",
  "suggested_location": "XX咖啡厅",
  "notes": "备注"
}
```

### GET /api/meeting/my
获取我的约见

### POST /api/meeting/{meeting_id}/accept
接受约见

### POST /api/meeting/{meeting_id}/reject
拒绝约见

## 名片录入（card-entry，后端需在 pengyoo 等服务实现）

### POST /api/card-entry/save-step/1（工作人员新增校友）

当工作人员代填模式下点击「新增」按钮，在空白表单填写后保存第一步时，请求体包含 `create_new: true`，且**无** `target_user_id` 查询参数。

后端需：
1. 校验 X-Staff-Id 工号
2. 创建新用户（User + UserCard）
3. 保存 step1 数据到新用户
4. 返回 `{ user_id: <新用户ID> }`

前端将据此设置 targetUser，继续后续步骤。

