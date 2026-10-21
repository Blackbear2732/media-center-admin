import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))
const mockPath = fileURLToPath(new URL('./src/api/mock.js', import.meta.url))
const mockStubPath = fileURLToPath(new URL('./src/api/mock.stub.js', import.meta.url))

export default defineConfig(({ mode }) => {
    // 与 src/api/index.js 的 USE_MOCK 判断保持同一套规则：
    // 只有显式设置 VITE_USE_MOCK=false（见 .env.api）才关闭 Mock
    const env = loadEnv(mode, process.cwd(), '')
    const useMock = env.VITE_USE_MOCK !== 'false'

    return {
        plugins: [vue()],
        resolve: {
            alias: [
                // 关闭 Mock 时把数据模块指向空实现，演示数据不会进入构建产物
                { find: '@/api/mock', replacement: useMock ? mockPath : mockStubPath },
                { find: '@', replacement: srcPath }
            ]
        },
        server: {
            host: '0.0.0.0', // 允许局域网访问（同事/手机可通过 IP 访问你的电脑）
            port: 5173,      // Vite 默认端口：80 端口在 Windows 需要管理员权限，macOS/Linux 需要 sudo
            strictPort: false,
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true
                    // 注意：如果你们的后端接口本身没有 /api 前缀，这里需要加 rewrite
                    // rewrite: (path) => path.replace(/^\/api/, '')
                }
            }
        }
    }
})
