# 数据库配置说明

## 数据库信息
- **数据库类型**: MySQL/MariaDB
- **数据库名**: tanmai（独立的社交人脉匹配数据库）
- **主机**: localhost
- **端口**: 3306
- **用户名**: apache
- **密码**: pengyoo123

## 连接字符串
```
mysql+pymysql://apache:pengyoo123@localhost:3306/tanmai
```

## 数据库说明
- **moodle数据库**: 保留用于知识学习平台
- **tanmai数据库**: 用于探脉社交人脉匹配小程序

## 注意事项
1. tanmai数据库与moodle数据库完全独立，互不干扰
2. 所有DateTime字段使用timezone=True，SQLAlchemy会映射为MySQL的TIMESTAMP类型
3. 需要确保pymysql已安装：`pip install pymysql`

## 初始化表结构
运行以下命令创建表：
```bash
cd backend
python3 -m app.db.init_db
```
