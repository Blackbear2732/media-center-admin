import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import https from 'node:https'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))
const mockPath = fileURLToPath(new URL('./src/api/mock.js', import.meta.url))
const mockStubPath = fileURLToPath(new URL('./src/api/mock.stub.js', import.meta.url))

// Element Plus 整体打成一个 chunk：
// 曾尝试按组件目录拆分（拆分后首页只需下载用到的组件），但 Element Plus 内部
// 组件与 core 之间存在交叉引用，拆分必然产生 Circular chunk 告警与潜在的初始化顺序问题，
// 因此保持整包；配合 _headers 里 assets 的 1 年 immutable 强缓存，二次访问零成本。

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const useMock = env.VITE_USE_MOCK !== 'false'
    const isProd = mode === 'production' || mode === 'api'

    return {
        plugins: [
            vue(),
            // Element Plus 自动按需引入组件和 API
            AutoImport({
                imports: ['vue', 'vue-router'],
                resolvers: [ElementPlusResolver()],
                dts: false
            }),
            Components({
                resolvers: [ElementPlusResolver()],
                dts: false
            }),
            // gzip 压缩（Cloudflare 会自动 gzip，但预生成可减少服务器开销）
            viteCompression({
                verbose: false,
                disable: !isProd,
                threshold: 1024, // 大于 1KB 才压缩
                algorithm: 'gzip',
                ext: '.gz'
            })
        ],
        resolve: {
            alias: [
                { find: '@/api/mock', replacement: useMock ? mockPath : mockStubPath },
                { find: '@', replacement: srcPath }
            ]
        },
        build: {
            target: 'es2019',
            cssCodeSplit: true, // CSS 代码分割
            sourcemap: false,
            // rollup 分包策略：把大依赖拆成独立 chunk 便于浏览器缓存
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('element-plus')) return 'element-plus'
                            if (id.includes('@element-plus/icons-vue')) return 'ep-icons'
                            if (id.includes('vue-router')) return 'vue-router'
                            if (id.includes('axios')) return 'axios'
                            if (id.includes('vue/') || id.includes('\\vue\\')) return 'vue-vendor'
                        }
                    }
                }
            },
            // 默认阈值 500KB：element-plus 单包约 950KB 会命中该告警，属预期内的整体分包
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: false,
            proxy: {
                '/api': {
                    target: 'https://api.blackbearcode.dpdns.org',
                    changeOrigin: true,
                    secure: false,
                    followRedirects: true,
                    timeout: 30000,
                    proxyTimeout: 30000,
                    // 关键：自定义 HTTPS Agent 解决并发瓶颈
                    // node-http-proxy 默认 Agent 的 maxSockets=256 但 keepAlive=false，
                    // 每个请求都要新建 TLS 连接 → 并发多了握手排队超时
                    agent: new https.Agent({
                        keepAlive: true,
                        keepAliveMsecs: 1000,
                        maxSockets: 20,
                        maxFreeSockets: 10,
                        rejectUnauthorized: false
                    })
                }
            }
        }
    }
})
