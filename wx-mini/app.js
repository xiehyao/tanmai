// app.js - 微信小程序主入口
App({
  globalData: {
    user: null,
    token: null,
    apiBase: 'https://www.pengyoo.com'
  },

  onLaunch() {
    console.log('探脉小程序启动')
    this.checkLogin()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.getUserInfo()
    }
  },

  async getUserInfo() {
    try {
      const request = require('./utils/request.js')
      const res = await request.get('/api/auth/me')
      if (res && res.id) {
        this.globalData.user = res
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  async login(code) {
    try {
      const request = require('./utils/request.js')
      const res = await request.post('/api/auth/login', { code })
      if (res.success && res.token) {
        this.globalData.token = res.token
        this.globalData.user = res.user
        wx.setStorageSync('token', res.token)
        return res
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  logout() {
    this.globalData.user = null
    this.globalData.token = null
    wx.removeStorageSync('token')
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
