import { createApp } from 'vue'
import ElementPlus, { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import '@/styles/index.css'  // 引入全局公共样式
import { loadRuntimeConfig } from '@/api/runtime'
import { setUseMock } from '@/api'
import { setApiBase } from '@/api/request'

// 启动前先拉取运行时配置（Cloudflare Pages /config），
// 用于在 CF 后台切换「本地 Mock / 真实 API」及修改 API 地址，无需重新构建。
// 本地开发拉取失败时自动回退到默认（本地 Mock + /api）。
async function bootstrap() {
  const cfg = await loadRuntimeConfig()
  setUseMock(cfg.useMock)
  setApiBase(cfg.apiBase)

  const app = createApp(App)
  for (const [k, v] of Object.entries(ElementPlusIconsVue)) app.component(k, v)

  // 全局错误边界：渲染期异常不再直接白屏，至少给出可理解的提示
  app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue Error]', err, info)
    ElMessage.error('页面发生错误，请刷新重试')
  }

  app.use(ElementPlus, { locale: zhCn }).use(router).mount('#app')
}

bootstrap()