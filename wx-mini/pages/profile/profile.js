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

  goToCardEntryV2() {
    wx.navigateTo({ url: '/pages/card-entry-v2/card-entry-v2' })
  },

  goToCard() {
    wx.navigateTo({ url: '/pages/card/card' })
  },

  goToMap() {
    wx.switchTab({ url: '/pages/map/map' })
  },

  // 跳转到地图页（可返回，用于个人中心「附近朋友地图」）
  goToMapView() {
    wx.navigateTo({ url: '/pages/map-view/map-view' })
  },

  goToAlumniLink() {
    wx.switchTab({ url: '/pages/alumni-link/alumni-link' })
  },

  // 跳转到校友连连看页（可返回，用于个人中心「校友连连看」）
  goToAlumniLinkView() {
    wx.navigateTo({ url: '/pages/alumni-link-view/alumni-link-view' })
  },

  goToContacts() {
    wx.navigateTo({ url: '/pages/contacts/contacts' })
  },

  goToActivityFeed() {
    wx.navigateTo({ url: '/pages/activity-feed/activity-feed' })
  },

  goToCardFolder() {
    wx.navigateTo({ url: '/pages/card-folder/card-folder' })
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
