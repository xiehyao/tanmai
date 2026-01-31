# SSL / 网络请求错误排查

## net::ERR_SSL_PROTOCOL_ERROR

当请求 `https://www.pengyoo.com` 出现 `ERR_SSL_PROTOCOL_ERROR` 时，说明 SSL 握手失败。

### 可能原因

1. **服务器 SSL 证书**：过期、自签名、证书链不完整
2. **TLS 版本**：微信小程序要求 TLS 1.2+，服务器若仅支持旧版本会失败
3. **域名未备案或解析异常**
4. **开发环境限制**：本机网络或代理影响

### 开发阶段临时方案

1. **微信开发者工具**  
   - 打开「详情」→「本地设置」  
   - 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」

2. **改用本地 / 测试后端**  
   - 编辑 `wx-mini/config.js`  
   - 将 `apiBase` 改为本地地址，例如：
     ```js
     apiBase: 'http://localhost:8000'
     // 或
     apiBase: 'http://43.143.224.158:8000'
     ```
   - 确认已勾选上述「不校验」选项（使用 HTTP 时必须）

### 正式环境

- 将 `www.pengyoo.com` 配置到微信公众平台「开发 → 开发管理 → 服务器域名 → request合法域名」
- 确保证书有效、支持 TLS 1.2+
- 可用 `openssl s_client -connect www.pengyoo.com:443` 检查证书和协议

## SharedArrayBuffer 提示

该提示来自 Chrome/ DevTools，一般不影响真机运行，可忽略。
