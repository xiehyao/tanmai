# HBuilderX服务器安装完整方案

## ✅ 确认：可以在服务器上安装HBuilderX！

您说得完全正确，HBuilderX有Linux版本，可以在服务器上安装。

## 📥 完整安装步骤

### 第一步：下载HBuilderX Linux版本

1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载Linux版本（.tar.gz格式）
3. 上传到服务器：`/opt/hbuilderx/`

### 第二步：解压安装

```bash
cd /opt/hbuilderx
tar -xzf HBuilderX-*.tar.gz
chmod +x HBuilderX/HBuilderX
```

### 第三步：配置VNC（使用图形界面）

服务器已安装VNC，可以配置使用：

```bash
# 启动VNC服务器（显示号:1，端口5901）
vncserver :1 -geometry 1920x1080 -depth 24

# 设置VNC密码（首次运行会提示）
# 输入密码后即可
```

### 第四步：通过VNC连接

1. 在本地电脑使用VNC客户端（如TightVNC、RealVNC）
2. 连接到：`43.143.224.158:5901`
3. 输入VNC密码
4. 在VNC桌面中运行HBuilderX

### 第五步：使用HBuilderX编译

1. 在VNC桌面中打开终端
2. 运行：`/opt/hbuilderx/HBuilderX/HBuilderX`
3. 打开项目：`/var/www/html/moodle/tanmai/frontend`
4. 编译H5：发行 -> 网站-H5
5. 编译后的文件在：`unpackage/dist/build/h5/`

## 🎯 或者：我帮您配置VNC

如果您希望，我可以：
1. 配置VNC服务器
2. 帮您下载HBuilderX（如果找到正确的下载链接）
3. 或者继续尝试命令行编译方案

您希望我帮您配置VNC吗？

