# VNC和HBuilderX配置指南

## ✅ 当前状态

### VNC服务器
- ✅ VNC软件已安装（tigervnc-server）
- ⚠️ 需要设置VNC密码才能启动
- 📝 新版本使用systemd服务

### HBuilderX
- ⚠️ 需要手动下载Linux版本
- 📥 下载地址：https://www.dcloud.io/hbuilderx.html

## 🔧 配置步骤

### 1. 设置VNC密码（需要交互）

在服务器上执行：
```bash
vncpasswd
# 输入密码（至少6位）
# 确认密码
```

### 2. 启动VNC服务器

```bash
# 方式1：使用systemd（推荐）
systemctl start vncserver@:1.service
systemctl enable vncserver@:1.service

# 方式2：直接启动（如果systemd未配置）
vncserver :1 -geometry 1920x1080 -depth 24
```

### 3. 下载HBuilderX

手动下载：
1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载Linux版本（.tar.gz格式）
3. 上传到服务器：`/opt/hbuilderx/`

然后解压：
```bash
cd /opt/hbuilderx
tar -xzf HBuilderX-*.tar.gz
chmod +x HBuilderX/HBuilderX
```

### 4. 通过VNC连接

1. 使用VNC客户端（如TightVNC、RealVNC、TigerVNC）
2. 连接到：`43.143.224.158:5901`
3. 输入VNC密码

### 5. 在VNC中运行HBuilderX

```bash
cd /opt/hbuilderx/HBuilderX
./HBuilderX
```

## 📋 防火墙配置

如果需要从外网访问VNC，需要开放端口：
```bash
firewall-cmd --permanent --add-port=5901/tcp
firewall-cmd --reload
```

