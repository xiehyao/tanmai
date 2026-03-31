const STORAGE_KEY = 'activity_feed_user_posts'

Page({
  data: {
    content: '',
    images: [],
    enableSignup: false,
    publishing: false
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

  publishPost() {
    const content = (this.data.content || '').trim()
    if (!content) {
      wx.showToast({ title: '请先输入文字内容', icon: 'none' })
      return
    }
    const now = Date.now()
    const post = {
      id: `user-${now}`,
      author: {
        id: 0,
        name: '我',
        subtitle: '校友',
        avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png',
        followerCount: 0
      },
      content,
      images: this.data.images.slice(),
      location: '',
      timeText: '刚刚',
      likeCount: 0,
      shareCount: 0,
      commentCount: 0,
      activityKey: 'custom',
      enableSignup: !!this.data.enableSignup
    }
    const oldList = wx.getStorageSync(STORAGE_KEY)
    const list = Array.isArray(oldList) ? oldList : []
    wx.setStorageSync(STORAGE_KEY, [post, ...list])
    wx.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateTo({ url: `/pages/post-detail/post-detail?post_id=${post.id}` })
    }, 300)
  }
})
