// pages/activity-feed/activity-feed.js - 活动贴子聚合页（类似朋友圈动态流）
const request = require('../../utils/request.js')

Page({
  data: {
    posts: [],
    filteredPosts: [],
    loading: false,
    tabs: [
      { key: 'plaza', label: '广场' },
      { key: 'tea', label: '喝茶局' },
      { key: 'innovation', label: '研学' },
      { key: 'sport', label: '运动局' },
      { key: 'food', label: '泉州菜走起' }
    ],
    activeTab: 'plaza',
    searchKeyword: ''
  },

  onLoad(options) {
    const tab = options && options.tab ? String(options.tab) : ''
    const validTabs = ['plaza', 'tea', 'innovation', 'sport', 'food']
    if (tab && validTabs.includes(tab)) this.setData({ activeTab: tab })
    this.loadPosts()
  },

  onPullDownRefresh() {
    this.loadPosts().then(() => wx.stopPullDownRefresh())
  },

  async loadPosts() {
    this.setData({ loading: true })
    try {
      const res = await request.get('/api/posts')
      const posts = (res && res.success && Array.isArray(res.list)) ? res.list : []
      this.setData({ posts, loading: false }, () => this.applyFilters())
    } catch (e) {
      this.setData({ posts: [], loading: false }, () => this.applyFilters())
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' }, () => this.applyFilters())
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (key && key !== this.data.activeTab) {
      this.setData({ activeTab: key }, () => this.applyFilters())
    }
  },

  applyFilters() {
    const tab = this.data.activeTab
    const keyword = (this.data.searchKeyword || '').trim().toLowerCase()
    let list = this.data.posts.slice()
    if (tab !== 'plaza') {
      list = list.filter(item => (item.activityKey || 'plaza') === tab)
    }
    if (keyword) {
      list = list.filter(item =>
        ((item.content || '').toLowerCase().includes(keyword)) ||
        ((item.location || '').toLowerCase().includes(keyword)) ||
        ((item.author && item.author.name ? item.author.name : '').toLowerCase().includes(keyword))
      )
    }
    this.setData({ filteredPosts: list })
  },

  goToPostDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/post-detail/post-detail?post_id=${id}` })
  },

  onCreatePostTap() {
    const tab = this.data.activeTab && this.data.activeTab !== 'plaza' ? this.data.activeTab : 'tea'
    wx.navigateTo({ url: `/pages/activity-post-create/activity-post-create?tab=${tab}` })
  },

  onShow() {
    this.loadPosts()
  }
})
