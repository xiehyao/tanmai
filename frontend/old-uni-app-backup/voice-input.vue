<template>
  <view class="voice-input-page">
    <view class="header">
      <text class="title">AI语音录入</text>
      <text class="subtitle">通过语音对话录入您的信息</text>
    </view>
    
    <view class="mode-selector">
      <view 
        class="mode-btn" 
        :class="{ active: mode === 'guided' }"
        @click="mode = 'guided'"
      >
        对话式引导
      </view>
      <view 
        class="mode-btn" 
        :class="{ active: mode === 'free' }"
        @click="mode = 'free'"
      >
        自由输入
      </view>
    </view>
    
    <view class="chat-container">
      <view v-for="(msg, index) in messages" :key="index" class="message" :class="msg.type">
        <text>{{ msg.content }}</text>
      </view>
    </view>
    
    <view class="input-area">
      <voice-recorder @transcript="handleTranscript" />
      <view class="text-input-area">
        <input 
          v-model="inputText" 
          placeholder="也可以直接输入文字..."
          @confirm="sendMessage"
        />
        <button @click="sendMessage">发送</button>
      </view>
    </view>
    
    <view v-if="matchFeedback" class="match-feedback">
      <text class="feedback-title">匹配反馈</text>
      <text>{{ matchFeedback }}</text>
    </view>
  </view>
</template>

<script>
import VoiceRecorder from '@/components/voice-recorder/voice-recorder.vue'

export default {
  components: {
    VoiceRecorder
  },
  data() {
    return {
      mode: 'guided', // guided or free
      messages: [],
      inputText: '',
      matchFeedback: ''
    }
  },
  onLoad() {
    this.startConversation()
  },
  methods: {
    startConversation() {
      this.addMessage('assistant', '您好！我是探脉AI助手，请告诉我您的姓名和职位')
    },
    addMessage(type, content) {
      this.messages.push({ type, content })
    },
    async sendMessage() {
      if (!this.inputText.trim()) return
      
      this.addMessage('user', this.inputText)
      const userInput = this.inputText
      this.inputText = ''
      
      try {
        const res = await this.$http.post('/api/voice/process', {
          text: userInput,
          mode: this.mode
        })
        
        if (res.success) {
          this.addMessage('assistant', res.reply)
          
          if (res.matchFeedback) {
            this.matchFeedback = res.matchFeedback
          }
          
          if (res.extractedInfo) {
            // 显示提取的信息
            this.showExtractedInfo(res.extractedInfo)
          }
        }
      } catch (error) {
        console.error('Send message error:', error)
      }
    },
    handleTranscript(transcript) {
      this.inputText = transcript
      this.sendMessage()
    },
    showExtractedInfo(info) {
      // 显示提取的信息卡片
      console.log('Extracted info:', info)
    }
  }
}
</script>

<style scoped>
.voice-input-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.mode-selector {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.mode-btn {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  background: #fff;
  border-radius: 10rpx;
  border: 2rpx solid #e0e0e0;
}

.mode-btn.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.chat-container {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  min-height: 400rpx;
  max-height: 600rpx;
  overflow-y: auto;
  margin-bottom: 40rpx;
}

.message {
  margin-bottom: 20rpx;
  padding: 20rpx;
  border-radius: 10rpx;
}

.message.user {
  background: #667eea;
  color: #fff;
  text-align: right;
}

.message.assistant {
  background: #f0f0f0;
  color: #333;
}

.input-area {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.text-input-area {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.text-input-area input {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
}

.match-feedback {
  margin-top: 40rpx;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
}

.feedback-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 20rpx;
}
</style>

