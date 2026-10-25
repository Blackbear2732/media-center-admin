import axios from 'axios'
import { ElMessage } from 'element-plus'
import { userStore } from '@/store/user'
import { runtimeConfig } from '@/api/runtime'

const service = axios.create({ baseURL: '/api', timeout: 15000 })

// 运行时更新后端地址：默认 /api（走 CF 的 Functions 代理），
// 若 /config 里配置了完整 API_BASE_URL（如 https://xxx.com），则直达该后端
export const setApiBase = (url) => { service.defaults.baseURL = url || '/api' }

/*
 * 轻量 GET 响应缓存：本地开发/频繁切换菜单时减少重复请求。
 * - 只缓存 GET，写请求（POST/PUT/DELETE）一律透传不缓存
 * - 键 = 请求方法 + URL + 登录 token（避免跨账号串数据）
 * - 短 TTL，过期自动失效；写请求会清除整体缓存防止脏读
 * - 可选 config.cache = false 强制本次不透传缓存
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

const cacheKey = (method, url, token) => method + '|' + url + '|' + (token || '')

const clearGetCache = () => getCache.clear()

service.interceptors.request.use(config => {
    // 保证 baseURL 与运行时配置一致（默认 /api -> CF Functions 代理）
    config.baseURL = runtimeConfig.apiBase
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`

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
            clearAuth()
            redirectToLogin()
            return Promise.reject(new Error(msg || '登录状态已过期'))
        }
        ElMessage.error(msg || '请求失败')
        return Promise.reject(new Error(msg || '请求失败'))
    },
    err => {
        // 在 401 处理逻辑里加上：
        if (code === 401) {
            ElMessage.closeAll() // 👈 关掉前面可能弹出的多个错误提示
            clearAuth()
            redirectToLogin()
            return Promise.reject(new Error(msg || '登录状态已过期'))
        }
        ElMessage.error(err.response?.data?.msg || err.message || '网络异常')
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