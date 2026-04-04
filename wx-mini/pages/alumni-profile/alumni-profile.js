// pages/alumni-profile/alumni-profile.js
const request = require('../../utils/request.js')
const { utf8BytesToString, getUtf8SafeDecodeLength } = require('../../utils/stream-sse.js')

function getApiBase() {
  try {
    const app = getApp()
    if (app && app.globalData && app.globalData.apiBase) return app.globalData.apiBase
  } catch (e) {}
  try {
    return require('../../config.js').apiBase || 'https://www.pengyoo.com'
  } catch (e) {
    return 'https://www.pengyoo.com'
  }
}

// 根据出生日期推算星座（月日）
function getConstellation(month, day) {
  if (!month || !day) return ''
  const d = parseInt(day, 10)
  const m = parseInt(month, 10)
  const dates = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]
  const signs = ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手']
  const i = m - (d < dates[m - 1] ? 1 : 0)
  return signs[i >= 0 ? i : 11] || ''
}

// 格式化中学信息：惠安一中 初97届 高00届
function formatMiddleSchool(s2) {
  if (!s2) return ''
  const parts = []
  if (s2.middle_school && s2.middle_graduation_year) {
    parts.push(`${s2.middle_school} 初${String(s2.middle_graduation_year).slice(-2)}届`)
  }
  if (s2.high_school && s2.high_graduation_year) {
    parts.push(`${s2.high_school} 高${String(s2.high_graduation_year).slice(-2)}届`)
  }
  return parts.join(' ')
}

/** 简介自动拼接：优先高中届别 */
function formatHighSchoolLine(s2) {
  if (!s2) return ''
  if (s2.high_school && s2.high_graduation_year) {
    return `${s2.high_school} 高${String(s2.high_graduation_year).slice(-2)}届`
  }
  return ''
}

// 格式化大学信息：北邮00级本 04级硕 通信工程
function formatUniversity(s2) {
  if (!s2) return ''
  const parts = []
  if (s2.bachelor_university && s2.bachelor_graduation_year) {
    let s = `${s2.bachelor_university}${String(s2.bachelor_graduation_year).slice(-2)}级本`
    if (s2.bachelor_major) s += ' ' + s2.bachelor_major
    parts.push(s)
  }
  if (s2.master_university && s2.master_graduation_year) {
    let s = `${s2.master_university}${String(s2.master_graduation_year).slice(-2)}级硕`
    if (s2.master_major) s += ' ' + s2.master_major
    parts.push(s)
  }
  if (s2.doctor_university && s2.doctor_graduation_year) {
    parts.push(`${s2.doctor_university}${String(s2.doctor_graduation_year).slice(-2)}级博`)
  }
  return parts.join(' ')
}

// 社会职位：association_positions + board_position
function formatSocialPositions(s5) {
  if (!s5) return ''
  const arr = []
  if (s5.board_position) arr.push(s5.board_position)
  if (Array.isArray(s5.association_positions) && s5.association_positions.length) {
    arr.push(...s5.association_positions)
  }
  return arr.filter(Boolean).join('；')
}

// 兴趣爱好：从 resources 或 hidden_info 提取
function formatInterests(profile) {
  if (!profile) return ''
  const s4 = profile.step4
  if (s4 && Array.isArray(s4.resources)) {
    const interests = s4.resources
      .filter(r => r.resource_type === 'interest' || (r.resource_title && /兴趣|爱好|喜欢/.test(r.resource_title)))
      .map(r => r.resource_title || r.resource_description)
    if (interests.length) return interests.join('、')
  }
  const h = profile.step6?.hidden_info
  if (h && (h.interests || h.hobbies)) return h.interests || h.hobbies
  return ''
}

function mergeS2FromUser(u, s2) {
  if (s2 && Object.keys(s2).length > 0) return s2
  return {
    middle_school: u.middle_school,
    middle_graduation_year: u.middle_graduation_year,
    high_school: u.high_school,
    high_graduation_year: u.high_graduation_year,
    bachelor_university: u.bachelor_university,
    bachelor_major: u.bachelor_major,
    bachelor_graduation_year: u.bachelor_graduation_year,
    master_university: u.master_university,
    master_major: u.master_major,
    master_graduation_year: u.master_graduation_year,
    doctor_university: u.doctor_university,
    doctor_graduation_year: u.doctor_graduation_year
  }
}

/**
 * 无手写简介时按顺序拼接：高中届别 → 大学 → 城市/公司/职务 → 兴趣与联系方式
 */
function buildAutoIntroParagraph(user, profile) {
  const u = user || {}
  const s1 = profile?.step1 || {}
  const s2 = mergeS2FromUser(u, profile?.step2 || {})
  const s5 = profile?.step5 || {}
  const lines = []
  const hs = formatHighSchoolLine(s2)
  const ms = formatMiddleSchool(s2)
  if (hs) lines.push(hs)
  else if (ms) lines.push(ms)
  const uni = formatUniversity(s2)
  if (uni) lines.push(uni)
  const addr = (s1.locations && s1.locations[0] && s1.locations[0].address)
    ? s1.locations[0].address
    : (u.address || '')
  const company = u.company || s1.company || ''
  const title = u.title || s1.title || ''
  const workBits = []
  if (addr) workBits.push(`常驻${addr}`)
  if (company && title) workBits.push(`在${company}担任${title}`)
  else if (company) workBits.push(`在${company}工作`)
  else if (title) workBits.push(`职务：${title}`)
  if (workBits.length) lines.push(workBits.join('，'))
  const interests = formatInterests(profile)
  const contacts = [u.phone || s1.phone, u.wechat_id || s1.wechat_id, u.email || s1.email].filter(Boolean)
  const tail = []
  if (interests) tail.push(`兴趣爱好：${interests}`)
  if (contacts.length) tail.push(`联系方式：${contacts.join('，')}`)
  const social = formatSocialPositions(s5)
  if (social) tail.push(`社会职务：${social}`)
  if (tail.length) lines.push(tail.join('。'))
  return lines.filter(Boolean).join('\n')
}

/** 当前用户是否已具备「帮我连连看」所需名片与信息 */
function isSelfCardEntryComplete(entry) {
  if (!entry) return false
  const s1 = entry.step1 || {}
  const s2 = entry.step2 || {}
  const name = (s1.name || '').trim()
  const company = (s1.company || '').trim()
  if (!name || !company) return false
  const hasIntro = !!(s1.bio && String(s1.bio).trim())
  const hasContact = !!(s1.phone || s1.wechat_id || s1.email)
  const hasEdu = !!(s2.high_school || s2.bachelor_university || s2.master_university || s2.middle_school)
  return hasIntro || hasContact || hasEdu
}

/** 解析 wx.request 非 200 时的 FastAPI 错误文案 */
function formatPairRequestError(res) {
  const code = res.statusCode || 0
  if (code === 401) return '登录已失效，请重新登录'
  let raw = res.data
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw)
      if (j.detail != null) {
        const d = j.detail
        if (typeof d === 'string') return d
        if (Array.isArray(d) && d[0] && d[0].msg) return d.map(x => x.msg).join('；')
      }
    } catch (e) {}
  }
  if (code === 404) {
    return '连连看服务未就绪（404）。若管理员刚更新后端，请稍等片刻后重试；仍失败请联系管理员重启 API 服务。'
  }
  return '服务暂不可用(' + code + ')'
}

Page({
  data: {
    user: null,
    userId: null,
    profileData: null,
    introCards: [],
    matchContent: '',
    ownerName: '校友',
    displayName: '',
    displayPhotos: [],
    displayConstellation: '',
    displayMiddleSchool: '',
    displayUniversity: '',
    displayCompanyTitle: '',
    displaySocialPositions: '',
    displayInterests: '',
    displayAssociationNeeds: '',
    displayContact: '',
    displayAddress: '',
    introHeroUrl: '',
    introBodyText: '',
    showPairSheet: false,
    pairLoading: false,
    pairStreamText: '',
    pairThinking: '',
    pairAnswer: ''
  },

  onLoad(options) {
    const uid = options.user_id
    if (!uid) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ userId: uid })
    this.loadUser(uid)
  },

  _ownerDisplayName(user, s1) {
    const u = user || {}
    return (s1 && s1.name) || u.name || u.nickname || '校友'
  },

  _computeIntroPresentation(user, profileRes) {
    const u = user || {}
    const s1 = profileRes?.step1 || {}
    const photos = Array.isArray(s1.personal_photos) ? s1.personal_photos : (Array.isArray(u.personal_photos) ? u.personal_photos : [])
    const introHeroUrl =
      (s1.avatar_photo_cartoon_url || '').trim() ||
      (s1.avatar_photo_original_url || '').trim() ||
      (photos[0] || '') ||
      u.selected_avatar ||
      u.avatar ||
      ''
    const bioRaw = (s1.bio || u.bio || '').trim()
    const profile = profileRes
      ? {
          step1: profileRes.step1 || {},
          step2: profileRes.step2 || {},
          step4: profileRes.step4 || {},
          step5: profileRes.step5 || {},
          step6: profileRes.step6 || {}
        }
      : { step1: {}, step2: {}, step4: {}, step5: {}, step6: {} }
    const introBodyText = bioRaw || buildAutoIntroParagraph(u, profile)
    return { introHeroUrl, introBodyText }
  },

  async loadUser(uid) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${uid}`)
      if (res.success && res.data) {
        const user = res.data
        const name = user.name || user.nickname || '校友'
        this.setData({
          user,
          pageTitle: name + '的卡片',
          ownerName: name
        })
        wx.setNavigationBarTitle({ title: this.data.pageTitle })
        await this.loadProfileData(uid, user)
        this.loadIntroCards(uid)
        this.loadMatchContent(uid)
      } else {
        wx.showToast({ title: res.error || '加载失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async loadProfileData(uid, user) {
    try {
      const res = await request.get(`/api/card-entry/data?target_user_id=${uid}`)
      if (!res) return
      const s1 = res.step1 || {}
      const s2 = res.step2 || {}
      const s5 = res.step5 || {}
      const profile = { step1: s1, step2: s2, step4: res.step4 || {}, step5: s5, step6: res.step6 || {} }
      const display = this._buildDisplayFields(user, profile)
      const intro = this._computeIntroPresentation(user, res)
      const ownerName = this._ownerDisplayName(user, s1)
      this.setData({
        profileData: res,
        ...display,
        ...intro,
        ownerName
      })
    } catch (e) {
      this._applyDisplayFromUser(user)
    }
  },

  _applyDisplayFromUser(user) {
    if (!user) return
    const display = this._buildDisplayFields(user, null)
    const intro = this._computeIntroPresentation(user, null)
    const ownerName = user.name || user.nickname || '校友'
    this.setData({
      ...display,
      ...intro,
      ownerName
    })
  },

  _buildDisplayFields(user, profile) {
    const u = user || {}
    const s1 = profile?.step1 || {}
    let s2 = profile?.step2 || {}
    let s5 = profile?.step5 || {}
    if (!s2 || Object.keys(s2).length === 0) {
      s2 = mergeS2FromUser(u, s2)
    }
    if (!s5 || Object.keys(s5).length === 0) {
      s5 = {
        association_needs: u.association_needs,
        board_position: u.board_position,
        association_positions: u.association_positions || []
      }
    }
    const photos = (s1.personal_photos || u.personal_photos || [])
    const birthParts = (s1.birth_date || u.birth_date || '').split(/[-/]/)
    const constellation = (s1.constellation || u.constellation || '') || getConstellation(birthParts[1], birthParts[2])
    const companyTitle = [u.company || s1.company, u.title || s1.title].filter(Boolean).join(' ')
    const contactParts = [u.phone || s1.phone, u.email || s1.email, u.wechat_id || s1.wechat_id].filter(Boolean)
    const addr = (s1.locations && s1.locations[0] && s1.locations[0].address) ? s1.locations[0].address : (u.address || '')
    return {
      displayName: u.name || s1.name || u.nickname || s1.nickname || '',
      displayPhotos: Array.isArray(photos) ? photos : [],
      displayConstellation: constellation,
      displayMiddleSchool: formatMiddleSchool(s2),
      displayUniversity: formatUniversity(s2),
      displayCompanyTitle: companyTitle || (u.company && u.title ? `${u.company} ${u.title}` : u.company || u.title || ''),
      displaySocialPositions: formatSocialPositions(s5),
      displayInterests: formatInterests(profile),
      displayAssociationNeeds: s5?.association_needs || u.association_needs || '',
      displayContact: contactParts.join('；'),
      displayAddress: addr
    }
  },

  async loadIntroCards(uid) {
    try {
      const res = await request.get('/api/intro-cards/user/' + uid)
      const cards = (res.success && res.cards) ? res.cards : []
      this.setData({ introCards: cards })
    } catch (e) {
      this.setData({ introCards: [] })
    }
  },

  async loadMatchContent(uid) {
    try {
      const res = await request.get('/api/alumni/match-with', { user_id: uid })
      const content = (res && res.content) ? res.content : '暂无 AI 匹配结果，敬请期待。'
      this.setData({ matchContent: content })
    } catch (e) {
      this.setData({ matchContent: '暂无 AI 匹配结果，敬请期待。' })
    }
  },

  onFollowTap() {
    wx.showToast({ title: '关注功能开发中', icon: 'none' })
  },

  closePairSheet() {
    this.setData({ showPairSheet: false, pairLoading: false })
  },

  stopPairTap() {},

  async onPairHelpTap() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.showLoading({ title: '校验资料...', mask: true })
    let entry = null
    try {
      entry = await request.get('/api/card-entry/data')
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '无法获取我的名片', icon: 'none' })
      return
    }
    wx.hideLoading()
    if (!isSelfCardEntryComplete(entry)) {
      wx.showToast({ title: '必须填写完成后，方可使用此功能', icon: 'none' })
      return
    }
    const peerId = parseInt(this.data.userId, 10)
    if (!peerId) return
    this.setData({
      showPairSheet: true,
      pairLoading: true,
      pairStreamText: '',
      pairThinking: '',
      pairAnswer: ''
    })
    const apiBase = getApiBase()
    let buffer = ''
    let byteBuffer = []
    let accReason = ''
    let accContent = ''
    const requestTask = wx.request({
      url: `${apiBase}/api/assistant/llm-pair-connection`,
      method: 'POST',
      data: { peer_user_id: peerId },
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      enableChunked: true,
      success: (res) => {
        if (res.statusCode && res.statusCode !== 200) {
          this.setData({
            pairLoading: false,
            pairStreamText: formatPairRequestError(res)
          })
        }
      },
      fail: () => {
        this.setData({ pairLoading: false })
        wx.showToast({ title: '请求失败', icon: 'none' })
      }
    })
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
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        if (!line.startsWith('data: ')) continue
        const dataStr = line.substring(6).trim()
        if (dataStr === '[DONE]') {
          let finalText = ''
          if (accReason) finalText += '【思考】\n' + accReason
          if (accContent) {
            if (finalText) finalText += '\n\n'
            finalText += accContent
          }
          this.setData({
            pairLoading: false,
            pairStreamText: finalText || this.data.pairStreamText,
            pairThinking: accReason,
            pairAnswer: accContent
          })
          try { requestTask.abort() } catch (e) {}
          return
        }
        try {
          const data = JSON.parse(dataStr)
          if (data.alumni) continue
          if (data.error) {
            this.setData({ pairLoading: false, pairStreamText: data.error })
            return
          }
          if (data.reasoning) {
            accReason += data.reasoning
            const show = (accReason ? '【思考】\n' + accReason + '\n\n' : '') + (accContent || '')
            this.setData({ pairStreamText: show, pairThinking: accReason })
          }
          if (data.content) {
            accContent += data.content
            const show = (accReason ? '【思考】\n' + accReason + '\n\n' : '') + accContent
            this.setData({ pairStreamText: show, pairAnswer: accContent })
          }
        } catch (e) {
          console.warn('pair SSE parse', e)
        }
      }
    })
  },

  onUnload() {
    this._pairReq = null
  }
})
