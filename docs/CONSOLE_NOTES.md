# 控制台提示说明

## 1. Canvas 2D 建议

```
canvas 2d 接口支持同层渲染且性能更佳，建议切换使用
```

**说明**：地图页用旧版 `canvas-id` 生成圆形头像，微信建议迁移到 Canvas 2D。

**影响**：仅为建议，当前实现可用，不影响功能。

**迁移**：需将 `map.wxml` 的 `<canvas canvas-id="...">` 改为 `<canvas type="2d" id="...">`，并在 `map.js` 中用 `createSelectorQuery` 获取 node，使用 `getContext('2d')` 等新接口。工作量较大，可暂缓。

---

## 2. 404 接口

```
GET /api/intro-cards/user/10 404
GET /api/alumni/match-with?user_id=10 404
```

**说明**：校友详情页会请求这两个接口，后端尚未实现，返回 404。

**影响**：前端已用 try-catch 处理，会显示默认内容：
- 简介卡片：空列表
- AI 匹配：`暂无 AI 匹配结果，敬请期待。`

**解决**：后端需实现：
- `GET /api/intro-cards/user/{uid}` 返回某用户的简介卡片
- `GET /api/alumni/match-with?user_id=xxx` 返回与某校友的 AI 匹配内容

---

## 3. reportRealtimeAction:fail

**说明**：微信内部接口，与业务代码无关，可忽略。
