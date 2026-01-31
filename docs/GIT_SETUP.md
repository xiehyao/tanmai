# tanmai Git + Gitea 配置指南

## 一、当前状态

- ✅ **本地 Git**：tanmai 已完成 `git init` 和首次提交
- ⏳ **Gitea 远程**：需在 Gitea 上创建仓库并添加远程

## 二、Gitea 与 Git 的关系

|  | Git | Gitea |
|---|---|---|
| **作用** | 本地版本控制 | 远程备份 + Web 管理 |
| **必需** | ✅ 必需（防丢失） | 推荐（云端备份） |
| **使用** | 每次修改后 commit | 定期 push |

**建议：两者都用** —— 本地 Git 保证每次修改有记录，Gitea 提供远程备份和跨设备同步。

## 三、配置 Gitea 远程

### 3.1 在 Gitea 上创建仓库

1. 浏览器打开：http://43.143.224.158:3000
2. 登录（管理员账号：root）
3. 点击右上角 **+** → **New Repository**
4. 填写：
   - **Repository Name**：`tanmai`
   - **Description**：探脉小程序+后端
   - **Visibility**：Private 或 Public
5. 点击 **Create Repository**
6. 复制仓库地址，例如：`http://43.143.224.158:3000/root/tanmai.git`

### 3.2 添加远程并推送

```bash
cd /var/www/html/moodle/tanmai

# 添加 Gitea 远程
git remote add origin http://43.143.224.158:3000/root/tanmai.git

# 推送（首次需输入 Gitea 账号密码）
git push -u origin master
```

### 3.3 保存认证（避免每次输密码）

```bash
# 凭证缓存 15 分钟
git config credential.helper cache

# 或永久保存（不太安全但方便）
git config credential.helper store
```

## 四、日常工作流

### 每次修改后（必须）

```bash
cd /var/www/html/moodle/tanmai
git add -A
git status          # 确认修改内容
git commit -m "描述本次修改"
```

### 定期推送到 Gitea（推荐）

```bash
git push
```

## 五、Cursor AI 规则

已配置 `.cursorrules`，要求 AI 在修改 tanmai 文件后自动执行 git commit。请确保遵守。

## 六、故障恢复

若本地代码丢失：
```bash
cd /var/www/html/moodle
rm -rf tanmai
git clone http://43.143.224.158:3000/root/tanmai.git tanmai
```
