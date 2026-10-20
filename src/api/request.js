import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({ baseURL: '/api', timeout: 15000 })

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
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('user')
            window.location.replace('/login')
            return Promise.reject(new Error(msg || '登录状态已过期'))
        }
        ElMessage.error(msg || '请求失败')
        return Promise.reject(new Error(msg || '请求失败'))
    },
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('user')
            window.location.replace('/login')
        }
        ElMessage.error(err.response?.data?.msg || err.message || '网络异常')
        return Promise.reject(err)
    }
)

export default service
