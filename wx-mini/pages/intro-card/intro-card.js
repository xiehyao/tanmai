// pages/intro-card/intro-card.js
const request = require('../../utils/request.js')

Page({
  data: {
    cards: [],
    showGenerateModal: false,
    newCardName: '',
    sceneIndex: 0,
    sceneTypes: ['校友群', '行业群', '兴趣群', '自定义']
  },

  onLoad() {
    this.loadCards()
  },

  // 加载卡片列表
  async loadCards() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const res = await request.get('/api/intro-cards/my')
      
      if (res.success && res.cards) {
        this.setData({
          cards: res.cards
        })
      }
    } catch (error) {
      console.error('Load cards error:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 获取场景名称
  getSceneName(sceneType) {
    const map = {
      'alumni': '校友群',
      'industry': '行业群',
      'interest': '兴趣群',
      'custom': '自定义'
    }
    return map[sceneType] || sceneType
  },

  // 显示生成弹窗
  showGenerateModal() {
    this.setData({ showGenerateModal: true })
  },

  // 隐藏生成弹窗
  hideGenerateModal() {
    this.setData({ showGenerateModal: false })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，阻止点击事件冒泡
  },

  // 卡片名称输入
  onCardNameInput(e) {
    this.setData({
      newCardName: e.detail.value
    })
  },

  // 场景类型改变
  onSceneChange(e) {
    this.setData({
      sceneIndex: parseInt(e.detail.value)
    })
  },

  // 生成卡片
  async generateCard() {
    if (!this.data.newCardName.trim()) {
      wx.showToast({
        title: '请输入卡片名称',
        icon: 'none'
      })
      return
    }
    
    const sceneMap = ['alumni', 'industry', 'interest', 'custom']
    
    wx.showLoading({ title: '生成中...' })
    
    try {
      const res = await request.post('/api/intro-cards/generate', {
        card_name: this.data.newCardName,
        scene_type: sceneMap[this.data.sceneIndex]
      })
      
      if (res.success) {
        wx.showToast({
          title: '生成成功',
          icon: 'success'
        })
        this.setData({
          showGenerateModal: false,
          newCardName: ''
        })
        this.loadCards()
      }
    } catch (error) {
      console.error('Generate card error:', error)
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 编辑卡片
  editCard(e) {
    const card = e.currentTarget.dataset.card
    wx.showModal({
      title: card.card_name,
      content: card.content,
      showCancel: true,
      confirmText: '编辑',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到编辑页面
          wx.showToast({
            title: '编辑功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }
})

