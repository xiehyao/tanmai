<template>
  <view class="container">
    <view class="header">
      <text class="title">探脉</text>
      <text class="subtitle">智能社交匹配平台</text>
    </view>
    
    <view class="content">
      <view class="card" @click="goToVoiceInput">
        <text class="card-title">AI语音录入</text>
        <text class="card-desc">通过语音对话录入信息</text>
      </view>
      
      <view class="card" @click="goToMap">
        <text class="card-title">周边朋友地图</text>
        <text class="card-desc">查看附近的好友</text>
      </view>
      
      <view class="card" @click="goToAssistant">
        <text class="card-title">AI助手</text>
        <text class="card-desc">智能匹配推荐</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      
    }
  },
  onLoad() {
    this.checkLogin()
  },
  methods: {
    checkLogin() {
      // 检查登录状态
      const token = uni.getStorageSync('token')
      if (!token) {
        // 未登录，触发登录
        this.login()
      }
    },
    async login() {
      // 微信登录
      const res = await uni.login({
        provider: 'weixin'
      })
      if (res.code) {
        // 调用登录API
        try {
          const loginRes = await this.$store.dispatch('login', { code: res.code })
          if (loginRes.success) {
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            })
          }
        } catch (error) {
          console.error('Login error:', error)
        }
      }
    },
    goToVoiceInput() {
      uni.navigateTo({
        url: '/pages/voice-input/voice-input'
      })
    },
    goToMap() {
      uni.switchTab({
        url: '/pages/map/map'
      })
    },
    goToAssistant() {
      uni.switchTab({
        url: '/pages/assistant/assistant'
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.header {
  text-align: center;
  padding: 60rpx 0;
}

.title {
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
}

.content {
  margin-top: 60rpx;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.card-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
}
</style>

