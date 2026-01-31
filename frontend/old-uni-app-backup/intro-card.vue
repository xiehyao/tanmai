<template>
  <view class="intro-card-page">
    <view class="header">
      <text class="title">自我简介卡片</text>
    </view>
    
    <view class="card-list">
      <view 
        v-for="card in cards" 
        :key="card.id" 
        class="card-item"
        @click="editCard(card)"
      >
        <text class="card-name">{{ card.card_name }}</text>
        <text class="card-scene">{{ getSceneName(card.scene_type) }}</text>
        <text class="card-content">{{ card.content }}</text>
      </view>
    </view>
    
    <view class="actions">
      <button @click="showGenerateModal = true">生成新卡片</button>
    </view>
    
    <u-modal v-model="showGenerateModal" title="生成简介卡片">
      <view class="generate-form">
        <view class="form-item">
          <text>卡片名称</text>
          <input v-model="newCardName" placeholder="输入卡片名称" />
        </view>
        <view class="form-item">
          <text>场景类型</text>
          <picker :value="sceneIndex" :range="sceneTypes" @change="onSceneChange">
            <view>{{ sceneTypes[sceneIndex] }}</view>
          </picker>
        </view>
        <button @click="generateCard">生成</button>
      </view>
    </u-modal>
  </view>
</template>

<script>
export default {
  data() {
    return {
      cards: [],
      showGenerateModal: false,
      newCardName: '',
      sceneIndex: 0,
      sceneTypes: ['校友群', '行业群', '兴趣群', '自定义']
    }
  },
  onLoad() {
    this.loadCards()
  },
  methods: {
    async loadCards() {
      try {
        const res = await this.$http.get('/api/intro-cards/my')
        if (res.success) {
          this.cards = res.cards
        }
      } catch (error) {
        console.error('Load cards error:', error)
      }
    },
    getSceneName(sceneType) {
      const map = {
        'alumni': '校友群',
        'industry': '行业群',
        'interest': '兴趣群',
        'custom': '自定义'
      }
      return map[sceneType] || sceneType
    },
    onSceneChange(e) {
      this.sceneIndex = e.detail.value
    },
    async generateCard() {
      if (!this.newCardName) {
        uni.showToast({
          title: '请输入卡片名称',
          icon: 'error'
        })
        return
      }
      
      const sceneMap = ['alumni', 'industry', 'interest', 'custom']
      
      try {
        const res = await this.$http.post('/api/intro-cards/generate', {
          card_name: this.newCardName,
          scene_type: sceneMap[this.sceneIndex]
        })
        
        if (res.success) {
          uni.showToast({
            title: '生成成功',
            icon: 'success'
          })
          this.showGenerateModal = false
          this.loadCards()
        }
      } catch (error) {
        console.error('Generate card error:', error)
      }
    },
    editCard(card) {
      // 编辑卡片
      uni.navigateTo({
        url: `/pages/intro-card/edit?id=${card.id}`
      })
    }
  }
}
</script>

<style scoped>
.intro-card-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.card-list {
  margin-bottom: 40rpx;
}

.card-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.card-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.card-scene {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.card-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.actions {
  position: fixed;
  bottom: 40rpx;
  left: 40rpx;
  right: 40rpx;
}

.actions button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50rpx;
  padding: 30rpx;
}

.generate-form {
  padding: 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-item text {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.form-item input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
}
</style>

