# 前端页面访问说明

## ✅ 已创建的临时访问页面

我已经创建了一个简单的HTML页面，可以通过以下地址访问：

- **访问地址**: http://43.143.224.158/tanmai/
- **本地访问**: http://localhost/tanmai/

这个页面提供了：
1. 后端API文档链接
2. 健康检查链接
3. 系统状态信息

## 📱 完整前端功能（需要编译）

前端是uni-app项目，完整功能需要使用HBuilderX编译：

### 编译步骤：

1. **下载HBuilderX**
   - 访问：https://www.dcloud.io/hbuilderx.html
   - 下载并安装HBuilderX

2. **打开项目**
   - 使用HBuilderX打开：`/var/www/html/moodle/tanmai/frontend`
   
3. **编译H5版本**
   - 菜单：运行 -> 运行到浏览器 -> Chrome
   - 或：发行 -> 网站-H5 -> 填写配置后打包
   
4. **部署编译后的文件**
   - 编译后的文件在 `unpackage/dist/build/h5/` 目录
   - 复制到服务器：`/var/www/html/moodle/tanmai/frontend/dist/`
   - 访问：http://43.143.224.158/tanmai/

## 🔗 当前可用链接

- **临时访问页面**: http://43.143.224.158/tanmai/
- **API文档**: http://43.143.224.158:8000/docs
- **健康检查**: http://43.143.224.158:8000/health
- **API根路径**: http://43.143.224.158:8000/

## 📝 注意事项

1. 当前页面是临时测试页面，提供基本信息和API链接
2. 完整的前端功能需要编译uni-app项目
3. 后端API已正常运行，可以通过API文档页面测试所有接口
