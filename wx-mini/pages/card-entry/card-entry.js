// pages/card-entry/card-entry.js
// 校友圈卡片录入页：分步表单 + 断点续填 + 步骤内语音补充

const request = require('../../utils/request.js')
// 引入腾讯位置服务 SDK（需要先下载官方SDK：https://mapapi.qq.com/web/miniprogram/JSSDK/qqmap-wx-jssdk1.2.zip）
// 使用 try-catch 包裹，避免SDK文件不存在时导致页面崩溃
let QQMapWX = null
try {
  QQMapWX = require('../../utils/qqmap-wx.js')
} catch (error) {
  console.warn('腾讯地图SDK加载失败，地址智能提示功能将不可用:', error)
  // 创建一个占位类，避免后续调用报错
  QQMapWX = class {
    constructor() {}
    getSuggestion() {
      if (arguments[0] && arguments[0].fail) {
        arguments[0].fail({ message: 'SDK未安装' })
      }
    }
  }
}

var EMPTY_STEP2 = { primary_school: '', primary_graduation_year: '', middle_school: '', middle_graduation_year: '', high_school: '', high_graduation_year: '', bachelor_university: '', bachelor_major: '', bachelor_graduation_year: '', master_university: '', master_major: '', master_graduation_year: '', doctor_university: '', doctor_major: '', doctor_graduation_year: '', highest_degree: '', field_visibility: {} }
var EMPTY_STEP3 = { marital_status: '', dating_need: false, dating_preferences: '', job_seeking: false, job_target_position: '', job_target_industry: '', job_preferences: '', entrepreneurship_need: false, entrepreneurship_type: '', entrepreneurship_description: '', field_visibility: {} }
var EMPTY_STEP4 = { resources: [], field_visibility: {} }
var EMPTY_STEP5 = { willing_to_serve: false, contribution_types: '', contribution_description: '', desired_position: '', position_preferences: '', association_needs: '', board_position: '', association_positions: [], support_offerings: [], association_needs_detail: { selected: [], other: '' }, field_visibility: {} }
var EMPTY_STEP6 = { hidden_info: {}, field_visibility: {} }
function hasStep2Data(o) { return o && typeof o === 'object' && Object.keys(o).some(function(k) { return k !== 'field_visibility' && o[k] !== undefined && o[k] !== null && o[k] !== '' }) }
function hasStep3Data(o) { return o && typeof o === 'object' && Object.keys(o).some(function(k) { return k !== 'field_visibility' && o[k] !== undefined && o[k] !== null && o[k] !== '' }) }
function hasStep5Data(o) {
  if (!o || typeof o !== 'object') return false
  var ad = o.association_needs_detail
  var hasNeeds = ad && typeof ad === 'object' && (Array.isArray(ad.selected) && ad.selected.length > 0 || (ad.other && String(ad.other).trim()))
  return Object.keys(o).some(function(k) {
    if (k === 'field_visibility' || k === 'association_needs_detail') return false
    var v = o[k]
    if (Array.isArray(v) && v.length > 0) return true
    if (v === true || v === false) return true
    return v !== undefined && v !== null && v !== ''
  }) || !!hasNeeds
}

Page({
  data: {
    currentStep: 1,
    totalSteps: 6,  // 从5改为6
    progress: null,
    isInternalMode: false,
    staffFillConfirmed: false,  // 是否已确认代填提醒
    staffAddNewMode: false,     // 工作人员新增校友模式（空白填写，第一步保存时创建新用户）
    // 步骤1：基础与名片 + 位置信息
    step1: {
      name: '',
      nickname: '',
      avatar: '',
      gender: '',
      wechat_id: '',
      selected_avatar: '',
      personal_photos: [],
      birth_place: '',
      title: '',
      company: '',
      phone: '',
      email: '',
      bio: '',
      field_visibility: {},
      locations: []
    },
    // 步骤2：教育经历
    step2: {
      primary_school: '',
      primary_graduation_year: '',
      middle_school: '',
      middle_graduation_year: '',
      high_school: '',
      high_graduation_year: '',
      bachelor_university: '',
      bachelor_major: '',
      bachelor_graduation_year: '',
      master_university: '',
      master_major: '',
      master_graduation_year: '',
      doctor_university: '',
      doctor_major: '',
      doctor_graduation_year: '',
      highest_degree: '',
      field_visibility: {}
    },
    // 步骤3：需求与状态
    step3: {
      marital_status: '',
      dating_need: false,
      dating_preferences: '',
      job_seeking: false,
      job_target_position: '',
      job_target_industry: '',
      job_preferences: '',
      entrepreneurship_need: false,
      entrepreneurship_type: '',
      entrepreneurship_description: '',
      field_visibility: {}
    },
    // 步骤4：资源分享
    step4: {
      resources: [],
      field_visibility: {}
    },
    // 步骤5：校友会相关
    step5: {
      willing_to_serve: false,
      contribution_types: '',
      contribution_description: '',
      desired_position: '',
      position_preferences: '',
      association_needs: '',
      board_position: '',
      association_positions: [],
      support_offerings: [],
      association_needs_detail: { selected: [], other: '' },
      field_visibility: {}
    },
    // 步骤6：补充（隐藏匹配信息）
    step6: {
      hidden_info: {},
      field_visibility: {}
    },
    // 学历选项
    degreeOptions: ['小学', '初中', '高中', '本科', '硕士', '博士'],
    // 性别选项
    genderOptions: [
      { label: '请选择', value: '' },
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '其他', value: 'other' }
    ],
    // 预设头像列表（与 COS avatars 本地上传的文件一致）
    selectedAvatarOptions: [
      { label: '使用微信头像', value: '' },
      { label: '女中1', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-middle-1.png' },
      { label: '女中2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-middle-2.jpeg' },
      { label: '女老2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-old-2.jpeg' },
      { label: '女老', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-old.jpeg' },
      { label: '女青10', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-10.jpeg' },
      { label: '女青11', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-11.jpeg' },
      { label: '女青12', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-12.jpeg' },
      { label: '女青13', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-13.jpeg' },
      { label: '女青14', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-14.jpeg' },
      { label: '女青15', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-15.jpeg' },
      { label: '女青16', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-16.jpeg' },
      { label: '女青17', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-17.jpeg' },
      { label: '女青18', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-18.webp' },
      { label: '女青19', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-19.jpeg' },
      { label: '女青20', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-20.jpeg' },
      { label: '女青21', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-21.jpeg' },
      { label: '女青22', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-22.jpeg' },
      { label: '女青222', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-222.png' },
      { label: '女青23', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-23.jpeg' },
      { label: '女青24', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-24.png' },
      { label: '女青25', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-25.jpeg' },
      { label: '女青26', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-26.jpeg' },
      { label: '女青3', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-3.jpeg' },
      { label: '女青4', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-4.jpeg' },
      { label: '女青8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-8.png' },
      { label: '女青9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young-9.webp' },
      { label: '女青', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/female-young.png' },
      { label: '男中10', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-10.png' },
      { label: '男中11', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-11.png' },
      { label: '男中12', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-12.jpeg' },
      { label: '男中13', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-13.png' },
      { label: '男中14', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-14.png' },
      { label: '男中15', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-15.png' },
      { label: '男中2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-2.png' },
      { label: '男中3', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-3.png' },
      { label: '男中4', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-4.jpeg' },
      { label: '男中5', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-5.webp' },
      { label: '男中6', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-6.jpeg' },
      { label: '男中7', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-7.png' },
      { label: '男中8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-8.png' },
      { label: '男中9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle-9.png' },
      { label: '男中', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-middle.png' },
      { label: '男老10', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-10.png' },
      { label: '男老11', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-11.jpeg' },
      { label: '男老12', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-12.jpeg' },
      { label: '男老13', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-13.jpeg' },
      { label: '男老14', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-14.png' },
      { label: '男老15', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-15.png' },
      { label: '男老16', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-16.png' },
      { label: '男老17', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-17.jpeg' },
      { label: '男老18', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-18.webp' },
      { label: '男老19', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-19.png' },
      { label: '男老2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-2.jpeg' },
      { label: '男老3', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-3.png' },
      { label: '男老4', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-4.jpeg' },
      { label: '男老5', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-5.png' },
      { label: '男老6', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-6.png' },
      { label: '男老7', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-7.png' },
      { label: '男老8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-8.png' },
      { label: '男老9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old-9.png' },
      { label: '男老', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-old.png' },
      { label: '男青1', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-1.png' },
      { label: '男青10', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-10.png' },
      { label: '男青11', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-11.png' },
      { label: '男青12', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-12.png' },
      { label: '男青13', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-13.png' },
      { label: '男青14', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-14.webp' },
      { label: '男青15', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-15.jpeg' },
      { label: '男青16', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-16.jpeg' },
      { label: '男青2', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-2.jpeg' },
      { label: '男青3', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-3.jpeg' },
      { label: '男青4', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-4.jpeg' },
      { label: '男青5', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-5.jpeg' },
      { label: '男青6', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-6.webp' },
      { label: '男青7', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-7.jpeg' },
      { label: '男青8', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-8.jpeg' },
      { label: '男青9', value: 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/male-young-9.jpeg' }
    ],
    // 婚姻状况选项
    maritalOptions: [
      { label: '单身', value: 'single' },
      { label: '已婚', value: 'married' },
      { label: '离异', value: 'divorced' },
      { label: '丧偶', value: 'widowed' }
    ],
    // 创业类型选项
    entrepreneurshipTypeOptions: [
      { label: '找资源', value: 'resource' },
      { label: '找合作伙伴', value: 'partner' },
      { label: '两者都需要', value: 'both' }
    ],
    // 资源类型选项
    resourceTypeOptions: [
      { label: '经验分享', value: 'experience' },
      { label: '知识技能', value: 'knowledge' },
      { label: '资源对接', value: 'resource' },
      { label: '人脉连接', value: 'connection' },
      { label: '其他', value: 'other' }
    ],
    // 分享方式选项
    sharingModeOptions: [
      { label: '免费分享', value: 'free' },
      { label: '事业共创', value: 'collaboration' },
      { label: '两者都可以', value: 'both' }
    ],
    // 位置类型选项
    locationTypeOptions: [
      { label: '居住地', value: 'residence' },
      { label: '工作地', value: 'work' },
      { label: '其他', value: 'other' }
    ],
    // 位置可见性：公开 / 不公开 / 仅精确到区
    locationVisibilityOptions: [
      { label: '公开', value: 'public' },
      { label: '不公开', value: 'private' },
      { label: '仅精确到区，不暴露精准位置', value: 'district_only' }
    ],
    // 字段可见性：公开 / 不公开 / 部分打码
    fieldVisibilityOptions: [
      { label: '公开', value: 'public' },
      { label: '不公开', value: 'private' },
      { label: '部分打码', value: 'masked' }
    ],
    // 地址智能提示相关
    addressSuggestions: {}, // { locIndex: [suggestions] } 存储每个位置的建议列表
    addressSuggestionTimers: {}, // { locIndex: timerId } 防抖定时器
    showAddressSuggestions: {}, // { locIndex: true/false } 控制建议列表显示
    qqmapsdk: null, // 腾讯地图SDK实例
    // 惠安一中校董会职务（单选）
    boardPositionOptions: [
      { label: '校董会常务副董事长（为母校捐资100万元，每年10万元，10年捐完）', value: 'board_vice_chair_senior' },
      { label: '校董会副董事长（为母校捐资50万元，每年10万元，5年捐完）', value: 'board_vice_chair' },
      { label: '校董会常务董事（为母校捐资25万元，每年5万元，5年捐完）', value: 'board_director_senior' },
      { label: '校董会董事（为母校捐资5万元，每年1万元，5年捐完）', value: 'board_director' },
      { label: '只捐资不愿担任职务（可另外推荐人选）', value: 'donate_only' },
      { label: '可捐可不捐，有需要可联系我', value: 'donate_maybe' },
      { label: '当前尚无意愿或能力，争取未来参与', value: 'future' }
    ],
    // 惠安一中大湾区校友会职务（多选）
    associationPositionOptions: [
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
    ],
    // 可为校友会提供的支持（多选）
    supportTypeOptions: [
      { label: '出场地', value: 'venue' },
      { label: '出人力', value: 'manpower' },
      { label: '出经费', value: 'funding' },
      { label: '出经验', value: 'experience' }
    ],
    // 对校友会的需求（多选）
    associationNeedsOptions: [
      { label: '希望组织节日团拜/中秋博饼等家乡活动', value: 'festival_events' },
      { label: '经常组团品尝家乡菜', value: 'hometown_dining' },
      { label: '多组织活动认识同城校友', value: 'local_network' },
      { label: '脱单/相亲', value: 'dating' },
      { label: '找到各种搭子', value: 'buddies' },
      { label: '新人迎新&新人职业发展指引', value: 'career_mentoring' },
      { label: '一身传奇经验，愿意带新人', value: 'mentor' },
      { label: '纯喝茶聊聊就很好', value: 'tea_chat' },
      { label: '喜欢热闹，欢迎大家多来我这里喝茶（请填具体地址）', value: 'host_tea' },
      { label: '方便组局&找局', value: 'events' },
      { label: '科创专业委员会提供现场咨询交流', value: 'tech_consulting' },
      { label: '校友科创资源挖掘和共享', value: 'tech_resources' },
      { label: '深入的事业发展资源支持', value: 'career_support' },
      { label: '其它（请填写）', value: 'other' }
    ],
    // 选择器索引缓存（用于WXML）
    pickerIndexes: {},
    // 工作人员模式
    isStaffMode: false,
    staffIdVerified: false,  // 工号是否已验证
    targetUser: null,  // {id, name, nickname, company, title}
    searchKeyword: '',
    searchResults: [],
    showUserSearch: false,
    // 按性别过滤后的头像选项（用于图像列表选择）
    filteredAvatarOptions: []
  },

  onLoad(options) {
    // 初始化腾讯地图SDK（需要配置TENCENT_MAP_KEY，建议从后端获取或配置）
    // 使用 try-catch 包裹，避免SDK初始化失败导致页面崩溃
    try {
      const TENCENT_MAP_KEY = 'HLRBZ-2VD6Q-X6C5D-2OG4P-4WHZO-ZVFEI' // 请替换为您的Key
      if (QQMapWX && typeof QQMapWX === 'function') {
        this.setData({
          qqmapsdk: new QQMapWX({ key: TENCENT_MAP_KEY })
        })
        console.log('腾讯地图SDK初始化成功')
      } else {
        console.warn('腾讯地图SDK未正确加载，地址智能提示功能将不可用')
        this.setData({ qqmapsdk: null })
      }
    } catch (error) {
      console.error('腾讯地图SDK初始化失败:', error)
      // SDK初始化失败不影响页面正常使用，只是地址智能提示功能不可用
      this.setData({ qqmapsdk: null })
    }
    
    // 兼容旧的 URL 参数（如果从其他页面跳转过来）
    const isInternal = options.mode === 'internal'
    if (isInternal) {
      wx.setNavigationBarTitle({ title: '内部评价' })
      this.setData({ isInternalMode: true, isStaffMode: true })
    }
    // 检查是否有target_user_id参数（从其他页面传入）
    if (options.target_user_id) {
      const verifiedStaffId = wx.getStorageSync('staff_id_verified')
      if (verifiedStaffId === '362100' || isInternal) {
        this.setData({
          isStaffMode: true,
          targetUser: { id: parseInt(options.target_user_id) }
        })
      } else if (!isInternal) {
        console.warn('非工作人员模式，忽略target_user_id参数')
      }
    }
    const verifiedStaffId = wx.getStorageSync('staff_id_verified')
    if (verifiedStaffId === '362100') {
      this.setData({ staffIdVerified: true })
    }
    // 如果是内部模式但没有目标用户，只更新选择器索引
    if (isInternal && (!this.data.targetUser || !this.data.targetUser.id)) {
      this.updatePickerIndexes()
      this.updateFilteredAvatarOptions()
      return
    }
    // 统一使用 forceInternal，在内部模式下确保使用内部接口
    this.loadAllData(undefined, isInternal ? true : undefined)
    this.loadProgress()
    this.updatePickerIndexes()
    this.updateFilteredAvatarOptions()
  },

  onShow() {
    this.loadProgress()
    if (this.data.currentStep === 1) this.updateFilteredAvatarOptions()
  },

  // 加载所有步骤的已有数据。forceInternal 为 true 时强制走内部评价接口（避免 setData 未完成时用错接口）
  async loadAllData(overrideTargetUser, forceInternal) {
    try {
      const isInternalMode = forceInternal === true ? true : this.data.isInternalMode
      const isStaffMode = this.data.isStaffMode
      const targetUser = overrideTargetUser || this.data.targetUser
      const requestedTargetId = (targetUser && targetUser.id) ? targetUser.id : null
      console.log('loadAllData 调用，isInternalMode:', isInternalMode, 'forceInternal:', forceInternal, 'targetUser:', targetUser)

      if (isInternalMode && (!targetUser || !targetUser.id)) {
        return
      }
      const base = isInternalMode ? '/api/card-entry/internal' : '/api/card-entry'
      let url = base + '/data'
      if (targetUser && targetUser.id) {
        url += `?target_user_id=${targetUser.id}`
        console.log(isInternalMode ? '内部评价：加载用户' : '工作人员模式：加载用户ID', targetUser.id, '（', targetUser.name || targetUser.nickname, '）')
      } else if (!isInternalMode) {
        console.log('普通模式：加载当前登录用户的数据')
      }
      const res = await request.get(url)
      if (res) {
        console.log('加载到的数据：', {
          step1_name: res.step1?.name,
          step1_nickname: res.step1?.nickname,
          step2_has_data: !!res.step2 && Object.keys(res.step2).length > 0,
          step3_has_data: !!res.step3 && Object.keys(res.step3).length > 0,
          step4_resources_count: res.step4?.resources?.length || 0,
          step5_has_data: !!res.step5 && Object.keys(res.step5).length > 0,
          step6_has_data: !!res.step6 && res.step6.hidden_info && Object.keys(res.step6.hidden_info).length > 0
        })
        if (res.step1) {
          let s1
          if (isInternalMode || (res.step1._original != null)) {
            // 内部评价或响应带 _original：仅用本响应构建，不合并历史。左侧=_original，右侧=工作人员评价
            const orig = res.step1._original || {}
            s1 = {
              name: res.step1.name ?? '',
              nickname: res.step1.nickname ?? '',
              avatar: res.step1.avatar ?? '',
              gender: res.step1.gender ?? '',
              wechat_id: res.step1.wechat_id ?? '',
              selected_avatar: res.step1.selected_avatar ?? '',
              personal_photos: Array.isArray(res.step1.personal_photos) ? res.step1.personal_photos : [],
              birth_place: res.step1.birth_place ?? '',
              title: res.step1.title ?? '',
              company: res.step1.company ?? '',
              phone: res.step1.phone ?? '',
              email: res.step1.email ?? '',
              bio: res.step1.bio ?? '',
              field_visibility: res.step1.field_visibility || {},
              field_source: res.step1.field_source || {},
              _original: { ...orig, locations: orig.locations || [] }
            }
            if (res.step1.locations && res.step1.locations.length) {
              s1.locations = res.step1.locations.map(loc => {
                const typeIndex = this.data.locationTypeOptions.findIndex(i => i.value === loc.location_type)
                const typeLabel = this.data.locationTypeOptions.find(i => i.value === loc.location_type)?.label || '请选择'
                const vis = loc.location_visibility || 'public'
                const visIndex = this.data.locationVisibilityOptions.findIndex(i => i.value === vis)
                const visLabel = this.data.locationVisibilityOptions.find(i => i.value === vis)?.label || '公开'
                return { ...loc, _typeIndex: typeIndex >= 0 ? typeIndex : -1, _typeLabel: typeLabel, _visibilityIndex: visIndex >= 0 ? visIndex : 0, _visibilityLabel: visLabel, source: loc.source }
              })
            } else {
              s1.locations = []
            }
          } else {
            s1 = { ...this.data.step1, ...res.step1 }
            if (res.step1._original) s1._original = res.step1._original
            if (res.step1.locations && res.step1.locations.length) {
              s1.locations = res.step1.locations.map(loc => {
                const typeIndex = this.data.locationTypeOptions.findIndex(i => i.value === loc.location_type)
                const typeLabel = this.data.locationTypeOptions.find(i => i.value === loc.location_type)?.label || '请选择'
                const vis = loc.location_visibility || 'public'
                const visIndex = this.data.locationVisibilityOptions.findIndex(i => i.value === vis)
                const visLabel = this.data.locationVisibilityOptions.find(i => i.value === vis)?.label || '公开'
                return { ...loc, _typeIndex: typeIndex >= 0 ? typeIndex : -1, _typeLabel: typeLabel, _visibilityIndex: visIndex >= 0 ? visIndex : 0, _visibilityLabel: visLabel, source: loc.source }
              })
            } else {
              s1.locations = s1.locations || []
            }
            s1.field_visibility = res.step1.field_visibility || {}
            s1.field_source = res.step1.field_source || {}
          }
          // 填写评价下只接受内部接口的 step1；代填/普通模式下接受本次响应。避免代填接口数据覆盖“工作人员填写”右侧
          const isInternalResponse = !!(res.step1 && res.step1._original != null)
          const sameTarget = requestedTargetId == null || (this.data.targetUser && this.data.targetUser.id === requestedTargetId)
          const inInternalNow = !!this.data.isInternalMode
          const allowStep1 = !inInternalNow || (isInternalResponse && sameTarget)
          if (allowStep1) {
            const g = String(s1.gender || '').trim()
            const genderForPicker = (g === '男' ? 'male' : g === '女' ? 'female' : g) || ''
            const gi = this.data.genderOptions.findIndex(o => o.value === genderForPicker)
            s1._genderIndex = gi >= 0 ? gi : 0
            s1._genderLabel = (this.data.genderOptions[s1._genderIndex] || {}).label || '请选择性别'
            const ai = this.data.selectedAvatarOptions.findIndex(o => o.value === (s1.selected_avatar || ''))
            s1._selectedAvatarIndex = ai >= 0 ? ai : 0
            s1._selectedAvatarLabel = (this.data.selectedAvatarOptions[s1._selectedAvatarIndex] || {}).label || '使用微信头像'
            const loadedGender = String(s1.gender || '').trim()
            this.setData({ step1: s1 }, () => this.updateFilteredAvatarOptions(loadedGender))
          }
        }
        if (hasStep2Data(res.step2)) {
          const s2 = { ...EMPTY_STEP2, ...res.step2, field_visibility: res.step2.field_visibility || {}, field_source: res.step2.field_source || {} }
          // 保留原始数据（用于内部评价模式对比）
          if (res.step2._original) {
            s2._original = res.step2._original
          }
          this.setData({ step2: s2 })
          console.log('步骤2数据已加载：', { bachelor_university: res.step2.bachelor_university, master_university: res.step2.master_university })
        } else {
          const s2 = { ...EMPTY_STEP2 }
          if (res.step2 && res.step2._original) {
            s2._original = res.step2._original
          }
          this.setData({ step2: s2 })
        }
        if (hasStep3Data(res.step3)) {
          const s3 = { ...EMPTY_STEP3, ...res.step3, field_visibility: res.step3.field_visibility || {}, field_source: res.step3.field_source || {} }
          // 保留原始数据（用于内部评价模式对比）
          if (res.step3._original) {
            s3._original = res.step3._original
          }
          this.setData({ step3: s3 })
          console.log('步骤3数据已加载：', { marital_status: res.step3.marital_status, entrepreneurship_need: res.step3.entrepreneurship_need })
        } else {
          const s3 = { ...EMPTY_STEP3 }
          if (res.step3 && res.step3._original) {
            s3._original = res.step3._original
          }
          this.setData({ step3: s3 })
        }
        if (res.step4 && res.step4.resources && res.step4.resources.length > 0) {
            const resources = (res.step4.resources || []).map(r => {
            const typeIndex = this.data.resourceTypeOptions.findIndex(i => i.value === r.resource_type)
            const typeLabel = this.data.resourceTypeOptions.find(i => i.value === r.resource_type)?.label || '请选择'
            const modeIndex = this.data.sharingModeOptions.findIndex(i => i.value === r.sharing_mode)
            const modeLabel = this.data.sharingModeOptions.find(i => i.value === r.sharing_mode)?.label || '请选择'
            return { ...r, field_visibility: r.field_visibility || {}, source: r.source, _typeIndex: typeIndex >= 0 ? typeIndex : -1, _typeLabel: typeLabel, _modeIndex: modeIndex >= 0 ? modeIndex : -1, _modeLabel: modeLabel }
          })
          const s4 = { resources, field_visibility: res.step4.field_visibility || {} }
          this.setData({ step4: s4 })
        } else {
          this.setData({ step4: { resources: [], field_visibility: {} } })
        }
        if (hasStep5Data(res.step5)) {
          const d = res.step5
          this.setData({
            step5: {
              ...EMPTY_STEP5,
              willing_to_serve: !!d.willing_to_serve,
              contribution_types: d.contribution_types || '',
              contribution_description: d.contribution_description || '',
              desired_position: d.desired_position || '',
              position_preferences: d.position_preferences || '',
              association_needs: d.association_needs || '',
              board_position: d.board_position || '',
              association_positions: Array.isArray(d.association_positions) ? d.association_positions : [],
              support_offerings: Array.isArray(d.support_offerings) ? d.support_offerings : [],
              association_needs_detail: (d.association_needs_detail && typeof d.association_needs_detail === 'object') ? d.association_needs_detail : { selected: [], other: '' },
              field_visibility: d.field_visibility || {},
              field_source: d.field_source || {}
            }
          })
        } else {
          this.setData({ step5: { ...EMPTY_STEP5, association_needs_detail: { selected: [], other: '' } } })
        }
        if (res.step6 && res.step6.hidden_info && typeof res.step6.hidden_info === 'object') {
          const hi = res.step6.hidden_info
          const hiddenData = Array.isArray(hi) && hi.length > 0 ? hi[0].data : (typeof hi === 'object' ? hi : {})
          const s6 = { hidden_info: hiddenData || {}, field_visibility: res.step6.field_visibility || {} }
          this.setData({ step6: s6 })
        } else {
          this.setData({ step6: { hidden_info: {}, field_visibility: {} } })
        }
        this.updatePickerIndexes()
      }
    } catch (e) {
      console.error('Load data error:', e)
    }
  },

  // 更新选择器索引（用于WXML显示）
  updatePickerIndexes() {
    const indexes = {}
    
    // 步骤3：婚姻状况
    if (this.data.step3.marital_status) {
      indexes.maritalStatus = this.data.maritalOptions.findIndex(
        item => item.value === this.data.step3.marital_status
      )
      indexes.maritalStatusLabel = this.data.maritalOptions.find(
        item => item.value === this.data.step3.marital_status
      )?.label || '请选择婚姻状况'
    } else {
      indexes.maritalStatus = -1
      indexes.maritalStatusLabel = '请选择婚姻状况'
    }
    
    // 步骤3：创业类型
    if (this.data.step3.entrepreneurship_type) {
      indexes.entrepreneurshipType = this.data.entrepreneurshipTypeOptions.findIndex(
        item => item.value === this.data.step3.entrepreneurship_type
      )
      indexes.entrepreneurshipTypeLabel = this.data.entrepreneurshipTypeOptions.find(
        item => item.value === this.data.step3.entrepreneurship_type
      )?.label || '请选择创业需求类型'
    } else {
      indexes.entrepreneurshipType = -1
      indexes.entrepreneurshipTypeLabel = '请选择创业需求类型'
    }
    
    // 步骤2：最高学历
    if (this.data.step2.highest_degree) {
      indexes.highestDegree = this.data.degreeOptions.indexOf(this.data.step2.highest_degree)
      indexes.highestDegreeLabel = this.data.step2.highest_degree
    } else {
      indexes.highestDegree = -1
      indexes.highestDegreeLabel = '请选择最高学历'
    }
    
    // 步骤5：校董会职务
    const bp = this.data.step5.board_position
    const bpOpts = this.data.boardPositionOptions || []
    indexes.boardPosition = bpOpts.findIndex(i => i.value === bp)
    indexes.boardPositionLabel = this.data.boardPositionOptions.find(i => i.value === bp)?.label || '请选择'
    
    // 步骤5：多选预计算（用于 WXML checkbox）
    const pos = this.data.step5.association_positions || []
    indexes.associationPositionsWithChecked = (this.data.associationPositionOptions || []).map(opt => ({
      ...opt,
      checked: pos.indexOf(opt.value) >= 0
    }))
    const sup = this.data.step5.support_offerings || []
    const supTypes = Array.isArray(sup) ? sup.map(s => (s && s.type) ? s.type : s) : []
    indexes.supportTypesWithChecked = (this.data.supportTypeOptions || []).map(opt => ({
      ...opt,
      checked: supTypes.indexOf(opt.value) >= 0
    }))
    const sel = (this.data.step5.association_needs_detail && this.data.step5.association_needs_detail.selected) || []
    indexes.associationNeedsWithChecked = (this.data.associationNeedsOptions || []).map(opt => ({
      ...opt,
      checked: sel.indexOf(opt.value) >= 0
    }))
    
    this.setData({ pickerIndexes: indexes })
  },

  onBoardPositionChange(e) {
    const index = parseInt(e.detail.value)
    const value = this.data.boardPositionOptions[index].value
    this.setData({ 'step5.board_position': value })
    this.updatePickerIndexes()
  },

  onAssociationPositionTap(e) {
    const v = e.currentTarget.dataset.value
    const arr = [...(this.data.step5.association_positions || [])]
    const i = arr.indexOf(v)
    if (i >= 0) arr.splice(i, 1)
    else arr.push(v)
    this.setData({ 'step5.association_positions': arr })
    this.updatePickerIndexes()
  },

  onSupportTypeTap(e) {
    const v = e.currentTarget.dataset.value
    const arr = [...(this.data.step5.support_offerings || [])]
    const existing = arr.findIndex(s => (s && s.type ? s.type : s) === v)
    if (existing >= 0) arr.splice(existing, 1)
    else arr.push({ type: v, details: {} })
    this.setData({ 'step5.support_offerings': arr })
    this.updatePickerIndexes()
  },

  onAssociationNeedTap(e) {
    const v = e.currentTarget.dataset.value
    const d = { ...this.data.step5.association_needs_detail, selected: [...(this.data.step5.association_needs_detail && this.data.step5.association_needs_detail.selected) || []] }
    const i = d.selected.indexOf(v)
    if (i >= 0) d.selected.splice(i, 1)
    else d.selected.push(v)
    this.setData({ 'step5.association_needs_detail': d })
    this.updatePickerIndexes()
  },

  // 加载进度
  async loadProgress() {
    try {
      if (this.data.isInternalMode) {
        return
      }
      let url = '/api/card-entry/progress'
      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }
      
      const res = await request.get(url)
      if (res && res.current_step != null) {
        this.setData({
          progress: res,
          currentStep: res.current_step || 1
        })
      }
    } catch (e) {
      console.error('Load progress error:', e)
    }
  },

  // 更新进度（overrideTargetUserId：新增模式第一步保存后传入新建用户ID，因 setData 可能尚未生效）
  async updateProgress(nextStep, overrideTargetUserId) {
    try {
      if (this.data.isInternalMode) {
        this.setData({ currentStep: nextStep })
        return
      }
      const completedSteps = this.data.progress?.completed_steps || []
      if (!completedSteps.includes(this.data.currentStep)) {
        completedSteps.push(this.data.currentStep)
      }
      
      const body = {
        current_step: nextStep,
        completed_steps: completedSteps
      }
      
      let url = '/api/card-entry/progress'
      const targetUserId = overrideTargetUserId != null ? overrideTargetUserId : (this.data.targetUser && this.data.targetUser.id)
      if (this.data.isStaffMode && targetUserId) {
        url += `?target_user_id=${targetUserId}`
      }
      
      await request.put(url, body)
      this.setData({
        currentStep: nextStep,
        progress: {
          ...this.data.progress,
          current_step: nextStep,
          completed_steps: completedSteps
        }
      })
    } catch (e) {
      console.error('Update progress error:', e)
    }
  },

  // 保存当前步骤数据
  async saveCurrentStep() {
    const staffAddNewMode = this.data.staffAddNewMode
    const needTargetUser = this.data.isStaffMode && !staffAddNewMode
    if (needTargetUser && (!this.data.targetUser || !this.data.targetUser.id)) {
      wx.showToast({ title: '请先选择目标用户', icon: 'none' })
      return false
    }
    
    // 工作人员新增模式：第一步保存时显示确认提醒
    if (staffAddNewMode && this.data.currentStep === 1) {
      const name = (this.data.step1.name || '').trim()
      const company = (this.data.step1.company || '').trim()
      if (!name || !company) {
        wx.showToast({ title: '请填写真实姓名和公司名称', icon: 'none' })
        return false
      }
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '⚠️ 确认新增校友',
          content: `即将创建新校友「${name}」（${company}）。\n\n代填信息将被校友本人及他人看到，会显示「（校友会代填）」备注，系统会记录您的操作。\n\n请确认信息准确无误。`,
          confirmText: '确认新增',
          cancelText: '取消',
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
      if (!confirmed) return false
    }
    
    // 工作人员代填模式（非新增）：首次保存时显示确认提醒
    if (this.data.isStaffMode && !this.data.isInternalMode && !this.data.staffFillConfirmed && !staffAddNewMode) {
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '⚠️ 确认保存代填信息',
          content: `您即将保存为「${this.data.targetUser.name || this.data.targetUser.nickname}」代填的信息。\n\n⚠️ 重要提醒：\n1. 该校友本人将能看到您填写的信息\n2. 信息可能被其他校友看到（取决于隐私设置）\n3. 代填的字段会显示「（校友会代填）」备注\n4. 系统会记录您的操作记录（包括您的身份信息）\n\n请确认信息准确无误。`,
          confirmText: '确认保存',
          cancelText: '取消',
          success: (res) => {
            resolve(res.confirm)
          },
          fail: () => resolve(false)
        })
      })
      
      if (!confirmed) {
        return false
      }
      
      // 标记已确认，本次会话不再提示
      this.setData({ staffFillConfirmed: true })
    }
    
    wx.showLoading({ title: '保存中...' })
    try {
      const stepData = this.data[`step${this.data.currentStep}`]
      let dataToSave = {}
      
      if (this.data.currentStep === 1) {
        const s1 = { ...stepData }
        const locations = (s1.locations || []).map(loc => {
          const { _typeIndex, _typeLabel, _visibilityIndex, _visibilityLabel, ...rest } = loc
          return { ...rest, location_visibility: loc.location_visibility || 'public' }
        })
        dataToSave = {
          name: s1.name,
          nickname: s1.nickname,
          avatar: s1.avatar,
          gender: s1.gender,
          wechat_id: s1.wechat_id,
          selected_avatar: s1.selected_avatar,
          personal_photos: Array.isArray(s1.personal_photos) ? s1.personal_photos : [],
          birth_place: s1.birth_place,
          title: s1.title,
          company: s1.company,
          phone: s1.phone,
          email: s1.email,
          bio: s1.bio,
          field_visibility: s1.field_visibility || {},
          locations
        }
        ;['name','nickname','birth_place','title','company','phone','email','bio','wechat_id','selected_avatar'].forEach(k => {
          if (dataToSave[k] === '') delete dataToSave[k]
        })
      } else if (this.data.currentStep === 2) {
        // 步骤2特殊处理：清理年份字段（空字符串转null，字符串数字转整数）
        dataToSave = { ...stepData }
        const yearFields = [
          'primary_graduation_year', 'middle_graduation_year', 'high_graduation_year',
          'bachelor_graduation_year', 'master_graduation_year', 'doctor_graduation_year'
        ]
        yearFields.forEach(field => {
          if (dataToSave[field] === '' || dataToSave[field] === null || dataToSave[field] === undefined) {
            delete dataToSave[field]
          } else if (typeof dataToSave[field] === 'string') {
            const num = parseInt(dataToSave[field])
            dataToSave[field] = isNaN(num) ? null : num
          }
        })
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === '' && key !== 'field_visibility') {
            delete dataToSave[key]
          }
        })
        if (!dataToSave.field_visibility) dataToSave.field_visibility = {}
      } else if (this.data.currentStep === 3) {
        dataToSave = { ...stepData }
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === '' && key !== 'field_visibility') {
            delete dataToSave[key]
          }
        })
        if (!dataToSave.field_visibility) dataToSave.field_visibility = {}
      } else if (this.data.currentStep === 4) {
        // 步骤4：资源分享
        const ress = (stepData.resources || []).map(r => {
          const { _typeIndex, _typeLabel, _modeIndex, _modeLabel, ...rest } = r
          return { ...rest, field_visibility: r.field_visibility || {} }
        })
        dataToSave = { resources: ress, field_visibility: stepData.field_visibility || {} }
      } else if (this.data.currentStep === 5) {
        dataToSave = {
          willing_to_serve: stepData.willing_to_serve || false,
          contribution_types: stepData.contribution_types || '',
          contribution_description: stepData.contribution_description || '',
          desired_position: stepData.desired_position || '',
          position_preferences: stepData.position_preferences || '',
          association_needs: stepData.association_needs || '',
          board_position: stepData.board_position || '',
          association_positions: Array.isArray(stepData.association_positions) ? stepData.association_positions : [],
          support_offerings: Array.isArray(stepData.support_offerings) ? stepData.support_offerings : [],
          association_needs_detail: stepData.association_needs_detail && typeof stepData.association_needs_detail === 'object' ? stepData.association_needs_detail : { selected: [], other: '' },
          field_visibility: stepData.field_visibility || {}
        }
        Object.keys(dataToSave).forEach(k => {
          if (dataToSave[k] === '' && k !== 'field_visibility') delete dataToSave[k]
        })
      } else if (this.data.currentStep === 6) {
        dataToSave = { hidden_info: stepData.hidden_info || {}, field_visibility: stepData.field_visibility || {} }
      } else {
        dataToSave = stepData
        // 清理空字符串字段
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === '') {
            delete dataToSave[key]
          }
        })
      }
      
      const isInternalMode = this.data.isInternalMode
      const base = isInternalMode ? '/api/card-entry/internal' : '/api/card-entry'
      let url = `${base}/save-step/${this.data.currentStep}`
      if (this.data.isStaffMode && this.data.targetUser && this.data.targetUser.id) {
        url += `?target_user_id=${this.data.targetUser.id}`
      }
      if (staffAddNewMode && this.data.currentStep === 1) {
        dataToSave.create_new = true
      }
      
      const res = await request.post(url, dataToSave)
      // 新增模式第一步保存成功后，后端返回 user_id，设置为目标用户继续后续步骤
      if (staffAddNewMode && this.data.currentStep === 1 && res && res.user_id != null) {
        this.setData({
          targetUser: { id: res.user_id, name: this.data.step1.name, nickname: this.data.step1.nickname, company: this.data.step1.company, title: this.data.step1.title },
          staffAddNewMode: false
        })
      }
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      return { ok: true, newTargetUserId: (staffAddNewMode && this.data.currentStep === 1 && res && res.user_id != null) ? res.user_id : undefined }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      console.error('Save step error:', e)
      return false
    }
  },

  // 下一步
  async nextStep() {
    const result = await this.saveCurrentStep()
    if (!result) return
    const ok = typeof result === 'object' ? result.ok : result
    const newTargetUserId = typeof result === 'object' ? result.newTargetUserId : undefined
    if (!ok) return
    
    if (this.data.currentStep < this.data.totalSteps) {
      await this.updateProgress(this.data.currentStep + 1, newTargetUserId)
    } else {
      // 完成所有步骤
      wx.showModal({
        title: '完成',
        content: '恭喜！您已完成所有信息填写',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  // 上一步
  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({
        currentStep: this.data.currentStep - 1
      })
      this.updateProgress(this.data.currentStep - 1)
    }
  },

  // 跳转到指定步骤
  goToStep(e) {
    const step = e.currentTarget.dataset.step
    if (step >= 1 && step <= this.data.totalSteps) {
      this.setData({ currentStep: step })
      this.updateProgress(step)
    }
  },

  // 输入框变化
  onInputChange(e) {
    const { step, field } = e.currentTarget.dataset
    const value = e.detail.value
    
    if (step == 6 && field.startsWith('hidden_info.')) {
      const subField = field.replace('hidden_info.', '')
      const hiddenInfo = { ...this.data.step6.hidden_info }
      hiddenInfo[subField] = value
      this.setData({ 'step6.hidden_info': hiddenInfo })
    } else if (step == 5 && (field || '').startsWith('association_needs_detail.')) {
      const sub = field.replace('association_needs_detail.', '')
      const d = { ...this.data.step5.association_needs_detail }
      d[sub] = value
      this.setData({ 'step5.association_needs_detail': d })
    } else {
      this.setData({
        [`step${step}.${field}`]: value
      })
    }
  },

  // 开关变化
  onSwitchChange(e) {
    const { step, field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`step${step}.${field}`]: value
    })
  },

  // 选择器变化
  onPickerChange(e) {
    const { step, field, options } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    
    if (step == 2 && field == 'highest_degree') {
      // 步骤2：学历选择
      const value = this.data.degreeOptions[index]
      this.setData({
        'step2.highest_degree': value
      })
      this.updatePickerIndexes()
    } else if (options) {
      // 其他选择器：从options数组中取值
      const optionArray = this.data[options]
      const value = optionArray[index]?.value || optionArray[index]
      this.setData({
        [`step${step}.${field}`]: value
      })
      this.updatePickerIndexes()
    } else {
      // 默认：直接使用索引或值
      this.setData({
        [`step${step}.${field}`]: index
      })
    }
  },

  // 添加位置
  addLocation() {
    const locations = [...this.data.step1.locations]
    locations.push({
      location_type: 'residence',
      address: '',
      latitude: null,
      longitude: null,
      visible_range: 'friends',
      location_visibility: 'public',
      _typeIndex: 0,
      _typeLabel: '居住地',
      _visibilityIndex: 0,
      _visibilityLabel: '公开'
    })
    this.setData({ 'step1.locations': locations })
  },

  // 删除位置
  removeLocation(e) {
    const index = e.currentTarget.dataset.index
    const locations = [...this.data.step1.locations]
    locations.splice(index, 1)
    this.setData({ 'step1.locations': locations })
  },

  // 添加资源
  addResource() {
    const resources = [...this.data.step4.resources]
    resources.push({
      resource_type: 'experience',
      resource_title: '',
      resource_description: '',
      sharing_mode: 'free',
      field_visibility: {},
      _typeIndex: 0,
      _typeLabel: '经验分享',
      _modeIndex: 0,
      _modeLabel: '免费分享'
    })
    this.setData({ 'step4.resources': resources })
  },

  // 删除资源
  removeResource(e) {
    const index = e.currentTarget.dataset.index
    const resources = [...this.data.step4.resources]
    resources.splice(index, 1)
    this.setData({ 'step4.resources': resources })
  },

  // 位置输入变化（带智能提示）
  onLocationInputChange(e) {
    const { locIndex, field } = e.currentTarget.dataset
    const value = e.detail.value
    const locations = [...this.data.step1.locations]
    locations[locIndex][field] = value
    this.setData({ 'step1.locations': locations })
    
    // 如果是地址字段，触发智能提示
    if (field === 'address' && value && value.trim().length > 0) {
      this.searchAddressSuggestions(locIndex, value.trim())
    } else if (field === 'address' && (!value || value.trim().length === 0)) {
      // 清空时隐藏建议列表
      this.setData({
        [`showAddressSuggestions.${locIndex}`]: false,
        [`addressSuggestions.${locIndex}`]: []
      })
    }
  },
  
  // 搜索地址建议（防抖处理）
  searchAddressSuggestions(locIndex, keyword) {
    const _this = this
    
    // 清除之前的定时器
    if (this.data.addressSuggestionTimers[locIndex]) {
      clearTimeout(this.data.addressSuggestionTimers[locIndex])
    }
    
    // 设置防抖：300ms后执行
    const timer = setTimeout(() => {
      // 检查SDK是否可用
      if (!_this.data.qqmapsdk) {
        console.warn('腾讯地图SDK未初始化，地址智能提示功能不可用')
        return
      }
      
      // 检查getSuggestion方法是否存在
      if (typeof _this.data.qqmapsdk.getSuggestion !== 'function') {
        console.warn('腾讯地图SDK的getSuggestion方法不可用')
        return
      }
      
      try {
        // 调用腾讯地图关键词输入提示接口
        _this.data.qqmapsdk.getSuggestion({
        keyword: keyword,
        region: '深圳市', // 限制在深圳市范围内，可根据需要调整
        policy: 1, // 策略1：适合收货地址/上门服务，优先显示小区、楼宇、学校等
        page_size: 10, // 最多返回10条建议
        success: function(res) {
          if (res.status === 0 && res.data && res.data.length > 0) {
            // 处理建议数据
            const suggestions = res.data.map(item => ({
              title: item.title,
              address: item.address,
              fullAddress: `${item.title} ${item.address}`.trim(), // 完整地址
              latitude: item.location ? item.location.lat : null,
              longitude: item.location ? item.location.lng : null,
              city: item.city || '',
              district: item.district || ''
            }))
            
            _this.setData({
              [`addressSuggestions.${locIndex}`]: suggestions,
              [`showAddressSuggestions.${locIndex}`]: true
            })
          } else {
            // 无结果
            _this.setData({
              [`addressSuggestions.${locIndex}`]: [],
              [`showAddressSuggestions.${locIndex}`]: false
            })
          }
        },
        fail: function(err) {
          console.error('地址建议查询失败:', err)
          _this.setData({
            [`addressSuggestions.${locIndex}`]: [],
            [`showAddressSuggestions.${locIndex}`]: false
          })
        }
      })
      } catch (error) {
        console.error('调用地址建议接口异常:', error)
        _this.setData({
          [`addressSuggestions.${locIndex}`]: [],
          [`showAddressSuggestions.${locIndex}`]: false
        })
      }
    }, 300)
    
    // 保存定时器ID
    const timers = { ...this.data.addressSuggestionTimers }
    timers[locIndex] = timer
    this.setData({ addressSuggestionTimers: timers })
  },
  
  // 选择地址建议
  onSelectAddressSuggestion(e) {
    const { locIndex, index } = e.currentTarget.dataset
    const suggestions = this.data.addressSuggestions[locIndex] || []
    
    if (suggestions[index]) {
      const selected = suggestions[index]
      const locations = [...this.data.step1.locations]
      
      // 回填完整地址
      locations[locIndex].address = selected.fullAddress || selected.address
      
      // 如果有坐标，也一并保存（可选优化：保存时就不需要再地理编码了）
      if (selected.latitude && selected.longitude) {
        locations[locIndex].latitude = selected.latitude
        locations[locIndex].longitude = selected.longitude
      }
      
      this.setData({
        'step1.locations': locations,
        [`showAddressSuggestions.${locIndex}`]: false,
        [`addressSuggestions.${locIndex}`]: []
      })
    }
  },
  
  // 位置输入框获得焦点
  onLocationInputFocus(e) {
    const { locIndex } = e.currentTarget.dataset
    const value = e.detail.value
    // 如果有输入内容，显示建议
    if (value && value.trim().length > 0) {
      this.searchAddressSuggestions(locIndex, value.trim())
    }
  },
  
  // 位置输入框失去焦点（延迟隐藏，让用户有时间点击建议项）
  onLocationInputBlur(e) {
    const { locIndex } = e.currentTarget.dataset
    // 延迟200ms隐藏，确保点击建议项的事件能触发
    setTimeout(() => {
      this.hideAddressSuggestions(locIndex)
    }, 200)
  },
  
  // 隐藏地址建议列表（点击其他地方时）
  hideAddressSuggestions(locIndex) {
    this.setData({
      [`showAddressSuggestions.${locIndex}`]: false
    })
  },

  // 位置类型变化
  onLocationTypeChange(e) {
    const { locIndex } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    const value = this.data.locationTypeOptions[index].value
    const label = this.data.locationTypeOptions[index].label
    const locations = [...this.data.step1.locations]
    locations[locIndex].location_type = value
    locations[locIndex]._typeIndex = index
    locations[locIndex]._typeLabel = label
    this.setData({ 'step1.locations': locations })
  },

  // 位置可见性变化
  onLocationVisibilityChange(e) {
    const { locIndex } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    const value = this.data.locationVisibilityOptions[index].value
    const label = this.data.locationVisibilityOptions[index].label
    const locations = [...this.data.step1.locations]
    locations[locIndex].location_visibility = value
    locations[locIndex]._visibilityIndex = index
    locations[locIndex]._visibilityLabel = label
    this.setData({ 'step1.locations': locations })
  },

  onGenderChange(e) {
    const index = parseInt(e.detail.value)
    const value = this.data.genderOptions[index].value
    const label = this.data.genderOptions[index].label
    this.setData({
      'step1.gender': value,
      'step1._genderIndex': index,
      'step1._genderLabel': label
    }, () => this.updateFilteredAvatarOptions(value))
  },

  /** 按性别过滤头像选项：男→仅男头像，女→仅女头像，未选/其他→全部；若当前选中不在过滤结果内则重置为「使用微信头像」。支持 gender 为 'male'/'男' 或 'female'/'女'。可传入 overrideGender 避免 setData 回调中读到旧值。 */
  updateFilteredAvatarOptions(overrideGender) {
    const raw = overrideGender !== undefined && overrideGender !== null ? String(overrideGender).trim() : ((this.data.step1 && this.data.step1.gender) != null ? String(this.data.step1.gender).trim() : '')
    const gender = raw
    const isMale = gender === 'male' || gender === '男'
    const isFemale = gender === 'female' || gender === '女'
    const all = this.data.selectedAvatarOptions || []
    let filtered = all
    if (isMale) {
      filtered = all.filter(o => !o.value || o.value.indexOf('/avatars/male-') !== -1)
    } else if (isFemale) {
      filtered = all.filter(o => !o.value || o.value.indexOf('female-') !== -1)
    }
    const current = (this.data.step1 && this.data.step1.selected_avatar) || ''
    const inList = filtered.some(o => o.value === current)
    const updates = { filteredAvatarOptions: filtered }
    if (!inList && current !== '') {
      const idx = this.data.selectedAvatarOptions.findIndex(o => o.value === '')
      updates['step1.selected_avatar'] = ''
      updates['step1._selectedAvatarIndex'] = idx >= 0 ? idx : 0
      updates['step1._selectedAvatarLabel'] = '使用微信头像'
    }
    this.setData(updates)
  },

  /** 图像列表中点击某一头像时选中 */
  onAvatarImageTap(e) {
    const value = e.currentTarget.dataset.value
    const label = e.currentTarget.dataset.label || ''
    const idx = this.data.selectedAvatarOptions.findIndex(o => o.value === value)
    this.setData({
      'step1.selected_avatar': value,
      'step1._selectedAvatarIndex': idx >= 0 ? idx : 0,
      'step1._selectedAvatarLabel': label
    })
  },

  onSelectedAvatarChange(e) {
    const index = parseInt(e.detail.value)
    const value = this.data.selectedAvatarOptions[index].value
    const label = this.data.selectedAvatarOptions[index].label
    this.setData({
      'step1.selected_avatar': value,
      'step1._selectedAvatarIndex': index,
      'step1._selectedAvatarLabel': label
    })
  },

  async addPersonalPhoto() {
    try {
      const res = await wx.chooseMedia({ count: 9 - (this.data.step1.personal_photos || []).length, mediaType: ['image'] })
      if (!res.tempFiles || !res.tempFiles.length) return
      const request = require('../../utils/request.js')
      for (const file of res.tempFiles) {
        wx.showLoading({ title: '上传中...' })
        const uploadRes = await new Promise((resolve, reject) => {
          wx.uploadFile({
            url: (getApp().globalData.apiBase || 'https://www.pengyoo.com') + '/api/upload/photo',
            filePath: file.tempFilePath,
            name: 'file',
            header: { Authorization: 'Bearer ' + (wx.getStorageSync('token') || '') },
            success: (r) => {
              try {
                const data = JSON.parse(r.data)
                resolve(data)
              } catch (e) {
                reject(e)
              }
            },
            fail: reject
          })
        })
        wx.hideLoading()
        if (uploadRes && uploadRes.success && uploadRes.url) {
          const photos = [...(this.data.step1.personal_photos || []), uploadRes.url]
          this.setData({ 'step1.personal_photos': photos })
        }
      }
    } catch (e) {
      wx.hideLoading()
      console.error('addPersonalPhoto error', e)
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  removePersonalPhoto(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const photos = [...(this.data.step1.personal_photos || [])]
    photos.splice(index, 1)
    this.setData({ 'step1.personal_photos': photos })
  },

  // 字段可见性变化
  onFieldVisibilityChange(e) {
    const { field } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    const value = this.data.fieldVisibilityOptions[index].value
    const step = parseInt(e.currentTarget.dataset.step)
    const key = `step${step}.field_visibility`
    const vis = this.data[`step${step}`].field_visibility || {}
    // 处理嵌套字段（如 hidden_info.description）
    if (field.includes('.')) {
      const parts = field.split('.')
      const mainField = parts[0] + '_' + parts[1] // hidden_info_description
      vis[mainField] = value
    } else {
      vis[field] = value
    }
    this.setData({ [key]: vis })
  },

  // 资源字段可见性变化
  onResourceFieldVisibilityChange(e) {
    const { resIndex, field } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    const value = this.data.fieldVisibilityOptions[index].value
    const resources = [...this.data.step4.resources]
    if (!resources[resIndex].field_visibility) {
      resources[resIndex].field_visibility = {}
    }
    resources[resIndex].field_visibility[field] = value
    this.setData({ 'step4.resources': resources })
  },

  // 资源输入变化
  onResourceInputChange(e) {
    const { resIndex, field } = e.currentTarget.dataset
    const value = e.detail.value
    const resources = [...this.data.step4.resources]
    resources[resIndex][field] = value
    this.setData({ 'step4.resources': resources })
  },

  // 资源类型/分享方式变化
  onResourceTypeChange(e) {
    const { resIndex, field } = e.currentTarget.dataset
    const index = parseInt(e.detail.value)
    const options = field === 'resource_type' 
      ? this.data.resourceTypeOptions 
      : this.data.sharingModeOptions
    const value = options[index].value
    const label = options[index].label
    const resources = [...this.data.step4.resources]
    resources[resIndex][field] = value
    if (field === 'resource_type') {
      resources[resIndex]._typeIndex = index
      resources[resIndex]._typeLabel = label
    } else {
      resources[resIndex]._modeIndex = index
      resources[resIndex]._modeLabel = label
    }
    this.setData({ 'step4.resources': resources })
  },

  // 跳转到语音录入
  goToVoiceInput() {
    wx.navigateTo({
      url: `/pages/voice-input/voice-input?source=card_entry&step=${this.data.currentStep}`
    })
  },

  // ========== 工作人员模式 ==========
  
  // 切换工作人员模式
  toggleStaffMode() {
    const isStaffMode = !this.data.isStaffMode
    
    // 如果要切换到工作人员模式，需要先验证工号
    if (isStaffMode && !this.data.staffIdVerified) {
      this.showStaffIdInput()
      return
    }
    
    this.setData({ 
      isStaffMode,
      isInternalMode: isStaffMode ? this.data.isInternalMode : false, // 关闭工作人员模式时，也关闭内部模式
      targetUser: isStaffMode ? null : null,
      searchKeyword: '',
      searchResults: [],
      showUserSearch: false,
      staffFillConfirmed: false  // 切换模式时重置确认状态
    }, () => {
      // 更新页面标题
      if (!isStaffMode) {
        wx.setNavigationBarTitle({ title: '我的校友圈卡片' })
      } else if (this.data.isInternalMode) {
        wx.setNavigationBarTitle({ title: '内部评价' })
      }
    })
    
    if (isStaffMode) {
      // 切换到工作人员模式，显示用户搜索
      this.setData({ showUserSearch: true })
    } else {
      // 切换回普通模式，重新加载自己的数据
      this.loadAllData()
      this.loadProgress()
    }
  },

  // 显示工号输入框
  showStaffIdInput() {
    wx.showModal({
      title: '工作人员验证',
      editable: true,
      placeholderText: '请输入工号',
      success: (res) => {
        if (res.confirm && res.content) {
          const staffId = res.content.trim()
          if (staffId === '362100') {
            // 验证通过
            wx.setStorageSync('staff_id_verified', '362100')
            this.setData({ 
              staffIdVerified: true,
              isStaffMode: true,
              showUserSearch: true
            })
            wx.showToast({
              title: '验证通过',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '工号错误',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 搜索用户
  async searchUsers() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword || keyword.length < 1) {
      this.setData({ searchResults: [] })
      return
    }

    try {
      const res = await request.get(`/api/users/search?keyword=${encodeURIComponent(keyword)}`)
      if (res && res.success && res.users) {
        this.setData({ searchResults: res.users })
      }
    } catch (e) {
      console.error('Search users error:', e)
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  },

  // 搜索输入变化
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.searchUsers()
    }, 300)
  },

  // 选择目标用户
  selectTargetUser(e) {
    console.log('selectTargetUser 被调用', e)
    const dataset = e.currentTarget.dataset || {}
    console.log('dataset:', dataset)
    
    // 小程序会将 data-user-id 转换为 userId（驼峰命名）
    const userId = parseInt(dataset.userId)
    if (!userId || isNaN(userId)) {
      console.error('选择用户失败：缺少用户ID', dataset)
      wx.showToast({ title: '选择失败，请重试', icon: 'none' })
      return
    }
    
    // 从 dataset 中重建 user 对象
    const user = {
      id: userId,
      name: dataset.userName || '',
      nickname: dataset.userNickname || '',
      company: dataset.userCompany || '',
      title: dataset.userTitle || ''
    }
    
    console.log('重建的 user 对象:', user)
    
    // 如果已验证工号但未切换到工作人员模式，先切换
    const verifiedStaffId = wx.getStorageSync('staff_id_verified')
    const shouldBeStaffMode = verifiedStaffId === '362100' || this.data.isInternalMode
    const currentIsStaffMode = this.data.isStaffMode
    
    if (shouldBeStaffMode && !currentIsStaffMode) {
      console.log('自动切换到工作人员模式')
      this.setData({ isStaffMode: true, staffIdVerified: true }, () => {
        // 在回调中继续处理
        this.handleSelectTargetUser(user, true)
      })
    } else {
      this.handleSelectTargetUser(user, currentIsStaffMode)
    }
  },

  // 处理选择目标用户的后续逻辑
  handleSelectTargetUser(user, isStaffMode) {
    // 先立即切换并加载目标用户数据，再作提醒（避免 modal 阻塞或游客模式模拟导致不切换）
    this.setTargetUserAndLoad(user)
    
    if (isStaffMode && !this.data.isInternalMode) {
      wx.showModal({
        title: '⚠️ 代填信息提醒',
        content: `您正在为「${user.name || user.nickname}」代填信息。\n\n代填内容将被该校友本人及他人看到，会显示「（校友会代填）」备注，系统会记录您的操作。请确保信息准确。`,
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  // 设置目标用户并加载数据
  setTargetUserAndLoad(user) {
    console.log('setTargetUserAndLoad 被调用，user:', user, '当前 isStaffMode:', this.data.isStaffMode)
    const shouldBeStaffMode = this.data.isInternalMode || (this.data.staffIdVerified && !this.data.isStaffMode)
    const inInternal = !!this.data.isInternalMode
    const payload = {
      targetUser: user,
      showUserSearch: false,
      searchKeyword: '',
      searchResults: [],
      staffFillConfirmed: false,
      staffAddNewMode: false,
      isStaffMode: shouldBeStaffMode ? true : this.data.isStaffMode
    }
    // 填写评价下换人时先清空右侧“工作人员填写”展示，避免残留上一人的代填数据
    if (inInternal) {
      payload.step1 = {
        name: '', nickname: '', birth_place: '', title: '', company: '', phone: '', email: '', bio: '',
        field_visibility: {}, field_source: {}, _original: {}, locations: []
      }
    }
    this.setData(payload, () => {
      console.log('setData 回调执行，targetUser:', this.data.targetUser, 'isStaffMode:', this.data.isStaffMode)
      this.loadAllData(user, inInternal ? true : undefined)
      this.loadProgress()
      this.updatePickerIndexes()
    })
  },

  // 清除目标用户
  clearTargetUser() {
    this.setData({
      targetUser: null,
      showUserSearch: true,
      staffFillConfirmed: false,
      staffAddNewMode: false
    })
  },

  // 工作人员新增校友：进入空白填写模式
  onStaffAddNew() {
    this.setData({
      targetUser: null,
      showUserSearch: false,
      staffAddNewMode: true,
      staffFillConfirmed: false,
      searchKeyword: '',
      searchResults: [],
      currentStep: 1,
      step1: {
        name: '',
        nickname: '',
        avatar: '',
        gender: '',
        wechat_id: '',
        selected_avatar: '',
        personal_photos: [],
        birth_place: '',
        title: '',
        company: '',
        phone: '',
        email: '',
        bio: '',
        field_visibility: {},
        locations: []
      },
      step2: { ...EMPTY_STEP2 },
      step3: { ...EMPTY_STEP3 },
      step4: { ...EMPTY_STEP4 },
      step5: { ...EMPTY_STEP5 },
      step6: { ...EMPTY_STEP6 }
    })
    wx.showToast({ title: '请在下方填写新校友信息', icon: 'none', duration: 2000 })
  },

  // 取消新增模式
  cancelStaffAddNew() {
    this.setData({
      staffAddNewMode: false,
      showUserSearch: true
    })
  },

  // 切换到代填信息模式（场景一、二）
  switchToFillMode() {
    if (this.data.isInternalMode) {
      this.setData({ isInternalMode: false }, () => {
        wx.setNavigationBarTitle({ title: '我的校友圈卡片' })
        // 如果已选择目标用户，重新加载数据
        if (this.data.targetUser && this.data.targetUser.id) {
          this.loadAllData()
        }
      })
    }
  },

  // 切换到填写评价模式（场景三）
  switchToInternalMode() {
    if (!this.data.isInternalMode) {
      const prev = this.data.step1 || {}
      // 切到填写评价时立即清空右侧“工作人员填写”展示，避免残留代填数据；左侧 _original 保留
      const clearedStep1 = {
        name: '', nickname: '', birth_place: '', title: '', company: '', phone: '', email: '', bio: '',
        field_visibility: {}, field_source: {},
        _original: prev._original || {},
        locations: []
      }
      this.setData({ isInternalMode: true, step1: clearedStep1 }, () => {
        wx.setNavigationBarTitle({ title: '内部评价' })
        if (this.data.targetUser && this.data.targetUser.id) {
          this.loadAllData(this.data.targetUser, true)
        }
      })
    }
  }
})
