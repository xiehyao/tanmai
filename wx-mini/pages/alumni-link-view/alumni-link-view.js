// pages/alumni-link/alumni-link.js
const request = require('../../utils/request.js')
const app = getApp()

// 真机不支持 TextDecoder：正确解码 UTF-8，兼容分块边界与 apply 参数上限
function utf8BytesToString(arr) {
  const u8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr)
  if (u8.length === 0) return ''
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(u8)
    }
  } catch (e) {}
  // escape+decodeURIComponent 方案，分批避免 apply 参数过多
  const BATCH = 8192
  let out = ''
  for (let i = 0; i < u8.length; i += BATCH) {
    const slice = u8.subarray(i, Math.min(i + BATCH, u8.length))
    const arrCopy = Array.from(slice)
    out += decodeURIComponent(escape(String.fromCharCode.apply(null, arrCopy)))
  }
  return out
}

// 返回可安全解码的字节数（不切断 UTF-8 多字节字符）
function getUtf8SafeDecodeLength(u8) {
  const n = u8.length
  if (n === 0) return 0
  let i = n - 1
  const b = u8[i]
  if ((b & 0x80) === 0) return n
  if ((b & 0xC0) === 0x80) {
    while (i > 0 && (u8[i] & 0xC0) === 0x80) i--
    const start = u8[i]
    const need = (start & 0xE0) === 0xC0 ? 2 : (start & 0xF0) === 0xE0 ? 3 : (start & 0xF8) === 0xF0 ? 4 : 1
    return (n - i >= need) ? n : i
  }
  return n - 1
}

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
    lastAssistantMsgIndex: -1,
    // 反馈入口是否已就绪（避免过度依赖 [DONE]，在回答足够长时提前展示）
    feedbackReady: false
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

  // 思考过程专用：去除 id=xx、提示词泄漏（deepthink/use_knowledge_base/关键约束等）
  sanitizeThinking(text) {
    if (!text || typeof text !== 'string') return text
    const idPat = /(^|\n)\s*[-*•]?\s*id\s*=\s*\d+\s*[:：]?\s*/gi
    const idParen = /[（(]\s*id\s*=\s*\d+\s*[)）]/gi
    const idBare = /\bid\s*=\s*\d+\b/gi
    let t = text.replace(idPat, '$1').replace(idParen, '').replace(idBare, '')
    const leakPat = /deepthink\s*=\s*(True|False)|use_knowledge_base\s*=\s*(True|False)|用户指定了\s*deepthink|用户指定了\s*use_knowledge_base|关键约束：|【严禁】在推理|数据库已?提供|主体部分需要自由发挥|结尾部分.*格式|回顾校友数据库/
    t = t.split('\n').filter(line => !leakPat.test(line)).join('\n')
    return t.replace(/\n{3,}/g, '\n\n').trim()
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
      .replace(/\t/g, '  ')                   // 制表符 → 2 空格（保留层级）
      .replace(/[ \t]+\n/g, '\n')            // 行尾空格 → 换行
      .split(/\n/).map(line => {
        const m = line.match(/^([ \t]*)(.*)$/)
        const lead = (m && m[1]) || ''
        const rest = (m && m[2]) || line
        return lead + rest.replace(/[ ]{3,}/g, '  ')  // 仅行内 3+ 空格折叠，保留行首缩进
      }).join('\n')
      .replace(/\n{3,}/g, '\n\n')
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

  // 当助手回答达到一定长度时，提前打开反馈入口（避免必须等到 [DONE]）
  maybeSetFeedbackReady(msg) {
    if (this.data.feedbackReady) return
    if (!msg || msg.role !== 'assistant') return
    const text = [msg.thinking, msg.answer, msg.content].filter(Boolean).join('\n')
    if (!text) return
    const lineCount = text.split(/\n+/).length
    // 约等于「10 行」或「300 字」左右即可展示反馈与复制
    if (lineCount >= 10 || text.length >= 300) {
      this.setData({ feedbackReady: true })
    }
  },

  // 思考区专用：仅解析校友名可点击，不做 ### 和 ** 转义
  parseThinkingSegments(text, alumniList) {
    if (!text || typeof text !== 'string') return []
    const preprocess = (t) => {
      t = t.replace(/^---+$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/(^|\n)\s*[-*•]?\s*id\s*=\s*\d+\s*[:：]?\s*/gi, '$1').replace(/[（(]\s*id\s*=\s*\d+\s*[)）]/gi, '').replace(/\bid\s*=\s*\d+\b/gi, '')
      t = t.replace(/\t/g, '  ').replace(/[ \t]+\n/g, '\n')
      return t.split(/\n/).map(line => { const m = line.match(/^([ \t]*)(.*)$/); const lead = (m && m[1]) || ''; const rest = (m && m[2]) || line; return lead + rest.replace(/[ ]{3,}/g, '  ') }).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    }
    text = preprocess(text)
    const nameMap = []
    const seen = new Set()
    for (const a of alumniList || []) {
      const name = (a.name || a.nickname || '').trim()
      const nickname = (a.nickname || '').trim()
      const userId = a.id || a.user_id
      if (name && !seen.has(name)) { seen.add(name); nameMap.push({ name, userId }) }
      if (name && nickname && name !== nickname) {
        const nwn = `${name} (${nickname})`
        if (!seen.has(nwn)) { seen.add(nwn); nameMap.push({ name: nwn, userId }) }
      }
    }
    nameMap.sort((a, b) => (b.name.length - a.name.length))
    const segments = []
    let idx = 0
    const lines = text.split(/\n/)
    for (let L = 0; L < lines.length; L++) {
      const line = lines[L]
      let i = 0
      while (i < line.length) {
        let bestAlumni = null
        let bestStart = line.length
        for (const n of nameMap) {
          const p = line.indexOf(n.name, i)
          if (p !== -1 && p < bestStart) { bestStart = p; bestAlumni = n }
        }
        if (bestAlumni) {
          if (i < bestStart) segments.push({ type: 'text', value: line.substring(i, bestStart), idx: idx++ })
          segments.push({ type: 'alumni', userId: bestAlumni.userId, name: bestAlumni.name, idx: idx++ })
          i = bestStart + bestAlumni.name.length
        } else {
          segments.push({ type: 'text', value: line.substring(i), idx: idx++ })
          break
        }
      }
      if (L < lines.length - 1) segments.push({ type: 'text', value: '\n', idx: idx++ })
    }
    return segments.length ? segments : [{ type: 'text', value: text, idx: 0 }]
  },

  // 解析 **粗体** 内部内容，提取其中的校友名为可点击段（如 **谢怀遥的双轨制身份** → 谢怀遥可点 + 的双轨制身份加粗）
  parseBoldInnerForAlumni(inner, nameMap) {
    const out = []
    let i = 0
    while (i < inner.length) {
      let bestAlumni = null
      let bestStart = inner.length
      for (const n of nameMap) {
        const p = inner.indexOf(n.name, i)
        if (p !== -1 && p < bestStart) { bestStart = p; bestAlumni = n }
      }
      if (bestAlumni) {
        if (i < bestStart) out.push({ type: 'bold', value: inner.substring(i, bestStart) })
        out.push({ type: 'alumni', userId: bestAlumni.userId, name: bestAlumni.name, bold: true })
        i = bestStart + bestAlumni.name.length
      } else {
        out.push({ type: 'bold', value: inner.substring(i) })
        break
      }
    }
    return out
  },

  // 将答案/内容文本解析为段落（### 标题、**粗体**、可点击校友姓名、普通文本）
  parseAnswerSegments(text, alumniList) {
    if (!text || typeof text !== 'string') return []
    const preprocess = (t) => {
      t = t.replace(/^---+$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/(^|\n)\s*[-*•]?\s*id\s*=\s*\d+\s*[:：]?\s*/gi, '$1').replace(/[（(]\s*id\s*=\s*\d+\s*[)）]/gi, '').replace(/\bid\s*=\s*\d+\b/gi, '')
      t = t.replace(/\t/g, '  ').replace(/[ \t]+\n/g, '\n')
      return t.split(/\n/).map(line => { const m = line.match(/^([ \t]*)(.*)$/); const lead = (m && m[1]) || ''; const rest = (m && m[2]) || line; return lead + rest.replace(/[ ]{3,}/g, '  ') }).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    }
    text = preprocess(text)
    const nameMap = []
    const seen = new Set()
    for (const a of alumniList || []) {
      const name = (a.name || a.nickname || '').trim()
      const nickname = (a.nickname || '').trim()
      const userId = a.id || a.user_id
      if (name && !seen.has(name)) { seen.add(name); nameMap.push({ name, userId }) }
      if (name && nickname && name !== nickname) {
        const nwn = `${name} (${nickname})`
        if (!seen.has(nwn)) { seen.add(nwn); nameMap.push({ name: nwn, userId }) }
      }
    }
    nameMap.sort((a, b) => (b.name.length - a.name.length))
    const segments = []
    let idx = 0
    const lines = text.split(/\n/)
    const parseLineToSegments = (s, nameMap, idxRef) => {
      const out = []
      const push = (seg) => { seg.idx = idxRef.current++; out.push(seg) }
      const parseLine = (str) => {
        let i = 0
        while (i < str.length) {
          const open = str.indexOf('**', i)
          let bestAlumni = null
          let bestStart = str.length
          for (const n of nameMap) {
            const p = str.indexOf(n.name, i)
            if (p !== -1 && p < bestStart) { bestStart = p; bestAlumni = n }
          }
          if (open !== -1 && (bestAlumni === null || open <= bestStart)) {
            const close = str.indexOf('**', open + 2)
            if (close !== -1) {
              if (open > i) parseLine(str.substring(i, open))
              const inner = str.substring(open + 2, close)
              const alum = nameMap.find(x => x.name === inner)
              if (alum) push({ type: 'alumni', userId: alum.userId, name: alum.name, bold: true })
              else for (const seg of this.parseBoldInnerForAlumni(inner, nameMap)) push(seg)
              i = close + 2
              continue
            }
            push({ type: 'text', value: str.substring(i) })
            break
          }
          if (bestAlumni) {
            if (i < bestStart) parseLine(str.substring(i, bestStart))
            push({ type: 'alumni', userId: bestAlumni.userId, name: bestAlumni.name })
            i = bestStart + bestAlumni.name.length
            continue
          }
          if (open !== -1 || bestAlumni) { i++; continue }
          if (i < str.length) push({ type: 'text', value: str.substring(i) })
          break
        }
      }
      parseLine(s)
      return out
    }

    for (let L = 0; L < lines.length; L++) {
      const line = lines[L]
      const headingMatch = line.match(/^[ \t]*###\s*(.*)$/)
      if (headingMatch) {
        const headingContent = (headingMatch[1] || '').trim()
        const headIdx = idx
        const idxRef = { current: idx }
        const subSegs = parseLineToSegments(headingContent, nameMap, idxRef)
        if (subSegs.length === 0) { subSegs.push({ type: 'text', value: headingContent, idx: idx }); idx++ } else { idx = idxRef.current }
        segments.push({ type: 'heading', segments: subSegs, idx: headIdx })
        continue
      }
      const parseLine = (s) => {
        let i = 0
        while (i < s.length) {
          const open = s.indexOf('**', i)
          let bestAlumni = null
          let bestStart = s.length
          for (const { name } of nameMap) {
            const p = s.indexOf(name, i)
            if (p !== -1 && p < bestStart) { bestStart = p; bestAlumni = { name, userId: nameMap.find(x => x.name === name).userId } }
          }
          if (open !== -1 && (bestAlumni === null || open <= bestStart)) {
            const close = s.indexOf('**', open + 2)
            if (close !== -1) {
              if (open > i) parseLine(s.substring(i, open))
              const inner = s.substring(open + 2, close)
              const alum = nameMap.find(x => x.name === inner)
              if (alum) segments.push({ type: 'alumni', userId: alum.userId, name: alum.name, bold: true, idx: idx++ })
              else for (const seg of this.parseBoldInnerForAlumni(inner, nameMap)) { seg.idx = idx++; segments.push(seg) }
              i = close + 2
              continue
            }
            segments.push({ type: 'text', value: s.substring(i), idx: idx++ })
            break
          }
          if (bestAlumni) {
            if (bestAlumni.name.length > 0 && i < bestStart) parseLine(s.substring(i, bestStart))
            segments.push({ type: 'alumni', userId: bestAlumni.userId, name: bestAlumni.name, idx: idx++ })
            i = bestStart + bestAlumni.name.length
            continue
          }
          if (open !== -1 || bestAlumni) { i++; continue }
          if (i < s.length) segments.push({ type: 'text', value: s.substring(i), idx: idx++ })
          break
        }
      }
      parseLine(line)
      if (L < lines.length - 1) segments.push({ type: 'text', value: '\n', idx: idx++ })
    }
    return segments.length ? segments : [{ type: 'text', value: text, idx: 0 }]
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
      showCardsInline: false, // 发送后收起内联卡片
      feedbackReady: false
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
      let byteBuffer = []
      let streamAlumniList = []
      // 闭包内累积，避免 setData 未完成时下一 chunk 读到旧数据导致清空/重播
      let accumulatedReasoning = ''
      let accumulatedContent = ''
      requestTask.onChunkReceived((res) => {
        if (typeof res.data === 'string') {
          buffer += res.data
        } else {
          const raw = res.data
          const u8 = raw instanceof Uint8Array ? raw : (raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(0))
          for (let i = 0; i < u8.length; i++) byteBuffer.push(u8[i])
          const safeLen = getUtf8SafeDecodeLength(new Uint8Array(byteBuffer))
          if (safeLen > 0) {
            const toDecode = new Uint8Array(byteBuffer.splice(0, safeLen))
            buffer += utf8BytesToString(toDecode)
          }
        }
        console.log('收到数据块，buffer长度:', buffer.length, 'byteBuf:', byteBuffer.length)
        
        // 解析SSE格式：data: {...}\n\n
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行
        
        for (const line of lines) {
          if (!line.trim()) continue // 跳过空行
          
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim() // 去掉 "data: " 前缀并去除空白
            
              if (dataStr === '[DONE]') {
              if (byteBuffer.length > 0) {
                try { buffer += utf8BytesToString(new Uint8Array(byteBuffer)) } catch (e) {}
                byteBuffer = []
              }
              // 流结束：对助手消息做 markdown 转纯文字，并解析校友姓名可点击
              const msgs = [...this.data.messages]
              const last = msgs[assistantMessageIndex]
              const alumniList = (streamAlumniList && streamAlumniList.length > 0) ? streamAlumniList : (this.data.alumniList || [])
              if (last && last.role === 'assistant') {
                // 用闭包累积值保证完整，避免 setData 竞态
                if (accumulatedReasoning) {
                  last.thinking = this.sanitizeThinking(accumulatedReasoning)
                  last.thinkingSegments = this.parseThinkingSegments(last.thinking, alumniList)
                }
                if (accumulatedContent) {
                  if (accumulatedReasoning) {
                    last.answer = accumulatedContent
                    last.answerSegments = this.parseAnswerSegments(last.answer, alumniList)
                    last.answer = this.sanitizeMarkdown(last.answer)
                  } else {
                    const parts = this.parseThinkingAndAnswer(accumulatedContent)
                    last.thinking = parts.thinking
                    last.answer = parts.answer
                    if (last.thinking) last.thinkingSegments = this.parseThinkingSegments(last.thinking, alumniList)
                    if (last.answer) last.answerSegments = this.parseAnswerSegments(last.answer, alumniList)
                    last.answer = this.sanitizeMarkdown(last.answer)
                  }
                }
                if (last.content && !last.thinking && !last.answer) {
                  last.contentSegments = this.parseAnswerSegments(last.content, alumniList)
                  last.content = this.sanitizeMarkdown(last.content)
                }
              }
              this.setData({ messages: msgs, loading: false, feedbackReady: true })
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
              
              // DeepSeek R1 的 reasoning：深度思考过程，实时展示（去除提示词泄漏和 id=xx，校友名可点击）
              if (data.reasoning) {
                accumulatedReasoning += data.reasoning
                const sanitized = this.sanitizeThinking(accumulatedReasoning)
                const updatedMessages = [...this.data.messages]
                updatedMessages[assistantMessageIndex].thinking = sanitized
                updatedMessages[assistantMessageIndex].content = (updatedMessages[assistantMessageIndex].content || '') + data.reasoning
                const alumniList = (streamAlumniList && streamAlumniList.length > 0) ? streamAlumniList : (this.data.alumniList || [])
                updatedMessages[assistantMessageIndex].thinkingSegments = this.parseThinkingSegments(sanitized, alumniList)
                this.setData({ messages: updatedMessages })
                this.updateLastAssistant(updatedMessages)
                this.maybeSetFeedbackReady(updatedMessages[assistantMessageIndex])
                setTimeout(() => this.scrollToBottom(), 50)
              }
              
              if (data.content) {
                accumulatedContent += data.content
                const updatedMessages = [...this.data.messages]
                const cur = updatedMessages[assistantMessageIndex]
                const hasReasoning = accumulatedReasoning.length > 0
                if (hasReasoning) {
                  // 已有 reasoning：content 即正式回答
                  cur.answer = accumulatedContent
                  cur.content = accumulatedReasoning + accumulatedContent
                } else {
                  // 无 reasoning：用 --- 分割 thinking/answer（兼容旧模型）
                  const parts = this.parseThinkingAndAnswer(accumulatedContent)
                  cur.content = accumulatedContent
                  cur.thinking = parts.thinking
                  cur.answer = parts.answer
                }
                const alumniList = (streamAlumniList && streamAlumniList.length > 0) ? streamAlumniList : (this.data.alumniList || [])
                if (cur.thinking) cur.thinkingSegments = this.parseThinkingSegments(cur.thinking, alumniList)
                if (cur.answer) {
                  cur.answerSegments = this.parseAnswerSegments(cur.answer, alumniList)
                } else if (cur.content) {
                  cur.contentSegments = this.parseAnswerSegments(cur.content, alumniList)
                }
                this.setData({ messages: updatedMessages })
                this.updateLastAssistant(updatedMessages)
                this.maybeSetFeedbackReady(updatedMessages[assistantMessageIndex])
                
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
      showModeSelector: false,
      feedbackReady: false
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
        cardData.display_avatar = cardData.avatar || cardData.selected_avatar
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


