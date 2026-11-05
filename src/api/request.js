import axios from 'axios'
import { ElMessage } from 'element-plus'
import { userStore } from '@/store/user'

// 后端地址：由 VITE_API_BASE_URL 注入（构建口径见 .env.workers / .env.server / .env.production，
// 分别对应 npm run build、build:server 与直接 vite build 的兜底），
// 缺变量时回落到默认的直连域名，避免构建环境漏配导致请求打空。
// 后端接口本身带 /api 前缀，这里统一规范化：
// - 变量填 origin（https://api.example.com）→ 拼接为 https://api.example.com/api
// - 变量误填 .../api 或带结尾斜杠 → 先剥掉再补，绝不会出现 /api/api
// - 本地开发填 '/api'，仍走 vite.config.js 的 8080 代理
// - 自建服务器同源反代也填 '/api'：规范化后仍是 '/api'（浏览器按页面源解析，
//   不会变成 '//api'；同源 Nginx 再转发到本机 8080，保留 /api 前缀）
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || 'https://api.zhangjunyi.top')
    .trim()
    .replace(/\/+$/, '')
const API_BASE_URL = rawApiBase.replace(/\/api$/, '') + '/api'

const service = axios.create({ baseURL: API_BASE_URL, timeout: 30000 })

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

/* ===================== 后端维护拦截 =====================
 * 后端在宝塔停用/宕机时，Nginx 网关层会返回错误页：
 * - 502/503/504：后端服务不可达，直接判定为维护
 * - 403：需甄别——业务权限 403 返回的是 JSON（{code,msg}），
 *   而宝塔「停用站点」/Nginx 维护页返回的是 HTML 字符串，只有后者才跳维护页
 * 注意：本模块被 router 引用（abortPendingRequests），不能反向 import router，
 * 因此与 redirectToLogin 一样用 location.replace 跳转
 */
const isMaintenanceResponse = (response) => {
    if (!response) return false
    const { status, data } = response
    if ([502, 503, 504].includes(status)) return true
    // Nginx 错误页是 HTML 字符串；后端业务 403 是 JSON 对象，不会误伤
    if (status === 403 && typeof data === 'string' &&
        (data.includes('系统正在升级维护') || data.includes('<html'))) return true
    return false
}

const redirectToMaintenance = () => {
    if (window.location.pathname !== '/maintenance') window.location.replace('/maintenance')
}

// 请求是否携带了登录令牌：带令牌的请求 401 = 登录过期（跳登录）；
// 未携带令牌的匿名请求 401 = 该接口需登录（如首页公开数据），静默失败即可，不强制跳转
const hasAuthHeader = (cfg) => !!(cfg && cfg.headers && cfg.headers.Authorization)

const cacheKey = (method, url, token) => method + '|' + url + '|' + (token || '')

const clearGetCache = () => getCache.clear()

/* ===================== 错误文案兜底 =====================
 * 后端异常时会把 SQL / 堆栈信息塞进 msg（如「... could not execute statement ...」
 * 「Unknown column ...」「Duplicate entry ...」），直接弹给用户既看不懂也不安全。
 * 这里统一做一层过滤：
 * - 命中技术错误关键字 → 替换成可读文案，原文只 console.error 留作排查
 * - 业务中文提示（如「参与部门与联动部门存在重复」）→ 原样展示
 */
const TECHNICAL_ERROR_KEYWORDS = [
    'SQL',
    'Duplicate entry',
    'Column',
    'constraint',
    'ORA-',
    'Exception',
    'could not execute statement',
    'DataIntegrityViolation',
    'syntax error',
    'not-null property'
]
const TECHNICAL_ERROR_TIP = '提交的数据不合法，请检查填写内容后重试'

const isTechnicalError = (msg) => {
    const text = String(msg || '')
    if (!text) return false
    return TECHNICAL_ERROR_KEYWORDS.some(keyword =>
        new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text))
}

/**
 * 把后端/网络层错误转换成可直接展示给用户的文案。
 * 技术错误会换成通用提示并打印原文，业务中文 msg 原样返回。
 * 页面里如果有自己 catch 并展示错误的地方，统一调用这个函数。
 */
export function getFriendlyErrorMessage(err, fallback = '操作失败，请稍后重试') {
    const backendMsg = typeof err === 'object' && err ? err.response?.data?.msg : ''
    if (backendMsg) {
        if (isTechnicalError(backendMsg)) {
            console.error('[接口错误原文]', backendMsg, err)
            return TECHNICAL_ERROR_TIP
        }
        return backendMsg
    }
    const raw = typeof err === 'string' ? err : (err?.message || '')
    if (raw.includes('timeout')) return '系统接口请求超时'
    if (raw === 'Network Error') return '后端接口连接异常'
    if (raw.includes('Request failed with status code')) {
        console.error('[接口错误原文]', raw, err)
        return '系统接口异常，请稍后重试'
    }
    if (isTechnicalError(raw)) {
        console.error('[接口错误原文]', raw, err)
        return TECHNICAL_ERROR_TIP
    }
    return raw || fallback
}

service.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    const method = (config.method || 'get').toLowerCase()

    // 请求取消：只有 GET 挂到共享 AbortController。
    // 写请求（POST/PUT/DELETE）不挂 signal —— 用户保存/上传后立刻切页时，
    // 请求必须继续执行，否则会被路由切换静默中断、组件却仍提示成功
    if (method === 'get' && config.abort !== false) {
        if (!currentAbortCtrl) currentAbortCtrl = new AbortController()
        config.signal = currentAbortCtrl.signal
    }

    // 写操作会改变数据，立即失效所有读缓存避免拿到旧数据
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
        // 技术类错误（SQL/堆栈）不原样弹给用户，统一换成可读文案，原文写控制台
        const userMsg = getFriendlyErrorMessage(msg, '请求失败')
        ElMessage.error(userMsg)
        return Promise.reject(new Error(userMsg))
    },
    err => {
        // 被取消的请求：GET 返回 null，组件的 await api.xxx() 不会抛异常，
        // 判断 null 即可跳过处理；写请求被取消时必须 reject，
        // 否则组件会把中断当成成功，造成「提示成功但数据没落库」
        if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
            const cancelledMethod = ((err.config && err.config.method) || 'get').toLowerCase()
            return cancelledMethod === 'get' ? Promise.resolve(null) : Promise.reject(err)
        }

        // 后端维护/宕机：整页跳维护页，不再弹错误消息（维护页本身就是提示）
        if (isMaintenanceResponse(err.response)) {
            redirectToMaintenance()
            return Promise.reject(new Error('系统维护中'))
        }

        // 网络抖动/超时自动重试：仅对 GET 且没有拿到任何响应的请求重试 1 次，
        // 写请求重试可能造成重复提交，因此不重试
        const cfg = err.config || {}
        const method = (cfg.method || 'get').toLowerCase()
        const retried = cfg._retryCount || 0
        // 超时不重试：30s 超时后再重放一次，等于让后端慢接口被连续压 30s×2，
        // 而且素材轮询/全量成员查询这类慢 GET 会被放大成连续请求
        const timedOut = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')
        if (method === 'get' && !err.response && !timedOut && cfg.retry !== false && retried < 1) {
            cfg._retryCount = retried + 1
            return new Promise(resolve => setTimeout(resolve, 600)).then(() => service(cfg))
        }

        // 统一转换错误文案：后端技术错误替换为可读提示，业务中文 msg 原样展示，
        // 没有 msg 的网络层错误（timeout / Network Error / HTTP 状态码）映射成中文
        const errMsg = getFriendlyErrorMessage(err, '网络异常')
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
        // 被取消的 GET 会 resolve(null)，不能当成有效数据写入缓存，
        // 否则切页后快速返回同一页面会命中空缓存，列表空白数秒
        if (data !== null && data !== undefined) {
            getCache.set(key, { ts: Date.now(), data })
        }
        return data
    })
}

export default service
