# 探脉部署与配置守护

## Apache 配置（www.pengyoo.com）

- **canonical 配置**（以 repo 为准）：
  - `apache/pengyoo-ssl.conf` → 部署到 `/etc/httpd/conf.d/pengyoo-ssl.conf`（HTTPS + /api 反向代理）
  - `apache/http-redirect.conf` → 部署到 `/etc/httpd/conf.d/http-redirect.conf`（80→443 重定向）

### 修改配置的正确流程

1. 在 **tanmai/deploy/apache/** 下修改对应 `.conf` 文件。
2. `git add` 并 `git commit`，执行 `./scripts/git-sync.sh push`。
3. 在服务器上部署并重载：
   ```bash
   sudo cp /var/www/html/moodle/tanmai/deploy/apache/pengyoo-ssl.conf /etc/httpd/conf.d/
   sudo cp /var/www/html/moodle/tanmai/deploy/apache/http-redirect.conf /etc/httpd/conf.d/
   sudo systemctl reload httpd
   ```

## 配置守护（防误改）

`guard-apache-config.sh` 会对比 `/etc/httpd/conf.d/` 与 repo 中 `deploy/apache/` 的配置；若不一致则：

- 使用 **logger** 打标 `pengyoo-apache-guard` 告警；
- 自动用 repo 中的配置覆盖 `/etc/httpd/conf.d/` 并执行 `systemctl reload httpd`。

### 安装 cron（需 root）

```bash
sudo bash -c 'echo "*/5 * * * * root /var/www/html/moodle/tanmai/deploy/guard-apache-config.sh" >> /etc/crontab'
# 或
sudo crontab -e
# 添加：*/5 * * * * /var/www/html/moodle/tanmai/deploy/guard-apache-config.sh
```

确保脚本可执行：`sudo chmod +x /var/www/html/moodle/tanmai/deploy/guard-apache-config.sh`

### 查看告警

- `journalctl -t pengyoo-apache-guard` 或 `grep pengyoo-apache-guard /var/log/messages`（视系统而定）。
