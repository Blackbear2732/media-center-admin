import { reactive } from 'vue'
import { ALL_DEPT_ID, getDeptLabel } from '@/utils/dict'

// 定义 localStorage 的 key，统一管理，避免手写错
const KEYS = {
    TOKEN: 'token',
    ROLE: 'role',
    USER: 'user',
    ADMIN_DEPT: 'adminDept'
}

// 兼容早期以字符串保存的角色（member / minister / director）
const LEGACY_ROLE = { member: 0, minister: 1, director: 2 }

// 角色统一成数字：0 部员 / 1 部长 / 2 主任
const normalizeRole = (raw) => {
    if (raw === null || raw === undefined || raw === '') return null
    if (Object.prototype.hasOwnProperty.call(LEGACY_ROLE, raw)) return LEGACY_ROLE[raw]
    const num = Number(raw)
    return Number.isNaN(num) ? null : num
}

// 管理视角部门：数字 deptId；空值表示「未设置」
const normalizeDeptId = (raw) => {
    if (raw === null || raw === undefined || raw === '') return null
    const num = Number(raw)
    return Number.isNaN(num) ? null : num
}

const readUser = () => {
    try {
        return JSON.parse(localStorage.getItem(KEYS.USER) || '{}')
    } catch (e) {
        return {}
    }
}

// 初始化状态（从本地读取）
const initState = () => ({
    token: localStorage.getItem(KEYS.TOKEN) || '',
    role: normalizeRole(localStorage.getItem(KEYS.ROLE)),
    userInfo: readUser(),
    adminDept: normalizeDeptId(localStorage.getItem(KEYS.ADMIN_DEPT))
})

// 创建响应式全局对象
export const userStore = reactive({
    ...initState(),

    // ================= 核心状态计算 =================
    get isLogin() {
        return !!this.token
    },
    get isMember() {
        return this.role === 0
    },
    get isMinister() {
        return this.role === 1
    },
    get isDirector() {
        return this.role === 2
    },
    // 只要不是普通部员，就具备管理权限
    get canManage() {
        return this.isMinister || this.isDirector
    },
    // 当前用户所属部门 ID
    get deptId() {
        return normalizeDeptId(this.userInfo.deptId)
    },
    // 当前用户所属部门名称
    get deptLabel() {
        return this.deptId ? getDeptLabel(this.deptId) : '未分配'
    },
    // 管理区实际生效的部门 ID（主任默认全中心 100）
    get viewDeptId() {
        if (this.isDirector) return this.adminDept ?? ALL_DEPT_ID
        return this.deptId ?? ALL_DEPT_ID
    },
    // 是否全中心视角
    get isCenter() {
        return this.isDirector && this.viewDeptId === ALL_DEPT_ID
    },
    // 获取当前用户的展示名字
    get name() {
        return this.userInfo.name || '未登录'
    },

    // ================= 提供动作方法 =================

    // 1. 登录：统一处理数据写入（role 为 0/1/2）
    login(token, role, user, customDeptId) {
        const roleNum = normalizeRole(role) ?? 0
        this.token = token
        this.role = roleNum
        this.userInfo = user || {}
        // 主任默认全中心视角，部长/部员默认本部门
        this.adminDept = customDeptId !== undefined && customDeptId !== null
            ? normalizeDeptId(customDeptId)
            : (roleNum === 2 ? ALL_DEPT_ID : normalizeDeptId(user?.deptId))

        localStorage.setItem(KEYS.TOKEN, this.token)
        localStorage.setItem(KEYS.ROLE, String(this.role))
        localStorage.setItem(KEYS.USER, JSON.stringify(this.userInfo))
        localStorage.setItem(KEYS.ADMIN_DEPT, this.adminDept === null ? '' : String(this.adminDept))
    },

    // 2. 退出登录：统一清理数据
    logout() {
        this.token = ''
        this.role = null
        this.userInfo = {}
        this.adminDept = null
        localStorage.removeItem(KEYS.TOKEN)
        localStorage.removeItem(KEYS.ROLE)
        localStorage.removeItem(KEYS.USER)
        localStorage.removeItem(KEYS.ADMIN_DEPT)
    },

    // 3. 主任切换部门视角
    setAdminDept(deptId) {
        this.adminDept = normalizeDeptId(deptId)
        localStorage.setItem(KEYS.ADMIN_DEPT, this.adminDept === null ? '' : String(this.adminDept))
    }
})
