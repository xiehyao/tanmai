// pages/meeting/meeting.js
Page({
  data: {
    meetings: []
  },

  onLoad() {
    this.loadMeetings()
  },

  loadMeetings() {
    // TODO: 调用API加载约见列表
    this.setData({
      meetings: []
    })
  },

  getStatusText(status) {
    const map = {
      'pending': '待确认',
      'confirmed': '已确认',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return map[status] || status
  }
})

