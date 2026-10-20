import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: { '@': path.resolve(process.cwd(), 'src') }
    },
    server: {
        host: '0.0.0.0', // 👈 核心代码：允许局域网访问
        port: 80,        // 你之前设置的端口
        strictPort: false, // 如果 80 被占用，自动往后找端口
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
})