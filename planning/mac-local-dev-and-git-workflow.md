## Mac 本地开发与三备份 Git 流程（tanmai）

### 1. 在 Mac 上 git clone

- **推荐从 GitHub 克隆（网络最稳）**：

```bash
git clone git@github.com:xiehyao/tanmai.git
cd tanmai
git remote -v  # 可看到 origin / sgp / github 三个远端
```

- **也可以直接从服务器 Gitea 克隆**：

```bash
# 本地 Gitea（43.143.224.158）
git clone http://43.143.224.158:3000/root/tanmai.git

# 新加坡 Gitea（43.160.245.130）
git clone http://43.160.245.130:3000/root/tanmai.git
```

### 2. Mac 本地 git commit + 三备份 push

tanmai 仓库已经内置 `scripts/git-sync.sh`，在 Mac 本地 clone 后同样可用：

```bash
cd tanmai

# 开发前先拉最新
./scripts/git-sync.sh pull

# 开发完成后
git status              # 自检改动
git add <相关文件...>   # 或者 git add .
git commit -m "模块：描述"

# 三备份推送（本地 Gitea + 新加坡 + GitHub）
./scripts/git-sync.sh push
```

#### 2.1 建议在 Mac 上放一个快捷脚本（可选）

在个人 home 目录或任意 PATH 下，新建 `tanmai-git-push.sh`（不放进仓库，只做个人工具）：

```bash
#!/bin/bash
set -e

REPO_ROOT="${1:-$PWD}"
cd "$REPO_ROOT"

echo ">>> git status"
git status

if [ -z "$2" ]; then
  echo "用法: tanmai-git-push.sh <repo-path> \"提交说明\""
  exit 1
fi

MSG="$2"

git add .
git commit -m "$MSG"
./scripts/git-sync.sh push
```

使用示例：

```bash
tanmai-git-push.sh ~/workspace/tanmai "后端：xxx 接口优化"
```

### 3. Mac 本地运行后端时的 DB / Redis / COS 配置

#### 3.1 当前后端配置方式（统一走环境变量）

`backend/app/core/config.py` 中：

- `DATABASE_URL` 默认：`mysql+pymysql://apache:pengyoo123@localhost:3306/tanmai`
- `REDIS_HOST` / `REDIS_PORT` 默认：`localhost:6379`
- COS / DeepSeek / 腾讯云等均通过相关环境变量（如 `UPLOAD_URL_BASE`、`DEEPSEEK_BASE_URL` 等）配置。

**结论**：后端已经支持用环境变量覆盖，不需要改代码；在 Mac 本地只要准备好 `.env` 或 shell 环境即可。

#### 3.2 Mac 本地如何指向服务器上的 DB / Redis

在 Mac 本地 tanmai 根目录下，新建 `.env`（不进 git，已在 `.gitignore` 中），示例：

```bash
# MySQL：指向服务器 IP，而不是 localhost
DATABASE_URL=mysql+pymysql://apache:pengyoo123@43.143.224.158:3306/tanmai

# Redis：若需要也走服务器
REDIS_HOST=43.143.224.158
REDIS_PORT=6379
REDIS_DB=0
```

然后在 Mac 本地运行后端时（例如调试）：

```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

此时：

- DB、Redis 均连到服务器，而不是 Mac 本机。
- COS 相关 URL（例如头像）本来就是公网 `https://tanmai-xxxx.cos.ap-guangzhou.myqcloud.com/...`，与运行地点无关，无需额外修改。

> 若不希望本地直接连生产库，可在服务器上额外开一套「测试库」，并为 Mac 本地提供单独的 `DATABASE_URL`，原则上都只需改 `.env`，不需要动代码。

### 4. 微信小程序端的 API Base 与 COS

`wx-mini/utils/request.js` 中：

- `apiBase` 默认：`https://www.pengyoo.com`
- 也可以在小程序 `app.globalData.apiBase` 或 `config.js` 中覆盖。

因此：

- 在 Mac 本地用微信开发者工具调试时，**请求仍然直接打到线上域名**（或你配置的公网网关），不会走 `localhost`。
- COS 头像等资源为固定公网 URL，不依赖本地环境。

如需切换到「测试环境 API 域名」，只需要在 `wx-mini/config.js` 中设置不同的 `apiBase`，不必改后端代码。

