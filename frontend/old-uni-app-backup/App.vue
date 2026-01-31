<template>
  <view id="app">
    <view class="app-container">
      <router-view />
    </view>
  </view>
</template>

<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 初始化应用
    this.initApp()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    initApp() {
      // 检查登录状态
      // 初始化配置
      // 加载用户信息
    }
  }
}
</script>

<style lang="scss">
@import 'uview-ui/index.scss';

page {
  background-color: #f8f8f8;
}

.app-container {
  min-height: 100vh;
}
</style>

