// 运行时配置加载器
// 通过 Cloudflare Pages Function 的 /config 接口获取运行时配置，
// 使「本地 Mock / 真实 API」的切换及 API 地址可在 CF 后台环境变量中随时调整，
// 无需重新构建前端代码。本地开发没有 /config 时自动回退到默认值。
const DEFAULTS = {
  useMock: true,  // 默认走本地 Mock（开箱即用，未配置后端也能演示）
  apiBase: '/api' // 默认走 /api，由 CF 的 functions/api/[[path]].js 代理到真实后端
}

const state = { ...DEFAULTS, loaded: false }

export async function loadRuntimeConfig() {
  try {
    const res = await fetch('/config', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json() // 本地开发 /config 返回 index.html 会在此抛错
      state.loaded = true
      if (typeof data.useMock === 'boolean') state.useMock = data.useMock
      if (data.apiBase) state.apiBase = data.apiBase
    }
  } catch (e) {
    // 本地开发无 /config（或返回 HTML 无法解析），保持构建时环境变量的默认值
  }
  return state
}

export const runtimeConfig = state