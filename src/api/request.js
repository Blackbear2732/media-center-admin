import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({ baseURL: '/api', timeout: 15000 })

service.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

service.interceptors.response.use(
    res => {
        const { code, data, message } = res.data
        if (code === 0 || code === 200) return data
        if (code === 401) {
            localStorage.removeItem('token')
            location.hash = '#/login'
        }
        ElMessage.error(message || '请求失败')
        return Promise.reject(new Error(message || '请求失败'))
    },
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token')
            location.hash = '#/login'
        }
        ElMessage.error(err.message || '网络异常')
        return Promise.reject(err)
    }
)

export default service