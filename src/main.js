import { createApp } from 'vue'
import { ElMessage } from 'element-plus'
import App from './App.vue'
import router from './router'
import '@/styles/index.css'

// 数据来源（真实后端 / 本地 Mock）由构建时 VITE_USE_MOCK 环境变量决定
import { setUseMock } from '@/api'
setUseMock(import.meta.env.VITE_USE_MOCK !== 'false')

const app = createApp(App)

// 全局错误边界：渲染期异常不再直接白屏，至少给出可理解的提示
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
  ElMessage.error('页面发生错误，请刷新重试')
}

app.use(router).mount('#app')
