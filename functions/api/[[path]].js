// Cloudflare Pages Function：/api/* 反向代理
// 把前端发往 /api/xxx 的请求转发到真实后端，规避跨域。
// 真实后端地址在 CF 后台环境变量配置：API_UPSTREAM = https://your-backend.example.com
// 改地址只需改环境变量，无需改前端代码。
export async function onRequest(context) {
  const env = context.env || {}
  const upstream = (env.API_UPSTREAM || '').replace(/\/+$/, '')
  if (!upstream) {
    return new Response('API_UPSTREAM not configured', { status: 500 })
  }

  const parts = context.params.path ? context.params.path.join('/') : ''
  const url = new URL(context.request.url)
  const target = `${upstream}/${parts}${url.search}`

  const method = context.request.method
  const headers = new Headers(context.request.headers)
  headers.delete('host')

  const init = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await context.request.arrayBuffer()
  }

  const resp = await fetch(target, init)
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers
  })
}