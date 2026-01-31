// pages/updates/updates.js
Page({
  data: {
    updates: []
  },

  onLoad() {
    this.loadUpdates()
  },

  loadUpdates() {
    // TODO: 调用API加载更新列表
    this.setData({
      updates: []
    })
  }
})

