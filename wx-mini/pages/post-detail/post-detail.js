// pages/post-detail/post-detail.js - 帖子详情页（类似朋友圈阅读评论）
const request = require('../../utils/request.js')
const AVATAR_BASE = 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/'

function mockPost(postId) {
  const map = {
    'mock-tea-1': {
      id: 'mock-tea-1',
      author: { id: 1, name: '于涛', subtitle: '00通信工程', avatar: AVATAR_BASE + 'male-young-1.png', followerCount: 10 },
      content: '本周六下午 3 点，南山喝茶局，欢迎大家来聊近况和合作方向。',
      images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop'],
      location: '深圳 南山科技园',
      timeText: '刚刚',
      likeCount: 18,
      shareCount: 1,
      commentCount: 3,
      activityKey: 'tea',
      enableSignup: true
    },
    'mock-innovation-1': {
      id: 'mock-innovation-1',
      author: { id: 2, name: '孟楠', subtitle: '北邮深圳研究院', avatar: AVATAR_BASE + 'female-young.png', followerCount: 8 },
      content: '下周组织科创研学，计划参访两家 AI 创业团队，欢迎报名。',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop'],
      location: '深圳 南山区',
      timeText: '1小时前',
      likeCount: 26,
      shareCount: 2,
      commentCount: 6,
      activityKey: 'innovation',
      enableSignup: true
    },
    'mock-sport-1': {
      id: 'mock-sport-1',
      author: { id: 3, name: '周杨', subtitle: '12电子工程', avatar: AVATAR_BASE + 'male-young-3.jpeg', followerCount: 6 },
      content: '周日早上 8 点深圳湾慢跑 8 公里，欢迎不同配速校友加入。',
      images: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&auto=format&fit=crop'],
      location: '深圳湾公园',
      timeText: '2小时前',
      likeCount: 33,
      shareCount: 4,
      commentCount: 9,
      activityKey: 'sport',
      enableSignup: true
    },
    'mock-food-1': {
      id: 'mock-food-1',
      author: { id: 4, name: '李静', subtitle: '09工商管理', avatar: AVATAR_BASE + 'female-young-10.jpeg', followerCount: 9 },
      content: '泉州菜走起！周五晚 7 点，南山海岸城集合，欢迎带朋友。',
      images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop'],
      location: '深圳 海岸城',
      timeText: '3小时前',
      likeCount: 41,
      shareCount: 6,
      commentCount: 12,
      activityKey: 'food',
      enableSignup: true
    }
  }
  return map[postId] || null
}

function mockSignups(postId) {
  const confirmed = [
    { id: 1, name: '张三', avatar: AVATAR_BASE + 'male-young-1.png', status: 'confirmed' },
    { id: 2, name: '李四', avatar: AVATAR_BASE + 'male-young-2.jpeg', status: 'confirmed' },
    { id: 3, name: '王五', avatar: AVATAR_BASE + 'male-middle.png', status: 'confirmed' },
    { id: 4, name: '赵六', avatar: AVATAR_BASE + 'female-young.png', status: 'confirmed' },
    { id: 5, name: '钱七', avatar: AVATAR_BASE + 'female-young-10.jpeg', status: 'confirmed' },
    { id: 6, name: '孙八', avatar: AVATAR_BASE + 'male-old-2.jpeg', status: 'confirmed' },
    { id: 7, name: '周九', avatar: AVATAR_BASE + 'female-middle-1.png', status: 'confirmed' },
    { id: 8, name: '吴十', avatar: AVATAR_BASE + 'male-young-3.jpeg', status: 'confirmed' },
    { id: 9, name: '郑十一', avatar: AVATAR_BASE + 'female-young-11.jpeg', status: 'confirmed' },
    { id: 10, name: '陈十二', avatar: AVATAR_BASE + 'male-young-4.jpeg', status: 'confirmed' }
  ]
  const pending = [
    { id: 11, name: '林待定', avatar: AVATAR_BASE + 'male-young-5.jpeg', status: 'pending' },
    { id: 12, name: '黄待定', avatar: AVATAR_BASE + 'female-young-12.jpeg', status: 'pending' },
    { id: 13, name: '刘待定', avatar: AVATAR_BASE + 'male-middle-2.png', status: 'pending' }
  ]
  return { confirmed, pending }
}

function mockComments(postId) {
  return [
    {
      id: 'c1',
      author: { name: '可以叫我雨大人', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
      content: '和好如初包含了那三个词',
      timeText: '10-09',
      likeCount: 574,
      replies: [
        {
          id: 'c1-1',
          author: { name: '源码', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
          replyTo: '可以叫我雨大人',
          content: '不是有这个词吗',
          timeText: '10-09',
          likeCount: 214,
          replies: [
            {
              id: 'c1-1-1',
              author: { name: '可以叫我雨大人', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
              replyTo: '源码',
              content: '你再去读两遍',
              timeText: '10-09',
              likeCount: 5
            }
          ]
        }
      ]
    }
  ]
}

Page({
  data: {
    post: null,
    comments: [],
    commentTotal: 0,
    liked: false,
    signups: { confirmed: [], pending: [] },
    signupStatus: 'none',  // none | confirmed | pending
    showParticipantModal: false,
    participantTab: 'confirmed',  // confirmed | pending
    avatarDisplayCount: 5
  },

  onLoad(options) {
    const postId = options.post_id || options.id
    if (!postId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    this.setData({ postId })
    this.loadPost(postId)
  },

  async loadPost(postId) {
    const localPost = mockPost(postId)
    if (localPost) {
      const comments = mockComments(postId)
      const signups = mockSignups(postId)
      const commentTotal = localPost.commentCount || comments.length
      wx.setNavigationBarTitle({ title: localPost.author ? `${localPost.author.subtitle}-${localPost.author.name}` : '帖子详情' })
      this.setData({ post: localPost, comments, commentTotal, signups, signupStatus: 'none' })
      return
    }
    try {
      const [postRes, signupRes] = await Promise.all([
        request.get(`/api/posts/${postId}`),
        request.get(`/api/posts/${postId}/signups`)
      ])
      const post = (postRes && postRes.success) ? postRes.data : null
      if (!post) throw new Error('帖子不存在')
      const comments = mockComments(postId)
      const signups = (signupRes && signupRes.success)
        ? { confirmed: signupRes.confirmed || [], pending: signupRes.pending || [] }
        : { confirmed: [], pending: [] }
      const meId = wx.getStorageSync('token') ? ((getApp().globalData.user && getApp().globalData.user.id) || null) : null
      let signupStatus = 'none'
      if (meId) {
        if (signups.confirmed.some(s => Number(s.id) === Number(meId))) signupStatus = 'confirmed'
        else if (signups.pending.some(s => Number(s.id) === Number(meId))) signupStatus = 'pending'
      }
      const commentTotal = post.commentCount || comments.length
      wx.setNavigationBarTitle({ title: post.author ? `${post.author.subtitle}-${post.author.name}` : '帖子详情' })
      this.setData({ post, comments, commentTotal, signups, signupStatus })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async onSignupTap() {
    if (!this.data.post || this.data.post.enableSignup === false) return
    if (this.data.signupStatus === 'none') {
      wx.showActionSheet({
        itemList: ['确定参加', '待定'],
        success: async (res) => {
          const status = res.tapIndex === 0 ? 'confirmed' : 'pending'
          try {
            await request.post(`/api/posts/${this.data.post.id}/signup`, { status })
            this.setData({ signupStatus: status })
            await this.loadPost(this.data.post.id)
            wx.showToast({ title: status === 'confirmed' ? '已报名' : '已标记待定', icon: 'success' })
          } catch (e) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      })
    } else {
      wx.showModal({
        title: '取消报名',
        content: '确定要取消报名吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await request.post(`/api/posts/${this.data.post.id}/signup`, { status: 'none' })
              this.setData({ signupStatus: 'none' })
              await this.loadPost(this.data.post.id)
              wx.showToast({ title: '已取消', icon: 'success' })
            } catch (e) {
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
    }
  },

  showParticipantList() {
    this.setData({ showParticipantModal: true })
  },

  closeParticipantModal() {
    this.setData({ showParticipantModal: false })
  },

  stopPropagation() {},

  onParticipantTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab) this.setData({ participantTab: tab })
  },

  onFollowTap() {
    wx.showToast({ title: '关注功能开发中', icon: 'none' })
  },

  onLikeTap() {
    const post = this.data.post
    if (!post) return
    const liked = !this.data.liked
    const likeCount = post.likeCount + (liked ? 1 : -1)
    this.setData({
      liked,
      'post.likeCount': Math.max(0, likeCount)
    })
  },

  onShareTap() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  onHeartTap() {
    wx.showToast({ title: '收藏功能开发中', icon: 'none' })
  },

  onCommentTap() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' })
  },

  closeComments() {
    wx.navigateBack()
  }
})
