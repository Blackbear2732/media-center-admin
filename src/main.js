import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import '@/styles/index.css'  // 引入全局公共样式
const app = createApp(App)
for (const [k, v] of Object.entries(ElementPlusIconsVue)) app.component(k, v)
app.use(ElementPlus, { locale: zhCn }).use(router).mount('#app')