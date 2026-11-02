/**
 * Cloudflare Worker 入口：静态资源（Vite 构建产物 dist/）+ /api 反向代理
 *
 * 职责划分：
 * - /api/*   → 转发到 env.API_UPSTREAM（**保留 /api 前缀**：后端接口本身带 /api，
 *              SecurityConfig 按此前缀放行/鉴权，前缀丢失会导致 401）
 * - 其余路径 → env.ASSETS.fetch(request) 服务 dist/ 静态资源；
 *              未命中的路径由 wrangler.jsonc 的
 *              not_found_handling: "single-page-application" 自动回落 index.html（SPA 前端路由）
 *
 * 运行时变量：wrangler.jsonc 的 vars.API_UPSTREAM（后端地址，非敏感，可明文提交）。
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
    const upstream = (env.API_UPSTREAM || '').replace(/\/+$/, '')
    if (!upstream) {
        return jsonError(500, '后端上游未配置（缺少 API_UPSTREAM）')
    }

    // 拼接目标地址：upstream 不带 /api 后缀，路径原样保留 /api 前缀
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
