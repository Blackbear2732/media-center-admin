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
    latestTasks:  pick(() => request.get('/tasks/latest'),        () => delay(mock.tasks.slice(0, 4))),
    latestVideos: pick(() => request.get('/videos/latest'),       () => delay(mock.videos))
}

/* ================= 登录认证 ================= */
/* 登录 */
export const authApi = {
    login: (payload = {}) => USE_MOCK
        ? delay((() => {
            const key = payload.role || 'member'

            // 如果是部长登录，根据传入的部门动态查找对应的部长
            if (key === 'minister' && payload.dept) {
                const m = mock.members.find(m => m.dept === payload.dept && m.title.includes('部长'))
                if (m) {
                    return {
                        token: 'mock-minister-' + Date.now(),
                        role: 'minister',
                        label: '部长',
                        user: {
                            studentNo: m.studentNo,
                            name: m.name,
                            nickname: m.nickname || m.name,
                            dept: m.dept,
                            college: m.college,
                            className: m.className,
                            grade: m.grade,
                            phone: m.phone,
                            email: m.email,
                            title: m.title
                        }
                    }
                }
            }

            // 否则回退到默认账号
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
    list:        pick(() => request.get('/messages'),               () => delay(mock.messages)),
    markRead:    pick(id => request.put(`/messages/${id}/read`),    () => delay({ success: true })),
    markAllRead: pick(() => request.put('/messages/read-all'),      () => delay({ success: true }))
}

/* ================= 任务 F-08 ~ F-10 ================= */
export const taskApi = {
    list:        pick(p => request.get('/tasks', { params: p }),     p => delay(mock.filterTasks(p))),
    detail:      pick(id => request.get(`/tasks/${id}`),            id => delay(mock.tasks.find(t => String(t.id) === String(id)) || mock.tasks[0])),
    create:      pick(d => request.post('/tasks', d),               () => delay({ success: true, id: 99 })),
    materials:   pick(id => request.get(`/tasks/${id}/materials`),  id => delay(mock.materials.filter(m => String(m.taskId) === String(id)))),
    departments: pick(() => request.get('/departments'),            () => delay(mock.departments)),
    devices:     pick(() => request.get('/devices/names'),          () => delay(mock.deviceNames))
}

/* ================= 素材 F-11 ~ F-13 ================= */
export const materialApi = {
    search:        pick(p => request.get('/materials', { params: p }), p => delay(mock.filterMaterials(p))),
    detail:        pick(id => request.get(`/materials/${id}`),        id => delay(mock.materials.find(m => String(m.id) === String(id)) || mock.materials[0])),
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
    // D-01 部门概览
    overview: (dept) => USE_MOCK
        ? delay((() => {
            const isAll = !dept || dept === '全部部门'
            const filteredMembers = isAll ? (mock.members || []) : (mock.members || []).filter(m => m.dept === dept)
            const activeCount = filteredMembers.filter(m => m.status === '在岗').length

            return {
                ...mock.deptOverview,
                memberCount: filteredMembers.length,
                activeCount: activeCount,
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
    addParticipant: (taskId, data) => USE_MOCK
        ? delay({ success: true })
        : request.post(`/admin/tasks/${taskId}/participants`, data),
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
    evaluations: (dept) => USE_MOCK
        ? delay(mock.evaluations.filter(e => e.dept === dept))
        : request.get('/admin/evaluations', { params: { dept } }),
    evaluationTemplate: (dept) => USE_MOCK
        ? delay(mock.evaluationTemplates[dept] || mock.defaultEvaluationTemplate)
        : request.get('/admin/evaluations/template', { params: { dept } }),
    createEvaluation: (data) => USE_MOCK
        ? delay({ success: true })
        : request.post('/admin/evaluations', data),

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

    // D-14 打卡记录（根据日期+部门，动态拼装所有在岗成员的默认打卡状态）
    checkins: (params) => USE_MOCK
        ? delay((() => {
            const { date, dept } = params || {}
            let targetMembers = (mock.members || []).filter(m => m.status === '在岗')
            if (dept && dept !== '全部') {
                targetMembers = targetMembers.filter(m => m.dept === dept)
            }
            return targetMembers.map((m, index) => {
                const record = (mock.checkinRecords || []).find(r => r.date === date && r.dept === m.dept && r.member === m.name)
                return {
                    id: record ? record.id : `temp-${m.id}-${date}`, // 如果没有记录，使用临时id
                    date,
                    dept: m.dept,
                    member: m.name,
                    studentNo: m.studentNo,
                    status: record ? record.status : '未打卡'
                }
            })
        })())
        : request.get('/admin/checkins', { params }),

    // 标记打卡状态（支持处理临时新增的记录）
    markCheckin: (id, status, record) => USE_MOCK
        ? delay(() => {
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
        })()
        : request.put(`/admin/checkins/${id}`, { status }),
    // D-15 综合部：打卡申诉审批
    checkinAppeals: () => USE_MOCK ? delay(mock.checkinAppeals) : request.get('/admin/checkins/appeals'),
    reviewAppeal: (id, status) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/checkins/appeals/${id}`, { status }),

    // D-16 综合部：打卡统计
    checkinStats: () => USE_MOCK ? delay(mock.checkinStats) : request.get('/admin/checkins/stats'),

    // D-18 摄制部：设备档案管理
    devices: () => USE_MOCK ? delay(mock.deviceList) : request.get('/admin/devices'),
    saveDevice: (data) => USE_MOCK
        ? delay({ success: true })
        : (data.id ? request.put(`/admin/devices/${data.id}`, data) : request.post('/admin/devices', data)),

    // D-19 摄制部：设备申请审核
    deviceApplications: () => USE_MOCK ? delay(mock.deviceApplications) : request.get('/admin/device-applications'),
    reviewDevice: (id, data) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/device-applications/${id}`, data)
}

/* ================= 通用工具 ================= */
export const statusTagType = (s) => ({
    '筹备': 'info', '进行中': 'warning', '已结束': 'success',
    '正常': 'success', '迟到': 'warning', '缺勤': 'danger',
    '已归还': 'success', '使用中': 'warning', '待审批': 'info', '待审核': 'info',
    '已通过': 'success', '已拒绝': 'danger', '审批中': 'warning',
    '已参加': 'success', '待参加': 'info',
    '在岗': 'success', '停用': 'info'
}[s] || 'info')