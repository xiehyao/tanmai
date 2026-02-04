// pages/post-detail/post-detail.js - 帖子详情页（类似朋友圈阅读评论）
const request = require('../../utils/request.js')

function mockPost(id) {
  const posts = {
    'tea-1': {
      id: 'tea-1',
      author: { id: 1, name: '于涛', subtitle: '00通信工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png', followerCount: 10 },
      content: '这周六下午17:00在北邮科技大厦开北邮深港澳校友会筹备会。大家到了可以先在一楼大厅稍等。',
      images: [],
      location: '深圳 北邮科技大厦',
      timeText: '昨天',
      likeCount: 42,
      shareCount: 42,
      commentCount: 12,
      activityKey: 'tea'
    },
    'innovation-1': {
      id: 'innovation-1',
      author: { id: 2, name: '孟楠', subtitle: '北邮深圳研究院', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png', followerCount: 8 },
      content: '科创研学活动报名中，一起走进腾讯滨海大厦，了解前沿技术。',
      images: [],
      location: '深圳 南山区',
      timeText: '2天前',
      likeCount: 28,
      shareCount: 15,
      commentCount: 5,
      activityKey: 'innovation'
    },
    'food-1': {
      id: 'food-1',
      author: { id: 3, name: '于涛', subtitle: '00通信工程', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png', followerCount: 10 },
      content: '看风景。',
      images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600'],
      location: '泰国 普吉岛',
      timeText: '昨天',
      likeCount: 156,
      shareCount: 42,
      commentCount: 297,
      activityKey: 'food'
    }
  }
  return posts[id] || posts['food-1']
}

const AVATAR_BASE = 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/'

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

  loadPost(postId) {
    const post = mockPost(postId)
    const comments = mockComments(postId)
    const signups = mockSignups(postId)
    const commentTotal = post.commentCount || comments.length
    wx.setNavigationBarTitle({ title: post.author ? `${post.author.subtitle}-${post.author.name}` : '帖子详情' })
    this.setData({ post, comments, commentTotal, signups })
  },

  onSignupTap() {
    if (this.data.signupStatus === 'none') {
      wx.showActionSheet({
        itemList: ['确定参加', '待定'],
        success: (res) => {
          const status = res.tapIndex === 0 ? 'confirmed' : 'pending'
          this.setData({ signupStatus: status })
          const signups = { ...this.data.signups }
          const me = { id: 0, name: '我', avatar: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png', status }
          if (status === 'confirmed') {
            signups.confirmed = [me, ...signups.confirmed]
          } else {
            signups.pending = [me, ...signups.pending]
          }
          this.setData({ signups })
          wx.showToast({ title: status === 'confirmed' ? '已报名' : '已标记待定', icon: 'success' })
        }
      })
    } else {
      wx.showModal({
        title: '取消报名',
        content: '确定要取消报名吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({ signupStatus: 'none' })
            wx.showToast({ title: '已取消', icon: 'success' })
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
