# HBuilderX编译指南

## ⚠️ 重要说明

HBuilderX是桌面IDE应用，需要在**您的本地电脑**上下载和运行，无法在服务器上直接使用。

## 📥 下载和安装HBuilderX（在您的本地电脑上）

### Windows用户
1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载"标准版"或"完整版"
3. 解压到任意目录（如 C:\HBuilderX）
4. 运行 HBuilderX.exe

### Mac用户
1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载Mac版本
3. 解压后将HBuilderX.app拖入应用程序文件夹
4. 双击运行

### Linux用户
1. 访问：https://www.dcloud.io/hbuilderx.html
2. 下载Linux版本
3. 解压后运行 HBuilderX

## 🔨 编译步骤（在HBuilderX中）

1. **打开项目**
   - 启动HBuilderX
   - 文件 -> 打开目录
   - 选择项目目录（需要先通过FTP/SFTP将项目下载到本地，或者直接在服务器上操作）

2. **编译H5版本**
   - 点击顶部菜单：**发行** -> **网站-H5**
   - 在弹出的窗口中：
     - 网站标题：探脉
     - 网站域名：http://43.143.224.158
   - 点击"发行"按钮
   - 等待编译完成

3. **找到编译后的文件**
   - 编译完成后，文件位于：`unpackage/dist/build/h5/`
   - 这个目录包含所有需要部署的HTML/CSS/JS文件

4. **上传到服务器**
   - 使用FTP/SFTP工具（如FileZilla、WinSCP等）
   - 将 `unpackage/dist/build/h5/` 目录下的所有文件
   - 上传到服务器：`/var/www/html/moodle/tanmai/frontend/dist/`

5. **访问页面**
   - 上传完成后，访问：http://43.143.224.158/tanmai/

## 🔄 服务器端操作（如果需要在服务器上编译）

如果您需要在服务器上编译，可以：

1. **通过SSH隧道使用本地HBuilderX**
   - 在本地HBuilderX中配置SSH连接
   - 直接编辑服务器上的文件
   - 编译后自动上传

2. **或者使用命令行工具**（需要配置，较复杂）
   - 需要安装uni-app CLI工具链
   - 需要正确的配置文件

## 💡 推荐方案

1. **临时方案**：使用我已经创建的临时HTML页面
   - 地址：http://43.143.224.158/tanmai/
   - 可以访问API文档和测试接口

2. **完整方案**：在本地使用HBuilderX编译
   - 下载HBuilderX到本地电脑
   - 通过FTP/SFTP将项目下载到本地
   - 使用HBuilderX编译
   - 上传编译后的文件到服务器

