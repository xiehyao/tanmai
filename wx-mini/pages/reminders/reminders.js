// pages/reminders/reminders.js
Page({
  data: {
    reminders: []
  },

  onLoad() {
    this.loadReminders()
  },

  loadReminders() {
    // TODO: 调用API加载提醒列表
    this.setData({
      reminders: []
    })
  }
})

