/**
 * 腾讯位置服务 微信小程序 JavaScript SDK 占位
 * 下载官方SDK后替换此文件：https://mapapi.qq.com/web/miniprogram/JSSDK/qqmap-wx-jssdk1.2.zip
 */
module.exports = class QQMapWX {
  constructor(options) {
    this.key = (options && options.key) || ''
  }
  
  getSuggestion(options) {
    if (options && typeof options.fail === 'function') {
      setTimeout(() => {
        try {
          options.fail({ status: -1, message: 'SDK未安装，请下载腾讯位置服务SDK' })
        } catch (e) {}
      }, 0)
    }
  }
  
  geocoder() {
    if (arguments[0] && typeof arguments[0].fail === 'function') {
      setTimeout(() => { try { arguments[0].fail({ message: 'SDK未安装' }) } catch (e) {} }, 0)
    }
  }
  
  reverseGeocoder() {
    if (arguments[0] && typeof arguments[0].fail === 'function') {
      setTimeout(() => { try { arguments[0].fail({ message: 'SDK未安装' }) } catch (e) {} }, 0)
    }
  }
}
