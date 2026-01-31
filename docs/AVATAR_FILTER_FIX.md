# 头像性别筛选 Bug 修复

## 问题
- 选择性别「女」时，能正确只显示女头像 ✓
- 选择性别「男」时，却显示**全部**头像（男+女）✗

## 原因
`"female"` 包含子串 `"male-"`：

```javascript
// JavaScript 中：
"female-young-1.png".indexOf("male-")  // 返回 2（匹配 fe"male-" 中的 "male-"）
```

因此用 `indexOf('male-')` 筛选男头像时，会**误匹配**女头像 URL，导致筛选失效。

## 修复

在 `wx-mini/pages/card-entry/card-entry.js` 的 `updateFilteredAvatarOptions` 中：

**原代码：**
```javascript
if (isMale) {
  filtered = all.filter(o => !o.value || o.value.indexOf('male-') !== -1)
} else if (isFemale) {
  filtered = all.filter(o => !o.value || o.value.indexOf('female-') !== -1)
}
```

**修改为：**
```javascript
if (isMale) {
  // 使用 /avatars/male- 避免误匹配 female-（因为 "female" 包含 "male-"）
  filtered = all.filter(o => !o.value || o.value.indexOf('/avatars/male-') !== -1)
} else if (isFemale) {
  filtered = all.filter(o => !o.value || o.value.indexOf('female-') !== -1)
}
```

女头像的 URL 为 `.../avatars/female-middle-1.png`，不包含 `/avatars/male-`，因此不会被误匹配。
