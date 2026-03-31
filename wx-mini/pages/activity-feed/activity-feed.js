// pages/activity-feed/activity-feed.js - 活动贴子聚合页（类似朋友圈动态流）
const request = require('../../utils/request.js')

function mockPosts() {
  return [
    {
      id: 'mock-tea-1',
      author: { id: 1, name: '于涛', subtitle: '00通信工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
      content: '本周六下午 3 点，南山喝茶局，欢迎大家来聊近况和合作方向。',
      images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop'],
      location: '深圳 南山科技园',
      timeText: '刚刚',
      likeCount: 18,
      commentCount: 3,
      shareCount: 1,
      activityKey: 'tea',
      enableSignup: true
    },
    {
      id: 'mock-innovation-1',
      author: { id: 2, name: '孟楠', subtitle: '北邮深圳研究院', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
      content: '下周组织科创研学，计划参访两家 AI 创业团队，欢迎报名。',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop'],
      location: '深圳 南山区',
      timeText: '1小时前',
      likeCount: 26,
      commentCount: 6,
      shareCount: 2,
      activityKey: 'innovation',
      enableSignup: true
    },
    {
      id: 'mock-sport-1',
      author: { id: 3, name: '周杨', subtitle: '12电子工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-3.jpeg' },
      content: '周日早上 8 点深圳湾慢跑 8 公里，欢迎不同配速校友加入。',
      images: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&auto=format&fit=crop'],
      location: '深圳湾公园',
      timeText: '2小时前',
      likeCount: 33,
      commentCount: 9,
      shareCount: 4,
      activityKey: 'sport',
      enableSignup: true
    },
    {
      id: 'mock-food-1',
      author: { id: 4, name: '李静', subtitle: '09工商管理', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-10.jpeg' },
      content: '泉州菜走起！周五晚 7 点，南山海岸城集合，欢迎带朋友。',
      images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop'],
      location: '深圳 海岸城',
      timeText: '3小时前',
      likeCount: 41,
      commentCount: 12,
      shareCount: 6,
      activityKey: 'food',
      enableSignup: true
    }
  ]
}

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
      const posts = (res && res.success && Array.isArray(res.list) && res.list.length > 0) ? res.list : mockPosts()
      this.setData({ posts, loading: false }, () => this.applyFilters())
    } catch (e) {
      this.setData({ posts: mockPosts(), loading: false }, () => this.applyFilters())
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
