// utils/request.js - 微信小程序请求封装
function getAppInstance() {
  try {
    return getApp()
  } catch (e) {
    return null
  }
}

function getApiBase() {
  const app = getAppInstance()
  if (app?.globalData?.apiBase) return app.globalData.apiBase
  try {
    return require('../config.js').apiBase || 'https://www.pengyoo.com'
  } catch (e) {
    return 'https://www.pengyoo.com'
  }
}

// 请求方法
function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const apiBase = getApiBase()
    
    // 获取工号（如果已验证）
    const staffId = wx.getStorageSync('staff_id_verified')
    
    const fullUrl = apiBase + options.url
    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Staff-Id': staffId === '362100' ? '362100' : '',  // 工号验证
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          const app = getAppInstance()
          if (app && app.logout) {
            app.logout()
          }
          reject(new Error('未登录'))
        } else if (res.statusCode >= 500) {
          console.error('服务器错误:', res.statusCode)
          reject(new Error('服务器暂时不可用，请稍后重试'))
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (err) => {
        console.error('请求失败:', err, 'URL:', fullUrl)
        const msg = err.errMsg === 'request:fail'
          ? '请求失败：请检查 1) 微信开发者工具勾选「不校验合法域名」 2) 网络是否可达 ' + fullUrl
          : (err.errMsg || '网络连接失败，请检查网络设置')
        reject(new Error(msg))
      }
    })
  })
}

module.exports = {
  get(url, data, options = {}) {
    return request({ url, method: 'GET', data, ...options })
  },
  post(url, data, options = {}) {
    return request({ url, method: 'POST', data, ...options })
  },
  put(url, data, options = {}) {
    return request({ url, method: 'PUT', data, ...options })
  },
  delete(url, data, options = {}) {
    return request({ url, method: 'DELETE', data, ...options })
  }
}
