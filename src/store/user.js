import { reactive } from 'vue'

// 定义 localStorage 的 key，统一管理，避免手写错
const KEYS = {
    TOKEN: 'token',
    ROLE: 'role',
    USER: 'user',
    ADMIN_DEPT: 'adminDept'
}

// 初始化状态（从本地读取）
const initState = () => ({
    token: localStorage.getItem(KEYS.TOKEN) || '',
    role: localStorage.getItem(KEYS.ROLE) || '',
    userInfo: JSON.parse(localStorage.getItem(KEYS.USER) || '{}'),
    adminDept: localStorage.getItem(KEYS.ADMIN_DEPT) || ''
})

// 创建响应式全局对象
export const userStore = reactive({
    ...initState(),

    // ================= 核心状态计算 =================
    get isLogin() {
        return !!this.token
    },
    get isMember() {
        return this.role === 'member'
    },
    get isMinister() {
        return this.role === 'minister'
    },
    get isDirector() {
        return this.role === 'director'
    },
    // 只要不是普通部员，就具备管理权限
    get canManage() {
        return this.isMinister || this.isDirector
    },
    // 获取当前用户所在部门
    get dept() {
        return this.userInfo.dept || ''
    },
    // 获取当前用户的展示名字
    get name() {
        return this.userInfo.name || '未登录'
    },

    // ================= 提供动作方法 =================

    // 1. 登录：统一处理数据写入
    login(token, role, user, customDept) {
        this.token = token
        this.role = role
        this.userInfo = user
        // 如果是主任，默认全部部门（空字符串），否则用用户的部门
        this.adminDept = customDept !== undefined ? customDept : (role === 'director' ? '' : user.dept)

        localStorage.setItem(KEYS.TOKEN, this.token)
        localStorage.setItem(KEYS.ROLE, this.role)
        localStorage.setItem(KEYS.USER, JSON.stringify(this.userInfo))
        localStorage.setItem(KEYS.ADMIN_DEPT, this.adminDept)
    },

    // 2. 退出登录：统一清理数据
    logout() {
        this.token = ''
        this.role = ''
        this.userInfo = {}
        this.adminDept = ''
        localStorage.removeItem(KEYS.TOKEN)
        localStorage.removeItem(KEYS.ROLE)
        localStorage.removeItem(KEYS.USER)
        localStorage.removeItem(KEYS.ADMIN_DEPT)
    },

    // 3. 主任切换部门
    setAdminDept(dept) {
        this.adminDept = dept
        localStorage.setItem(KEYS.ADMIN_DEPT, dept)
    }
})