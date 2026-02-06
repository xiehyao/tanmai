// pages/contacts/contacts.js - 通讯录
const AVATAR_BASE = 'https://tanmai-1318644773.cos.ap-guangzhou.myqcloud.com/avatars/'

function mockCardsByTab() {
  const birthday = [
    { id: 1, name: '陈昊', avatar: AVATAR_BASE + 'male-young-1.png', school: '北邮00级电院通信工程 04级移动通信工程', work: '现在鹏城实验室做研究工作,常驻深圳', hobby: '喜欢踢球和各类运动,欢迎大家约起~', phone: '139 3366 8899', action: '发送贺卡' },
    { id: 2, name: '张心怡', avatar: AVATAR_BASE + 'female-young.png', school: '北邮10级管理 清华14级管理', work: '现在腾讯从事商业分析', hobby: '喜欢读书旅游,欢迎交朋友', phone: '136 8866 3322', action: '发送贺卡' },
    { id: 5, name: '曾蓉', avatar: AVATAR_BASE + 'female-young-222.png', school: '北邮02级电子工程', work: '现在腾讯新加坡担任产品总监', hobby: '喜欢读书运动遛娃,欢迎一起', phone: '136 8866 3322', action: '发送贺卡' }
  ]
  const nearby = [
    { id: 3, name: '王荣', avatar: AVATAR_BASE + 'male-young-2.jpeg', school: '北邮00级电院通信工程 04级移动通信工程', work: '现在深圳移动市场部', hobby: '喜欢羽毛球,欢迎大家约起~', phone: '139 3366 8899', action: '打个招呼' },
    { id: 0, type: 'map', title: '在地图上找校友', action: '查看地图' }
  ]
  const buddy = [
    { id: 4, name: '李四', avatar: AVATAR_BASE + 'male-middle.png', school: '北邮08级计算机', work: '现在阿里做研发', hobby: '喜欢徒步', phone: '138 0000 1234', action: '搭子速配' }
  ]
  return { birthday, nearby, buddy }
}

Page({
  data: {
    tabs: [
      { key: 'birthday', label: '近期生日', count: 12 },
      { key: 'nearby', label: '附近可约', count: 9 },
      { key: 'buddy', label: '搭子速配', count: 3 }
    ],
    activeTab: 'birthday',
    cardsByTab: null,
    cards: [],
    searchKeyword: ''
  },

  onLoad() {
    const cardsByTab = mockCardsByTab()
    this.setData({ cardsByTab, cards: cardsByTab.birthday })
  },

  onTabTap(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeTab) return
    const cards = (this.data.cardsByTab && this.data.cardsByTab[key]) || []
    this.setData({ activeTab: key, cards })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onCardTap(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.type === 'map') {
      wx.switchTab({ url: '/pages/map/map' })
    }
  },

  goToCardFolder() {
    wx.navigateTo({ url: '/pages/card-folder/card-folder' })
  }
})
