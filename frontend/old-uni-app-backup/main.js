import { createSSRApp } from 'vue'
import App from './App.vue'
import store from './store'
import uView from 'uview-ui'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(uView)
  return {
    app
  }
}

