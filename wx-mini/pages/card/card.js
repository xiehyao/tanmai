// pages/card/card.js
const request = require('../../utils/request.js')

Page({
  data: {
    card: {},
    isOwnCard: false,
    userId: null
  },

  onLoad(options) {
    if (options.user_id) {
      this.setData({ userId: options.user_id })
      this.loadCard(options.user_id)
    } else {
      this.setData({ isOwnCard: true })
      this.loadOwnCard()
    }
  },

  async loadOwnCard() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get('/api/cards/my')
      if (res.success && res.data) {
        this.setData({ card: res.data })
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async loadCard(userId) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${userId}`)
      if (res.success && res.data) {
        this.setData({ card: res.data })
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  editCard() {
    wx.navigateTo({ url: '/pages/card-entry/card-entry' })
  }
})
