// pages/alumni-profile/alumni-profile.js
const request = require('../../utils/request.js')

Page({
  data: {
    user: null,
    introCards: [],
    matchContent: ''
  },

  onLoad(options) {
    const uid = options.user_id
    if (!uid) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ userId: uid })
    this.loadUser(uid)
  },

  async loadUser(uid) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${uid}`)
      if (res.success && res.data) {
        const user = res.data
        this.setData({
          user,
          pageTitle: (user.name || user.nickname || '校友') + '的世界'
        })
        wx.setNavigationBarTitle({ title: this.data.pageTitle })
        this.loadIntroCards(uid)
        this.loadMatchContent(uid)
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async loadIntroCards(uid) {
    try {
      const res = await request.get('/api/intro-cards/user/' + uid)
      const cards = (res.success && res.cards) ? res.cards : []
      this.setData({ introCards: cards })
    } catch (e) {
      this.setData({ introCards: [] })
    }
  },

  async loadMatchContent(uid) {
    try {
      const res = await request.get('/api/alumni/match-with', { user_id: uid })
      const content = (res && res.content) ? res.content : '暂无 AI 匹配结果，敬请期待。'
      this.setData({ matchContent: content })
    } catch (e) {
      this.setData({ matchContent: '暂无 AI 匹配结果，敬请期待。' })
    }
  },

  onFollowTap() {
    wx.showToast({ title: '关注功能开发中', icon: 'none' })
  }
})
