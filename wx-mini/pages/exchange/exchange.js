// pages/exchange/exchange.js
Page({
  data: {
    
  },

  onLoad() {
    
  },

  scanQRCode() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res)
        // TODO: 处理扫码结果，交换名片
        wx.showToast({
          title: '扫码功能开发中',
          icon: 'none'
        })
      },
      fail: (err) => {
        console.error('扫码失败:', err)
      }
    })
  }
})

