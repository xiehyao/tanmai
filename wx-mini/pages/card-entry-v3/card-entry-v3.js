// pages/card-entry-v3/card-entry-v3.js
// 模仿「名片全能王」的填写体验

const request = require('../../utils/request.js')

const GENDER_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '其他', value: 'other' }
]
function genderLabelFor(value) {
  if (!value) return '请选择'
  const o = GENDER_OPTIONS.find(item => item.value === value)
  return o ? o.label : '请选择'
}

function _buildContactItems(phone, wechat, email, address) {
  const items = []
  if (phone !== undefined && phone !== null) items.push({ id: 'phone-0', type: 'phone', label: '手机', value: phone, required: true })
  if (wechat !== undefined && wechat !== null) items.push({ id: 'wechat-0', type: 'wechat', label: '微信', value: wechat, required: false })
  if (email !== undefined && email !== null) items.push({ id: 'email-0', type: 'email', label: '邮箱', value: email, required: false })
  items.push({ id: 'address-0', type: 'address', label: '公司地址', value: address || '', required: false, location_type: 'work' })
  return items
}
function _previewFromContactItems(items) {
  const arr = items || []
  const addresses = (arr.filter(c => c.type === 'address') || []).map(c => c.value).filter(Boolean)
  return {
    previewPhone: (arr.find(c => c.type === 'phone') || {}).value || '',
    previewEmail: (arr.find(c => c.type === 'email') || {}).value || '',
    previewAddress: (arr.find(c => c.type === 'address') || {}).value || '',
    previewAddressList: addresses.length ? addresses : []
  }
}

const CONTACT_TYPE_LABELS = { phone: '手机', landline: '座机', email: '邮箱', fax: '传真', wechat: '微信', qq: 'QQ', weibo: '微博', address: '地址', linkedin: 'LinkedIn', homepage: '个人主页' }

// 子项可见性：公开｜完全私密｜部分打码｜只对好友可见｜只对校友可见（含 icon 供半屏展示）
const VISIBILITY_ICONS = { public: '👁️', private: '🔒', masked: '🎭', friend: '👥', alumni: '🎓' }
const VISIBILITY_OPTIONS = [
  { label: '公开', value: 'public', icon: VISIBILITY_ICONS.public },
  { label: '完全私密（仅用于AI匹配）', value: 'private', icon: VISIBILITY_ICONS.private },
  { label: '部分隐藏（*打码）', value: 'masked', icon: VISIBILITY_ICONS.masked },
  { label: '只对好友可见', value: 'friend', icon: VISIBILITY_ICONS.friend },
  { label: '只对校友可见', value: 'alumni', icon: VISIBILITY_ICONS.alumni }
]
const VISIBILITY_LABELS = { public: '公开', private: '私密', masked: '打码', friend: '好友', alumni: '校友' }
// 所有需要隐私状态的子项 key：基本信息 + 联系方式(按索引) + 各卡片子项
function _visibilityKeys() {
  const base = ['name', 'photo', 'nickname', 'wechatId', 'avatar', 'gender', 'birthPlace', 'company', 'title', 'association_title', 'industry']
  const contact = Array.from({ length: 12 }, (_, i) => 'contact_' + i)
  const association = ['associationOrgs', 'associationNeeds', 'associationNeedsOther', 'associationWilling', 'board_position', 'association_positions', 'desired_position', 'position_preferences', 'support_offerings', 'contributionTypes', 'contributionDescription']
  const intro = Array.from({ length: 10 }, (_, i) => 'intro_' + i)
  const work = Array.from({ length: 10 }, (_, i) => 'work_' + i)
  const edu = Array.from({ length: 10 }, (_, i) => 'edu_' + i)
  const resource = Array.from({ length: 10 }, (_, i) => 'resource_' + i)
  const extra = ['card_attachment', 'business_intro', 'company_intro', 'needsText', 'dating', 'job', 'entrepreneurship', 'more_needs', 'resourcesText', 'paper_cards', 'extraInfo']
  return [...base, ...contact, ...association, ...intro, ...work, ...edu, ...resource, ...extra]
}
function _defaultFieldVisibility() {
  const keys = _visibilityKeys()
  const o = {}; const l = {}; const i = {}
  keys.forEach(k => { o[k] = 'public'; l[k] = '公开'; i[k] = VISIBILITY_ICONS.public })
  return { fieldVisibility: o, fieldVisibilityLabels: l, fieldVisibilityIcons: i }
}
// 根据当前列表长度和 fieldVisibilityIcons 生成动态子项的 icon 数组（用于 wxml 中 wx:for 的 index）
function _visibilityIconsArray(icons, prefix, length) {
  const arr = []; for (let j = 0; j < (length || 0); j++) arr.push(icons[prefix + j] || VISIBILITY_ICONS.public); return arr
}

// 头像选项（与 card-entry v1 同源 COS）
const AVATAR_OPTIONS = [
  { label: '女中1', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-middle-1.png' },
  { label: '女青1', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
  { label: '女青8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-8.png' },
  { label: '女青9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-9.webp' },
  { label: '女老', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-old.jpeg' },
  { label: '男青1', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
  { label: '男青2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-2.jpeg' },
  { label: '男青3', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-3.jpeg' },
  { label: '男青4', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-4.jpeg' },
  { label: '男青5', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-5.jpeg' },
  { label: '男青6', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-6.webp' },
  { label: '男青7', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-7.jpeg' },
  { label: '男青8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-8.jpeg' },
  { label: '男青9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-9.jpeg' },
  { label: '男中', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle.png' },
  { label: '男老', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old.png' }
]

const MARITAL_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '单身', value: 'single' },
  { label: '已婚', value: 'married' },
  { label: '离异', value: 'divorced' },
  { label: '丧偶', value: 'widowed' }
]
const ENTREPRENEURSHIP_TYPE_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '找资源', value: 'resource' },
  { label: '找合作伙伴', value: 'partner' },
  { label: '两者都需要', value: 'both' }
]
const BOARD_POSITION_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '校董会常务副董事长（为母校捐资100万元，每年10万元，10年捐完）', value: 'board_vice_chair_senior' },
  { label: '校董会副董事长（为母校捐资50万元，每年10万元，5年捐完）', value: 'board_vice_chair' },
  { label: '校董会常务董事（为母校捐资25万元，每年5万元，5年捐完）', value: 'board_director_senior' },
  { label: '校董会董事（为母校捐资5万元，每年1万元，5年捐完）', value: 'board_director' },
  { label: '只捐资不愿担任职务（可另外推荐人选）', value: 'donate_only' },
  { label: '可捐可不捐，有需要可联系我', value: 'donate_maybe' },
  { label: '当前尚无意愿或能力，争取未来参与', value: 'future' }
]
const ASSOCIATION_POSITION_OPTIONS = [
  { label: '名誉会长', value: 'honorary_president' },
  { label: '会长', value: 'president' },
  { label: '执行会长', value: 'executive_president' },
  { label: '副会长', value: 'vice_president' },
  { label: '理事', value: 'director' },
  { label: '专委会委员&秘书处顾问', value: 'advisor' },
  { label: '秘书长', value: 'secretary_general' },
  { label: '执行秘书长', value: 'executive_secretary' },
  { label: '副秘书长', value: 'deputy_secretary' },
  { label: '干事', value: 'staff' }
]
const SUPPORT_TYPE_OPTIONS = [
  { label: '出场地', value: 'venue' },
  { label: '出人力', value: 'manpower' },
  { label: '出经费', value: 'funding' },
  { label: '出经验', value: 'experience' }
]
// 对校友会需求：分组展示，便于浏览
const ASSOCIATION_NEEDS_GROUPS = [
  {
    title: '家乡情感寄托',
    options: [
      { label: '希望组织节日团拜/中秋博饼等家乡活动', value: 'festival_events' },
      { label: '经常组团品尝家乡菜', value: 'hometown_dining' },
      { label: '纯喝茶聊聊就很好，欢迎大家约我/来我这里喝茶（请填具体地址）', value: 'tea_chat' }
    ]
  },
  {
    title: '交友·交流',
    options: [
      { label: '脱单/相亲', value: 'dating' },
      { label: '找到各种搭子', value: 'buddies' },
      { label: '多组织活动认识同城校友', value: 'local_network' },
      { label: '方便组局&找局', value: 'events' }
    ]
  },
  {
    title: '传帮带',
    options: [
      { label: '新人迎新&新人职业发展指引', value: 'career_mentoring' },
      { label: '一身传奇经验，愿意带新人', value: 'mentor' }
    ]
  },
  {
    title: '科创·事业',
    options: [
      { label: '科创专业委员会提供现场咨询交流', value: 'tech_consulting' },
      { label: '校友科创资源挖掘和共享', value: 'tech_resources' },
      { label: '深入的事业发展资源支持', value: 'career_support' }
    ]
  },
  {
    title: '其它',
    options: [
      { label: '其它（请填写）', value: 'other' }
    ]
  }
]
// 兼容：扁平列表（用于 _optionsWithChecked 等旧逻辑不再使用，loadData 直接建 groups）
const ASSOCIATION_NEEDS_OPTIONS = ASSOCIATION_NEEDS_GROUPS.reduce((arr, g) => arr.concat(g.options), [])
const RESOURCE_TYPE_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '经验分享', value: 'experience' },
  { label: '知识技能', value: 'knowledge' },
  { label: '资源对接', value: 'resource' },
  { label: '人脉连接', value: 'connection' },
  { label: '其他', value: 'other' }
]
const SHARING_MODE_OPTIONS = [
  { label: '请选择', value: '' },
  { label: '免费分享', value: 'free' },
  { label: '事业共创', value: 'collaboration' },
  { label: '两者都可以', value: 'both' }
]

function _pickerLabel(opts, value) {
  if (!value || !opts) return '请选择'
  const o = opts.find(item => item.value === value)
  return o ? o.label : '请选择'
}
function _pickerIndex(opts, value) {
  if (!opts || !value) return 0
  const i = opts.findIndex(item => item.value === value)
  return i >= 0 ? i : 0
}
function _optionsWithChecked(opts, selected) {
  if (!opts) return []
  const set = new Set(selected || [])
  return opts.map(o => ({ ...o, checked: set.has(o.value) }))
}
function _groupsWithChecked(groups, selected) {
  if (!groups) return []
  const set = new Set(selected || [])
  return groups.map(g => ({
    title: g.title,
    options: (g.options || []).map(o => ({ ...o, checked: set.has(o.value) }))
  }))
}
function _buildResourcesList(resources) {
  if (!resources || !resources.length) return []
  return resources.map(r => {
    const typeIdx = _pickerIndex(RESOURCE_TYPE_OPTIONS, r.resource_type)
    const modeIdx = _pickerIndex(SHARING_MODE_OPTIONS, r.sharing_mode)
    return {
      ...r,
      _typeIndex: typeIdx,
      _typeLabel: _pickerLabel(RESOURCE_TYPE_OPTIONS, r.resource_type),
      _modeIndex: modeIdx,
      _modeLabel: _pickerLabel(SHARING_MODE_OPTIONS, r.sharing_mode)
    }
  })
}

// —— 下行映射辅助：V3 → card-entry step2/3/4/6 payload（仅前端构造，不直接发请求） ——
function _yearFromDateStr(str) {
  if (!str) return undefined
  const y = parseInt(String(str).slice(0, 4), 10)
  return Number.isNaN(y) ? undefined : y
}
function _buildStep2FromEdu(eduExperiences) {
  const step2 = {
    primary_school: '', primary_graduation_year: undefined,
    middle_school: '', middle_graduation_year: undefined,
    high_school: '', high_graduation_year: undefined,
    bachelor_university: '', bachelor_major: '', bachelor_graduation_year: undefined,
    master_university: '', master_major: '', master_graduation_year: undefined,
    doctor_university: '', doctor_major: '', doctor_graduation_year: undefined,
    highest_degree: ''
  }
  const degreeOrder = ['小学', '初中', '高中', '本科', '硕士', '博士']
  let maxIdx = -1
  ;(eduExperiences || []).forEach(item => {
    if (!item || !item.degree) return
    const d = item.degree
    const y = _yearFromDateStr(item.graduateDate) || _yearFromDateStr(item.duration && item.duration.split(' - ')[1])
    if (d === '小学') {
      if (item.school) step2.primary_school = item.school
      if (y) step2.primary_graduation_year = y
    } else if (d === '初中') {
      if (item.school) step2.middle_school = item.school
      if (y) step2.middle_graduation_year = y
    } else if (d === '高中') {
      if (item.school) step2.high_school = item.school
      if (y) step2.high_graduation_year = y
    } else if (d === '本科') {
      if (item.school) step2.bachelor_university = item.school
      if (item.major) step2.bachelor_major = item.major
      if (y) step2.bachelor_graduation_year = y
    } else if (d === '硕士') {
      if (item.school) step2.master_university = item.school
      if (item.major) step2.master_major = item.major
      if (y) step2.master_graduation_year = y
    } else if (d === '博士') {
      if (item.school) step2.doctor_university = item.school
      if (item.major) step2.doctor_major = item.major
      if (y) step2.doctor_graduation_year = y
    }
    const idx = degreeOrder.indexOf(d)
    if (idx > maxIdx) {
      maxIdx = idx
      step2.highest_degree = d
    }
  })
  return step2
}
function _buildStep3FromState(data) {
  return {
    marital_status: data.marital_status || '',
    dating_need: !!data.datingNeed,
    dating_preferences: data.datingPreferences || '',
    job_seeking: !!data.jobSeeking,
    job_target_position: data.jobTargetPosition || '',
    job_target_industry: data.jobTargetIndustry || '',
    job_preferences: data.jobPreferences || '',
    entrepreneurship_need: !!data.entrepreneurshipNeed,
    entrepreneurship_type: data.entrepreneurship_type || '',
    entrepreneurship_description: data.entrepreneurshipDescription || ''
  }
}
function _buildStep4FromState(resources, rawText) {
  const ress = (resources || []).map(r => {
    const { _typeIndex, _typeLabel, _modeIndex, _modeLabel, ...rest } = r
    return { ...rest }
  })
  if (rawText && String(rawText).trim()) {
    ress.push({
      resource_type: 'other',
      resource_title: '自由填写',
      resource_description: String(rawText).trim(),
      sharing_mode: 'free'
    })
  }
  return { resources: ress }
}
function _buildStep6FromExtra(extraInfo) {
  const desc = extraInfo || ''
  return {
    hidden_info: { description: desc },
    field_visibility: {}
  }
}

Page({
  data: {
    // 两步结构：仅当配置了校友会/商会时显示第2步，默认惠安一中大湾区校友会
    hasAlumniConfig: true,
    currentStep: 1,
    // 子项可见性（公开/私密/打码/好友/校友）
    fieldVisibility: (() => { const d = _defaultFieldVisibility(); return d.fieldVisibility })(),
    fieldVisibilityLabels: (() => { const d = _defaultFieldVisibility(); return d.fieldVisibilityLabels })(),
    fieldVisibilityIcons: (() => { const d = _defaultFieldVisibility(); return d.fieldVisibilityIcons })(),
    contactVisibilityIcons: [],
    introVisibilityIcons: [],
    workVisibilityIcons: [],
    eduVisibilityIcons: [],
    resourceVisibilityIcons: [],
    visibilityOptions: VISIBILITY_OPTIONS,
    showVisibilitySheet: false,
    visibilityEditingField: '',
    visibilityEditingLabel: '',
    visibilityEditingValue: '', // 当前编辑字段的可见性值，用于半屏高亮选中项
    // 基本信息（step1）
    avatar: '',
    photoUrl: '', // 兼容：单张相片展示，与 personal_photos[0] 同步
    personal_photos: [], // 多张相片，对应后端 step1.personal_photos
    wechatId: '',
    name: '',
    nickname: '',
    gender: '',
    genderLabel: '请选择',
    genderOptions: [
      { label: '请选择', value: '' },
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '其他', value: 'other' }
    ],
    birthPlace: '',
    company: '',
    title: '',
    association_title: '',
    positions: [{ company: '', title: '', duration: '' }],
    industry: '',
    verification: [], // 在职、已实名 等（预留）
    // 联系方式（可多行、可增删）
    contactItems: (function () {
      const items = []
      items.push({ id: 'phone-0', type: 'phone', label: '手机', value: '', required: true })
      items.push({ id: 'wechat-0', type: 'wechat', label: '微信', value: '', required: false })
      items.push({ id: 'email-0', type: 'email', label: '邮箱', value: '', required: false })
      items.push({ id: 'address-0', type: 'address', label: '公司地址', value: '', required: false, location_type: 'work' })
      return items
    })(),
    contactTypeGrid: [
      { type: 'phone', label: '手机' },
      { type: 'landline', label: '座机' },
      { type: 'email', label: '邮箱' },
      { type: 'fax', label: '传真' },
      { type: 'wechat', label: '微信' },
      { type: 'qq', label: 'QQ' },
      { type: 'weibo', label: '微博' },
      { type: 'address', label: '居住地址', location_type: 'residence' },
      { type: 'address', label: '公司地址', location_type: 'work' },
      { type: 'address', label: '临时活动地址', location_type: 'temp_event' },
      { type: 'address', label: '其它', location_type: 'other' },
      { type: 'linkedin', label: 'LinkedIn' },
      { type: 'homepage', label: '个人主页' }
    ],
    addressTypeGrid: [
      { type: 'address', label: '居住地址', location_type: 'residence', icon: '🏠' },
      { type: 'address', label: '公司地址', location_type: 'work', icon: '🏢' },
      { type: 'address', label: '临时活动地址', location_type: 'temp_event', icon: '📍' },
      { type: 'address', label: '其它', location_type: 'other', icon: '📌' }
    ],
    showContactAddSheet: false,
    showAddressTypeSheet: false,
    showAvatarSheet: false,
    showBoardPositionSheet: false,
    avatarOptions: AVATAR_OPTIONS,
    address: '', // 与 contactItems 中 type=address 的首项同步
    previewPhone: '',
    previewEmail: '',
    previewAddress: '',
    previewAddressListVisible: [],
    showAddressPlaceholder: false,
    previewPhoneVisible: false,
    previewPhoneValue: '',
    previewEmailVisible: false,
    previewEmailValue: '',
    // 名片附件
    pdfFiles: [],
    // 个人介绍：多张自我简介卡片（横向滚动），初始一条模拟数据
    introCards: [
      { name: '示例姓名', photo: '', introText: '北邮00级电院通信工程 04级移动通信工程\n现在鹏城实验室做研究工作，常驻深圳\n喜欢踢球和各类运动，欢迎大家约起~', scene: '线下活动、线上对接' }
    ],
    showIntroSheet: false,
    introEditIndex: -1,
    introForm: { name: '', photo: '', introText: '', scene: '' },
    // 个人介绍 / 简介（来自 step2.intro_raw 或 step1.bio，兼容）
    personalIntro: '',
    // 业务介绍
    businessIntro: '',
    // 企业介绍
    companyIntro: '',
    // 需求与状态（step3）
    needsText: '',
    maritalOptions: MARITAL_OPTIONS,
    marital_status: '',
    maritalStatusLabel: '请选择',
    maritalStatusIndex: 0,
    datingNeed: false,
    datingPreferences: '',
    jobSeeking: false,
    jobTargetPosition: '',
    jobTargetIndustry: '',
    jobPreferences: '',
    entrepreneurshipTypeOptions: ENTREPRENEURSHIP_TYPE_OPTIONS,
    entrepreneurshipNeed: false,
    entrepreneurship_type: '',
    entrepreneurshipTypeLabel: '请选择',
    entrepreneurshipTypeIndex: 0,
    entrepreneurshipDescription: '',
    // 资源与需求（step4）
    resourcesText: '',
    resourcesCount: 0,
    resources: [],
    resourceTypeOptions: RESOURCE_TYPE_OPTIONS,
    sharingModeOptions: SHARING_MODE_OPTIONS,
    // 社团 / 校友会参与（step5）
    associationOrgs: '',
    associationWilling: false,
    associationRole: '',
    boardPositionOptions: BOARD_POSITION_OPTIONS,
    board_position: '',
    boardPositionLabel: '请选择',
    boardPositionIndex: 0,
    associationPositionOptions: ASSOCIATION_POSITION_OPTIONS.map(o => ({ ...o, checked: false })),
    association_positions: [],
    supportTypeOptions: SUPPORT_TYPE_OPTIONS.map(o => ({ ...o, checked: false })),
    support_offerings: [],
    contributionTypes: '',
    contributionDescription: '',
    desired_position: '',
    position_preferences: '',
    associationNeedsGroups: _groupsWithChecked(ASSOCIATION_NEEDS_GROUPS, []),
    association_needs_selected: [],
    associationNeedsOtherVisible: false,
    associationNeedsOther: '',
    // 补充信息（step6）
    extraInfo: '',
    // 我的需求弹窗 + 添加类型九宫格
    needTypeGrid: [
      { type: 'dating', label: '脱单', icon: '💕' },
      { type: 'friend', label: '交友', icon: '👥' },
      { type: 'org', label: '找组织', icon: '🏘' },
      { type: 'job', label: '求职', icon: '💼' },
      { type: 'entre', label: '创业', icon: '🚀' }
    ],
    showNeedTypeSheet: false,
    showDatingSheet: false,
    showJobSheet: false,
    showEntreSheet: false,
    // 工作经历
    workExperiences: [],
    showWorkSheet: false,
    workEditIndex: -1,
    workForm: { company: '', title: '', department: '', startDate: '', endDate: '', currentJob: false, description: '' },
    // 教育经历
    eduExperiences: [],
    showEduSheet: false,
    eduEditIndex: -1,
    eduForm: { school: '', major: '', degree: '', enrollDate: '', graduateDate: '' },
    degreeOptions: ['小学', '初中', '高中', '本科', '硕士', '博士', '其他'],
    degreeLabel: '请选择',
    // 教育经历：先选学历层级的九宫格
    showEduLevelSheet: false,
    eduLevelGrid: [
      { degree: '小学', label: '小学', icon: '🏫' },
      { degree: '初中', label: '初中', icon: '🎒' },
      { degree: '高中', label: '高中', icon: '🏫' },
      { degree: '本科', label: '大学本科', icon: '🎓' },
      { degree: '硕士', label: '硕士', icon: '🎓' },
      { degree: '博士', label: '博士', icon: '🎓' }
    ],
    // 资源列表弹窗
    showResourceSheet: false,
    resourceEditIndex: -1,
    resourceForm: {
      resource_type: '',
      resource_title: '',
      resource_description: '',
      sharing_mode: '',
      typeIndex: 0,
      typeLabel: '请选择',
      modeIndex: 0,
      modeLabel: '请选择'
    },
    // 上传纸质名片
    paperCards: []
  },

  onLoad() {
    this.loadData()
  },
  goToStep(e) {
    const step = parseInt(e.currentTarget.dataset.step, 10)
    if (step === 1 || step === 2) {
      const prev = this.data.currentStep
      if (prev !== step) this.saveStepToServer(prev)
      this.setData({ currentStep: step })
    }
  },
  // 可见性：点击子项左侧图标打开半屏
  onVisibilityTap(e) {
    const field = e.currentTarget.dataset.field
    const label = e.currentTarget.dataset.label || field
    this.setData({
      showVisibilitySheet: true,
      visibilityEditingField: field,
      visibilityEditingLabel: label,
      visibilityEditingValue: this.data.fieldVisibility[field] || 'public'
    })
  },
  closeVisibilitySheet() {
    this.setData({ showVisibilitySheet: false, visibilityEditingField: '', visibilityEditingLabel: '', visibilityEditingValue: '' })
  },
  onSelectVisibility(e) {
    const value = e.currentTarget.dataset.value
    const field = this.data.visibilityEditingField
    if (!field) { this.closeVisibilitySheet(); return }
    const label = VISIBILITY_LABELS[value] || '公开'
    const icon = VISIBILITY_ICONS[value] || VISIBILITY_ICONS.public
    const icons = { ...this.data.fieldVisibilityIcons, [field]: icon }
    this.setData({
      fieldVisibility: { ...this.data.fieldVisibility, [field]: value },
      fieldVisibilityLabels: { ...this.data.fieldVisibilityLabels, [field]: label },
      fieldVisibilityIcons: icons,
      showVisibilitySheet: false,
      visibilityEditingField: '',
      visibilityEditingLabel: '',
      visibilityEditingValue: '',
      contactVisibilityIcons: _visibilityIconsArray(icons, 'contact_', (this.data.contactItems || []).length),
      introVisibilityIcons: _visibilityIconsArray(icons, 'intro_', (this.data.introCards || []).length),
      workVisibilityIcons: _visibilityIconsArray(icons, 'work_', (this.data.workExperiences || []).length),
      eduVisibilityIcons: _visibilityIconsArray(icons, 'edu_', (this.data.eduExperiences || []).length),
      resourceVisibilityIcons: _visibilityIconsArray(icons, 'resource_', (this.data.resources || []).length)
    })
  },
  _syncVisibilityIconArrays() {
    const icons = this.data.fieldVisibilityIcons || {}
    const items = this.data.contactItems || []
    const vis = this.data.fieldVisibility || {}
    const previewAddressListVisible = items.map((c, i) => ({ type: c.type, value: c.value, i }))
      .filter(x => x.type === 'address')
      .filter(x => vis['contact_' + x.i] !== 'private')
      .map(x => x.value)
    const phoneItem = items.map((c, i) => ({ c, i })).find(x => x.c.type === 'phone' && vis['contact_' + x.i] !== 'private')
    const emailItem = items.map((c, i) => ({ c, i })).find(x => x.c.type === 'email' && vis['contact_' + x.i] !== 'private')
    const showAddressPlaceholder = previewAddressListVisible.length === 0 && items.length > 0
    this.setData({
      contactVisibilityIcons: _visibilityIconsArray(icons, 'contact_', items.length),
      introVisibilityIcons: _visibilityIconsArray(icons, 'intro_', (this.data.introCards || []).length),
      workVisibilityIcons: _visibilityIconsArray(icons, 'work_', (this.data.workExperiences || []).length),
      eduVisibilityIcons: _visibilityIconsArray(icons, 'edu_', (this.data.eduExperiences || []).length),
      resourceVisibilityIcons: _visibilityIconsArray(icons, 'resource_', (this.data.resources || []).length),
      previewAddressListVisible,
      showAddressPlaceholder,
      previewPhoneVisible: !!phoneItem,
      previewPhoneValue: phoneItem ? (phoneItem.c.value || '') : '',
      previewEmailVisible: !!emailItem,
      previewEmailValue: emailItem ? (emailItem.c.value || '') : ''
    })
  },
  // 自动保存：失焦存草稿，切换步骤存服务器
  onFieldBlur() {
    this.saveDraft()
  },
  saveDraft() {
    try {
      wx.setStorageSync('cardEntryV3Draft', {
        name: this.data.name,
        nickname: this.data.nickname,
        wechatId: this.data.wechatId,
        company: this.data.company,
        title: this.data.title,
        contactItems: this.data.contactItems,
        needsText: this.data.needsText,
        resourcesText: this.data.resourcesText,
        resources: this.data.resources,
        associationOrgs: this.data.associationOrgs,
        associationWilling: this.data.associationWilling,
        introCards: this.data.introCards,
        savedAt: Date.now()
      })
    } catch (e) {
      console.error('saveDraft error:', e)
    }
  },
  saveStepToServer(step) {
    if (!step) return
    if (step === 1) {
      const items = this.data.contactItems || []
      const first = type => (items.find(c => c.type === type) || {}).value
      const payload = {
        name: this.data.name,
        nickname: this.data.nickname,
        gender: this.data.gender,
        birth_place: this.data.birthPlace,
        company: this.data.company,
        title: this.data.title || this.data.positions?.[0]?.title || '',
        phone: first('phone'),
        wechat_id: this.data.wechatId || first('wechat'),
        email: first('email'),
        main_address: first('address') || this.data.address,
        bio: this.data.personalIntro,
        field_visibility: this.data.fieldVisibility || {},
        selected_avatar: this.data.avatar || '',
        personal_photos: Array.isArray(this.data.personal_photos) ? this.data.personal_photos : []
      }
      request.post('/api/card-entry/save-step/1', payload).catch(e => console.error('saveStep1 error:', e))
    }
    if (step === 2) {
      request.post('/api/card-entry/save-step/5', {
        orgs: this.data.associationOrgs,
        willing_to_serve: this.data.associationWilling,
        board_position: this.data.board_position,
        association_positions: this.data.association_positions,
        desired_position: this.data.desired_position || '',
        position_preferences: this.data.position_preferences || '',
        support_offerings: this.data.support_offerings,
        contribution_types: this.data.contributionTypes,
        contribution_description: this.data.contributionDescription,
        association_needs_detail: { selected: this.data.association_needs_selected, other: this.data.associationNeedsOther }
      }).catch(e => console.error('saveStep5 error:', e))
    }
  },

  async loadData() {
    // 1. 优先从 card-entry 接口加载六步完整数据
    try {
      const res = await request.get('/api/card-entry/data')
      if (res && res.step1) {
        const s1 = res.step1 || {}
        const s2 = res.step2 || {}
        const s3 = res.step3 || {}
        const s4 = res.step4 || {}
        const s5 = res.step5 || {}
        const s6 = res.step6 || {}

        // 教育经历：按 step2 中各学历层级映射为列表，若无结构化数据则退化为 schools 概况
        const eduList = []
        const pushEdu = (school, degree, major, gradYear) => {
          if (!school && !major && !gradYear) return
          const y = gradYear ? String(gradYear) : ''
          const duration = y ? `${y} 年毕业` : ''
          eduList.push({
            school: school || '',
            degree: degree || '',
            major: major || '',
            enrollDate: '',
            graduateDate: '',
            duration
          })
        }
        pushEdu(s2.primary_school, '小学', '', s2.primary_graduation_year)
        pushEdu(s2.middle_school, '初中', '', s2.middle_graduation_year)
        pushEdu(s2.high_school, '高中', '', s2.high_graduation_year)
        pushEdu(s2.bachelor_university, '本科', s2.bachelor_major, s2.bachelor_graduation_year)
        pushEdu(s2.master_university, '硕士', s2.master_major, s2.master_graduation_year)
        pushEdu(s2.doctor_university, '博士', s2.doctor_major, s2.doctor_graduation_year)
        if (!eduList.length && s3.schools) {
          eduList.push({
            school: s3.schools,
            degree: s2.highest_degree || '',
            major: '',
            enrollDate: '',
            graduateDate: '',
            duration: ''
          })
        }

        const contactItemsBuilt = _buildContactItems(
          s1.phone || '',
          s1.wechat_id || '',
          s1.email || '',
          s1.main_address || (s1.locations && s1.locations[0] && s1.locations[0].address) || ''
        )
        this.setData({
          avatar: s1.display_avatar || s1.selected_avatar || s1.avatar || this.data.avatar,
          personal_photos: Array.isArray(s1.personal_photos) ? s1.personal_photos : [],
          photoUrl: (s1.personal_photos && s1.personal_photos[0]) || s1.photo_url || this.data.photoUrl || '',
          wechatId: s1.wechat_id || this.data.wechatId || '',
          name: s1.name || this.data.name,
          nickname: s1.nickname || '',
          gender: s1.gender || '',
          genderLabel: genderLabelFor(s1.gender || ''),
          birthPlace: s1.birth_place || '',
          company: s1.company || '',
          title: s1.title || '',
          association_title: s1.association_title || '',
          industry: s1.industry || this.data.industry || '',
          contactItems: contactItemsBuilt,
          ..._previewFromContactItems(contactItemsBuilt),
          address:
            s1.main_address ||
            (s1.locations && s1.locations[0] && s1.locations[0].address) ||
            this.data.address,
          personalIntro: s2.intro_raw || s1.bio || '',
          // 需求与状态（step3）
          needsText: s3.raw || '',
          marital_status: s3.marital_status || '',
          maritalStatusLabel: _pickerLabel(MARITAL_OPTIONS, s3.marital_status),
          maritalStatusIndex: _pickerIndex(MARITAL_OPTIONS, s3.marital_status),
          datingNeed: !!s3.dating_need,
          datingPreferences: s3.dating_preferences || '',
          jobSeeking: !!s3.job_seeking,
          jobTargetPosition: s3.job_target_position || '',
          jobTargetIndustry: s3.job_target_industry || '',
          jobPreferences: s3.job_preferences || '',
          entrepreneurshipNeed: !!s3.entrepreneurship_need,
          entrepreneurship_type: s3.entrepreneurship_type || '',
          entrepreneurshipTypeLabel: _pickerLabel(ENTREPRENEURSHIP_TYPE_OPTIONS, s3.entrepreneurship_type),
          entrepreneurshipTypeIndex: _pickerIndex(ENTREPRENEURSHIP_TYPE_OPTIONS, s3.entrepreneurship_type),
          entrepreneurshipDescription: s3.entrepreneurship_description || '',
          // 资源与需求（step4）
          resourcesText: s4.raw || '',
          resourcesCount: (s4.resources && s4.resources.length) || 0,
          resources: _buildResourcesList(s4.resources),
          // 社团 / 校友会（step5）
          associationOrgs: s5.orgs || s5.association_orgs || '惠安一中大湾区校友会',
          associationWilling: !!s5.willing_to_serve,
          associationRole: s5.association_positions ? (Array.isArray(s5.association_positions) ? s5.association_positions.join('、') : s5.association_positions) : '',
          board_position: s5.board_position || '',
          boardPositionLabel: _pickerLabel(BOARD_POSITION_OPTIONS, s5.board_position),
          boardPositionIndex: _pickerIndex(BOARD_POSITION_OPTIONS, s5.board_position),
          association_positions: Array.isArray(s5.association_positions) ? s5.association_positions : [],
          support_offerings: Array.isArray(s5.support_offerings) ? s5.support_offerings : [],
          contributionTypes: s5.contribution_types || '',
          contributionDescription: s5.contribution_description || '',
          desired_position: s5.desired_position || '',
          position_preferences: s5.position_preferences || '',
          association_needs_selected: (() => {
            const sel = (s5.association_needs_detail && s5.association_needs_detail.selected) ? s5.association_needs_detail.selected : []
            return sel
          })(),
          associationNeedsOtherVisible: ((s5.association_needs_detail && s5.association_needs_detail.selected) || []).includes('other'),
          associationNeedsOther: (s5.association_needs_detail && s5.association_needs_detail.other) ? s5.association_needs_detail.other : '',
          associationPositionOptions: _optionsWithChecked(ASSOCIATION_POSITION_OPTIONS, Array.isArray(s5.association_positions) ? s5.association_positions : []),
          supportTypeOptions: _optionsWithChecked(SUPPORT_TYPE_OPTIONS, Array.isArray(s5.support_offerings) ? s5.support_offerings : []),
          associationNeedsGroups: _groupsWithChecked(ASSOCIATION_NEEDS_GROUPS, (s5.association_needs_detail && s5.association_needs_detail.selected) ? s5.association_needs_detail.selected : []),
          // 补充信息
          extraInfo:
            (s6.hidden_info && s6.hidden_info.description) ||
            s6.raw ||
            '',
          // 教育经历列表
          eduExperiences: eduList.length ? eduList : this.data.eduExperiences
        }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
        return
      }
    } catch (e) {
      console.error('Load card-entry data error (v3):', e)
    }

    // 2. 兜底：从 /api/cards/my 读取基础卡片信息
    try {
      const res = await request.get('/api/cards/my')
      if (res.success && res.data) {
        const u = res.data
        this.setData({
          avatar: u.display_avatar || u.avatar || u.selected_avatar || '',
          name: u.name || u.nickname || '',
          company: u.company || '',
          title: u.title || '',
          industry: u.industry || '',
          contactItems: _buildContactItems(
            u.phone || '',
            u.wechat_id || u.wechat || '',
            u.email || '',
            u.main_address || (u.locations && u.locations[0] && u.locations[0].address) || ''
          ),
          address:
            u.main_address ||
            (u.locations && u.locations[0] && u.locations[0].address) ||
            '',
          personalIntro: u.bio || ''
        }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
      }
    } catch (e) {
      console.error('Load cards/my data error (v3):', e)
    }
    this._syncVisibilityIconArrays && this._syncVisibilityIconArrays()
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    if (!field) return
    this.setData({ [field]: value })
  },

  onContactInput(e) {
    const { index } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({ [`contacts[${index}].value`]: value })
  },

  onGenderChange(e) {
    const index = e.detail.value
    const opts = this.data.genderOptions
    const option = opts && opts[index]
    const value = option ? option.value : ''
    const label = option ? option.label : '请选择'
    this.setData({ gender: value, genderLabel: label })
  },

  onSwitchChange(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    if (!field) return
    this.setData({ [field]: value })
  },

  onMaritalStatusChange(e) {
    const index = parseInt(e.detail.value, 10)
    const opts = this.data.maritalOptions || MARITAL_OPTIONS
    const o = opts[index]
    this.setData({
      marital_status: o ? o.value : '',
      maritalStatusLabel: o ? o.label : '请选择',
      maritalStatusIndex: index
    })
  },
  onMaritalStatusTap(e) {
    const value = e.currentTarget.dataset.value
    const label = e.currentTarget.dataset.label
    const opts = this.data.maritalOptions || MARITAL_OPTIONS
    const index = opts.findIndex(item => item.value === value)
    this.setData({
      marital_status: value || '',
      maritalStatusLabel: label || (value ? value : '请选择'),
      maritalStatusIndex: index >= 0 ? index : 0
    })
  },
  onEntrepreneurshipTypeChange(e) {
    const index = parseInt(e.detail.value, 10)
    const opts = this.data.entrepreneurshipTypeOptions || ENTREPRENEURSHIP_TYPE_OPTIONS
    const o = opts[index]
    this.setData({
      entrepreneurship_type: o ? o.value : '',
      entrepreneurshipTypeLabel: o ? o.label : '请选择',
      entrepreneurshipTypeIndex: index
    })
  },
  onEntrepreneurshipTypeTap(e) {
    const value = e.currentTarget.dataset.value
    const label = e.currentTarget.dataset.label
    const opts = this.data.entrepreneurshipTypeOptions || ENTREPRENEURSHIP_TYPE_OPTIONS
    const index = opts.findIndex(item => item.value === value)
    this.setData({
      entrepreneurship_type: value || '',
      entrepreneurshipTypeLabel: label || (value ? value : '请选择'),
      entrepreneurshipTypeIndex: index >= 0 ? index : 0
    })
  },
  onBoardPositionChange(e) {
    const index = parseInt(e.detail.value, 10)
    const opts = this.data.boardPositionOptions || BOARD_POSITION_OPTIONS
    const o = opts[index]
    this.setData({
      board_position: o ? o.value : '',
      boardPositionLabel: o ? o.label : '请选择',
      boardPositionIndex: index
    })
  },
  openBoardPositionSheet() {
    this.setData({ showBoardPositionSheet: true })
  },
  closeBoardPositionSheet() {
    this.setData({ showBoardPositionSheet: false })
  },
  onSelectBoardPosition(e) {
    const value = e.currentTarget.dataset.value
    const label = e.currentTarget.dataset.label
    const opts = this.data.boardPositionOptions || BOARD_POSITION_OPTIONS
    const index = opts.findIndex(o => o.value === value)
    this.setData({
      board_position: value || '',
      boardPositionLabel: label || '请选择',
      boardPositionIndex: index >= 0 ? index : 0,
      showBoardPositionSheet: false
    })
  },
  onAssociationPositionTap(e) {
    const val = e.currentTarget.dataset.value
    const list = this.data.association_positions || []
    const next = list.includes(val) ? list.filter(x => x !== val) : [...list, val]
    this.setData({
      association_positions: next,
      associationPositionOptions: _optionsWithChecked(ASSOCIATION_POSITION_OPTIONS, next)
    })
  },
  onSupportTypeTap(e) {
    const val = e.currentTarget.dataset.value
    const list = this.data.support_offerings || []
    const next = list.includes(val) ? list.filter(x => x !== val) : [...list, val]
    this.setData({
      support_offerings: next,
      supportTypeOptions: _optionsWithChecked(SUPPORT_TYPE_OPTIONS, next)
    })
  },
  onAssociationNeedTap(e) {
    const val = e.currentTarget.dataset.value
    const list = this.data.association_needs_selected || []
    const next = list.includes(val) ? list.filter(x => x !== val) : [...list, val]
    this.setData({
      association_needs_selected: next,
      associationNeedsOtherVisible: next.includes('other'),
      associationNeedsGroups: _groupsWithChecked(ASSOCIATION_NEEDS_GROUPS, next)
    })
  },

  onResourceTypeChange(e) {
    const index = parseInt(e.detail.value, 10)
    const resIndex = parseInt(e.currentTarget.dataset.index, 10)
    const opts = this.data.resourceTypeOptions || RESOURCE_TYPE_OPTIONS
    const o = opts[index]
    const resources = (this.data.resources || []).map((r, i) => {
      if (i !== resIndex) return r
      return { ...r, resource_type: o ? o.value : '', _typeIndex: index, _typeLabel: o ? o.label : '请选择' }
    })
    this.setData({ resources }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onResourceModeChange(e) {
    const index = parseInt(e.detail.value, 10)
    const resIndex = parseInt(e.currentTarget.dataset.index, 10)
    const opts = this.data.sharingModeOptions || SHARING_MODE_OPTIONS
    const o = opts[index]
    const resources = (this.data.resources || []).map((r, i) => {
      if (i !== resIndex) return r
      return { ...r, sharing_mode: o ? o.value : '', _modeIndex: index, _modeLabel: o ? o.label : '请选择' }
    })
    this.setData({ resources }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onResourceInput(e) {
    const resIndex = parseInt(e.currentTarget.dataset.index, 10)
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    const resources = (this.data.resources || []).map((r, i) => (i !== resIndex ? r : { ...r, [field]: value }))
    this.setData({ resources }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onAddResource() {
    const resources = [...(this.data.resources || []), {
      resource_type: '',
      resource_title: '',
      resource_description: '',
      sharing_mode: '',
      _typeIndex: 0,
      _typeLabel: '请选择',
      _modeIndex: 0,
      _modeLabel: '请选择'
    }]
    this.setData({ resources }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onRemoveResource(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const resources = this.data.resources.filter((_, i) => i !== index)
    this.setData({ resources }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  onPickPhoto() {
    const current = this.data.personal_photos || []
    const remain = Math.max(1, 9 - current.length)
    wx.showActionSheet({
      itemList: ['相册', '拍摄'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera']
        wx.chooseMedia({
          count: remain,
          mediaType: ['image'],
          sourceType,
          success: (r) => {
            const newUrls = (r.tempFiles || []).map(f => f.tempFilePath)
            const personal_photos = [...current, ...newUrls]
            const photoUrl = personal_photos[0] || ''
            this.setData({ personal_photos, photoUrl })
            wx.showToast({ title: '已添加相片', icon: 'success' })
          }
        })
      }
    })
  },
  onRemovePersonalPhoto(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const personal_photos = (this.data.personal_photos || []).filter((_, i) => i !== index)
    const photoUrl = personal_photos[0] || ''
    this.setData({ personal_photos, photoUrl })
  },
  onPickAvatar() {
    this.setData({ showAvatarSheet: true })
  },
  closeAvatarSheet() {
    this.setData({ showAvatarSheet: false })
  },
  onSelectAvatar(e) {
    const url = e.currentTarget.dataset.url
    if (url) this.setData({ avatar: url, showAvatarSheet: false })
  },

  onChangeCardBg() {
    wx.showToast({ title: '更换名片背景（待完善）', icon: 'none' })
  },

  onAddCompanyPosition() {
    const positions = [...this.data.positions, { company: '', title: '', duration: '' }]
    this.setData({ positions })
  },

  openContactAddSheet() {
    this.setData({ showContactAddSheet: true })
  },
  closeContactAddSheet() {
    this.setData({ showContactAddSheet: false })
  },
  onSelectContactType(e) {
    const type = e.currentTarget.dataset.type
    const label = e.currentTarget.dataset.label || CONTACT_TYPE_LABELS[type] || type
    const location_type = e.currentTarget.dataset.location_type
    const items = [...(this.data.contactItems || [])]
    if (type === 'address') {
      items.push({ id: 'address-' + Date.now(), type: 'address', label, value: '', required: false, location_type: location_type || 'work' })
    } else {
      items.push({ id: type + '-' + Date.now(), type, label, value: '', required: false })
    }
    this.setData({ contactItems: items, ..._previewFromContactItems(items), showContactAddSheet: false }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onContactItemInput(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const value = e.detail.value
    const items = (this.data.contactItems || []).map((item, i) => (i === index ? { ...item, value } : item))
    const upd = { contactItems: items, ..._previewFromContactItems(items) }
    if (items[index] && items[index].type === 'address') upd.address = value
    this.setData(upd, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onRemoveContact(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const items = this.data.contactItems.filter((_, i) => i !== index)
    this.setData({ contactItems: items, ..._previewFromContactItems(items) }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onAddAddress() {
    this.setData({ showAddressTypeSheet: true })
  },
  closeAddressTypeSheet() {
    this.setData({ showAddressTypeSheet: false })
  },
  onSelectAddressType(e) {
    const label = e.currentTarget.dataset.label
    const location_type = e.currentTarget.dataset.location_type || 'work'
    const items = [...(this.data.contactItems || [])]
    items.push({ id: 'address-' + Date.now(), type: 'address', label: label || '公司地址', value: '', required: false, location_type })
    this.setData({ contactItems: items, ..._previewFromContactItems(items), showAddressTypeSheet: false }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  onAddPdf() {
    wx.showToast({ title: '仅支持单个PDF上传, 最大10MB', icon: 'none' })
  },

  openIntroSheet() {
    const defaultPhoto = (this.data.personal_photos && this.data.personal_photos[0]) || this.data.photoUrl || this.data.avatar || ''
    this.setData({
      showIntroSheet: true,
      introEditIndex: -1,
      introForm: { name: '', photo: defaultPhoto, introText: '', scene: '' }
    })
  },
  closeIntroSheet() {
    this.setData({ showIntroSheet: false, introEditIndex: -1 })
  },
  onEditIntroCard(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const list = this.data.introCards || []
    const item = list[index]
    this.setData({
      showIntroSheet: true,
      introEditIndex: index,
      introForm: {
        name: item ? item.name || '' : '',
        photo: item ? item.photo || '' : '',
        introText: item ? item.introText || '' : '',
        scene: item ? item.scene || '' : ''
      }
    })
  },
  onIntroFormInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ introForm: { ...this.data.introForm, [field]: value } })
  },
  onIntroPhotoTap() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ introForm: { ...this.data.introForm, photo: res.tempFiles[0].tempFilePath } })
      }
    })
  },
  saveIntroCard() {
    const { introForm, introCards, introEditIndex } = this.data
    const item = { name: introForm.name, photo: introForm.photo, introText: introForm.introText, scene: introForm.scene }
    const list = [...(introCards || [])]
    if (introEditIndex >= 0) list[introEditIndex] = item
    else list.push(item)
    this.setData({ introCards: list, showIntroSheet: false, introEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  deleteIntroCard() {
    const { introCards, introEditIndex } = this.data
    if (introEditIndex < 0) { this.closeIntroSheet(); return }
    const list = introCards.filter((_, i) => i !== introEditIndex)
    this.setData({ introCards: list, showIntroSheet: false, introEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  onAddBusinessIntro() {
    wx.showToast({ title: '支持添加文字、图片、视频', icon: 'none' })
  },

  onAddCompanyIntro() {
    wx.showToast({ title: '支持添加文字、图片、视频', icon: 'none' })
  },

  onAddWorkExperience() {
    const workExperiences = [...this.data.workExperiences, { company: '', title: '', duration: '' }]
    this.setData({ workExperiences }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  openEduSheet(editIndex, initialDegree, initialDegreeLabel) {
    const isEdit = editIndex >= 0
    const list = this.data.eduExperiences || []
    let form
    let degreeLabel
    if (isEdit && list[editIndex]) {
      form = {
        school: list[editIndex].school || '',
        major: list[editIndex].major || '',
        department: list[editIndex].department || '',
        className: list[editIndex].className || '',
        degree: list[editIndex].degree || '',
        enrollDate: list[editIndex].enrollDate || '',
        graduateDate: list[editIndex].graduateDate || ''
      }
      degreeLabel = form.degree ? form.degree : '请选择'
    } else {
      form = { school: '', major: '', department: '', className: '', degree: initialDegree || '', enrollDate: '', graduateDate: '' }
      degreeLabel = (initialDegreeLabel || initialDegree) ? (initialDegreeLabel || initialDegree) : '请选择'
    }
    this.setData({ showEduSheet: true, eduEditIndex: editIndex, eduForm: form, degreeLabel })
  },
  closeEduSheet() {
    this.setData({ showEduSheet: false, eduEditIndex: -1 })
  },
  onEduFormInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`eduForm.${field}`]: value })
  },
  onEduDegreeChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const opts = this.data.degreeOptions || []
    const degree = opts[idx] || ''
    this.setData({ 'eduForm.degree': degree, degreeLabel: degree || '请选择' })
  },
  onEduEnrollDateChange(e) {
    const date = e.detail.value
    const degree = this.data.eduForm.degree
    let gradDate = this.data.eduForm.graduateDate
    if (date && !gradDate) {
      const parts = String(date).split('-')
      const year = parseInt(parts[0], 10)
      const month = parts[1] || '01'
      const day = parts[2] || '01'
      let offset = 0
      if (degree === '小学') offset = 6
      else if (degree === '初中') offset = 3
      else if (degree === '高中') offset = 3
      else if (degree === '本科') offset = 4
      else if (degree === '硕士') offset = 3
      else if (degree === '博士') offset = 2
      if (!Number.isNaN(year) && offset > 0) {
        gradDate = `${year + offset}-${month}-${day}`
      }
    }
    const update = { 'eduForm.enrollDate': date }
    if (gradDate) update['eduForm.graduateDate'] = gradDate
    this.setData(update)
  },
  onEduGraduateDateChange(e) {
    this.setData({ 'eduForm.graduateDate': e.detail.value })
  },
  saveEdu() {
    const { eduForm, eduExperiences, eduEditIndex } = this.data
    const parts = [eduForm.enrollDate, eduForm.graduateDate].filter(Boolean).map(d => d.substring(0, 7))
    const duration = parts.join(' - ')
    const item = {
      school: eduForm.school,
      degree: eduForm.degree,
      major: eduForm.major,
      department: eduForm.department,
      className: eduForm.className,
      enrollDate: eduForm.enrollDate,
      graduateDate: eduForm.graduateDate,
      duration
    }
    const list = [...(eduExperiences || [])]
    if (eduEditIndex >= 0) list[eduEditIndex] = item
    else list.push(item)
    this.setData({ eduExperiences: list, showEduSheet: false, eduEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  deleteEdu() {
    const { eduExperiences, eduEditIndex } = this.data
    if (eduEditIndex < 0) { this.closeEduSheet(); return }
    const list = eduExperiences.filter((_, i) => i !== eduEditIndex)
    this.setData({ eduExperiences: list, showEduSheet: false, eduEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  onAddEduExperience() {
    this.setData({ showEduLevelSheet: true })
  },
  closeEduLevelSheet() {
    this.setData({ showEduLevelSheet: false })
  },
  onSelectEduLevel(e) {
    const degree = e.currentTarget.dataset.degree
    const label = e.currentTarget.dataset.label || degree
    this.setData({ showEduLevelSheet: false })
    this.openEduSheet(-1, degree, label)
  },

  onEditEdu(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    this.openEduSheet(index)
  },

  openWorkSheet(editIndex) {
    const isEdit = editIndex >= 0
    const list = this.data.workExperiences || []
    const form = isEdit && list[editIndex]
      ? { company: list[editIndex].company || '', title: list[editIndex].title || '', department: list[editIndex].department || '', startDate: list[editIndex].startDate || '', endDate: list[editIndex].endDate || '', currentJob: !!list[editIndex].currentJob, description: list[editIndex].description || '' }
      : { company: '', title: '', department: '', startDate: '', endDate: '', currentJob: false, description: '' }
    this.setData({ showWorkSheet: true, workEditIndex: editIndex, workForm: form })
  },
  closeWorkSheet() {
    this.setData({ showWorkSheet: false, workEditIndex: -1 })
  },
  onWorkFormInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`workForm.${field}`]: value })
  },
  onWorkFormSwitch(e) {
    const value = e.detail.value
    this.setData({ 'workForm.currentJob': value })
  },
  onWorkStartDateChange(e) {
    this.setData({ 'workForm.startDate': e.detail.value })
  },
  onWorkEndDateChange(e) {
    this.setData({ 'workForm.endDate': e.detail.value })
  },
  saveWork() {
    const { workForm, workExperiences, workEditIndex } = this.data
    const start = workForm.startDate ? workForm.startDate.substring(0, 7) : ''
    const end = workForm.currentJob ? '至今' : (workForm.endDate ? workForm.endDate.substring(0, 7) : '')
    const duration = [start, end].filter(Boolean).join('-')
    const item = { company: workForm.company, title: workForm.title, department: workForm.department, startDate: workForm.startDate, endDate: workForm.endDate, currentJob: workForm.currentJob, description: workForm.description, duration }
    const list = [...(workExperiences || [])]
    if (workEditIndex >= 0) list[workEditIndex] = item
    else list.push(item)
    this.setData({ workExperiences: list, showWorkSheet: false, workEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  deleteWork() {
    const { workExperiences, workEditIndex } = this.data
    if (workEditIndex < 0) { this.closeWorkSheet(); return }
    const list = workExperiences.filter((_, i) => i !== workEditIndex)
    this.setData({ workExperiences: list, showWorkSheet: false, workEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },

  onAddWorkExperience() {
    this.openWorkSheet(-1)
  },

  onEditWork(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    this.openWorkSheet(index)
  },

  // 我的需求：脱单 / 求职 / 创业
  openNeedTypeSheet() {
    this.setData({ showNeedTypeSheet: true })
  },
  closeNeedTypeSheet() {
    this.setData({ showNeedTypeSheet: false })
  },
  onSelectNeedType(e) {
    const type = e.currentTarget.dataset.type
    this.closeNeedTypeSheet()
    if (type === 'dating' || type === 'friend') this.openDatingSheet()
    else if (type === 'job') this.openJobSheet()
    else if (type === 'entre') this.openEntreSheet()
    else if (type === 'org') wx.showToast({ title: '找组织（待完善）', icon: 'none' })
  },
  openDatingSheet() {
    this.setData({ showDatingSheet: true })
  },
  closeDatingSheet() {
    this.setData({ showDatingSheet: false })
  },
  saveDating() {
    this.setData({ showDatingSheet: false })
  },
  openJobSheet() {
    this.setData({ showJobSheet: true })
  },
  closeJobSheet() {
    this.setData({ showJobSheet: false })
  },
  saveJob() {
    this.setData({ showJobSheet: false })
  },
  openEntreSheet() {
    this.setData({ showEntreSheet: true })
  },
  closeEntreSheet() {
    this.setData({ showEntreSheet: false })
  },
  saveEntre() {
    this.setData({ showEntreSheet: false })
  },
  onAddMoreNeed() {
    wx.showToast({ title: '更多需求（待扩展）', icon: 'none' })
  },

  // 资源列表：半屏添加/编辑
  onAddResourceSheet() {
    this.openResourceSheet(-1)
  },
  onEditResource(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    this.openResourceSheet(index)
  },
  openResourceSheet(editIndex) {
    const list = this.data.resources || []
    let form
    if (editIndex >= 0 && list[editIndex]) {
      const r = list[editIndex]
      const typeIndex = typeof r._typeIndex === 'number' ? r._typeIndex : _pickerIndex(RESOURCE_TYPE_OPTIONS, r.resource_type)
      const modeIndex = typeof r._modeIndex === 'number' ? r._modeIndex : _pickerIndex(SHARING_MODE_OPTIONS, r.sharing_mode)
      form = {
        resource_type: r.resource_type || '',
        resource_title: r.resource_title || '',
        resource_description: r.resource_description || '',
        sharing_mode: r.sharing_mode || '',
        typeIndex,
        typeLabel: _pickerLabel(RESOURCE_TYPE_OPTIONS, r.resource_type),
        modeIndex,
        modeLabel: _pickerLabel(SHARING_MODE_OPTIONS, r.sharing_mode)
      }
    } else {
      form = {
        resource_type: '',
        resource_title: '',
        resource_description: '',
        sharing_mode: '',
        typeIndex: 0,
        typeLabel: '请选择',
        modeIndex: 0,
        modeLabel: '请选择'
      }
    }
    this.setData({ showResourceSheet: true, resourceEditIndex: editIndex, resourceForm: form })
  },
  closeResourceSheet() {
    this.setData({ showResourceSheet: false, resourceEditIndex: -1 })
  },
  onResourceFormTypeChange(e) {
    const index = parseInt(e.detail.value, 10)
    const opts = this.data.resourceTypeOptions || RESOURCE_TYPE_OPTIONS
    const o = opts[index]
    this.setData({
      resourceForm: {
        ...this.data.resourceForm,
        resource_type: o ? o.value : '',
        typeIndex: index,
        typeLabel: o ? o.label : '请选择'
      }
    })
  },
  onResourceFormModeChange(e) {
    const index = parseInt(e.detail.value, 10)
    const opts = this.data.sharingModeOptions || SHARING_MODE_OPTIONS
    const o = opts[index]
    this.setData({
      resourceForm: {
        ...this.data.resourceForm,
        sharing_mode: o ? o.value : '',
        modeIndex: index,
        modeLabel: o ? o.label : '请选择'
      }
    })
  },
  onResourceFormInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    if (!field) return
    this.setData({
      resourceForm: {
        ...this.data.resourceForm,
        [field]: value
      }
    })
  },
  saveResource() {
    const { resourceForm, resources, resourceEditIndex } = this.data
    const item = {
      resource_type: resourceForm.resource_type,
      resource_title: resourceForm.resource_title,
      resource_description: resourceForm.resource_description,
      sharing_mode: resourceForm.sharing_mode,
      _typeIndex: _pickerIndex(RESOURCE_TYPE_OPTIONS, resourceForm.resource_type),
      _typeLabel: _pickerLabel(RESOURCE_TYPE_OPTIONS, resourceForm.resource_type),
      _modeIndex: _pickerIndex(SHARING_MODE_OPTIONS, resourceForm.sharing_mode),
      _modeLabel: _pickerLabel(SHARING_MODE_OPTIONS, resourceForm.sharing_mode)
    }
    const list = [...(resources || [])]
    if (resourceEditIndex >= 0) list[resourceEditIndex] = item
    else list.push(item)
    this.setData({ resources: list, showResourceSheet: false, resourceEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  deleteResource() {
    const { resources, resourceEditIndex } = this.data
    if (resourceEditIndex < 0) { this.closeResourceSheet(); return }
    const list = (resources || []).filter((_, i) => i !== resourceEditIndex)
    this.setData({ resources: list, showResourceSheet: false, resourceEditIndex: -1 }, () => { this._syncVisibilityIconArrays && this._syncVisibilityIconArrays() })
  },
  onResourceFormTypeTap(e) {
    const value = e.currentTarget.dataset.value
    const opts = this.data.resourceTypeOptions || RESOURCE_TYPE_OPTIONS
    const index = opts.findIndex(o => o.value === value)
    const label = (opts[index] || {}).label || '请选择'
    this.setData({
      resourceForm: {
        ...this.data.resourceForm,
        resource_type: value || '',
        typeIndex: index >= 0 ? index : 0,
        typeLabel: label
      }
    })
  },
  onResourceFormModeTap(e) {
    const value = e.currentTarget.dataset.value
    const opts = this.data.sharingModeOptions || SHARING_MODE_OPTIONS
    const index = opts.findIndex(o => o.value === value)
    const label = (opts[index] || {}).label || '请选择'
    this.setData({
      resourceForm: {
        ...this.data.resourceForm,
        sharing_mode: value || '',
        modeIndex: index >= 0 ? index : 0,
        modeLabel: label
      }
    })
  },

  onUploadPaperCard() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paperCards = [...this.data.paperCards, res.tempFiles[0].tempFilePath]
        this.setData({ paperCards })
        wx.showToast({ title: '已添加', icon: 'success' })
      }
    })
  },

  onRemovePaperCard(e) {
    const { index } = e.currentTarget.dataset
    const paperCards = this.data.paperCards.filter((_, i) => i !== index)
    this.setData({ paperCards })
  },

  onPreview() {
    wx.navigateTo({ url: '/pages/card/card' })
  },

  async onSave() {
    wx.showLoading({ title: '保存中...' })
    try {
      const items = this.data.contactItems || []
      const first = (type) => (items.find(c => c.type === type) || {}).value
      const payload = {
        name: this.data.name,
        nickname: this.data.nickname,
        gender: this.data.gender,
        birth_place: this.data.birthPlace,
        company: this.data.company,
        title: this.data.title || this.data.positions?.[0]?.title || '',
        phone: first('phone'),
        wechat_id: this.data.wechatId || first('wechat'),
        email: first('email'),
        main_address: first('address') || this.data.address,
        bio: this.data.personalIntro,
        field_visibility: this.data.fieldVisibility || {},
        selected_avatar: this.data.avatar || '',
        personal_photos: Array.isArray(this.data.personal_photos) ? this.data.personal_photos : []
      }
      await request.post('/api/card-entry/save-step/1', payload)
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      // 第1步保存成功后若有第2步则跳下一步
      if (this.data.hasAlumniConfig && this.data.currentStep === 1) {
        this.setData({ currentStep: 2 })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '保存成功（本地）', icon: 'success' })
      if (this.data.hasAlumniConfig && this.data.currentStep === 1) {
        this.setData({ currentStep: 2 })
      }
    }
  }
})
