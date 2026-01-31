<template>
  <view class="map-page">
    <map
      :latitude="centerLat"
      :longitude="centerLng"
      :markers="markers"
      :scale="14"
      class="map-container"
      @markertap="onMarkerTap"
    ></map>
    
    <view class="controls">
      <view class="control-item" @click="getMyLocation">
        <text>定位</text>
      </view>
      <view class="control-item" @click="showFilter = true">
        <text>筛选</text>
      </view>
    </view>
    
    <view class="friend-list">
      <view 
        v-for="friend in nearbyFriends" 
        :key="friend.user_id"
        class="friend-item"
        @click="viewFriend(friend)"
      >
        <image :src="friend.avatar" class="avatar" />
        <view class="friend-info">
          <text class="name">{{ friend.nickname }}</text>
          <text class="distance">距离 {{ friend.distance }}km</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      centerLat: 39.908823,
      centerLng: 116.397470,
      markers: [],
      nearbyFriends: []
    }
  },
  onLoad() {
    this.getMyLocation()
    this.loadNearbyFriends()
  },
  methods: {
    getMyLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.centerLat = res.latitude
          this.centerLng = res.longitude
          this.loadNearbyFriends(res.latitude, res.longitude)
        },
        fail: (err) => {
          console.error('Get location error:', err)
          uni.showToast({
            title: '获取位置失败',
            icon: 'error'
          })
        }
      })
    },
    async loadNearbyFriends(lat, lng) {
      try {
        const res = await this.$http.get('/api/map/nearby-friends', {
          latitude: lat || this.centerLat,
          longitude: lng || this.centerLng,
          radius: 10
        })
        
        if (res.success) {
          this.nearbyFriends = res.friends
          this.updateMarkers()
        }
      } catch (error) {
        console.error('Load nearby friends error:', error)
      }
    },
    updateMarkers() {
      this.markers = this.nearbyFriends.map((friend, index) => ({
        id: friend.user_id,
        latitude: friend.latitude,
        longitude: friend.longitude,
        title: friend.nickname,
        iconPath: friend.avatar || '/static/marker.png',
        width: 40,
        height: 40
      }))
    },
    onMarkerTap(e) {
      const markerId = e.detail.markerId
      const friend = this.nearbyFriends.find(f => f.user_id === markerId)
      if (friend) {
        this.viewFriend(friend)
      }
    },
    viewFriend(friend) {
      uni.navigateTo({
        url: `/pages/friend/detail?id=${friend.user_id}`
      })
    }
  }
}
</script>

<style scoped>
.map-page {
  height: 100vh;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.control-item {
  background: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.friend-list {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  max-height: 400rpx;
  overflow-y: auto;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 30rpx;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.friend-info {
  flex: 1;
}

.name {
  font-size: 32rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.distance {
  font-size: 24rpx;
  color: #999;
  display: block;
}
</style>

