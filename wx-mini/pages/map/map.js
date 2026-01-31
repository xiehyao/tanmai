// pages/map/map.js
const request = require('../../utils/request.js')

Page({
  data: {
    centerLat: 22.5431,
    centerLng: 113.9344,
    markers: [],
    nearbyFriends: [],
    showCardModal: false,
    cardData: {}
  },

  onReady() {
    this.mapCtx = wx.createMapContext('mainMap', this)
  },

  onLoad() {
    this.loadNearbyFriends(this.data.centerLat, this.data.centerLng)
    this.getMyLocation()
  },

  getMyLocation() {
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
        this.loadNearbyFriends(this.data.centerLat, this.data.centerLng)
        wx.showToast({ title: '使用默认位置', icon: 'none', duration: 1500 })
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
        this.updateMarkers()
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

  updateMarkers() {
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

    const markers = []
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
        const marker = {
          id: friend.user_id || `${key}_${index}`,
          latitude,
          longitude,
          title: displayName,
          width: 30,
          height: 30,
          callout: {
            content: displayName,
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 5,
            display: 'BYCLICK'
          }
        }
        if (friend.avatar) {
          marker.iconPath = friend.avatar
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
        markers.push(marker)
      })
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
      this.setData({ centerLat: friend.latitude, centerLng: friend.longitude })
      if (this.mapCtx) {
        this.mapCtx.includePoints({
          points: [{ latitude: friend.latitude, longitude: friend.longitude }],
          padding: [80, 80, 80, 80]
        })
      }
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

  stopPropagation() {},

  showFilterModal() {
    wx.showToast({ title: '筛选功能开发中', icon: 'none' })
  }
})
