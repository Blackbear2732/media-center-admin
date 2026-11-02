/**
 * Cloudflare Worker 入口：静态资源（Vite 构建产物 dist/）+ /api 反向代理（过渡兜底）
 *
 * 【现状】前端已改为由 VITE_API_BASE_URL 直连后端域名（见 src/api/request.js），
 * 不再把 /api 请求发到本 Worker；下面的 /api 代理只保留给仍在用旧路径的客户端兜底。
 * 若确认没有旧客户端，可删除 proxyApi 与 wrangler.jsonc 的 run_worker_first，
 * Worker 即退回纯静态资源托管（静态资源与 SPA 回落不受影响）。
 *
 * 职责划分：
 * - /api/*   → 转发到 env.API_UPSTREAM（**保留 /api 前缀**：后端接口本身带 /api，
 *              SecurityConfig 按此前缀放行/鉴权，前缀丢失会导致 401）
 * - 其余路径 → env.ASSETS.fetch(request) 服务 dist/ 静态资源；
 *              未命中的路径由 wrangler.jsonc 的
 *              not_found_handling: "single-page-application" 自动回落 index.html（SPA 前端路由）
 *
 * 运行时变量：wrangler.jsonc 的 vars.API_UPSTREAM（后端地址，非敏感，可明文提交）。
 * 正确取值 = 协议+域名（如 https://api.example.com），不带 /api、不带结尾斜杠；
 * 误填带路径的接口地址（如 .../api/center）会产生 /api/api/... 双前缀、后端全部 401，
 * 脚本内 normalizeUpstream 已做兜底剥离。
 * 将来若需密钥类变量，用 `wrangler secret put <NAME>` 注入（加密存储，不进仓库），
 * 脚本里同样通过 env.<NAME> 读取，两者取值方式一致。
 */

/** 上游请求超时（毫秒）：与本地 vite 代理的 30s 对齐 */
const API_PROXY_TIMEOUT_MS = 30000

export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        if (url.pathname.startsWith('/api/')) {
            return proxyApi(request, env, url)
        }
        // 静态资源由 Assets 绑定处理，SPA 回落也在这一层完成
        return env.ASSETS.fetch(request)
    }
}

/**
 * 反向代理 /api/* 到真实后端。
 * 上游响应（含非 2xx）原样透传：后端约定的 { code, msg } 结构与 401 登录态
 * 由前端 axios 拦截器统一处理，代理层不做改写；
 * 只有代理自身失败（上游未配置 / 连接失败 / 超时）时才返回结构化错误。
 */
async function proxyApi(request, env, url) {
    const upstream = normalizeUpstream(env.API_UPSTREAM)
    if (!upstream) {
        return jsonError(500, 'API_UPSTREAM 配置无效：应只填协议+域名（如 https://api.example.com），不带 /api、不带结尾斜杠')
    }

    // 拼接目标地址：upstream 只含协议+域名，路径原样保留 /api 前缀
    const target = upstream + url.pathname + url.search

    try {
        // new Request(target, request) 完整透传方法 / 请求头 / body（含文件上传流），
        // Workers 运行时会自动剥离 Host 头，无需手工处理
        return await fetch(new Request(target, request), {
            signal: AbortSignal.timeout(API_PROXY_TIMEOUT_MS)
        })
    } catch (err) {
        // 不向上层抛裸异常、不回显 target（避免泄露 API_UPSTREAM 与内部细节）
        const isTimeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError')
        return jsonError(isTimeout ? 504 : 502, isTimeout ? '后端响应超时' : '后端连接失败')
    }
}

/** 统一错误结构：与前端 axios 拦截器约定的 { code, msg } 格式对齐 */
function jsonError(status, msg) {
    return new Response(JSON.stringify({ code: status, msg }), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
}

/**
 * 规范化 API_UPSTREAM，返回「协议+域名（+非 /api 前缀路径）」形式；无效返回 null。
 * 正确取值只应是 origin（如 https://api.example.com）。
 * 误填兜底：若把带 /api 前缀的接口地址整段贴进来（如 .../api 或 .../api/center），
 * 请求路径本身已以 /api 开头，直接拼接会产生 /api/api/... 双前缀、后端全部 401，
 * 此时丢弃误带的路径段只保留 origin。不回显原始值，避免泄露内部配置。
 */
function normalizeUpstream(raw) {
    let parsed
    try {
        parsed = new URL((raw || '').trim())
    } catch {
        return null
    }
    if (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')) {
        return parsed.origin
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '')
}
