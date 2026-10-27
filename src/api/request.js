import axios from 'axios'
import { ElMessage } from 'element-plus'
import { userStore } from '@/store/user'

// 统一 /api 前缀：本地开发由 vite.config.js 代理到真实后端(8080)；
// 自带 Functions 目录上传到 Cloudflare Pages 时，/api 由 functions/api/[[path]].js 代理到真实后端。
const service = axios.create({ baseURL: '/api', timeout: 15000 })

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

// 请求是否携带了登录令牌：带令牌的请求 401 = 登录过期（跳登录）；
// 未携带令牌的匿名请求 401 = 该接口需登录（如首页公开数据），静默失败即可，不强制跳转
const hasAuthHeader = (cfg) => !!(cfg && cfg.headers && cfg.headers.Authorization)

const cacheKey = (method, url, token) => method + '|' + url + '|' + (token || '')

const clearGetCache = () => getCache.clear()

service.interceptors.request.use(config => {
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
        // 修复：err 回调里 code/msg 未声明会导致 ReferenceError，错误提示全部失效
        const errMsg = err.response?.data?.msg || err.message || '网络异常'
        if (err.response?.data?.code === 401) {
            if (hasAuthHeader(err.config)) {
                ElMessage.closeAll() // 👈 关掉前面可能弹出的多个错误提示
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