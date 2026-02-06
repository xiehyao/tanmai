// pages/alumni-link/alumni-link.js
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    // 模式选项（含价值说明、示例问题、占位文案）
    modes: [
      { label: '脱单', icon: '💕', desc: '帮你找到合适的校友对象', placeholder: '描述理想类型、城市、兴趣爱好…',
        examples: ['想找在深圳、喜欢户外、30岁左右的校友', '希望找性格开朗、有共同话题的校友'] },
      { label: '知己', icon: '👫', desc: '找到聊得来、兴趣相投的校友', placeholder: '说说你的兴趣、想聊的话题…',
        examples: ['想找喜欢读书、电影、旅行的校友聊聊', '有没有对心理学、哲学感兴趣的校友'] },
      { label: '找局', icon: '🎯', desc: '发现线下活动、饭局、运动局', placeholder: '活动类型、时间、地点…',
        examples: ['周末想约人打羽毛球，有谁在南山附近？', '有没有想一起爬山、徒步的校友'] },
      { label: '事业', icon: '💼', desc: '职业发展、合作、内推', placeholder: '行业、岗位、想聊的话题…',
        examples: ['想找在互联网做产品、有创业经验的校友聊聊', '两个人之间在事业上如何共创？'] },
      { label: '资源', icon: '🤝', desc: '技能、人脉、信息互助', placeholder: '描述你能提供什么、需要什么…',
        examples: ['想找在深圳有设计资源的校友合作', '两个人之间在资源上如何互补？'] },
      { label: '发现', icon: '✨', desc: '随缘探索有意思的校友', placeholder: '随便问，AI会帮你发现…',
        examples: ['推荐几个有意思的校友认识一下', '有哪些校友的经历比较特别？'] }
    ],
    activeModeIndex: 0,

    // 用户信息
    userNickname: '',

    // 对话相关
    inputValue: '',
    messages: [],
    scrollTop: 0,
    hasStartedChat: false, // 是否已开始对话

    // 策略选项
    strategy: 'deepthink', // deepthink / knowledge
    loading: false,

    // 主题管理
    currentTopicId: null, // 当前主题ID
    topics: [], // 历史主题列表
    showHistoryDrawer: false, // 是否显示历史抽屉

    // 模式滚动框显示
    showModeSelector: false // 是否显示模式选择滚动框
  },

  onLoad() {
    // 获取用户昵称
    const user = app.globalData.user || {}
    const nickname = user.nickname || user.name || '校友'
    this.setData({ userNickname: nickname })
    
    // 如果没有用户信息，尝试获取
    if (!user.id) {
      this.fetchUserInfo()
    }

    // 加载历史主题
    this.loadTopics()
  },

  // 获取用户信息
  async fetchUserInfo() {
    try {
      const res = await request.get('/api/cards/my')
      if (res.success && res.data) {
        const nickname = res.data.nickname || res.data.name || '校友'
        this.setData({ userNickname: nickname })
        app.globalData.user = res.data
      }
    } catch (error) {
      console.error('Fetch user info error:', error)
    }
  },

  // 加载历史主题
  loadTopics() {
    // 从本地存储加载历史主题
    const topics = wx.getStorageSync('alumni_link_topics') || []
    this.setData({ topics })
  },

  // 保存主题到本地存储
  saveTopics() {
    wx.setStorageSync('alumni_link_topics', this.data.topics)
  },

  // 选择场景卡片
  onSelectModeCard(e) {
    const index = e.currentTarget.dataset.index
    const mode = (this.data.modes[index] || {}).label || '发现'
    
    // 如果已经有对话，则开启新主题
    if (this.data.hasStartedChat) {
      this.createNewTopic(mode, index)
    } else {
      // 首次选择，设置模式
      this.setData({ 
        activeModeIndex: index,
        showModeSelector: true
      })
    }
  },

  // 创建新主题
  createNewTopic(mode, modeIndex) {
    const topicId = Date.now()
    const newTopic = {
      id: topicId,
      mode,
      modeIndex,
      title: mode,
      messages: [],
      createTime: new Date().toISOString()
    }
    
    const topics = [newTopic, ...this.data.topics]
    this.setData({
      topics,
      currentTopicId: topicId,
      activeModeIndex: modeIndex,
      messages: [],
      hasStartedChat: false,
      showModeSelector: true
    })
    
    this.saveTopics()
  },

  // 选择模式滚动框中的模式
  onSelectModeFromSelector(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ 
      activeModeIndex: index,
      showModeSelector: false
    })
  },

  // 切换模式选择滚动框显示
  toggleModeSelector() {
    this.setData({
      showModeSelector: !this.data.showModeSelector
    })
  },

  // 选择策略
  onSelectStrategy(e) {
    const strategy = e.currentTarget.dataset.strategy
    this.setData({ strategy })
  },

  // 输入框内容
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 点击示例问题，填充到输入框
  onExampleTap(e) {
    const text = e.currentTarget.dataset.text
    if (text) this.setData({ inputValue: text })
  },

  // 复制内容到剪贴板
  onCopyContent(e) {
    const index = e.currentTarget.dataset.index
    const messages = this.data.messages || []
    const msg = messages[index]
    if (!msg || msg.role !== 'assistant') return
    // 复制完整输出：思考 + 答案（或原始 content）
    const text = [msg.thinking, msg.answer].filter(Boolean).join('\n\n') || msg.content || ''
    if (!text) {
      wx.showToast({ title: '暂无内容可复制', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    })
  },

  // 反馈：有用/一般/没用
  onFeedbackTap(e) {
    const { index, value } = e.currentTarget.dataset
    const messages = [...this.data.messages]
    if (messages[index] && messages[index].role === 'assistant') {
      messages[index].feedback = value
      this.setData({ messages })
      wx.showToast({ title: '感谢反馈', icon: 'none' })
    }
  },

  // 解析思考过程和正式答案
  parseThinkingAndAnswer(content) {
    // 查找分隔符 "---" 或 "---\n"
    const separatorIndex = content.indexOf('---')
    
    if (separatorIndex === -1) {
      // 如果没有分隔符，检查是否包含思考标记
      if (content.includes('💭') || content.includes('思考中')) {
        return { thinking: content, answer: '' }
      }
      return { thinking: '', answer: content }
    }
    
    const thinking = content.substring(0, separatorIndex).trim()
    const answer = content.substring(separatorIndex + 3).trim() // 跳过 "---"
    
    return { thinking, answer }
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollTop: 99999
    })
  },

  // 发送请求（流式接收）
  async onSend() {
    const prompt = (this.data.inputValue || '').trim()
    if (!prompt) {
      wx.showToast({ title: '请先输入需求', icon: 'none' })
      return
    }

    const mode = (this.data.modes[this.data.activeModeIndex] || {}).label || '发现'

    // 如果是首次发送，创建主题
    if (!this.data.hasStartedChat) {
      if (!this.data.currentTopicId) {
        this.createNewTopic(mode, this.data.activeModeIndex)
      }
      this.setData({ hasStartedChat: true })
    }

    // 添加用户消息
    const newMessages = this.data.messages.concat([
      { role: 'user', content: prompt }
    ])
    
    // 添加一个空的助手消息，用于流式更新
    const assistantMessageIndex = newMessages.length
    newMessages.push({ role: 'assistant', content: '', thinking: '', answer: '' })
    
    this.setData({
      messages: newMessages,
      inputValue: '',
      loading: true,
      showModeSelector: false // 发送后隐藏模式选择器
    })

    // 滚动到底部
    setTimeout(() => {
      this.scrollToBottom()
    }, 100)

    // 流式接收
    try {
      const app = getApp()
      const apiBase = app.globalData.apiBase || 'https://www.pengyoo.com'
      const token = wx.getStorageSync('token')
      
      const requestTask = wx.request({
        url: `${apiBase}/api/assistant/llm-match`,
        method: 'POST',
        data: {
          prompt,
          mode,
          strategy: this.data.strategy
        },
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        enableChunked: true, // 启用分块传输
        success: (res) => {
          console.log('Stream completed')
        },
        fail: (err) => {
          console.error('Stream error:', err)
          wx.showToast({
            title: '请求失败，请稍后再试',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      })

      // 监听数据接收
      let buffer = ''
      requestTask.onChunkReceived((res) => {
        // 接收到的数据块 - 微信小程序返回的是ArrayBuffer，需要转换为字符串
        let chunk = ''
        if (res.data instanceof ArrayBuffer) {
          // 将ArrayBuffer转换为UTF-8字符串
          const uint8Array = new Uint8Array(res.data)
          // 使用TextDecoder（如果支持）或手动转换
          try {
            const decoder = new TextDecoder('utf-8')
            chunk = decoder.decode(uint8Array)
          } catch (e) {
            // 降级方案：手动转换
            chunk = String.fromCharCode.apply(null, uint8Array)
          }
        } else if (typeof res.data === 'string') {
          chunk = res.data
        } else {
          chunk = String(res.data)
        }
        
        buffer += chunk
        console.log('收到数据块，长度:', chunk.length, 'buffer长度:', buffer.length)
        
        // 解析SSE格式：data: {...}\n\n
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (!line.trim()) continue // 跳过空行
          
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim() // 去掉 "data: " 前缀并去除空白
            
            if (dataStr === '[DONE]') {
              // 流结束
              console.log('流式传输完成')
              requestTask.abort()
              this.setData({ loading: false })
              
              // 更新当前主题的消息
              if (this.data.currentTopicId) {
                const topics = this.data.topics.map(topic => {
                  if (topic.id === this.data.currentTopicId) {
                    return { ...topic, messages: this.data.messages }
                  }
                  return topic
                })
                this.setData({ topics })
                this.saveTopics()
              }
              
              // 滚动到底部
              setTimeout(() => {
                this.scrollToBottom()
              }, 100)
              return
            }
            
            try {
              const data = JSON.parse(dataStr)
              
              if (data.error) {
                // 错误信息
                console.error('收到错误:', data.error)
                const errorMsg = data.error
                const updatedMessages = [...this.data.messages]
                updatedMessages[assistantMessageIndex].content = errorMsg
                this.setData({ messages: updatedMessages, loading: false })
                return
              }
              
              // DeepSeek R1 的 reasoning：深度思考过程，实时展示
              if (data.reasoning) {
                const updatedMessages = [...this.data.messages]
                updatedMessages[assistantMessageIndex].thinking = (updatedMessages[assistantMessageIndex].thinking || '') + data.reasoning
                updatedMessages[assistantMessageIndex].content = (updatedMessages[assistantMessageIndex].content || '') + data.reasoning
                this.setData({ messages: updatedMessages })
                setTimeout(() => this.scrollToBottom(), 50)
              }
              
              if (data.content) {
                const updatedMessages = [...this.data.messages]
                const cur = updatedMessages[assistantMessageIndex]
                const hasReasoning = !!(cur.thinking && cur.thinking.length > 0)
                if (hasReasoning) {
                  // 已有 reasoning：content 即正式回答
                  cur.answer = (cur.answer || '') + data.content
                  cur.content = (cur.content || '') + data.content
                } else {
                  // 无 reasoning：用 --- 分割 thinking/answer（兼容旧模型）
                  const currentContent = (cur.content || '') + data.content
                  const parts = this.parseThinkingAndAnswer(currentContent)
                  cur.content = currentContent
                  cur.thinking = parts.thinking
                  cur.answer = parts.answer
                }
                this.setData({ messages: updatedMessages })
                
                // 定期滚动到底部
                setTimeout(() => {
                  this.scrollToBottom()
                }, 50)
              }
            } catch (e) {
              console.error('Parse SSE data error:', e, 'dataStr:', dataStr.substring(0, 200))
            }
          }
        }
      })
    } catch (err) {
      console.error('llm-match error:', err)
      wx.showToast({
        title: '请求失败，请稍后再试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 打开历史抽屉
  openHistoryDrawer() {
    this.setData({ showHistoryDrawer: true })
  },

  // 关闭历史抽屉
  closeHistoryDrawer() {
    this.setData({ showHistoryDrawer: false })
  },

  // 选择历史主题
  selectTopic(e) {
    const topicId = e.currentTarget.dataset.topicId
    const topic = this.data.topics.find(t => t.id === topicId)
    if (topic) {
      this.setData({
        currentTopicId: topic.id,
        activeModeIndex: topic.modeIndex || 0,
        messages: topic.messages || [],
        hasStartedChat: topic.messages && topic.messages.length > 0,
        showHistoryDrawer: false
      })
      
      // 滚动到底部
      setTimeout(() => {
        this.scrollToBottom()
      }, 100)
    }
  },

  // 新建主题（右上角气泡+）
  onNewTopic() {
    this.setData({
      currentTopicId: null,
      messages: [],
      hasStartedChat: false,
      activeModeIndex: 0,
      showModeSelector: false
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
})


