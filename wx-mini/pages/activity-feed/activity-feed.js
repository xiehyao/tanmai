// pages/activity-feed/activity-feed.js - 活动贴子聚合页（类似朋友圈动态流）
const request = require('../../utils/request.js')

// 模拟活动帖列表（后续接入 /api/posts 或类似接口）
function mockPosts() {
  return [
    {
      id: 'tea-1',
      author: { id: 1, name: '于涛', subtitle: '00通信工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
      content: '这周六下午17:00在北邮科技大厦开北邮深港澳校友会筹备会。大家到了可以先在一楼大厅稍等。',
      images: [],
      location: '深圳 北邮科技大厦',
      timeText: '昨天',
      likeCount: 42,
      commentCount: 12,
      activityKey: 'tea'
    },
    {
      id: 'innovation-1',
      author: { id: 2, name: '孟楠', subtitle: '北邮深圳研究院', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
      content: '科创研学活动报名中，一起走进腾讯滨海大厦，了解前沿技术。',
      images: [],
      location: '深圳 南山区',
      timeText: '2天前',
      likeCount: 28,
      commentCount: 5,
      activityKey: 'innovation'
    },
    {
      id: 'food-1',
      author: { id: 3, name: '于涛', subtitle: '00通信工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
      content: '看风景。',
      images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600'],
      location: '泰国 普吉岛',
      timeText: '昨天',
      likeCount: 156,
      commentCount: 297,
      activityKey: 'food'
    }
  ]
}

Page({
  data: {
    posts: [],
    loading: false,
    tabs: [
      { key: 'plaza', label: '广场' },
      { key: 'group', label: '群聊' },
      { key: 'watching', label: '在看' },
      { key: 'secondhand', label: '二手' },
      { key: 'topic', label: '主题' }
    ],
    activeTab: 'plaza',
    searchKeyword: ''
  },

  onLoad() {
    this.loadPosts()
  },

  onPullDownRefresh() {
    this.loadPosts().then(() => wx.stopPullDownRefresh())
  },

  async loadPosts() {
    this.setData({ loading: true })
    try {
      const posts = mockPosts()
      this.setData({ posts, loading: false })
    } catch (e) {
      this.setData({ posts: mockPosts(), loading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (key && key !== this.data.activeTab) {
      this.setData({ activeTab: key })
    }
  },

  goToPostDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: `/pages/post-detail/post-detail?post_id=${id}` })
  }
})
