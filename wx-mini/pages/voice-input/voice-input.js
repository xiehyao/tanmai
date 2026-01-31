// pages/voice-input/voice-input.js
const request = require('../../utils/request.js')

Page({
  data: {
    mode: 'guided', // guided or free
    messages: [],
    inputText: '',
    matchFeedback: '',
    isRecording: false,
    lastMsgId: ''
  },

  onLoad() {
    this.startConversation()
  },

  // 开始对话
  startConversation() {
    this.addMessage('assistant', '您好！我是探脉AI助手，请告诉我您的姓名和职位')
  },

  // 添加消息
  addMessage(type, content) {
    const messages = this.data.messages
    messages.push({ type, content })
    this.setData({
      messages,
      lastMsgId: `msg-${messages.length - 1}`
    })
  },

  // 设置模式
  setMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode })
  },

  // 输入文本
  onInput(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  // 发送消息
  async sendMessage() {
    if (!this.data.inputText.trim()) return
    
    const inputText = this.data.inputText
    this.addMessage('user', inputText)
    this.setData({ inputText: '' })
    
    try {
      const res = await request.post('/api/voice/process', {
        text: inputText,
        mode: this.data.mode
      })
      
      if (res.success) {
        this.addMessage('assistant', res.reply || '已收到您的信息')
        
        if (res.match_feedback) {
          this.setData({
            matchFeedback: res.match_feedback
          })
        }
        
        if (res.extracted_info) {
          this.showExtractedInfo(res.extracted_info)
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      this.addMessage('assistant', '抱歉，处理失败，请稍后再试')
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      })
    }
  },

  // 开始录音
  startRecord() {
    this.setData({ isRecording: true })
    
    const recorderManager = wx.getRecorderManager()
    recorderManager.start({
      duration: 60000,
      format: 'mp3'
    })
    
    recorderManager.onStop((res) => {
      this.setData({ isRecording: false })
      // 上传音频并转换为文字
      this.uploadAudio(res.tempFilePath)
    })
    
    recorderManager.onError((err) => {
      console.error('Record error:', err)
      this.setData({ isRecording: false })
      wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
    })
  },

  // 上传音频
  async uploadAudio(filePath) {
    wx.showLoading({ title: '处理中...' })
    
    try {
      const res = await wx.uploadFile({
        url: getApp().globalData.apiBase + '/api/voice/upload',
        filePath: filePath,
        name: 'audio',
        formData: {
          mode: this.data.mode
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        }
      })
      
      wx.hideLoading()
      
      if (res.statusCode === 200) {
        const data = JSON.parse(res.data)
        if (data.success) {
          this.addMessage('user', data.text || '[语音消息]')
          this.addMessage('assistant', data.reply || '已收到您的语音信息')
          
          if (data.match_feedback) {
            this.setData({
              matchFeedback: data.match_feedback
            })
          }
        }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('Upload audio error:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 显示提取的信息
  showExtractedInfo(info) {
    let infoText = '已提取以下信息：\n'
    for (const key in info) {
      infoText += `${key}: ${info[key]}\n`
    }
    wx.showModal({
      title: '信息提取',
      content: infoText,
      showCancel: false
    })
  }
})

