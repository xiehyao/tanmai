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
    activeModeIndex: 5,  // 默认「发现」

    // 用户信息
    userNickname: '',

    // 对话相关
    inputValue: '',
    messages: [],
    scrollTop: 0,
    hasStartedChat: false, // 是否已开始对话

    // 策略开关（独立）
    deepthinkOn: true,
    knowledgeOn: false,
    loading: false,

    // 主题管理
    currentTopicId: null, // 当前主题ID
    topics: [], // 历史主题列表
    showHistoryDrawer: false, // 是否显示历史抽屉

    // 半屏模式选择抽屉（≡ 按钮打开）
    showModeDrawer: false,
    // 对话后是否在消息下方插入 6 卡片 + 试试这样问（从半屏选择后）
    showCardsInline: false,

    // 校友名单（用于答案中姓名可点击）
    alumniList: [],
    // 校友名片半屏弹层
    showAlumniCard: false,
    alumniCardData: {},

    // 最后一条助手消息（供固定反馈栏使用）
    lastAssistantMsg: null,
    lastAssistantMsgIndex: -1
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
    // 加载校友名单（用于答案中姓名可点击匹配）
    this.loadAlumniList()
  },

  onShow() {
    if ((this.data.alumniList || []).length === 0) {
      this.loadAlumniList()
    }
  },

  async loadAlumniList() {
    try {
      const res = await request.get('/api/alumni/matched', { category: 'discover' })
      if (res.success && res.list && res.list.length > 0) {
        this.setData({ alumniList: res.list })
      }
    } catch (e) {
      console.error('loadAlumniList error:', e)
    }
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
    // 直接切换模式（初始卡片或内联卡片均适用）
    this.setData({ activeModeIndex: index })
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

  // 打开半屏模式选择抽屉
  openModeDrawer() {
    this.setData({ showModeDrawer: true })
  },

  // 关闭半屏模式选择抽屉
  closeModeDrawer() {
    this.setData({ showModeDrawer: false })
  },

  // 在半屏抽屉中选择模式
  onSelectModeFromDrawer(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      activeModeIndex: index,
      showModeDrawer: false,
      showCardsInline: true
    })
  },

  // 切换深度思考开关
  onToggleDeepthink() {
    this.setData({ deepthinkOn: !this.data.deepthinkOn })
  },

  // 切换校友信息库开关
  onToggleKnowledge() {
    this.setData({ knowledgeOn: !this.data.knowledgeOn })
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

  onExampleTapFromDrawer(e) {
    const text = e.currentTarget.dataset.text
    if (text) this.setData({ inputValue: text, showModeDrawer: false })
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

  // 将 markdown 转为纯文字显示（避免 ### ** 等符号直接展示），并去除 id=X 等内部标识
  sanitizeMarkdown(text) {
    if (!text || typeof text !== 'string') return text
    return text
      .replace(/^#{1,6}\s*/gm, '')           // ### 标题
      .replace(/\*\*([^*]+)\*\*/g, '$1')     // **粗体**
      .replace(/\*([^*]+)\*/g, '$1')         // *斜体*
      .replace(/^---+$/gm, '')               // --- 分隔线
      .replace(/```[\s\S]*?```/g, '')        // 代码块
      .replace(/`([^`]+)`/g, '$1')           // 行内代码
      .replace(/^\s*\|\s*[-:]+\s*\|/gm, '')  // 表格分隔行
      .replace(/\|/g, ' ')                   // 表格竖线
      .replace(/\n{3,}/g, '\n\n')            // 多余空行
      // 行首/列表中的 id=3: / id=3： 之类前缀
      .replace(/(^|\n)\s*[-*•]?\s*id\s*=\s*\d+\s*[:：]?\s*/gi, '$1')
      // 文中括号形式 (id=3) / （id=3）
      .replace(/[（(]\s*id\s*=\s*\d+\s*[)）]/gi, '')
      // 其余裸露的 id=3
      .replace(/\bid\s*=\s*\d+\b/gi, '')
      .replace(/\s{2,}/g, ' ')               // 多余空格
      .trim()
  },

  // 计算并缓存最后一条助手消息（用于固定反馈栏）
  updateLastAssistant(messages) {
    const msgs = messages || this.data.messages || []
    let last = null
    let lastIdx = -1
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i]
      if (m && m.role === 'assistant') {
        last = m
        lastIdx = i
        break
      }
    }
    this.setData({ lastAssistantMsg: last, lastAssistantMsgIndex: lastIdx })
  },

  // 将答案/内容文本解析为段落（普通文本 + 可点击校友姓名）
  parseAnswerSegments(text, alumniList) {
    if (!text || typeof text !== 'string') return []
    if (!alumniList || alumniList.length === 0) return [{ type: 'text', value: text }]
    const nameMap = [] // [{name, userId}]
    const seen = new Set()
    for (const a of alumniList) {
      const name = (a.name || a.nickname || '').trim()
      const nickname = (a.nickname || '').trim()
      const userId = a.id || a.user_id
      if (name && !seen.has(name)) {
        seen.add(name)
        nameMap.push({ name, userId })
      }
      if (name && nickname && name !== nickname) {
        const nameWithNick = `${name} (${nickname})`
        if (!seen.has(nameWithNick)) {
          seen.add(nameWithNick)
          nameMap.push({ name: nameWithNick, userId })
        }
      }
    }
    if (nameMap.length === 0) return [{ type: 'text', value: text }]
    nameMap.sort((a, b) => (b.name.length - a.name.length))
    const segments = []
    let i = 0
    let idx = 0
    while (i < text.length) {
      let matched = false
      for (const { name, userId } of nameMap) {
        if (text.substring(i, i + name.length) === name) {
          segments.push({ type: 'alumni', userId, name, idx: idx++ })
          i += name.length
          matched = true
          break
        }
      }
      if (!matched) {
        let j = i + 1
        while (j < text.length) {
          let anyMatch = false
          for (const { name } of nameMap) {
            if (text.substring(j, j + name.length) === name) {
              anyMatch = true
              break
            }
          }
          if (anyMatch) break
          j++
        }
        segments.push({ type: 'text', value: text.substring(i, j), idx: idx++ })
        i = j
      }
    }
    return segments
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
      showCardsInline: false // 发送后收起内联卡片
    })
    this.updateLastAssistant(newMessages)

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
          deepthink: this.data.deepthinkOn,
          use_knowledge_base: this.data.knowledgeOn
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

      // 监听数据接收（首个 data 可能含 alumni 名单，供答案中姓名匹配）
      let buffer = ''
      let streamAlumniList = []
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
              // 流结束：对助手消息做 markdown 转纯文字，并解析校友姓名可点击
              const msgs = [...this.data.messages]
              const last = msgs[assistantMessageIndex]
              const alumniList = (streamAlumniList && streamAlumniList.length > 0) ? streamAlumniList : (this.data.alumniList || [])
              if (last && last.role === 'assistant') {
                if (last.thinking) last.thinking = this.sanitizeMarkdown(last.thinking)
                if (last.answer) {
                  last.answer = this.sanitizeMarkdown(last.answer)
                  last.answerSegments = this.parseAnswerSegments(last.answer, alumniList)
                }
                if (last.content && !last.thinking && !last.answer) {
                  last.content = this.sanitizeMarkdown(last.content)
                  last.contentSegments = this.parseAnswerSegments(last.content, alumniList)
                }
              }
              this.setData({ messages: msgs, loading: false })
              this.updateLastAssistant(msgs)

              requestTask.abort()

              // 更新当前主题的消息
              if (this.data.currentTopicId) {
                const topics = this.data.topics.map(topic => {
                  if (topic.id === this.data.currentTopicId) {
                    return { ...topic, messages: msgs }
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
              
              if (data.alumni && Array.isArray(data.alumni)) {
                streamAlumniList = data.alumni
                if (streamAlumniList.length > 0) this.setData({ alumniList: streamAlumniList })
                continue
              }
              
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
                this.updateLastAssistant(updatedMessages)
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
                this.updateLastAssistant(updatedMessages)
                
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
      this.updateLastAssistant(topic.messages || [])
      
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
    this.updateLastAssistant([])
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  async onAlumniNameTap(e) {
    const userId = e.currentTarget.dataset.userId
    if (!userId) return
    await this.loadAlumniCard(userId)
  },

  async loadAlumniCard(userId) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${userId}`)
      if (res.success && res.data) {
        const cardData = { ...res.data }
        if (cardData.selected_avatar) cardData.display_avatar = cardData.selected_avatar
        else if (cardData.avatar) cardData.display_avatar = cardData.avatar
        this.setData({ alumniCardData: cardData, showAlumniCard: true })
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  closeAlumniCard() {
    this.setData({ showAlumniCard: false, alumniCardData: {} })
  },

  goToAlumniProfileFromCard() {
    const d = this.data.alumniCardData
    const uid = d && (d.id || d.user_id)
    if (!uid) return
    this.closeAlumniCard()
    wx.navigateTo({ url: `/pages/alumni-profile/alumni-profile?user_id=${uid}` })
  }
})


