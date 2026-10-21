import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 👈 修改点 1：引入 node:url

export default defineConfig({
    plugins: [vue()],
    resolve: {
        // 👈 修改点 2：使用官方推荐的 ESM 路径解析方式
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: '0.0.0.0', // 允许局域网访问（同事/手机可通过 IP 访问你的电脑）
        port: 80,      // 👈 修改点 3：建议改回 Vite 默认端口，避免 80 端口权限问题
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
})