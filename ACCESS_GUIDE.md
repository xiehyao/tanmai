# 探脉项目访问指南

## 当前访问方式

### 后端API（已部署）
- **根路径**: http://43.143.224.158:8000/
- **健康检查**: http://43.143.224.158:8000/health  
- **API文档**: http://43.143.224.158:8000/docs
- **状态**: ✅ 已启动运行

### 前端页面（需要编译）
前端是uni-app项目，需要编译后才能访问：

#### 方式1：H5网页版（推荐用于浏览器访问）
1. **使用HBuilderX编译**（推荐）
   - 下载并安装HBuilderX
   - 用HBuilderX打开 `/var/www/html/moodle/tanmai/frontend` 目录
   - 点击菜单：运行 -> 运行到浏览器 -> Chrome
   - 或点击：发行 -> 网站-H5 -> 填写配置后打包

2. **使用命令行编译**（需要安装uni-app CLI）
   ```bash
   cd /var/www/html/moodle/tanmai/frontend
   npm install -g @dcloudio/uvm
   uvm use latest
   npm install
   npm run build:h5
   ```
   编译后的文件在 `dist/build/h5/` 目录

3. **部署编译后的文件**
   ```bash
   # 复制编译后的文件到Apache目录
   cp -r dist/build/h5/* /var/www/html/moodle/tanmai/frontend/dist/
   
   # 然后访问：
   # http://43.143.224.158/moodle/tanmai/frontend/dist/index.html
   ```

#### 方式2：微信小程序
- 使用HBuilderX编译为微信小程序
- 使用微信开发者工具打开编译后的目录
- 在微信开发者工具中预览和调试

## 临时测试方案

如果暂时无法编译，可以通过以下方式查看API接口：

1. **访问API文档**（已自动生成）
   - 打开：http://43.143.224.158:8000/docs
   - 可以在这里测试所有API接口

2. **使用curl测试API**
   ```bash
   # 健康检查
   curl http://43.143.224.158:8000/health
   
   # 获取根信息
   curl http://43.143.224.158:8000/
   ```

## 注意事项

1. **前后端分离**：前端和后端是分离部署的
   - 后端：端口8000
   - 前端：需要编译后通过Apache访问（或HBuilderX开发服务器）

2. **跨域问题**：后端已配置CORS允许所有来源，前端可以正常调用API

3. **API地址配置**：前端的API地址在 `frontend/utils/request.js` 中配置

## 下一步

1. 安装HBuilderX并编译前端H5版本
2. 或安装uni-app CLI命令行工具编译
3. 将编译后的文件部署到Apache
4. 配置Apache虚拟主机（可选）
