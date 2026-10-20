import request from './request'
import * as mock from './mock'

// 是否使用 Mock 数据（后端接口就绪后改为 false）
const USE_MOCK = true

// 安全容错的 delay 函数，防止 undefined 导致 JSON.parse 报错并卡死 Promise
const delay = (data, ms = 200) => new Promise(resolve => setTimeout(() => {
    let result = null
    try {
        result = JSON.parse(JSON.stringify(data ?? null))
    } catch (e) {
        result = data
    }
    resolve(result)
}, ms))

// 统一封装：mock 走 mockFn，否则走真实 axios 请求
const pick = (real, mockFn) => (...args) => USE_MOCK ? mockFn(...args) : real(...args)

/* ================= 首页 F-01 ================= */
export const homeApi = {
    centerInfo:   pick(() => request.get('/center'),              () => delay(mock.centerInfo)),
    departments:  pick(() => request.get('/departments'),         () => delay(mock.departments)),
    // 首页最新任务，非主任只能看自己部门的
    latestTasks:  pick(() => request.get('/tasks/latest'),        () => {
        const user = mock.currentUser()
        const role = localStorage.getItem('role') || 'member'
        let tasks = mock.tasks
        if (role !== 'director') {
            tasks = tasks.filter(t => t.departments.includes(user.dept) || t.relatedDepts?.includes(user.dept))
        }
        return delay(tasks.slice(0, 4))
    }),
    latestVideos: pick(() => request.get('/videos/latest'),       () => delay(mock.videos))
}

/* ================= 登录认证 ================= */
/* 登录 */
export const authApi = {
    login: (payload = {}) => USE_MOCK
        ? delay((() => {
            const key = payload.role || 'member'
            if (key === 'minister' && payload.dept) {
                const m = mock.members.find(x => x.dept === payload.dept && x.title.includes('部长'))
                if (m) {
                    return { token: 'mock-minister', role: 'minister', label: '部长', user: { ...m } }
                }
            }
            const acc = mock.accounts?.[key] || mock.accounts?.member
            if (!acc) return null
            return { token: acc.token + '-' + Date.now(), role: acc.role, label: acc.label, user: acc.user }
        })())
        : request.post('/auth/login', payload),
    logout: pick(() => request.post('/auth/logout'), () => delay({ success: true }))
}

/* ================= 个人区 F-02 ~ F-06 ================= */
export const userApi = {
    profile:        pick(() => request.get('/user/profile'),          () => delay(mock.currentUser())),
    updateProfile:  pick(d => request.put('/user/profile', d),        () => delay({ success: true })),
    updatePassword: pick(d => request.put('/user/password', d),       () => delay({ success: true })),
    myTasks:        pick(() => request.get('/user/tasks'),            () => delay(mock.tasks.slice(0, 3))),
    attendance:     pick(() => request.get('/user/attendance'),       () => delay(mock.attendance)),
    appeal:         pick(d => request.post('/user/attendance/appeal', d), () => delay({ success: true })),
    myMeetings:     pick(() => request.get('/user/meetings'),         () => delay(mock.meetings)),
    myDevices:      pick(() => request.get('/user/devices'),          () => delay(mock.myDevices))
}


/* ================= 消息 F-07 ================= */
export const messageApi = {
    list: pick(() => request.get('/messages'), () => {
        const role = localStorage.getItem('role') || 'member'
        const user = mock.currentUser()

        // 1. 先获取底层真实的、包含已读状态的数组
        let msgs = mock.messages || []

        // 2. 根据角色过滤（不改变原数据，只返回副本引用即可，因为后续只会修改 read 属性）
        if (role === 'minister') {
            msgs = msgs.filter(m => m.id === 1 || m.id === 3) // 演示：部长看指定消息
        } else if (role === 'director') {
            msgs = msgs.filter(m => m.id === 2) // 演示：主任看指定消息
        }

        return delay(JSON.parse(JSON.stringify(msgs))) // 深拷贝返回，防止视图直接篡改原数组
    }),

    markRead: pick(
        id => request.put(`/messages/${id}/read`),
        (id) => {
            // 真正去修改 mock.messages 里的 read 状态
            const msg = mock.messages.find(m => m.id === id)
            if (msg) msg.read = true
            return delay({ success: true })
        }
    ),

    markAllRead: pick(
        () => request.put('/messages/read-all'),
        () => {
            // 真正把 mock.messages 里所有的 read 设为 true
            mock.messages.forEach(m => m.read = true)
            return delay({ success: true })
        }
    )
}

/* ================= 任务 F-08 ~ F-10 ================= */
export const taskApi = {
    list: pick(
        p => request.get('/tasks', { params: p }),
        p => {
            const user = mock.currentUser()
            const role = localStorage.getItem('role') || 'member'
            let result = mock.tasks

            // 部员和部长只能看本部门的，主任看全部
            if (role !== 'director') {
                result = result.filter(t =>
                    t.departments.includes(user.dept) || t.relatedDepts?.includes(user.dept)
                )
            }

            if (p?.status && p.status !== '全部') {
                result = result.filter(t => t.status === p.status)
            }
            return delay(result)
        }
    ),
    detail:      pick(id => request.get(`/tasks/${id}`),id => delay(mock.tasks.find(t => String(t.id) === String(id)) || mock.tasks[0])),
    create:      pick(d => request.post('/tasks', d),() => delay({ success: true, id: 99 })),
    materials:   pick(id => request.get(`/tasks/${id}/materials`),id => delay(mock.materials.filter(m => String(m.taskId) === String(id)))),
    departments: pick(() => request.get('/departments'), () => delay(mock.departments)),
    signup: (taskId, data) => USE_MOCK
        ? delay({ success: true })
        : request.post(`/tasks/${taskId}/signup`, data),
    devices:     pick(() => request.get('/devices/names'),() => delay(mock.deviceList))
}

/* ================= 素材 F-11 ~ F-13 ================= */
export const materialApi = {
    search: pick(
        p => request.get('/materials', { params: p }),
        p => {
            const user = mock.currentUser()
            const role = localStorage.getItem('role') || 'member'
            let result = mock.filterMaterials(p)

            // 素材权限隔离逻辑
            if (role !== 'director') { // 主任看全部
                if (role === 'minister') {
                    // 部长看本部门的所有素材
                    result = result.filter(m => m.department === user.dept)
                } else {
                    // 部员只能看：自己上传的 + 共享给自己部门的 + 自己参与的任务下的
                    const myTasks = mock.tasks.filter(t =>
                        t.participants?.some(part => part.name === user.name) ||
                        t.departments.includes(user.dept)
                    ).map(t => t.id)

                    result = result.filter(m =>
                        m.author === user.name ||
                        m.sharedDepts?.includes(user.dept) ||
                        myTasks.includes(m.taskId)
                    )
                }
            }
            return delay(result)
        }
    ),    detail:        pick(id => request.get(`/materials/${id}`),        id => delay(mock.materials.find(m => String(m.id) === String(id)) || mock.materials[0])),
    versions:      pick(id => request.get(`/materials/${id}/versions`), id => {
        const m = mock.materials.find(x => String(x.id) === String(id)) || mock.materials[0]
        return delay(m.versions)
    }),
    recordExtract: pick(id => request.post(`/materials/${id}/extract`), () => delay({ success: true })),
    uploadFields:  pick(dept => request.get('/upload/fields', { params: { department: dept } }),
        dept => delay(mock.uploadFieldMap[dept] || mock.uploadFieldMap['综合部'])),
    upload:        pick(d => request.post('/upload', d),               () => delay({ success: true }))
}

/* ================= 设备申请 F-14 ================= */
export const deviceApi = {
    list:           pick(() => request.get('/devices'),                    () => delay(mock.deviceList)),
    apply:          pick(d => request.post('/device-applications', d),      () => delay({ success: true })),
    myApplications: pick(() => request.get('/device-applications/my'),      () => delay(mock.deviceApplications))
}

/* ================= 部门管理区 (部长/主任) ================= */
export const adminApi = {
    // D-01 部门概览
    overview: (dept) => USE_MOCK
        ? delay((() => {
            const isAll = !dept || dept === '全部部门'
            const filteredMembers = isAll ? (mock.members || []) : (mock.members || []).filter(m => m.dept === dept)
            const activeCount = filteredMembers.filter(m => m.status === '在岗').length

            // 动态生成各部门的待办
            let todos = []
            if (dept === '综合部') {
                todos = [{ type: 'checkin', text: '今日打卡名单尚未核对，请及时处理', time: '2024-11-05 08:00' }]
            } else if (dept === '摄制部') {
                todos = [{ type: 'device', text: '张三 申请借用「佳能相机」，待审核', time: '2024-11-04 09:12' }]
            } else {
                todos = [{ type: 'signup', text: '陈存灿 报名「秋季运动会」任务，待确认', time: '2024-11-04 09:12' }]
            }
            if (isAll) todos.unshift({ type: 'global', text: '全中心 10 月份考评未发起', time: '2024-11-01' })

            return {
                ...mock.deptOverview,
                memberCount: filteredMembers.length,
                activeCount: activeCount,
                todos: todos,
                taskCount: isAll ? mock.tasks.length : mock.tasks.filter(t => t.departments.includes(dept) || t.relatedDepts?.includes(dept)).length,
                materialCount: isAll ? mock.materials.length : mock.materials.filter(m => m.department === dept).length
            }
        })())
        : request.get('/admin/overview', { params: { dept } }),

    // D-02 成员管理
    // D-02 成员管理
    members: (dept) => USE_MOCK
        ? delay(dept ? (mock.members || []).filter(m => m.dept === dept) : (mock.members || []))
        : request.get('/admin/members', { params: { dept } }),
    saveMember: (data) => USE_MOCK
        ? delay({ success: true })
        : (data.id ? request.put(`/admin/members/${data.id}`, data) : request.post('/admin/members', data)),
    toggleMember: (id, status) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/members/${id}/status`, { status }),

    // D-03 成员详情
    memberDetail: (id) => USE_MOCK
        ? delay({
            tasks: mock.tasks.slice(0, 2),
            checkins: mock.attendance.records.slice(0, 3),
            meetings: mock.meetings.slice(0, 2),
            evaluations: mock.evaluations.filter(e => e.member === mock.members.find(m => m.id === id)?.name)
        })
        : request.get(`/admin/members/${id}/detail`),

    // D-04/D-10 任务参与管理
    tasks: (dept) => USE_MOCK
        ? delay(mock.tasks.filter(t => t.departments.includes(dept) || t.relatedDepts?.includes(dept)))
        : request.get('/admin/tasks', { params: { dept } }),

    // 添加参与人
    addParticipant: (taskId, data) => USE_MOCK
        ? delay({ success: true })
        : request.post(`/admin/tasks/${taskId}/participants`, data),

    // 👇 新增：移除参与人
    removeParticipant: (taskId, name) => USE_MOCK
        ? delay({ success: true })
        : request.delete(`/admin/tasks/${taskId}/participants`, { data: { name } }),

    // 确认报名
    confirmSignup: (taskId, name) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/tasks/${taskId}/signups/${name}/confirm`),




    // D-05 会议管理
    meetings: (dept) => USE_MOCK
        ? delay(mock.adminMeetings.filter(m => m.dept === dept))
        : request.get('/admin/meetings', { params: { dept } }),
    createMeeting: (data) => USE_MOCK
        ? delay({ success: true })
        : request.post('/admin/meetings', data),
    saveMeetingRecords: (id, records) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/meetings/${id}/records`, { records }),

    // D-06/07/08 考评管理
    // 获取考评列表（支持按部门过滤）
    evaluations: (dept) => USE_MOCK
        ? delay(dept ? mock.evaluations.filter(e => e.dept === dept) : mock.evaluations)
        : request.get('/admin/evaluations', { params: { dept } }),

    // 获取考评模板
    evaluationTemplate: () => USE_MOCK
        ? delay(mock.evaluationTemplate)
        : request.get('/admin/evaluations/template'),

    // 发起考评
    createEvaluation: (data) => USE_MOCK
        ? delay((() => {
            data.members.forEach((m, idx) => {
                mock.evaluations.unshift({
                    id: Date.now() + idx,
                    month: data.month,
                    dept: m.dept,
                    member: m.name,
                    autoScore: m.autoScore,
                    manualScore: m.manualScore,
                    total: m.autoScore + m.manualScore,
                    level: m.level, // 👈 接收前端传来的评定等级
                    status: '已完成',
                    createdAt: new Date().toLocaleString(),
                    details: { checkinDays: 10, taskCount: 2, meetingCount: 1, extraNote: m.extraNote }
                })
            })
            return { success: true }
        })())
        : request.post('/admin/evaluations', data),


    // 获取某个成员考评明细（模拟展示打卡、任务等数据）
    memberEvalDetail: (memberName, month) => USE_MOCK
        ? delay({
            // 这里可以模拟从其他表里查数据，现在直接返回死数据演示
            checkinList: [
                { date: `${month}-01`, status: '已打卡' },
                { date: `${month}-02`, status: '已打卡' },
                { date: `${month}-03`, status: '未打卡' }
            ],
            taskList: [
                { title: '2024 秋季运动会开幕式报道', role: '参与人' },
                { title: '校园文化节宣传片拍摄', role: '参与人' }
            ]
        })
        : request.get('/admin/evaluations/detail', { params: { memberName, month } }),

    // D-09 本部门素材
    materials: (dept) => USE_MOCK
        ? delay(mock.materials.filter(m => m.department === dept))
        : request.get('/admin/materials', { params: { dept } }),

    // D-11 公告管理
    announcements: () => USE_MOCK ? delay(mock.announcements) : request.get('/admin/announcements'),
    saveAnnouncement: (data) => USE_MOCK
        ? delay({ success: true })
        : (data.id ? request.put(`/admin/announcements/${data.id}`, data) : request.post('/admin/announcements', data)),
    deleteAnnouncement: (id) => USE_MOCK ? delay({ success: true }) : request.delete(`/admin/announcements/${id}`),

    // D-12 部门介绍设置
    deptProfile: (dept) => USE_MOCK ? delay(mock.deptProfiles[dept]) : request.get('/admin/dept-profile', { params: { dept } }),
    saveDeptProfile: (dept, data) => USE_MOCK ? delay({ success: true }) : request.put('/admin/dept-profile', { dept, ...data }),

    // D-13/D-17 数据看板（返回 wx 和 yy 两块数据）
    dashboard: () => USE_MOCK ? delay(mock.dashboardData) : request.get('/admin/dashboard'),

    // 上传 CSV（增加 type 参数区分 wx / yy）
    uploadCsv: (type, file) => USE_MOCK ? delay({ success: true, rows: 128 }) : (() => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type)
        return request.post('/admin/dashboard/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    })(),

    // D-14 打卡记录（过滤掉部长和主任，动态拼装部员的打卡状态）
    checkins: (params) => USE_MOCK
        ? delay((() => {
            const { date, dept } = params || {}
            // 1. 获取在岗成员
            let targetMembers = (mock.members || []).filter(m => m.status === '在岗')

            // 2. 过滤掉部长和主任（他们的 title 包含“部长”或等于“中心主任”）
            targetMembers = targetMembers.filter(m =>
                !m.title.includes('部长') && m.title !== '中心主任'
            )

            // 3. 按部门过滤
            if (dept && dept !== '全部') {
                targetMembers = targetMembers.filter(m => m.dept === dept)
            }

            // 4. 拼装记录
            return targetMembers.map((m) => {
                // 从历史打卡记录里找是否已有这个人的记录
                const record = (mock.checkinRecords || []).find(r =>
                    r.date === date && r.dept === m.dept && r.member === m.name
                )
                return {
                    id: record ? record.id : `temp-${m.id}-${date}`, // 如果是新记录，给个临时ID
                    date,
                    dept: m.dept,
                    member: m.name,
                    studentNo: m.studentNo,
                    status: record ? record.status : '未打卡'
                }
            })
        })())
        : request.get('/admin/checkins', { params }),

    // 标记打卡状态（真实环境下发送 PUT 请求，Mock 环境下修改数组）
    markCheckin: (id, status, record) => USE_MOCK
        ? delay((() => {
            const target = (mock.checkinRecords || []).find(r => r.id === id)
            if (target) {
                // 已有记录，直接修改状态
                target.status = status
            } else if (record) {
                // 没有记录，且状态为已打卡，则新增一条
                mock.checkinRecords.push({
                    id: Date.now(),
                    date: record.date,
                    dept: record.dept,
                    member: record.member,
                    status
                })
            }
            return { success: true }
        })())
        : request.put(`/admin/checkins/${id}`, { status }),
    // D-15 综合部：打卡申诉审批
    checkinAppeals: () => USE_MOCK ? delay(mock.checkinAppeals) : request.get('/admin/checkins/appeals'),
    reviewAppeal: (id, status) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/checkins/appeals/${id}`, { status }),

    // D-16 综合部：打卡统计
    checkinStats: () => USE_MOCK ? delay(mock.checkinStats) : request.get('/admin/checkins/stats'),

    // D-18 摄制部：设备档案管理
    // 获取设备列表（兼容 mock 和真实后端）
    devices: () => USE_MOCK
        ? delay(mock.deviceList || []) // 防止 undefined
        : request.get('/admin/devices'), // 真实接口路径
    saveDevice: (data) => USE_MOCK
        ? delay({ success: true })
        : (data.id ? request.put(`/admin/devices/${data.id}`, data) : request.post('/admin/devices', data)),

    // D-19 摄制部：设备申请审核
    deviceApplications: () => USE_MOCK ? delay(mock.deviceApplications) : request.get('/admin/device-applications'),
    reviewDevice: (id, data) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/device-applications/${id}`, data),
    // 获取部门专属模块配置 GET /api/admin/dept-modules
    getDeptModules: (dept) => USE_MOCK
        ? delay(mock.deptModuleConfig[dept] || [])
        : request.get('/admin/dept-modules', { params: { dept } }),
    // 获取管理区菜单 GET /api/admin/menus
    getMenus: (dept, role) => USE_MOCK
        ? delay((() => {
            // 基础菜单所有人都有
            let menus = [...mock.baseAdminMenus]

            if (role === 'director') {
                // 主任拥有所有特殊菜单
                const allSpecial = Object.values(mock.specialAdminMenus).flat()
                // 去重（如果某个菜单在多个部门有）
                const uniqueSpecial = Array.from(new Set(allSpecial.map(m => m.path)))
                    .map(path => allSpecial.find(m => m.path === path))
                menus = [...menus, ...uniqueSpecial]
            } else if (dept) {
                // 部长只有本部门的特殊菜单
                const deptSpecial = mock.specialAdminMenus[dept] || []
                menus = [...menus, ...deptSpecial]
            }

            return menus
        })())
        : request.get('/admin/menus', { params: { dept, role } }),
    // 为任务参与人打附加分
    updateTaskScore: (taskId, memberName, score, reason) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                const p = task.participants.find(x => x.name === memberName)
                if (p) {
                    p.extraScore = score
                    p.scoreReason = reason
                }
            }
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/score`, { memberName, score, reason }),
}
// 兼容旧代码（如果不小心在哪个页面还留着 statusTagType 引用，也不会报错）
import { getTaskTagType } from '@/utils/dict'
export const statusTagType = getTaskTagType