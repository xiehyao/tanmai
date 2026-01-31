# VNC + HBuilderX 配置指南

## ✅ 当前状态

- VNC服务器：已安装
- 桌面环境：正在安装XFCE
- VNC服务：已配置并启动

## 📋 配置步骤

### 1. 设置VNC密码

**重要**：需要手动设置VNC密码才能连接。

```bash
# 以root用户登录后执行
vncpasswd
```

按提示输入密码（至少6位），用于VNC客户端连接。

### 2. 启动VNC服务

```bash
# 启动VNC服务（显示端口:1，对应5901端口）
systemctl start vncserver@:1.service

# 设置开机自启
systemctl enable vncserver@:1.service

# 查看状态
systemctl status vncserver@:1.service
```

### 3. 检查防火墙

确保VNC端口（5901）已开放：

```bash
# 检查防火墙状态
firewall-cmd --list-all

# 如果需要，开放VNC端口
firewall-cmd --permanent --add-service=vnc-server
firewall-cmd --reload
```

### 4. 连接VNC

使用VNC客户端连接：
- **地址**：`43.143.224.158:5901` 或 `43.143.224.158:1`
- **密码**：您设置的VNC密码

**推荐的VNC客户端**：
- Windows: TightVNC Viewer, RealVNC Viewer
- Mac: RealVNC Viewer, Screen Sharing
- Linux: Remmina, TigerVNC Viewer

### 5. 下载并安装HBuilderX

#### 5.1 下载HBuilderX

访问HBuilderX官网：https://www.dcloud.io/hbuilderx.html

下载Linux版本（AppImage格式）：
- 下载地址：https://www.dcloud.io/hbuilderx.html
- 选择"Linux"版本下载

#### 5.2 上传到服务器

将下载的HBuilderX文件上传到服务器：

```bash
# 使用scp上传（从本地电脑执行）
scp HBuilderX-*.AppImage root@43.143.224.158:/opt/hbuilderx/

# 或者使用其他方式上传到 /opt/hbuilderx/ 目录
```

#### 5.3 安装HBuilderX

在VNC桌面中：

1. 打开终端（Applications → Terminal 或 xfce4-terminal）
2. 进入HBuilderX目录：
   ```bash
   cd /opt/hbuilderx
   ```
3. 添加执行权限：
   ```bash
   chmod +x HBuilderX-*.AppImage
   ```
4. 运行HBuilderX：
   ```bash
   ./HBuilderX-*.AppImage
   ```

#### 5.4 首次运行配置

1. HBuilderX首次运行会解压到 `~/.HBuilderX/` 目录
2. 等待初始化完成
3. 打开项目：File → Open Directory → 选择 `/var/www/html/moodle/tanmai/frontend`

### 6. 编译uni-app项目

在HBuilderX中：

1. **打开项目**：File → Open Directory → `/var/www/html/moodle/tanmai/frontend`
2. **编译H5**：
   - 点击菜单：发行 → 网站-H5
   - 或者：运行 → 运行到浏览器 → Chrome
3. **编译输出**：编译后的文件在 `frontend/dist/build/h5/` 目录

### 7. 部署编译后的文件

编译完成后，将文件部署到Apache：

```bash
# 复制编译后的文件到Apache目录
cp -r /var/www/html/moodle/tanmai/frontend/dist/build/h5/* /var/www/html/moodle/tanmai/frontend/dist/

# 或者配置Apache直接指向编译输出目录
```

## 🔧 故障排除

### VNC连接失败

1. 检查VNC服务状态：
   ```bash
   systemctl status vncserver@:1.service
   ```

2. 检查端口是否监听：
   ```bash
   netstat -tlnp | grep 5901
   ```

3. 检查防火墙：
   ```bash
   firewall-cmd --list-all
   ```

4. 查看VNC日志：
   ```bash
   cat ~/.vnc/*:1.log
   ```

### HBuilderX无法运行

1. 检查文件权限：
   ```bash
   chmod +x /opt/hbuilderx/HBuilderX-*.AppImage
   ```

2. 检查依赖：
   ```bash
   # 可能需要安装一些库
   yum install -y libX11 libXext libXrender libXtst
   ```

3. 查看错误信息：
   ```bash
   /opt/hbuilderx/HBuilderX-*.AppImage --no-sandbox
   ```

## 📝 工作流程

### 日常开发流程

1. **修改代码**（不需要VNC）：
   - 通过SSH编辑代码
   - 或使用编辑器远程编辑

2. **编译前端**（需要VNC）：
   - 连接VNC
   - 在HBuilderX中刷新项目
   - 重新编译

3. **测试**：
   - 访问 `http://43.143.224.158/tanmai/` 查看效果

### 保持VNC连接

可以保持VNC连接一直开启，这样随时可以编译，不需要每次重新连接。

## 🎯 下一步

1. ✅ 设置VNC密码
2. ✅ 连接VNC桌面
3. ✅ 下载并安装HBuilderX
4. ✅ 打开项目并编译
5. ✅ 部署编译后的文件

