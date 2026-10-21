import axios from 'axios'
import { ElMessage } from 'element-plus'
import { userStore } from '@/store/user'

const service = axios.create({ baseURL: '/api', timeout: 15000 })

// 统一清理登录态：token / role / user / adminDept 一起清掉，
// 否则 adminDept 残留会让下一次登录的管理区直接采用错误的部门视角
const clearAuth = () => {
    userStore.logout()
}

const redirectToLogin = () => {
    if (window.location.pathname !== '/login') window.location.replace('/login')
}

service.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
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

export default service
