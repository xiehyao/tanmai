Page({
  data: {
    content: '',
    images: [],
    location: null,
    activityKey: 'tea',
    activityOptions: [
      { key: 'plaza', label: '广场' },
      { key: 'tea', label: '喝茶局' },
      { key: 'innovation', label: '研学' },
      { key: 'sport', label: '运动局' },
      { key: 'food', label: '泉州菜走起' }
    ],
    enableSignup: false,
    publishing: false
  },

  onLoad(options) {
    const tab = options && options.tab ? String(options.tab) : ''
    const allowed = ['plaza', 'tea', 'innovation', 'sport', 'food']
    if (allowed.includes(tab)) this.setData({ activityKey: tab })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value || '' })
  },

  onToggleSignup(e) {
    this.setData({ enableSignup: !!e.detail.value })
  },

  chooseImages() {
    const remain = 9 - this.data.images.length
    if (remain <= 0) return
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const list = (res.tempFiles || []).map(f => f.tempFilePath).filter(Boolean)
        this.setData({ images: this.data.images.concat(list).slice(0, 9) })
      }
    })
  },

  removeImage(e) {
    const idx = Number(e.currentTarget.dataset.index)
    if (Number.isNaN(idx)) return
    const images = this.data.images.slice()
    images.splice(idx, 1)
    this.setData({ images })
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const location = {
          name: res.name || '',
          address: res.address || '',
          latitude: res.latitude,
          longitude: res.longitude
        }
        this.setData({ location })
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.includes('auth deny') || msg.includes('auth denied')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置信息权限后重试',
            success: (r) => {
              if (r.confirm) wx.openSetting({})
            }
          })
          return
        }
        wx.showToast({ title: '标定地址失败，请重试', icon: 'none' })
      }
    })
  },

  clearLocation() {
    this.setData({ location: null })
  },

  onActivityChange(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    this.setData({ activityKey: key })
  },

  async publishPost() {
    const content = (this.data.content || '').trim()
    if (!content) {
      wx.showToast({ title: '请先输入文字内容', icon: 'none' })
      return
    }
    this.setData({ publishing: true })
    try {
      const payload = {
        content,
        images: this.data.images.slice(),
        location: this.data.location ? (this.data.location.address || this.data.location.name || '') : '',
        activity_key: this.data.activityKey,
        enable_signup: !!this.data.enableSignup
      }
      const res = await request.post('/api/posts', payload)
      if (!res || !res.success || !res.data || !res.data.id) {
        throw new Error('发布失败')
      }
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/post-detail/post-detail?post_id=${res.data.id}` })
      }, 300)
    } catch (e) {
      wx.showToast({ title: e.message || '发布失败', icon: 'none' })
    } finally {
      this.setData({ publishing: false })
    }
  }
})
