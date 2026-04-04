// pages/card/card.js
const request = require('../../utils/request.js')

Page({
  data: {
    card: {},
    isOwnCard: false,
    userId: null,
    myUserId: null
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
        const d = res.data
        const myUid = d.user_id != null ? d.user_id : d.id
        this.setData({ card: d, myUserId: myUid })
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
    wx.navigateTo({ url: '/pages/card-entry-v3/card-entry-v3' })
  },

  /** 进入「xxx的卡片」校友页，预览自己对外展示效果（仅本人名片页） */
  onPreviewMyAlumniProfile() {
    if (!this.data.isOwnCard) return
    const uid = this.data.myUserId || (this.data.card && (this.data.card.user_id || this.data.card.id))
    if (!uid) {
      wx.showToast({ title: '无法获取用户信息', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/alumni-profile/alumni-profile?user_id=${uid}` })
  }
})
