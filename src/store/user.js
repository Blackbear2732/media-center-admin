import { reactive } from 'vue'
import { ALL_DEPT_ID, getDeptLabel } from '@/utils/dict'

// 定义 localStorage 的 key，统一管理，避免手写错
const KEYS = {
    TOKEN: 'token',
    ROLE: 'role',
    USER: 'user',
    ADMIN_DEPT: 'adminDept',
    NEED_EMAIL_BIND: 'needEmailBind',
    // 多部门身份：可切换部门列表与当前生效部门
    DEPTS: 'depts',
    ACTIVE_DEPT: 'activeDeptId'
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

// 读取可切换部门列表：[{ deptId, deptLabel, primary }]
const readDepts = () => {
    try {
        const list = JSON.parse(localStorage.getItem(KEYS.DEPTS) || '[]')
        return Array.isArray(list) ? list : []
    } catch (e) {
        return []
    }
}

// 初始化状态（从本地读取）
const initState = () => ({
    token: localStorage.getItem(KEYS.TOKEN) || '',
    role: normalizeRole(localStorage.getItem(KEYS.ROLE)),
    userInfo: readUser(),
    adminDept: normalizeDeptId(localStorage.getItem(KEYS.ADMIN_DEPT)),
    // 后端登录接口返回：邮箱未绑定或仍是假邮箱时为 true
    needEmailBind: localStorage.getItem(KEYS.NEED_EMAIL_BIND) === '1',
    depts: readDepts(),
    activeDeptId: normalizeDeptId(localStorage.getItem(KEYS.ACTIVE_DEPT))
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
    // 是否被授权打卡管理（综合部部长/主任授予的部员）
    get isCheckinManager() {
        return !!this.userInfo.checkinManager
    },
    // 当前身份部门 ID（多部门以 activeDeptId 为唯一来源，未选择时回退登录用户部门）
    get deptId() {
        return normalizeDeptId(this.activeDeptId) ?? normalizeDeptId(this.userInfo.deptId)
    },
    // 当前身份部门名称：优先取可切换部门列表中的名称，避免 userInfo 里的登录旧值
    get deptLabel() {
        const id = this.deptId
        if (!id) return '未分配'
        const active = this.depts.find(dept => Number(dept.deptId) === Number(id))
        return active?.deptLabel || this.userInfo.deptLabel || getDeptLabel(id)
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
    login(token, role, user, customDeptId, needEmailBind) {
        const roleNum = normalizeRole(role) ?? 0
        this.token = token
        this.role = roleNum
        this.userInfo = user || {}
        // 字段缺失按 false 处理，兼容未升级的后端
        this.needEmailBind = needEmailBind === true
        // 主任默认全中心视角，部长/部员默认本部门
        this.adminDept = customDeptId !== undefined && customDeptId !== null
            ? normalizeDeptId(customDeptId)
            : (roleNum === 2 ? ALL_DEPT_ID : normalizeDeptId(user?.deptId))

        localStorage.setItem(KEYS.TOKEN, this.token)
        localStorage.setItem(KEYS.ROLE, String(this.role))
        localStorage.setItem(KEYS.USER, JSON.stringify(this.userInfo))
        localStorage.setItem(KEYS.ADMIN_DEPT, this.adminDept === null ? '' : String(this.adminDept))
        localStorage.setItem(KEYS.NEED_EMAIL_BIND, this.needEmailBind ? '1' : '0')
    },

    // 2. 退出登录：统一清理数据
    logout() {
        this.token = ''
        this.role = null
        this.userInfo = {}
        this.adminDept = null
        this.needEmailBind = false
        this.depts = []
        this.activeDeptId = null
        localStorage.removeItem(KEYS.TOKEN)
        localStorage.removeItem(KEYS.ROLE)
        localStorage.removeItem(KEYS.USER)
        localStorage.removeItem(KEYS.ADMIN_DEPT)
        localStorage.removeItem(KEYS.NEED_EMAIL_BIND)
        localStorage.removeItem(KEYS.DEPTS)
        localStorage.removeItem(KEYS.ACTIVE_DEPT)
    },

    // 补填成功后同步内存与本地缓存，避免同一次登录内反复弹窗
    setNeedEmailBind(value) {
        this.needEmailBind = value === true
        localStorage.setItem(KEYS.NEED_EMAIL_BIND, this.needEmailBind ? '1' : '0')
    },

    // 3. 主任切换部门视角
    setAdminDept(deptId) {
        this.adminDept = normalizeDeptId(deptId)
        localStorage.setItem(KEYS.ADMIN_DEPT, this.adminDept === null ? '' : String(this.adminDept))
    },

    // 4. 登录 / 切换身份后同步可切换部门列表与当前生效身份
    //    单部门用户 depts 只有一项，行为与旧版本一致
    setDepts(depts, activeDeptId) {
        this.depts = Array.isArray(depts) ? depts : []
        this.activeDeptId = normalizeDeptId(activeDeptId)
        localStorage.setItem(KEYS.DEPTS, JSON.stringify(this.depts))
        localStorage.setItem(KEYS.ACTIVE_DEPT, this.activeDeptId === null ? '' : String(this.activeDeptId))
    },

    // 5. 应用后端返回的身份信息（登录选身份 / 已登录切换身份共用）
    //    接口返回：{ role, user, depts, activeDeptId }
    applyIdentity(res) {
        if (!res || typeof res !== 'object') return
        const roleNum = normalizeRole(res.role)
        if (roleNum !== null) this.role = roleNum
        if (res.user) this.userInfo = res.user
        this.setDepts(res.depts, res.activeDeptId ?? res.user?.deptId)
        // 主任保留自己的全中心/部门视角选择；部长/部员的管理视角跟随新身份部门
        if (!this.isDirector) this.setAdminDept(this.deptId)
        localStorage.setItem(KEYS.ROLE, String(this.role))
        localStorage.setItem(KEYS.USER, JSON.stringify(this.userInfo))
    }
})
