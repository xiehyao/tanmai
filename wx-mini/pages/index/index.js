// pages/index/index.js
const request = require('../../utils/request.js')
const app = getApp()

// 无后台数据时，从 COS 上的 avatars 随机取头像并随机排列
const COS_AVATAR_BASE = 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/'
// 与 COS avatars 目录本地上传的文件一致
const AVATAR_FILES = [
  'female-middle-1.png',
  'female-middle-2.jpeg',
  'female-old-2.jpeg',
  'female-old.jpeg',
  'female-young-10.jpeg',
  'female-young-11.jpeg',
  'female-young-12.jpeg',
  'female-young-13.jpeg',
  'female-young-14.jpeg',
  'female-young-15.jpeg',
  'female-young-16.jpeg',
  'female-young-17.jpeg',
  'female-young-18.webp',
  'female-young-19.jpeg',
  'female-young-20.jpeg',
  'female-young-21.jpeg',
  'female-young-22.jpeg',
  'female-young-222.png',
  'female-young-23.jpeg',
  'female-young-24.png',
  'female-young-25.jpeg',
  'female-young-26.jpeg',
  'female-young-3.jpeg',
  'female-young-4.jpeg',
  'female-young-8.png',
  'female-young-9.webp',
  'female-young.png',
  'male-middle-10.png',
  'male-middle-11.png',
  'male-middle-12.jpeg',
  'male-middle-13.png',
  'male-middle-14.png',
  'male-middle-15.png',
  'male-middle-2.png',
  'male-middle-3.png',
  'male-middle-4.jpeg',
  'male-middle-5.webp',
  'male-middle-6.jpeg',
  'male-middle-7.png',
  'male-middle-8.png',
  'male-middle-9.png',
  'male-middle.png',
  'male-old-10.png',
  'male-old-11.jpeg',
  'male-old-12.jpeg',
  'male-old-13.jpeg',
  'male-old-14.png',
  'male-old-15.png',
  'male-old-16.png',
  'male-old-17.jpeg',
  'male-old-18.webp',
  'male-old-19.png',
  'male-old-2.jpeg',
  'male-old-3.png',
  'male-old-4.jpeg',
  'male-old-5.png',
  'male-old-6.png',
  'male-old-7.png',
  'male-old-8.png',
  'male-old-9.png',
  'male-old.png',
  'male-young-1.png',
  'male-young-10.png',
  'male-young-11.png',
  'male-young-12.png',
  'male-young-13.png',
  'male-young-14.webp',
  'male-young-15.jpeg',
  'male-young-16.jpeg',
  'male-young-2.jpeg',
  'male-young-3.jpeg',
  'male-young-4.jpeg',
  'male-young-5.jpeg',
  'male-young-6.webp',
  'male-young-7.jpeg',
  'male-young-8.jpeg',
  'male-young-9.jpeg'
]
const AVATAR_PATHS = AVATAR_FILES.map(name => COS_AVATAR_BASE + name)

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRandomPlaceholders(count, idPrefix) {
  const list = Array.from({ length: count }, (_, i) => ({
    user_id: idPrefix + i,
    displayName: '校友',
    avatar: AVATAR_PATHS[Math.floor(Math.random() * AVATAR_PATHS.length)]
  }))
  return shuffle(list)
}

const ALUMNI_TAB_LIST = [
  { key: 'dating', label: '脱单' },
  { key: 'soulmate', label: '知己' },
  { key: 'event', label: '找局' },
  { key: 'career', label: '事业' },
  { key: 'resource', label: '资源' },
  { key: 'discover', label: '发现' }
]

Page({
  data: {
    user: {},
    nearbyFriends: [],
    nearbyDisplay: getRandomPlaceholders(8, 'ph-'),
    alumniTabList: ALUMNI_TAB_LIST,
    activeAlumniTab: 'dating',
    alumniByTab: {
      dating: [], soulmate: [], event: [], career: [], resource: [], discover: []
    },
    currentAlumniList: getRandomPlaceholders(8, 'alumni-ph-'),
    activityList: [
      { key: 'tea', title: '线下喝茶局', desc: '周末约三五校友，小范围轻松闲聊、交换近况与想法。' },
      { key: 'innovation', title: '科创研学', desc: '一起走进科创园区、实验室或企业，了解前沿项目与合作机会。' },
      { key: 'food', title: '泉州菜走起', desc: '在一桌泉州菜里，聊聊家乡、聊聊故事，也聊聊未来的可能性。' }
    ]
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
    if (app.globalData.user) {
      this.setData({ user: app.globalData.user })
    }
    if (wx.getStorageSync('token')) {
      this.loadNearbyFriends()
      this.loadAlumniByTab(this.data.activeAlumniTab)
    } else {
      this.setData({
        nearbyDisplay: getRandomPlaceholders(8, 'ph-'),
        currentAlumniList: getRandomPlaceholders(8, 'alumni-ph-')
      })
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: true,
        success: (res) => {
          if (res.confirm) this.doLogin()
        }
      })
      return
    }
    this.getUserInfo()
  },

  async getUserInfo() {
    try {
      const res = await request.get('/api/auth/me')
      if (res && res.id) {
        app.globalData.user = res
        this.setData({ user: res })
      }
    } catch (e) {
      console.error('getUserInfo error', e)
    }
  },

  async doLogin() {
    try {
      const { code } = await wx.login()
      let avatar = null
      try {
        const profile = await wx.getUserProfile({ desc: '用于展示头像与昵称' })
        if (profile && profile.userInfo) avatar = profile.userInfo.avatarUrl || null
      } catch (_) {}
      const res = await request.post('/api/auth/login', { code, avatar: avatar || undefined })
      if (res.success && res.token) {
        wx.setStorageSync('token', res.token)
        app.globalData.token = res.token
        app.globalData.user = res.user
        this.setData({ user: res.user })
        this.loadNearbyFriends()
        this.loadAlumniByTab(this.data.activeAlumniTab)
      }
    } catch (error) {
      if (error.message && error.message.includes('服务器')) {
        console.warn('后端服务不可用，以游客模式运行')
      } else {
        wx.showToast({ title: error.message || '登录失败', icon: 'none', duration: 2000 })
      }
    }
  },

  goToVoiceInput() {
    wx.navigateTo({ url: '/pages/voice-input/voice-input' })
  },

  goToCardEntry() {
    wx.navigateTo({ url: '/pages/card-entry/card-entry' })
  },

  goToMap() {
    wx.switchTab({ url: '/pages/map/map' })
  },

  goToAssistant() {
    wx.switchTab({ url: '/pages/assistant/assistant' })
  },

  goToActivities() {
    wx.navigateTo({ url: '/pages/updates/updates' })
  },

  goToAlumniLink() {
    wx.navigateTo({ url: '/pages/alumni-link/alumni-link' })
  },

  onAlumniTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeAlumniTab) return
    const list = this.data.alumniByTab[key] && this.data.alumniByTab[key].length
      ? this.data.alumniByTab[key]
      : getRandomPlaceholders(8, 'alumni-ph-')
    this.setData({ activeAlumniTab: key, currentAlumniList: list })
    if (wx.getStorageSync('token')) this.loadAlumniByTab(key)
  },

  async loadAlumniByTab(category) {
    try {
      const res = await request.get('/api/alumni/matched', { category })
      const raw = (res && res.list) ? res.list : []
      const list = raw.slice(0, 8).map(f => {
        const name = (f.name != null && String(f.name).trim()) ? String(f.name).trim() : null
        const nickname = (f.nickname != null && String(f.nickname).trim()) ? String(f.nickname).trim() : null
        let displayName = '校友'
        if (name && nickname && name !== nickname) displayName = `${name}（${nickname}）`
        else if (name) displayName = name
        else if (nickname) displayName = nickname
        return { ...f, user_id: f.id != null ? f.id : f.user_id, displayName }
      })
      const alumniByTab = { ...this.data.alumniByTab, [category]: list }
      const displayList = list.length ? list : getRandomPlaceholders(8, 'alumni-ph-')
      const currentAlumniList = this.data.activeAlumniTab === category ? displayList : this.data.currentAlumniList
      this.setData({ alumniByTab, currentAlumniList })
    } catch (e) {
      const alumniByTab = { ...this.data.alumniByTab, [category]: [] }
      const currentAlumniList = this.data.activeAlumniTab === category ? getRandomPlaceholders(8, 'alumni-ph-') : this.data.currentAlumniList
      this.setData({ alumniByTab, currentAlumniList })
    }
  },

  async loadNearbyFriends() {
    try {
      const lat = 22.5431
      const lng = 113.9344
      const res = await request.get('/api/map/nearby-friends', { latitude: lat, longitude: lng, radius: 50 })
      if (!res.success || !res.friends || !res.friends.length) {
        this.setData({ nearbyFriends: [], nearbyDisplay: getRandomPlaceholders(8, 'ph-') })
        return
      }
      const friends = res.friends.slice(0, 8).map(f => {
        const name = (f.name != null && String(f.name).trim()) ? String(f.name).trim() : null
        const nickname = (f.nickname != null && String(f.nickname).trim()) ? String(f.nickname).trim() : null
        let displayName = '校友'
        if (name && nickname && name !== nickname) displayName = `${name}（${nickname}）`
        else if (name) displayName = name
        else if (nickname) displayName = nickname
        return { ...f, displayName }
      })
      this.setData({ nearbyFriends: friends, nearbyDisplay: friends })
    } catch (e) {
      this.setData({ nearbyFriends: [], nearbyDisplay: getRandomPlaceholders(8, 'ph-') })
    }
  }
})
