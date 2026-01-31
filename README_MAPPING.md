# 📁 服务器文件夹映射 - 快速参考

## 🚀 最快方案：SSHFS 映射

### Windows
1. 安装：WinFsp + SSHFS-Win
2. 映射：`\\sshfs.r\root@43.143.224.158!22\var\www\html\moodle\tanmai\frontend`
3. 在 HBuilderX 中打开映射的盘符

### Mac/Linux
```bash
mkdir -p ~/tanmai-frontend
sshfs root@43.143.224.158:/var/www/html/moodle/tanmai/frontend ~/tanmai-frontend
```
然后在 HBuilderX 中打开 `~/tanmai-frontend`

## 📖 详细文档

- **简单指南**：`SIMPLE_MAPPING_GUIDE.md`
- **完整方案**：`PRACTICAL_MAPPING_SOLUTIONS.md`
- **SSHFS 详细**：`SSHFS_MAPPING_GUIDE.md`

## ✅ 优势

- ✅ 像本地文件一样操作
- ✅ 修改自动同步到服务器
- ✅ 编译后文件直接在服务器上
- ✅ 无需手动上传
