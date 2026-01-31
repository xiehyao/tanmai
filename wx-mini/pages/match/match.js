// pages/match/match.js
const request = require('../../utils/request.js')

Page({
  data: {
    match: {}
  },

  onLoad(options) {
    if (options.match_id) {
      this.loadMatch(options.match_id)
    }
  },

  async loadMatch(matchId) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const res = await request.get(`/api/match/${matchId}`)
      
      if (res.success && res.data) {
        this.setData({
          match: res.data
        })
      }
    } catch (error) {
      console.error('Load match error:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})

