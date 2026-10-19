import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: { '@': path.resolve(process.cwd(), 'src') }
    },
    server: {
        port: 80,
        proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
    }
})