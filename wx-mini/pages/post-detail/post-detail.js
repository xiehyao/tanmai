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
    liked: false
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
    const commentTotal = post.commentCount || comments.length
    wx.setNavigationBarTitle({ title: post.author ? `${post.author.subtitle}-${post.author.name}` : '帖子详情' })
    this.setData({ post, comments, commentTotal })
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
