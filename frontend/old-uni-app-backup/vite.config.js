// HBuilderX 专用配置 - 最小化配置
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 注意：HBuilderX 会自动处理大部分配置
// 这里只提供最基本的插件配置
export default defineConfig({
  plugins: [uni()]
})
