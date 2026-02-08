# tanmai 三备份同步说明

## 架构

```
国内服务器                     新加坡服务器                     GitHub
(43.143.224.158)              (43.160.245.130)                 (xiehyao/tanmai)

本地 Gitea  ←─── push ───┐
                         ├──►  新加坡 Gitea  ── Push Mirror ──►  GitHub
         ──── push ──────┘
         
pull: GitHub (能连时) 或 新加坡 Gitea (不能连 GitHub 时)
```

## 一、前置准备

### 1. GitHub

- 登录 https://github.com/xiehyao
- 新建仓库 `tanmai`（空仓库，不勾选 README）
- 若私有仓库：Settings → Developer settings → Personal access tokens → 生成 Token，供 Gitea 使用

### 2. 新加坡 Gitea

- 登录 http://43.160.245.130:3000
- 新建仓库 `tanmai`（空仓库）
- 仓库路径需与 remote 一致，如 `root/tanmai` 或 `你的用户名/tanmai`

### 3. 若新加坡路径不是 root/tanmai

修改 remote：

```bash
git remote set-url sgp http://43.160.245.130:3000/你的用户名/tanmai.git
```

## 二、新加坡 Gitea → GitHub 镜像

让新加坡收到 push 后自动同步到 GitHub：

1. 进入新加坡 Gitea 的 `tanmai` 仓库
2. **Settings** → **Repository** → **Push Mirrors**
3. 添加 Push Mirror：
   - URL: `https://github.com/xiehyao/tanmai.git`
   - 认证：
     - 公开仓库：可不填
     - 私有仓库：用 `https://xiehyao:你的GitHub_Token@github.com/xiehyao/tanmai.git`
   - 勾选「Sync on push」等选项

之后：国内 push 到新加坡 Gitea → 新加坡自动 push 到 GitHub。

## 三、国内服务器使用

### Remote 已配置

```
origin  →  http://43.143.224.158:3000/root/tanmai.git  (本地 Gitea)
sgp     →  http://43.160.245.130:3000/root/tanmai.git  (新加坡 Gitea)
github  →  https://github.com/xiehyao/tanmai.git
```

### 日常推送（推荐）

```bash
./scripts/git-sync.sh push
```

### 脚本丢失恢复

若 `scripts/git-sync.sh` 丢失：`cp docs/git-sync.sh.backup scripts/git-sync.sh && chmod +x scripts/git-sync.sh`

会依次推送到：origin → sgp → github（github 失败不影响，新加坡会镜像）

### 手动推送

```bash
git push origin master
git push sgp master
git push github master   # 国内可能失败，忽略即可
```

### 拉取

```bash
./scripts/git-sync.sh pull
```

会先尝试 github，失败则从 sgp 拉。

## 四、首次推送

新加坡和 GitHub 的 tanmai 需先存在（空仓库）。然后在国内执行：

```bash
cd /var/www/html/moodle/tanmai
./scripts/git-sync.sh push
```

若新加坡路径不是 `root/tanmai`，先改 remote 再执行。
