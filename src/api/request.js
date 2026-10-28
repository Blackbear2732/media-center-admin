import axios from 'axios'
import { ElMessage } from 'element-plus'
import { userStore } from '@/store/user'

// 统一 /api 前缀：本地开发由 vite.config.js 代理到真实后端(8080)；
// 自带 Functions 目录上传到 Cloudflare Pages 时，/api 由 functions/api/[[path]].js 代理到真实后端。
const service = axios.create({ baseURL: '/api', timeout: 30000 })

/* ===================== 请求取消机制 =====================
 * 快速切换页面时，上一页未完成的请求会被取消：
 * - 避免旧请求返回的数据覆盖新页面状态
 * - 节省带宽（尤其是移动端或网络差的环境）
 * 使用：在路由 beforeEach 开头调 abortPendingRequests()
 */
let currentAbortCtrl = null

export function abortPendingRequests() {
    if (currentAbortCtrl) {
        currentAbortCtrl.abort()
        currentAbortCtrl = null
    }
}

/* ===================== 轻量 GET 响应缓存 =====================
 * - 只缓存 GET，写请求（POST/PUT/DELETE）一律透传不缓存
 * - 键 = 请求方法 + URL + 登录 token（避免跨账号串数据）
 * - 短 TTL，过期自动失效；写请求会清除整体缓存防止脏读
 */
const GET_CACHE_TTL = 4000
const getCache = new Map()

// 统一清理登录态：token / role / user / adminDept 一起清掉，
// 否则 adminDept 残留会让下一次登录的管理区直接采用错误的部门视角
const clearAuth = () => {
    userStore.logout()
    clearGetCache()
}

const redirectToLogin = () => {
    if (window.location.pathname !== '/login') window.location.replace('/login')
}

// 请求是否携带了登录令牌：带令牌的请求 401 = 登录过期（跳登录）；
// 未携带令牌的匿名请求 401 = 该接口需登录（如首页公开数据），静默失败即可，不强制跳转
const hasAuthHeader = (cfg) => !!(cfg && cfg.headers && cfg.headers.Authorization)

const cacheKey = (method, url, token) => method + '|' + url + '|' + (token || '')

const clearGetCache = () => getCache.clear()

service.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    // 请求取消：所有默认请求都挂到同一个 AbortController
    if (config.abort !== false) {
        if (!currentAbortCtrl) currentAbortCtrl = new AbortController()
        config.signal = currentAbortCtrl.signal
    }

    // 写操作会改变数据，立即失效所有读缓存避免拿到旧数据
    const method = (config.method || 'get').toLowerCase()
    if (method !== 'get') clearGetCache()

    return config
})

/*
 * 响应结构对齐若依：{ code: 200, msg: '操作成功', data: {...} }
 * 注意若依用的是 msg，不是 message。
 */
service.interceptors.response.use(
    res => {
        const { code, data, msg } = res.data
        if (code === 200 || code === 0) return data
        if (code === 401) {
            if (hasAuthHeader(res.config)) {
                clearAuth()
                redirectToLogin()
                return Promise.reject(new Error(msg || '登录状态已过期'))
            }
            // 匿名请求 401：不跳登录、不弹错（首页为公开页，未登录浏览时接口失败属预期）
            return Promise.reject(new Error(msg || '请求失败'))
        }
        ElMessage.error(msg || '请求失败')
        return Promise.reject(new Error(msg || '请求失败'))
    },
    err => {
        // 被取消的请求：resolve(null) 而不是 reject，这样组件的 await api.xxx()
        // 不会抛异常（避免 try/catch 满天飞），组件内部判断 null 即可跳过处理
        if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
            return Promise.resolve(null)
        }

        // 网络抖动/超时自动重试：仅对 GET 且没有拿到任何响应的请求重试 1 次，
        // 写请求重试可能造成重复提交，因此不重试
        const cfg = err.config || {}
        const method = (cfg.method || 'get').toLowerCase()
        const retried = cfg._retryCount || 0
        if (method === 'get' && !err.response && retried < 1) {
            cfg._retryCount = retried + 1
            return new Promise(resolve => setTimeout(resolve, 600)).then(() => service(cfg))
        }

        // 将常见网络错误的原始英文信息映射为友好中文提示，
        // 避免直接把 "timeout of 30000ms exceeded" 这类技术文案弹给用户
        let errMsg = err.response?.data?.msg
        if (!errMsg) {
            const raw = err.message || ''
            if (raw.includes('timeout')) {
                errMsg = '系统接口请求超时'
            } else if (raw === 'Network Error') {
                errMsg = '后端接口连接异常'
            } else if (raw.includes('Request failed with status code')) {
                errMsg = '系统接口' + raw.slice(-3) + '异常'
            } else {
                errMsg = raw || '网络异常'
            }
        }
        if (err.response?.data?.code === 401) {
            if (hasAuthHeader(err.config)) {
                ElMessage.closeAll() // 关掉前面可能弹出的多个错误提示
                clearAuth()
                redirectToLogin()
            }
            // 匿名请求 401：静默失败，不跳登录、不弹错
            return Promise.reject(new Error(errMsg || '请求失败'))
        }
        ElMessage.error(errMsg)
        return Promise.reject(err)
    }
)

/*
 * 包装 GET：命中短 TTL 缓存直接返回，未命中则请求并在成功后写入。
 * 兼容 axios 的 get(url, config) 用法，hack 掉 config.cache === false 时跳过缓存。
 */
const rawGet = service.get.bind(service)
service.get = (url, config = {}) => {
    if (config.cache === false) return rawGet(url, config)
    const token = localStorage.getItem('token') || ''
    // 把 query params 也纳入缓存键，避免同一 URL 不同参数互相串缓存
    const params = config.params ? '?' + JSON.stringify(config.params) : ''
    const key = cacheKey('get', url + params, token)
    const hit = getCache.get(key)
    if (hit && Date.now() - hit.ts < GET_CACHE_TTL) {
        return Promise.resolve(hit.data)
    }
    return rawGet(url, config).then(data => {
        getCache.set(key, { ts: Date.now(), data })
        return data
    })
}

export default service
