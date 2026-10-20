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
    myDevices:      pick(() => request.get('/user/devices'),          () => delay(mock.myDevices)),

    // 部员查看个人考评
    myEvaluations: () => USE_MOCK
        ? delay((() => {
            const user = mock.currentUser()
            return (mock.evaluations || []).filter(e => e.member === user.name)
        })())
        : request.get('/user/evaluations'),
}

/* ================= 消息 F-07 ================= */
export const messageApi = {
    list: pick(() => request.get('/messages'), () => {
        const role = localStorage.getItem('role') || 'member'
        let msgs = mock.messages || []
        if (role === 'minister') {
            msgs = msgs.filter(m => m.id === 1 || m.id === 3)
        } else if (role === 'director') {
            msgs = msgs.filter(m => m.id === 2)
        }
        return delay(JSON.parse(JSON.stringify(msgs)))
    }),
    markRead: pick(
        id => request.put(`/messages/${id}/read`),
        (id) => {
            const msg = mock.messages.find(m => m.id === id)
            if (msg) msg.read = true
            return delay({ success: true })
        }
    ),
    markAllRead: pick(
        () => request.put('/messages/read-all'),
        () => {
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
    create: pick(
        d => request.post('/tasks', d),
        (data) => {
            const newTask = {
                ...data,
                id: Date.now(),
                status: '筹备',
                participants: [],
                signups: []
            }
            mock.tasks.unshift(newTask)
            return delay({ success: true, id: newTask.id })
        }
    ),
    materials:   pick(id => request.get(`/tasks/${id}/materials`),id => delay(mock.materials.filter(m => String(m.taskId) === String(id)))),
    departments: pick(() => request.get('/departments'), () => delay(mock.departments)),

    // 部员报名
    signup: (taskId, data) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                if (!task.signups) task.signups = []
                if (!task.signups.some(s => s.name === data.name)) {
                    task.signups.push({ name: data.name, dept: data.dept, status: '待确认' })
                }
            }
            return { success: true }
        })())
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

            if (role !== 'director') {
                if (role === 'minister') {
                    result = result.filter(m => m.department === user.dept)
                } else {
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
    ),
    detail:        pick(id => request.get(`/materials/${id}`),        id => delay(mock.materials.find(m => String(m.id) === String(id)) || mock.materials[0])),
    versions:      pick(id => request.get(`/materials/${id}/versions`), id => {
        const m = mock.materials.find(x => String(x.id) === String(id)) || mock.materials[0]
        return delay(m.versions)
    }),
    recordExtract: pick(id => request.post(`/materials/${id}/extract`), () => delay({ success: true })),
    uploadFields:  pick(dept => request.get('/upload/fields', { params: { department: dept } }),
        dept => delay(mock.uploadFieldMap[dept] || mock.uploadFieldMap['综合部'])),

    // 素材上传（加入内存）
    upload:        pick(d => request.post('/upload', d), (data) => {
        const newMaterial = {
            id: Date.now(),
            title: data.title,
            type: data.department === '新闻部' ? '新闻稿' : '其他',
            department: data.department,
            author: mock.currentUser().name,
            createdAt: new Date().toLocaleString(),
            taskId: data.taskId,
            content: data.content || '',
            netdiskUrl: data.netdiskUrl || '',
            netdiskCode: data.netdiskCode || '',
            sharedDepts: data.sharedDepts || [],
            versions: [{ version: 'v1', updatedAt: new Date().toLocaleString(), size: '未知', author: mock.currentUser().name }],
            extracts: []
        }
        mock.materials.unshift(newMaterial)
        return delay({ success: true })
    })
}

/* ================= 设备申请 F-14 ================= */
export const deviceApi = {
    list:           pick(() => request.get('/devices'),                    () => delay(mock.deviceList)),

    // 申请设备（加入内存）
    apply:          pick(d => request.post('/device-applications', d), (data) => {
        const newApp = {
            id: Date.now(),
            applicant: mock.currentUser().name,
            dept: mock.currentUser().dept,
            phone: mock.currentUser().phone || '',
            device: data.deviceName,
            startTime: data.startTime,
            endTime: data.endTime,
            purpose: data.purpose,
            taskName: '',
            status: '待审核',
            opinion: ''
        }
        mock.deviceApplications.unshift(newApp)
        return delay({ success: true })
    }),

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
    members: (dept) => USE_MOCK
        ? delay(dept ? (mock.members || []).filter(m => m.dept === dept) : (mock.members || []))
        : request.get('/admin/members', { params: { dept } }),

    // 保存成员（加入内存）
    saveMember: (data) => USE_MOCK
        ? delay((() => {
            if (data.id) {
                const target = mock.members.find(m => m.id === data.id)
                if (target) Object.assign(target, data)
            } else {
                mock.members.unshift({
                    ...data,
                    id: Date.now(),
                    status: '在岗',
                    email: `${data.name}@example.com`
                })
            }
            return { success: true }
        })())
        : (data.id ? request.put(`/admin/members/${data.id}`, data) : request.post('/admin/members', data)),

    toggleMember: (id, status) => USE_MOCK
        ? delay((() => {
            const target = mock.members.find(m => String(m.id) === String(id))
            if (target) target.status = status
            return { success: true }
        })())
        : request.put(`/admin/members/${id}/status`, { status }),

    // D-03 成员详情
    memberDetail: (id) => USE_MOCK
        ? delay((() => {
            const member = mock.members.find(m => String(m.id) === String(id))
            const memberName = member ? member.name : ''

            const userTasks = mock.tasks.filter(t => (t.participants || []).some(p => p.name === memberName))
            const userEvaluations = (mock.evaluations || []).filter(e => e.member === memberName)

            const userCheckins = memberName ? [
                { id: 1, date: '2024-11-05', task: '日常推文转发', status: '正常' },
                { id: 2, date: '2024-11-04', task: '日常推文转发', status: '正常' }
            ] : []

            const userMeetings = memberName ? [
                { id: 1, title: `${member?.dept || ''} 11月例会`, time: '2024-11-04 14:00', status: '已参加' }
            ] : []

            return { tasks: userTasks, checkins: userCheckins, meetings: userMeetings, evaluations: userEvaluations }
        })())
        : request.get(`/admin/members/${id}/detail`),

    // D-04/D-10 任务参与管理
    tasks: (dept) => USE_MOCK
        ? delay(mock.tasks.filter(t => t.departments.includes(dept) || t.relatedDepts?.includes(dept)))
        : request.get('/admin/tasks', { params: { dept } }),

    addParticipant: (taskId, data) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                if (!task.participants) task.participants = []
                if (!task.participants.some(p => p.name === data.name)) {
                    task.participants.push({ name: data.name, dept: data.dept })
                }
            }
            return { success: true }
        })())
        : request.post(`/admin/tasks/${taskId}/participants`, data),

    removeParticipant: (taskId, name) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task && task.participants) {
                task.participants = task.participants.filter(p => p.name !== name)
            }
            return { success: true }
        })())
        : request.delete(`/admin/tasks/${taskId}/participants`, { data: { name } }),

    confirmSignup: (taskId, name) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                if (!task.participants) task.participants = []
                const signup = (task.signups || []).find(s => s.name === name)
                if (signup) {
                    if (!task.participants.some(p => p.name === signup.name)) {
                        task.participants.push({ name: signup.name, dept: signup.dept })
                    }
                    task.signups = task.signups.filter(s => s.name !== name)
                }
            }
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/signups/${name}/confirm`),

    updateTask: (id, data) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(id))
            if (task) Object.assign(task, data)
            return { success: true }
        })())
        : request.put(`/admin/tasks/${id}`, data),

    deleteTask: (id) => USE_MOCK
        ? delay((() => {
            const index = mock.tasks.findIndex(t => String(t.id) === String(id))
            if (index > -1) mock.tasks.splice(index, 1)
            return { success: true }
        })())
        : request.delete(`/admin/tasks/${id}`),

    // D-05 会议管理
    meetings: (dept) => USE_MOCK
        ? delay(mock.adminMeetings.filter(m => m.dept === dept || m.dept === '全中心'))
        : request.get('/admin/meetings', { params: { dept } }),

    // 创建会议（加入内存）
    createMeeting: (data) => USE_MOCK
        ? delay((() => {
            mock.adminMeetings.unshift({ ...data, id: Date.now(), records: [] })
            return { success: true }
        })())
        : request.post('/admin/meetings', data),

    saveMeetingRecords: (id, records) => USE_MOCK
        ? delay((() => {
            const target = mock.adminMeetings.find(m => String(m.id) === String(id))
            if (target) target.records = records
            return { success: true }
        })())
        : request.put(`/admin/meetings/${id}/records`, { records }),

    // D-06/07/08 考评管理
    evaluations: (dept) => USE_MOCK
        ? delay(dept ? mock.evaluations.filter(e => e.dept === dept) : mock.evaluations)
        : request.get('/admin/evaluations', { params: { dept } }),

    evaluationTemplate: () => USE_MOCK
        ? delay(mock.evaluationTemplate)
        : request.get('/admin/evaluations/template'),

    // 发起考评（修复了报错，并加入内存）
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
                    level: m.level || '合格',
                    status: '已完成',
                    createdAt: new Date().toLocaleString(),
                    details: {
                        extraNote: m.extraNote || '',
                        checkinDays: 8,
                        checkinScore: 4,
                        taskScore: Math.floor(m.autoScore * 0.4),
                        meetingScore: m.autoScore - 4 - Math.floor(m.autoScore * 0.4),
                        taskList: [{ title: '本月参与的各项任务', score: Math.floor(m.autoScore * 0.4) }],
                        meetingList: [{ title: '本月参与的各项会议', score: m.autoScore - 4 - Math.floor(m.autoScore * 0.4) }]
                    }
                })
            })
            return { success: true }
        })())
        : request.post('/admin/evaluations', data),

    memberEvalDetail: (memberName, month) => USE_MOCK
        ? delay({
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

    // 保存公告（加入内存）
    saveAnnouncement: (data) => USE_MOCK
        ? delay((() => {
            if (data.id) {
                const target = mock.announcements.find(a => a.id === data.id)
                if (target) Object.assign(target, data)
            } else {
                mock.announcements.unshift({ ...data, id: Date.now(), createdAt: new Date().toLocaleString() })
            }
            return { success: true }
        })())
        : (data.id ? request.put(`/admin/announcements/${data.id}`, data) : request.post('/admin/announcements', data)),

    // 删除公告（加入内存）
    deleteAnnouncement: (id) => USE_MOCK
        ? delay((() => {
            const index = mock.announcements.findIndex(a => String(a.id) === String(id))
            if (index > -1) mock.announcements.splice(index, 1)
            return { success: true }
        })())
        : request.delete(`/admin/announcements/${id}`),

    // D-12 部门介绍设置
    deptProfile: (dept) => USE_MOCK ? delay(mock.deptProfiles[dept]) : request.get('/admin/dept-profile', { params: { dept } }),

    // 保存部门介绍（加入内存）
    saveDeptProfile: (dept, data) => USE_MOCK
        ? delay((() => {
            if (mock.deptProfiles[dept]) Object.assign(mock.deptProfiles[dept], data)
            return { success: true }
        })())
        : request.put('/admin/dept-profile', { dept, ...data }),

    // D-13/D-17 数据看板
    dashboard: () => USE_MOCK ? delay(mock.dashboardData) : request.get('/admin/dashboard'),

    uploadCsv: (type, file) => USE_MOCK ? delay({ success: true, rows: 128 }) : (() => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type)
        return request.post('/admin/dashboard/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    })(),

    // D-14 打卡记录
    checkins: (params) => USE_MOCK
        ? delay((() => {
            const { date, dept } = params || {}
            let targetMembers = (mock.members || []).filter(m => m.status === '在岗')
            targetMembers = targetMembers.filter(m => !m.title.includes('部长') && m.title !== '中心主任')

            if (dept && dept !== '全部') {
                targetMembers = targetMembers.filter(m => m.dept === dept)
            }

            return targetMembers.map((m) => {
                const record = (mock.checkinRecords || []).find(r => r.date === date && r.dept === m.dept && r.member === m.name)
                return {
                    id: record ? record.id : `temp-${m.id}-${date}`,
                    date,
                    dept: m.dept,
                    member: m.name,
                    studentNo: m.studentNo,
                    status: record ? record.status : '未打卡'
                }
            })
        })())
        : request.get('/admin/checkins', { params }),

    markCheckin: (id, status, record) => USE_MOCK
        ? delay((() => {
            const target = (mock.checkinRecords || []).find(r => r.id === id)
            if (target) {
                target.status = status
            } else if (record) {
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

    // 审批申诉（加入内存）
    reviewAppeal: (id, status) => USE_MOCK
        ? delay((() => {
            const target = mock.checkinAppeals.find(a => String(a.id) === String(id))
            if (target) target.status = status
            return { success: true }
        })())
        : request.put(`/admin/checkins/appeals/${id}`, { status }),

    // D-16 综合部：打卡统计
    checkinStats: () => USE_MOCK ? delay(mock.checkinStats) : request.get('/admin/checkins/stats'),

    // D-18 摄制部：设备档案管理
    devices: () => USE_MOCK
        ? delay(mock.deviceList || [])
        : request.get('/admin/devices'),

    // 保存设备（加入内存）
    saveDevice: (data) => USE_MOCK
        ? delay((() => {
            if (data.id) {
                const target = mock.deviceList.find(d => d.id === data.id)
                if (target) Object.assign(target, data)
            } else {
                mock.deviceList.unshift({ ...data, id: Date.now() })
            }
            return { success: true }
        })())
        : (data.id ? request.put(`/admin/devices/${data.id}`, data) : request.post('/admin/devices', data)),

    // D-19 摄制部：设备申请审核
    deviceApplications: () => USE_MOCK ? delay(mock.deviceApplications) : request.get('/admin/device-applications'),

    // 👇 新增：更新任务关联的设备清单
    updateTaskDevices: (taskId, devices) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                task.devices = devices
            }
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/devices`, { devices }),


    // 审核设备（加入内存）
    reviewDevice: (id, data) => USE_MOCK
        ? delay((() => {
            const target = mock.deviceApplications.find(d => String(d.id) === String(id))
            if (target) Object.assign(target, data)
            return { success: true }
        })())
        : request.put(`/admin/device-applications/${id}`, data),

    // 获取部门专属模块配置
    getDeptModules: (dept) => USE_MOCK
        ? delay(mock.deptModuleConfig[dept] || [])
        : request.get('/admin/dept-modules', { params: { dept } }),

    // 获取管理区菜单
    getMenus: (dept, role) => USE_MOCK
        ? delay((() => {
            let menus = [...mock.baseAdminMenus]
            if (role === 'director') {
                const allSpecial = Object.values(mock.specialAdminMenus).flat()
                const uniqueSpecial = Array.from(new Set(allSpecial.map(m => m.path)))
                    .map(path => allSpecial.find(m => m.path === path))
                menus = [...menus, ...uniqueSpecial]
            } else if (dept) {
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
            if (task && task.participants) {
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

// 兼容旧代码
import { getTaskTagType } from '@/utils/dict'
export const statusTagType = getTaskTagType