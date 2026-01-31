// pages/profile/profile.js
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    user: {}
  },

  onLoad() {
    this.loadUser()
  },

  onShow() {
    this.loadUser()
  },

  async loadUser() {
    const u = app.globalData.user
    if (u && u.id) {
      this.setData({ user: u })
      return
    }
    try {
      const res = await request.get('/api/cards/my')
      if (res.success && res.data) {
        app.globalData.user = res.data
        this.setData({ user: res.data })
      }
    } catch (e) {
      this.setData({ user: {} })
    }
  },

  goToCardEntry() {
    wx.navigateTo({ url: '/pages/card-entry/card-entry' })
  },

  goToCard() {
    wx.navigateTo({ url: '/pages/card/card' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const a = getApp()
          if (a && a.logout) a.logout()
        }
      }
    })
  }
})
