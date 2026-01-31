import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    token: null,
    isLoggedIn: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      state.isLoggedIn = !!user
    },
    SET_TOKEN(state, token) {
      state.token = token
      if (token) {
        uni.setStorageSync('token', token)
      } else {
        uni.removeStorageSync('token')
      }
    },
    LOGOUT(state) {
      state.user = null
      state.token = null
      state.isLoggedIn = false
      uni.removeStorageSync('token')
    }
  },
  actions: {
    async login({ commit }, { code }) {
      // 调用登录API
      try {
        const res = await uni.request({
          url: `${getApp().globalData.apiBase}/api/auth/login`,
          method: 'POST',
          data: { code }
        })
        if (res.data.success) {
          commit('SET_TOKEN', res.data.token)
          commit('SET_USER', res.data.user)
          return res.data
        }
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    async logout({ commit }) {
      commit('LOGOUT')
    }
  },
  getters: {
    isLoggedIn: state => state.isLoggedIn,
    user: state => state.user
  }
})

