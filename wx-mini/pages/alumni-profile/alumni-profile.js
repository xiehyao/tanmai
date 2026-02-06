// pages/alumni-profile/alumni-profile.js
const request = require('../../utils/request.js')

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

Page({
  data: {
    user: null,
    profileData: null,  // card-entry 返回的 step1-6
    introCards: [],
    matchContent: '',
    // 格式化后的展示字段
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
    displayAddress: ''
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

  async loadUser(uid) {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await request.get(`/api/users/${uid}`)
      if (res.success && res.data) {
        const user = res.data
        this.setData({
          user,
          pageTitle: (user.name || user.nickname || '校友') + '的世界'
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
      this.setData({ profileData: res, ...display })
    } catch (e) {
      this._applyDisplayFromUser(user)
    }
  },

  _applyDisplayFromUser(user) {
    if (!user) return
    const display = this._buildDisplayFields(user, null)
    this.setData(display)
  },

  _buildDisplayFields(user, profile) {
    const u = user || {}
    const s1 = profile?.step1 || {}
    let s2 = profile?.step2 || {}
    let s5 = profile?.step5 || {}
    if (!s2 || Object.keys(s2).length === 0) {
      s2 = {
        middle_school: u.middle_school,
        middle_graduation_year: u.middle_graduation_year,
        high_school: u.high_school,
        high_graduation_year: u.high_graduation_year,
        bachelor_university: u.bachelor_university,
        bachelor_major: u.bachelor_major,
        bachelor_graduation_year: u.bachelor_graduation_year,
        master_university: u.master_university,
        master_major: u.master_major,
        master_graduation_year: u.master_graduation_year
      }
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

  _applyDisplayFromUser(user) {
    if (!user) return
    const display = this._buildDisplayFields(user, null)
    this.setData(display)
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
  }
})
