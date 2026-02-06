// pages/map/map.js
const request = require('../../utils/request.js')

Page({
  data: {
    centerLat: 22.5431,
    centerLng: 113.9344,
    scale: 14,
    markers: [],
    nearbyFriends: [],
    showCardModal: false,
    cardData: {},
    _locationRequested: false
  },

  onReady() {
    this.mapCtx = wx.createMapContext('mainMap', this)
  },

  onLoad() {
    this.loadNearbyFriends(this.data.centerLat, this.data.centerLng)
    this.getMyLocation()
  },

  getMyLocation() {
    // 防止 onLoad 与组件渲染等导致的重复请求（位置授权弹两次）
    if (this.data._locationRequested) {
      wx.showToast({ title: '正在定位中...', icon: 'none' })
      return
    }
    this.setData({ _locationRequested: true })
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          centerLat: res.latitude,
          centerLng: res.longitude
        })
        this.loadNearbyFriends(res.latitude, res.longitude)
      },
      fail: (err) => {
        this.setData({ _locationRequested: false })
        this.loadNearbyFriends(this.data.centerLat, this.data.centerLng)
        wx.showToast({ title: '使用默认位置', icon: 'none', duration: 1500 })
      },
      complete: () => {
        // 成功后也重置，以便用户点「定位」按钮时可再次请求
        setTimeout(() => this.setData({ _locationRequested: false }), 500)
      }
    })
  },

  async loadNearbyFriends(lat, lng) {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        this.setData({ nearbyFriends: [], markers: [] })
        return
      }

      const res = await request.get('/api/map/nearby-friends', {
        latitude: lat || this.data.centerLat,
        longitude: lng || this.data.centerLng,
        radius: 50,
        all_alumni: true
      })

      if (res.success && res.friends && res.friends.length > 0) {
        const friends = res.friends.map(f => {
          const name = (f.name != null && String(f.name).trim()) ? String(f.name).trim() : null
          const nickname = (f.nickname != null && String(f.nickname).trim()) ? String(f.nickname).trim() : null
          let displayName = '校友'
          if (name && nickname && name !== nickname) displayName = `${name}（${nickname}）`
          else if (name) displayName = name
          else if (nickname) displayName = nickname
          return { ...f, name, nickname, displayName }
        })
        this.setData({ nearbyFriends: friends })
        await this.updateMarkers()
      } else {
        this.setData({ nearbyFriends: [], markers: [] })
      }
    } catch (error) {
      this.setData({ nearbyFriends: [], markers: [] })
      wx.showToast({
        title: error.message && error.message.includes('未登录') ? '请先登录' : '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 用 canvas 生成圆形头像（save/restore 确保真机 clip 生效）
  createRoundedAvatar(imgUrl) {
    const size = 64
    return new Promise((resolve) => {
      const doDraw = (localPath) => this._drawRoundedFromLocal(localPath, size, resolve, imgUrl)
      wx.downloadFile({
        url: imgUrl,
        success: (dl) => {
          if (dl.statusCode === 200) doDraw(dl.tempFilePath)
          else resolve(imgUrl)
        },
        fail: () => {
          wx.getImageInfo({
            src: imgUrl,
            success: (info) => doDraw(info.path),
            fail: () => resolve(imgUrl)
          })
        }
      })
    })
  },

  _drawRoundedFromLocal(localPath, size, resolve, fallbackUrl) {
    const ctx = wx.createCanvasContext('roundedMarkerCanvas', this)
    const r = size / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(r, r, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(localPath, 0, 0, size, size)
    ctx.draw(false, () => {
      ctx.restore()
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'roundedMarkerCanvas',
          destWidth: size,
          destHeight: size,
          success: (res) => resolve(res.tempFilePath),
          fail: () => resolve(fallbackUrl)
        }, this)
      }, 50)
    })
  },

  async updateMarkers() {
    const friends = this.data.nearbyFriends || []
    if (friends.length === 0) {
      this.setData({ markers: [] })
      return
    }

    const groups = {}
    friends.forEach((friend) => {
      const lat = friend.latitude
      const lng = friend.longitude
      if (lat == null || lng == null) return
      const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(friend)
    })

    const flatList = []
    Object.keys(groups).forEach((key) => {
      const group = groups[key]
      const count = group.length
      group.forEach((friend, index) => {
        let displayName = friend.displayName || friend.name || friend.nickname || '校友'
        let { latitude, longitude } = friend
        if (count > 1) {
          const radius = 0.0005
          const angle = (2 * Math.PI * index) / count
          latitude += radius * Math.cos(angle)
          longitude += radius * Math.sin(angle)
        }
        flatList.push({
          friend,
          key,
          index,
          latitude,
          longitude,
          displayName
        })
      })
    })

    const avatarCache = {}
    for (const item of flatList) {
      if (item.friend.avatar && !avatarCache[item.friend.avatar]) {
        try {
          avatarCache[item.friend.avatar] = await this.createRoundedAvatar(item.friend.avatar)
        } catch (e) {
          avatarCache[item.friend.avatar] = item.friend.avatar
        }
      }
    }

    const markers = flatList.map((item) => {
      const { friend, key, index, latitude, longitude, displayName } = item
      const marker = {
        id: friend.user_id || `${key}_${index}`,
        latitude,
        longitude,
        title: displayName,
        width: 44,
        height: 44,
        callout: {
          content: displayName,
          color: '#ffffff',
          fontSize: 12,
          borderRadius: 6,
          bgColor: '#667eea',
          padding: 4,
          display: 'ALWAYS'
        }
      }
      if (friend.avatar) {
        marker.iconPath = avatarCache[friend.avatar] || friend.avatar
      } else {
        marker.label = {
          content: displayName,
          color: '#fff',
          fontSize: 12,
          bgColor: '#667eea',
          borderRadius: 15,
          padding: 5,
          anchorX: 0,
          anchorY: 0
        }
      }
      return marker
    })

    this.setData({ markers })
    if (this.mapCtx && markers.length > 0) {
      this.mapCtx.includePoints({
        points: markers.map(m => ({ latitude: m.latitude, longitude: m.longitude })),
        padding: [80, 80, 80, 80]
      })
    }
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    const friend = this.data.nearbyFriends.find(f => f.user_id === markerId)
    if (friend) {
      this.viewFriend({ currentTarget: { dataset: { friend } } })
    }
  },

  async viewFriend(e) {
    const friend = e.currentTarget.dataset.friend
    if (!friend) return

    if (friend.latitude && friend.longitude) {
      this.setData({
        centerLat: friend.latitude,
        centerLng: friend.longitude,
        scale: 14
      })
    }
    await this.loadCardData(friend.user_id, friend.address)
  },

  async loadCardData(userId, addressFromMap) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${userId}`)
      if (res.success && res.data) {
        const cardData = { ...res.data }
        if (addressFromMap) cardData.address = addressFromMap
        this.setData({ cardData, showCardModal: true })
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  closeCardModal() {
    this.setData({ showCardModal: false, cardData: {} })
  },

  goToAlumniProfile() {
    const d = this.data.cardData
    const uid = d && (d.id || d.user_id)
    if (!uid) return
    this.closeCardModal()
    wx.navigateTo({ url: `/pages/alumni-profile/alumni-profile?user_id=${uid}` })
  },

  stopPropagation() {},

  showFilterModal() {
    wx.showToast({ title: '筛选功能开发中', icon: 'none' })
  }
})
