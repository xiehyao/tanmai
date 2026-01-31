<template>
  <view class="voice-recorder">
    <view class="recorder-btn" @touchstart="startRecord" @touchend="stopRecord">
      <text class="btn-text">{{ isRecording ? '录音中...' : '按住说话' }}</text>
    </view>
    <view v-if="transcript" class="transcript">
      <text>{{ transcript }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VoiceRecorder',
  data() {
    return {
      isRecording: false,
      recorderManager: null,
      transcript: ''
    }
  },
  mounted() {
    this.recorderManager = uni.getRecorderManager()
    this.recorderManager.onStart(() => {
      this.isRecording = true
    })
    this.recorderManager.onStop((res) => {
      this.isRecording = false
      this.handleRecordResult(res)
    })
  },
  methods: {
    startRecord() {
      this.recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 96000,
        format: 'mp3'
      })
    },
    stopRecord() {
      this.recorderManager.stop()
    },
    async handleRecordResult(res) {
      // 上传录音文件到服务器
      try {
        const uploadRes = await uni.uploadFile({
          url: `${getApp().globalData.apiBase}/api/voice/upload`,
          filePath: res.tempFilePath,
          name: 'audio',
          header: {
            'Authorization': `Bearer ${uni.getStorageSync('token')}`
          }
        })
        
        const data = JSON.parse(uploadRes.data)
        if (data.success) {
          this.transcript = data.transcript
          this.$emit('transcript', this.transcript)
        }
      } catch (error) {
        console.error('Upload error:', error)
        uni.showToast({
          title: '上传失败',
          icon: 'error'
        })
      }
    }
  }
}
</script>

<style scoped>
.voice-recorder {
  padding: 40rpx;
}

.recorder-btn {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.btn-text {
  color: #fff;
  font-size: 28rpx;
}

.transcript {
  margin-top: 40rpx;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  min-height: 100rpx;
}
</style>

