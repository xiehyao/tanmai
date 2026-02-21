// pages/card-entry-v2/card-entry-v2.js
// V2 全新骨架：按 CARD_ENTRY_V2_DESIGN.md 设计，与旧版数据结构映射以复用后端

const request = require('../../utils/request.js')

// V2 步骤结构（按设计文档）
const EMPTY_STEP1 = {
  name: '', nickname: '', avatar: '', gender: '', wechat_id: '', selected_avatar: '',
  personal_photos: [], birth_place: '', title: '', company: '', phone: '', email: '',
  bio: '', field_visibility: {}, locations: [], main_address: '',
  company_title: '', association_title: ''
}
const STEP1_FIELD_LABELS = {
  name: '姓名', company_title: '公司-职位', association_title: '社团-职位',
  wechat_id: '微信', phone: '手机', email: '邮箱', main_address: '地址'
}
const EMPTY_STEP2 = { intro_raw: '', photos: [] }
const EMPTY_STEP3 = { raw: '', schools: '' }
const EMPTY_STEP4 = { raw: '', resources: [] }
const EMPTY_STEP5 = { orgs: '', willing_to_serve: false, board_position: '', association_positions: [], contribution_types: '' }
const EMPTY_STEP6 = { raw: '' }

Page({
  data: {
    currentStep: 1,
    totalSteps: 6,
    progress: null,
    isStaffMode: false,
    staffIdVerified: false,
    targetUser: null,
    showVisibilitySheet: false,
    visibilityEditField: null,
    visibilityEditFieldLabel: '',
    step1: { ...EMPTY_STEP1 },
    step2: { ...EMPTY_STEP2 },
    step3: { ...EMPTY_STEP3 },
    step4: { ...EMPTY_STEP4 },
    step5: { ...EMPTY_STEP5 },
    step6: { ...EMPTY_STEP6 },
    entrySource: null
  },

  onLoad(options) {
    const from = options.from || options.scene || null
    if (from) this.setData({ entrySource: from })
    const isInternal = options.mode === 'internal'
    if (isInternal) {
      wx.setNavigationBarTitle({ title: '填写名片 V2' })
      this.setData({ isStaffMode: true })
    }
    if (options.target_user_id) {
      const verified = wx.getStorageSync('staff_id_verified')
      if (verified === '362100' || isInternal) {
        this.setData({ isStaffMode: true, targetUser: { id: parseInt(options.target_user_id) } })
      }
    }
    if (wx.getStorageSync('staff_id_verified') === '362100') {
      this.setData({ staffIdVerified: true })
    }
    if (!this.data.isStaffMode || (this.data.targetUser && this.data.targetUser.id)) {
      this.loadAllData()
      this.loadProgress()
    }
  },

  onShow() {
    this.loadProgress()
  },

  toggleStaffMode() {
    const next = !this.data.isStaffMode
    this.setData({ isStaffMode: next })
    if (!next && this.data.targetUser) {
      this.setData({ targetUser: null })
    } else if (next && this.data.targetUser && this.data.targetUser.id) {
      this.loadAllData()
    }
  },

  async loadAllData() {
    try {
      let url = '/api/card-entry/data'
      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }
      const res = await request.get(url)
      if (!res) return

      // 映射旧版数据到 V2 结构
      const step1 = { ...EMPTY_STEP1, ...res.step1 }
      step1.main_address = (step1.locations && step1.locations[0] && step1.locations[0].address) || ''
      step1.company_title = [step1.company, step1.title].filter(Boolean).join(' ') || ''
      step1.association_title = step1.association_title || ''
      step1.field_visibility = step1.field_visibility || {}

      const step2 = { ...EMPTY_STEP2 }
      step2.intro_raw = res.step1 && res.step1.bio ? res.step1.bio : ''

      const step3 = { ...EMPTY_STEP3 }
      const edu = res.step2 || {}
      const needs = res.step3 || {}
      step3.schools = edu.high_school || edu.bachelor_university || ''
      step3.raw = [edu.high_school, edu.bachelor_university, needs.marital_status].filter(Boolean).join('；') || ''

      const step4 = { ...EMPTY_STEP4 }
      step4.resources = (res.step4 && res.step4.resources) || []

      const step5 = { ...EMPTY_STEP5 }
      const assoc = res.step5 || {}
      step5.willing_to_serve = !!assoc.willing_to_serve
      step5.board_position = assoc.board_position || ''
      step5.association_positions = assoc.association_positions || []
      step5.contribution_types = assoc.contribution_types || ''
      step5.orgs = assoc.association_positions && assoc.association_positions.length ? '已选' + assoc.association_positions.length + '项' : ''

      const step6 = { ...EMPTY_STEP6 }
      step6.raw = (res.step6 && res.step6.hidden_info && res.step6.hidden_info.description) || ''

      this.setData({ step1, step2, step3, step4, step5, step6 })
    } catch (e) {
      console.error('Load data error (v2):', e)
    }
  },

  async loadProgress() {
    try {
      let url = '/api/card-entry/progress'
      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }
      const res = await request.get(url)
      if (res && res.current_step != null) {
        this.setData({ progress: res, currentStep: res.current_step || 1 })
      }
    } catch (e) {
      console.error('Load progress error (v2):', e)
    }
  },

  _buildStep1ForSave() {
    const s = this.data.step1
    const locs = s.main_address ? [{ address: s.main_address, location_type: 'residence', location_visibility: 'public' }] : []
    let company = s.company, title = s.title
    if (s.company_title) {
      const parts = s.company_title.trim().split(/\s+/)
      company = parts[0] || s.company
      title = parts.length > 1 ? parts.slice(1).join(' ') : (s.title || '')
    }
    return {
      name: s.name, nickname: s.nickname, avatar: s.avatar, gender: s.gender,
      wechat_id: s.wechat_id, selected_avatar: s.selected_avatar,
      personal_photos: s.personal_photos, birth_place: s.birth_place,
      title: title, company: company, phone: s.phone, email: s.email,
      bio: s.bio, field_visibility: s.field_visibility || {}, locations: locs
    }
  },

  _buildStep3ForSave() {
    return {
      marital_status: '', dating_need: false, dating_preferences: '',
      job_seeking: false, job_target_position: '', entrepreneurship_need: false,
      entrepreneurship_type: '', entrepreneurship_description: this.data.step3.raw
    }
  },

  _buildStep4ForSave() {
    const s = this.data.step4
    let resources = [...(s.resources || [])]
    if (s.raw && s.raw.trim()) {
      resources.push({
        resource_type: 'other',
        resource_title: '自由填写',
        resource_description: s.raw.trim(),
        sharing_mode: 'free'
      })
    }
    return { resources }
  },

  _buildStep5ForSave() {
    const s = this.data.step5
    return {
      willing_to_serve: s.willing_to_serve,
      board_position: s.board_position || '',
      association_positions: s.association_positions || [],
      contribution_types: s.contribution_types || s.orgs || '',
      contribution_description: '',
      desired_position: '',
      position_preferences: '',
      association_needs: '',
      support_offerings: [],
      association_needs_detail: { selected: [], other: '' }
    }
  },

  _buildStep6ForSave() {
    return {
      hidden_info: { description: this.data.step6.raw || '' },
      field_visibility: {}
    }
  },

  async saveCurrentStep() {
    if (this.data.isStaffMode && (!this.data.targetUser || !this.data.targetUser.id)) {
      wx.showToast({ title: '请先选择目标用户', icon: 'none' })
      return false
    }

    wx.showLoading({ title: '保存中...' })
    try {
      const step = this.data.currentStep
      let dataToSave
      let url
      if (step === 1) {
        dataToSave = this._buildStep1ForSave()
        url = '/api/card-entry/save-step/1'
      } else if (step === 2) {
        const step1 = this._buildStep1ForSave()
        dataToSave = { ...step1, bio: this.data.step2.intro_raw }
        url = '/api/card-entry/save-step/1'
      } else if (step === 3) {
        dataToSave = this._buildStep3ForSave()
        url = '/api/card-entry/save-step/3'
      } else if (step === 4) {
        dataToSave = this._buildStep4ForSave()
        url = '/api/card-entry/save-step/4'
      } else if (step === 5) {
        dataToSave = this._buildStep5ForSave()
        url = '/api/card-entry/save-step/5'
      } else {
        dataToSave = this._buildStep6ForSave()
        url = '/api/card-entry/save-step/6'
      }

      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }

      await request.post(url, dataToSave)
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      return { ok: true }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
      console.error('Save step error (v2):', e)
      return false
    }
  },

  async nextStep() {
    const result = await this.saveCurrentStep()
    if (!result || !result.ok) return
    if (this.data.currentStep < this.data.totalSteps) {
      const next = this.data.currentStep + 1
      this.setData({ currentStep: next })
      await this.updateProgress(next)
    } else {
      wx.showModal({ title: '完成', content: '您已完成所有信息填写', showCancel: false, success: () => wx.navigateBack() })
    }
  },

  prevStep() {
    if (this.data.currentStep > 1) {
      const prev = this.data.currentStep - 1
      this.setData({ currentStep: prev })
      this.updateProgress(prev)
    }
  },

  async updateProgress(nextStep) {
    try {
      const completedSteps = this.data.progress?.completed_steps || []
      if (!completedSteps.includes(this.data.currentStep)) completedSteps.push(this.data.currentStep)
      const body = { current_step: nextStep, completed_steps: completedSteps }
      let url = '/api/card-entry/progress'
      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }
      await request.put(url, body)
      this.setData({ progress: { ...this.data.progress, current_step: nextStep, completed_steps: completedSteps } })
    } catch (e) {
      console.error('Update progress error (v2):', e)
    }
  },

  onInputChange(e) {
    const { step, field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({ [`step${step}.${field}`]: value })
  },

  onSwitchChange(e) {
    const { step, field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({ [`step${step}.${field}`]: value })
  },

  goToStep(e) {
    const step = parseInt(e.currentTarget.dataset.step)
    if (step >= 1 && step <= this.data.totalSteps) {
      this.setData({ currentStep: step })
      this.updateProgress(step)
    }
  },

  onPickAvatar() {
    wx.showToast({ title: '头像选择（待完善）', icon: 'none' })
  },

  onAddIntroPhoto() {
    wx.showToast({ title: '添加照片（待完善）', icon: 'none' })
  },

  onAddResource() {
    wx.showToast({ title: '添加资源（待完善）', icon: 'none' })
  },

  onVisibilityTap(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    const val = this.data.step1[field]
    if (!val || !val.trim()) return
    const label = STEP1_FIELD_LABELS[field] || field
    this.setData({
      showVisibilitySheet: true,
      visibilityEditField: field,
      visibilityEditFieldLabel: label
    })
  },

  closeVisibilitySheet() {
    this.setData({ showVisibilitySheet: false, visibilityEditField: null, visibilityEditFieldLabel: '' })
  },

  onVisibilitySelect(e) {
    const value = e.currentTarget.dataset.value
    const field = this.data.visibilityEditField
    if (!field) return
    const fv = { ...this.data.step1.field_visibility }
    fv[field] = value
    this.setData({ 'step1.field_visibility': fv })
    this.closeVisibilitySheet()
    wx.showToast({ title: '已设置', icon: 'success' })
  }
})
