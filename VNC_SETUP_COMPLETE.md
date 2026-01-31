# ✅ VNC + HBuilderX 配置完成

## 🎉 配置状态

所有服务器端配置已完成！

- ✅ VNC服务器已安装
- ✅ VNC服务已配置（端口:1，对应5901）
- ✅ xstartup脚本已配置
- ✅ HBuilderX安装目录已准备：`/opt/hbuilderx/`
- ✅ 防火墙未启用（无需额外配置）

## 🚀 立即开始（3步）

### 第1步：设置VNC密码（必须）

**这是唯一需要手动执行的命令**：

```bash
vncpasswd
```

按提示输入密码（至少6位），这是连接VNC时需要的密码。

### 第2步：启动VNC服务

设置密码后，启动服务：

```bash
systemctl start vncserver@:1.service
systemctl enable vncserver@:1.service  # 设置开机自启
```

验证服务已启动：

```bash
systemctl status vncserver@:1.service
ss -tlnp | grep 5901
```

如果看到5901端口在监听，说明VNC已成功启动！

### 第3步：连接VNC

使用VNC客户端连接到：
- **地址**：`43.143.224.158:5901` 或 `43.143.224.158:1`
- **密码**：您在第1步设置的密码

**推荐VNC客户端**：
- Windows: [TightVNC Viewer](https://www.tightvnc.com/download.php)
- Mac: 内置"屏幕共享"或 [RealVNC Viewer](https://www.realvnc.com/download/viewer/)
- Linux: `sudo yum install tigervnc` 然后运行 `vncviewer`

## 📦 安装HBuilderX

### 1. 下载HBuilderX

访问：https://www.dcloud.io/hbuilderx.html

下载 **Linux版本**（AppImage格式）

### 2. 上传到服务器

```bash
# 从本地电脑执行
scp HBuilderX-*.AppImage root@43.143.224.158:/opt/hbuilderx/
```

### 3. 在VNC中运行

连接VNC后，在终端中执行：

```bash
cd /opt/hbuilderx
chmod +x HBuilderX-*.AppImage
./HBuilderX-*.AppImage
```

### 4. 打开项目并编译

1. 在HBuilderX中：**File → Open Directory**
2. 选择：`/var/www/html/moodle/tanmai/frontend`
3. 编译：**发行 → 网站-H5**
4. 编译输出：`frontend/dist/build/h5/`

## 📋 工作流程

### 日常开发

1. **修改代码**（不需要VNC）：
   - 通过SSH编辑代码
   - 或使用编辑器远程编辑

2. **编译前端**（需要VNC）：
   - 连接VNC（或保持连接）
   - 在HBuilderX中刷新项目
   - 重新编译

3. **测试**：
   - 访问 `http://43.143.224.158/tanmai/` 查看效果

**提示**：可以保持VNC连接一直开启，这样随时可以编译！

## 🔧 常用命令

```bash
# 查看VNC服务状态
systemctl status vncserver@:1.service

# 重启VNC服务
systemctl restart vncserver@:1.service

# 停止VNC服务
systemctl stop vncserver@:1.service

# 查看VNC日志
cat ~/.vnc/*:1.log

# 检查端口
ss -tlnp | grep 5901
```

## 📚 相关文档

- **快速开始**：`QUICK_START_VNC.md`
- **详细配置**：`VNC_HBUILDERX_SETUP.md`
- **当前状态**：`VNC_STATUS.md`

## ⚠️ 重要提示

1. **必须先设置VNC密码**才能启动服务
2. **首次运行HBuilderX**会解压到 `~/.HBuilderX/`，需要等待几分钟
3. **编译后的文件**在 `frontend/dist/build/h5/`，需要部署到Apache才能访问

## 🎯 下一步

1. ✅ 执行 `vncpasswd` 设置密码
2. ✅ 启动VNC服务
3. ✅ 连接VNC桌面
4. ✅ 下载并上传HBuilderX
5. ✅ 运行HBuilderX并编译项目

**现在就可以开始第1步了！** 🚀

