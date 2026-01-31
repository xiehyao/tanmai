// pages/assistant/assistant.js
const request = require('../../utils/request.js')

Page({
  data: {
    matches: []
  },

  onLoad() {
    this.refreshMatches()
  },

  onShow() {
    this.refreshMatches()
  },

  async refreshMatches() {
    try {
      const res = await request.get('/api/alumni/matched', { category: 'discover' })
      const list = (res && res.list) ? res.list.slice(0, 6) : []
      this.setData({ matches: list })
    } catch (e) {
      this.setData({ matches: [] })
    }
  },

  viewMatch(e) {
    const match = e.currentTarget.dataset.match
    if (match && match.id) {
      wx.navigateTo({ url: `/pages/card/card?user_id=${match.id}` })
    }
  }
})
