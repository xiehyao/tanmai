# 快速开始指南

## 🎯 目标：在服务器上使用HBuilderX编译前端

## 📋 需要您手动完成的步骤

由于VNC密码设置和HBuilderX下载需要交互，以下是您需要手动完成的步骤：

### 第一步：设置VNC密码

SSH连接到服务器，执行：
```bash
vncpasswd
# 输入密码（至少6位，例如：tanmai123）
# 确认密码
```

### 第二步：启动VNC服务器

```bash
vncserver :1 -geometry 1920x1080 -depth 24
```

### 第三步：配置防火墙（如果需要外网访问）

```bash
firewall-cmd --permanent --add-port=5901/tcp
firewall-cmd --reload
```

### 第四步：下载HBuilderX

1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载Linux版本（选择.tar.gz格式）
3. 上传到服务器：`/opt/hbuilderx/`

然后解压：
```bash
cd /opt/hbuilderx
tar -xzf HBuilderX-*.tar.gz
chmod +x HBuilderX/HBuilderX
```

### 第五步：通过VNC连接并使用

1. **安装VNC客户端**（如果还没有）
   - Windows: TightVNC Viewer, RealVNC Viewer
   - Mac: Built-in Screen Sharing 或 VNC Viewer
   - Linux: Remmina, TigerVNC Viewer

2. **连接到服务器**
   - 地址：`43.143.224.158:5901`
   - 输入VNC密码

3. **运行HBuilderX**
   - 在VNC桌面中打开终端
   - 执行：`/opt/hbuilderx/HBuilderX/HBuilderX`
   - 等待HBuilderX启动

4. **编译项目**
   - 文件 -> 打开目录 -> `/var/www/html/moodle/tanmai/frontend`
   - 发行 -> 网站-H5 -> 填写配置 -> 发行
   - 编译后的文件在：`unpackage/dist/build/h5/`

5. **部署编译后的文件**
   ```bash
   cp -r /var/www/html/moodle/tanmai/frontend/unpackage/dist/build/h5/* /var/www/html/moodle/tanmai/frontend/dist/
   ```

6. **访问页面**
   - http://43.143.224.158/tanmai/

## ✅ 我已经完成的准备工作

- ✅ 安装了VNC服务器软件
- ✅ 配置了VNC启动脚本
- ✅ 创建了HBuilderX安装目录
- ✅ 配置了前端项目目录权限
- ✅ 准备了完整的操作指南

## 💡 如果您遇到问题

1. VNC连接失败：检查防火墙和VNC服务是否运行
2. HBuilderX无法运行：检查权限和依赖
3. 编译失败：检查项目配置和依赖

随时告诉我，我会帮您解决！

