// Cloudflare Pages Function：运行时配置入口
// 前端启动时请求 /config 获取：
//   - useMock  : 是否使用本地 Mock 数据（false 走真实后端）
//   - apiBase  : 后端请求前缀（不填则走本目录 /api 代理，由 API_UPSTREAM 指定真实后端）
// 对应变量在 CF 后台 Settings -> Environment variables 配置：
//   - PAGES_USE_MOCK = true | false
//   - API_BASE_URL   = 可选。若要用直连方案，必须包含 /api 后缀（如 https://your-backend.example.com/api），
//                     前端请求会拼成 https://your-backend.example.com/api/auth/login；且后端需允许跨域。
//                     推荐不配置此项，走下方 /api 代理（API_UPSTREAM），免跨域。
export function onRequest(context) {
  const env = context.env || {}
  const useMock = env.PAGES_USE_MOCK !== 'false'
  const apiBase = env.API_BASE_URL || '/api'
  return Response.json({ useMock, apiBase })
}