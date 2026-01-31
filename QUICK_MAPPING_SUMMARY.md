# 快速映射方案总结

## 🎯 推荐方案对比

| 方案 | 难度 | 适用系统 | 推荐度 |
|------|------|----------|--------|
| **HBuilderX 远程连接** | ⭐ 简单 | 所有系统 | ⭐⭐⭐⭐⭐ |
| **SSHFS 文件系统映射** | ⭐⭐ 中等 | Windows/Mac/Linux | ⭐⭐⭐⭐ |

## 🚀 快速开始

### 方案1：HBuilderX 远程连接（最简单）

1. 打开 HBuilderX
2. 工具 → 远程连接 → 新建连接
3. 填写：
   - 主机：43.143.224.158
   - 用户：root
   - 密码：[您的密码]
   - 根目录：/var/www/html/moodle/tanmai
4. 连接后打开 frontend 文件夹
5. 直接编译即可！

### 方案2：SSHFS 映射（更灵活）

**Windows:**
- 安装 WinFsp + SSHFS-Win
- 映射：`\\sshfs.r\root@43.143.224.158!22\var\www\html\moodle\tanmai\frontend`

**Mac/Linux:**
```bash
mkdir -p ~/tanmai-frontend
sshfs root@43.143.224.158:/var/www/html/moodle/tanmai/frontend ~/tanmai-frontend
```

## 📝 详细文档

- HBuilderX 远程连接：查看 `HBUILDERX_REMOTE_SETUP.md`
- SSHFS 映射：查看 `SSHFS_MAPPING_GUIDE.md`

## ✅ 工作流程

1. **开发**：在本地 HBuilderX 中编辑代码（自动保存到服务器）
2. **编译**：发行 → 网站-H5（文件自动在服务器上）
3. **访问**：http://43.143.224.158/tanmai/

无需手动上传，一切自动同步！
