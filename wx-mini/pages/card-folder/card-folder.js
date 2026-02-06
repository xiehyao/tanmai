// pages/card-folder/card-folder.js - 我的名片夹
const AVATAR_BASE = 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/'

function mockCards() {
  return [
    { id: 1, name: '于涛', avatar: AVATAR_BASE + 'male-young-1.png', company: '安捷伦科技(中国)有限公司 总经理', phone: '+86 139 3366 8899', email: 'yutao@Gmail.com', address: '广东省深圳市南山区全新科技园11A-2502', time: '12:21' },
    { id: 2, name: '曾蓉', avatar: AVATAR_BASE + 'female-young.png', company: '腾讯科技(新加坡) 产品总监', phone: '+86 139 3366 8899', email: 'zengrong@qq.com', address: '广东省深圳市南山区...', time: '12:20' },
    { id: 3, name: '陈昊', avatar: AVATAR_BASE + 'male-young-2.jpeg', company: '鹏城实验室无线部 研究员', phone: '+86 139 3366 8899', email: 'chenhao@example.com', address: '广东省深圳市南山区...', time: '12:19' },
    { id: 4, name: '焦剑飞', avatar: AVATAR_BASE + 'female-young-10.jpeg', company: '腾讯科技(深圳)有限公司 渠道总监', phone: '+86 136 8866 3322', email: 'jiaojf@qq.com', address: '广东省深圳市南山区...', time: '12:18' },
    { id: 5, name: '王荣', avatar: AVATAR_BASE + 'male-middle.png', company: '深圳移动市场营销部 副总经理', phone: '+86 139 3366 8899', email: 'wangr@example.com', address: '广东省深圳市...', time: '12:17' },
    { id: 6, name: '李宇飞', avatar: AVATAR_BASE + 'male-young-3.jpeg', company: '商汤科技 产品总监', phone: '+86 138 0000 1234', email: 'liyf@example.com', address: '北京市海淀区...', time: '12:16' },
    { id: 7, name: '谢怀遥', avatar: AVATAR_BASE + 'male-young-4.jpeg', company: '腾讯集团金融消保部副总经理&产品专家 \n北邮深港澳校友会执行秘书长 \n北邮新加坡校友会副秘书长', phone: '+86 138 0000 1234', email: 'hyman@example.com', address: '深圳市南山区锦隆花园锦虹阁B801', time: '12:15' }
  ]
}

Page({
  data: {
    tabs: [
      { key: 'card', label: '卡片', count: 16 },
      { key: 'text', label: '文字速览', count: 16 }
    ],
    activeTab: 'card',
    cards: [],
    searchKeyword: ''
  },

  onLoad() {
    this.setData({ cards: mockCards() })
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (key && key !== this.data.activeTab) this.setData({ activeTab: key })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onExchangeTap(e) {
    wx.showToast({ title: '交换名片功能开发中', icon: 'none' })
  }
})
