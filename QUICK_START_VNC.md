# VNC + HBuilderX 快速开始

## ✅ 已完成的配置

- ✅ VNC服务器已安装并启动
- ✅ VNC服务已配置（端口:1，对应5901）
- ✅ 防火墙已配置
- ✅ HBuilderX安装目录已准备：`/opt/hbuilderx/`

## 🚀 立即开始

### 第一步：设置VNC密码

**必须执行**，否则无法连接VNC：

```bash
vncpasswd
```

按提示输入密码（至少6位），用于VNC客户端连接。

### 第二步：连接VNC

使用VNC客户端连接到：
- **地址**：`43.143.224.158:5901` 或 `43.143.224.158:1`
- **密码**：您刚才设置的密码

**推荐VNC客户端**：
- Windows: [TightVNC Viewer](https://www.tightvnc.com/download.php)
- Mac: 内置"屏幕共享"或 [RealVNC Viewer](https://www.realvnc.com/download/viewer/)
- Linux: `sudo yum install tigervnc` 然后运行 `vncviewer`

### 第三步：下载HBuilderX

1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载 **Linux版本**（AppImage格式）
3. 上传到服务器：
   ```bash
   # 从本地电脑执行
   scp HBuilderX-*.AppImage root@43.143.224.158:/opt/hbuilderx/
   ```

### 第四步：在VNC中运行HBuilderX

连接VNC后，在终端中执行：

```bash
cd /opt/hbuilderx
chmod +x HBuilderX-*.AppImage
./HBuilderX-*.AppImage
```

### 第五步：打开项目并编译

1. 在HBuilderX中：File → Open Directory
2. 选择：`/var/www/html/moodle/tanmai/frontend`
3. 编译：发行 → 网站-H5
4. 编译输出：`frontend/dist/build/h5/`

## 📋 详细说明

完整配置指南请查看：`VNC_HBUILDERX_SETUP.md`

## ⚠️ 重要提示

1. **必须先设置VNC密码**才能连接
2. **首次运行HBuilderX**会解压到 `~/.HBuilderX/`，需要等待
3. **编译后的文件**需要部署到Apache才能访问

## 🔧 常用命令

```bash
# 查看VNC服务状态
systemctl status vncserver@:1.service

# 重启VNC服务
systemctl restart vncserver@:1.service

# 查看VNC日志
cat ~/.vnc/*:1.log

# 检查端口
ss -tlnp | grep 5901
```

