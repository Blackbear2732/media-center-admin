import request from './request'
// 通过别名引用：VITE_USE_MOCK=false 时构建会替换为空实现（见 vite.config.js）
import * as mockNs from '@/api/mock'
import { ALL_DEPT_ID, ROLE, isAllDept, getDeptLabel } from '@/utils/dict'

// ESM 命名空间导入只读，用解构拿到可变的对象引用
const mock = { ...mockNs }

// 是否使用 Mock 数据：由构建时环境变量决定（.env.development / .env.production / .env.api）
export let USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const setUseMock = (v) => { USE_MOCK = !!v }

// 是否已登录（匿名访客不应拿到「某个登录用户」视角的数据）
const isLoggedIn = () => !!localStorage.getItem('token')

// 安全容错的 delay 函数，防止 undefined 导致 JSON.parse 报错并卡死 Promise
const delay = (data, ms = 0) => new Promise(resolve => setTimeout(() => {
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

// Mock 内部抛业务错误时转成 rejected Promise，保持与 axios 请求失败一致的语义
const mockRejectable = (fn) => () => {
    try {
        return delay(fn())
    } catch (e) {
        return Promise.reject(e)
    }
}

// 任务是否属于某个部门（参与部门 或 联动部门）；全中心视角恒为 true
const taskInDept = (task, deptId) => {
    if (isAllDept(deptId)) return true
    const id = Number(deptId)
    return (task.deptIds || []).includes(id) || (task.relatedDeptIds || []).includes(id)
}

// 当前登录人信息
const me = () => mock.currentUser()

// 素材类型按上传部门决定（对应 biz_material.type）
const MATERIAL_TYPE_BY_DEPT = {
    101: 2, // 综合部 → 推文图片/材料
    102: 6, // 网宣部 → 原创推文
    103: 5, // 影音部 → 视频成片
    104: 4, // 摄制部 → 视频素材
    105: 1, // 新闻部 → 新闻稿
    106: 3  // 设计部 → 海报设计图
}

/* ================= 首页 F-01 ================= */
export const homeApi = {
    centerInfo:   pick(() => request.get('/center'),              () => delay(mock.centerInfo)),
    departments:  pick(() => request.get('/departments'),         () => delay(mock.departments)),
    latestTasks:  pick(() => request.get('/tasks/latest'),        () => {
        // 匿名访客看公共任务概览，不套用任何登录用户的部门视角
        if (!isLoggedIn()) return delay(mock.tasks.slice(0, 4))
        const user = me()
        const role = mock.currentRole()
        const deptId = role === ROLE.DIRECTOR ? ALL_DEPT_ID : user.deptId
        const list = role === ROLE.DIRECTOR
            ? mock.tasks
            : mock.tasks.filter(t => taskInDept(t, deptId))
        return delay(list.slice(0, 4))
    })
}

/* ================= 登录认证 ================= */
// Mock 多部门身份：与后端一致，返回 [{ deptId, deptLabel, primary }]
const mockDeptOptions = (acc) => {
    const ids = Array.isArray(acc.deptIds) && acc.deptIds.length ? acc.deptIds : [acc.deptId]
    return ids.map(id => ({
        deptId: Number(id),
        deptLabel: getDeptLabel(id),
        primary: Number(id) === Number(acc.deptId)
    }))
}

export const authApi = {
    // 入参：{ username, password }；Mock 模式统一密码 123456
    login: (payload = {}) => USE_MOCK
        ? delay((() => {
            const acc = mock.findAccountByUsername(payload.username, payload.password)
            if (!acc) return null
            const depts = mockDeptOptions(acc)
            return {
                token: `${acc.token}-${Date.now()}`,
                role: acc.role,
                label: acc.label,
                user: { ...acc.user },
                // 多部门身份：可切换部门列表、当前生效部门、是否需要登录后选择身份
                depts,
                activeDeptId: acc.user.deptId,
                needDeptSelect: depts.length > 1
            }
        })())
        : request.post('/auth/login', payload),
    // 切换身份：body { deptId }，后端改写会话并续期 token，返回结构同登录
    switchDept: (deptId) => USE_MOCK
        ? delay((() => {
            const id = Number(deptId)
            let depts = []
            try {
                depts = JSON.parse(localStorage.getItem('depts') || '[]')
            } catch (e) {}
            const target = depts.find(d => Number(d.deptId) === id)
            if (!target) throw new Error('无权切换到该部门身份')
            const role = mock.currentRole()
            return {
                deptId: id,
                deptLabel: target.deptLabel,
                role,
                user: { ...mock.currentUser(), deptId: id, deptLabel: target.deptLabel },
                depts,
                activeDeptId: id
            }
        })())
        : request.post('/auth/dept', { deptId }),
    logout: pick(() => request.post('/auth/logout'), () => delay({ success: true })),
    // 找回密码：发送邮箱验证码 / 验证码校验并重置密码（Mock 模式直接成功，便于演示流程）
    sendForgotCode: (email) => USE_MOCK
        ? delay({})
        : request.post('/auth/forgot/code', { email }),
    resetByEmail: (payload = {}) => USE_MOCK
        ? delay({})
        : request.post('/auth/forgot/reset', payload)
}

/* ================= 个人区 F-02 ~ F-06 ================= */
export const userApi = {
    profile:        pick(() => request.get('/user/profile'),          () => delay(me())),
    updateProfile:  pick(d => request.put('/user/profile', d),        () => delay({ success: true })),
    // 邮箱验证码发送与绑定：首次登录补全邮箱、个人信息页改绑邮箱共用
    sendEmailCode:  pick(e => request.post('/user/email/code', { email: e }), () => delay({ success: true })),
    bindEmail:      pick(({ email, code }) => request.post('/user/email/bind', { email, code }), (payload = {}) => delay((() => {
        // Mock：视为绑定成功，并写回本地登录态，刷新后个人信息页仍显示新邮箱
        try {
            const raw = localStorage.getItem('user')
            if (raw) {
                const u = JSON.parse(raw)
                u.email = payload.email
                localStorage.setItem('user', JSON.stringify(u))
            }
        } catch (e) {}
        return { success: true, email: payload.email }
    })())),
    updatePassword: pick(d => request.put('/user/password', d),       () => delay({ success: true })),
    myTasks:        pick(() => request.get('/user/tasks'),            () => {
        if (!isLoggedIn()) return delay([])
        const user = me()
        const list = mock.tasks.filter(t =>
            (t.participants || []).some(p => p.name === user.name) ||
            taskInDept(t, user.deptId)
        )
        return delay(list)
    }),
    attendance:     pick(() => request.get('/user/attendance'),       () => delay(mock.attendance)),
    appeal:         pick(d => request.post('/user/attendance/appeal', d), () => delay({ success: true })),
    myMeetings:     pick(() => request.get('/user/meetings'),         () => delay(mock.meetings)),
    myDevices:      pick(() => request.get('/user/devices'),          () => delay(mock.myDevices)),

    // 部员查看个人考评
    myEvaluations: () => USE_MOCK
        ? delay((mock.evaluations || []).filter(e => e.member === me().name))
        : request.get('/user/evaluations'),
}

/* ================= 消息 F-07 ================= */
export const messageApi = {
    list: pick(() => request.get('/messages'), () => {
        const role = mock.currentRole()
        let msgs = mock.messages || []
        if (role === ROLE.MINISTER) {
            msgs = msgs.filter(m => m.id === 1 || m.id === 3)
        } else if (role === ROLE.DIRECTOR) {
            msgs = msgs.filter(m => m.id === 2)
        }
        return delay(msgs)
    }),
    markRead: pick(
        id => request.put(`/messages/${id}/read`),
        (id) => {
            const msg = mock.messages.find(m => m.id === id)
            if (msg) msg.isRead = 1
            return delay({ success: true })
        }
    ),
    markAllRead: pick(
        () => request.put('/messages/read-all'),
        () => {
            mock.messages.forEach(m => m.isRead = 1)
            return delay({ success: true })
        }
    )
}

/* ================= 任务 F-08 ~ F-10 ================= */
export const taskApi = {
    // 入参：{ status: -1|0|1|2, deptId?: number }
    list: pick(
        p => request.get('/tasks', { params: p }),
        p => {
            const role = mock.currentRole()
            const deptId = p?.deptId ?? (role === ROLE.DIRECTOR ? ALL_DEPT_ID : me().deptId)
            let result = mock.tasks

            if (!isAllDept(deptId)) {
                result = result.filter(t => taskInDept(t, deptId))
            }
            if (p?.status !== undefined && p?.status !== null && Number(p.status) !== -1) {
                result = result.filter(t => Number(t.status) === Number(p.status))
            }
            return delay(result)
        }
    ),
    detail:      pick(id => request.get(`/tasks/${id}`), id => delay(mock.tasks.find(t => String(t.id) === String(id)) || mock.tasks[0])),
    // 甘特图：GET /tasks/gantt?startDate=&endDate=&deptId=&status=
    // 返回项字段：{ id, title, startTime, endTime, status, progress, timePending,
    //   deptNames: string[], deptIds: number[],   // 全部部门（新）
    //   deptId, deptName,                          // 旧字段，deptNames 缺失时回退
    //   publishByName }
    // cache: false —— 时间范围/筛选切换时不复用上一次的 GET 缓存
    gantt: pick(
        p => request.get('/tasks/gantt', { params: p, cache: false }),
        p => delay(mock.ganttTasks(p))
    ),
    create: pick(
        d => request.post('/tasks', d),
        (data) => {
            const user = me()
            const newTask = {
                ...data,
                id: Date.now(),
                status: 0,                 // 0-筹备中
                publishDeptId: user.deptId,
                participants: [],
                signups: [],
                equipmentIds: data.equipmentIds || []
            }
            mock.tasks.unshift(newTask)
            return delay({ success: true, id: newTask.id })
        }
    ),
    materials:   pick((id, config) => request.get(`/tasks/${id}/materials`, config), id => delay(mock.materials.filter(m => String(m.taskId) === String(id)))),
    departments: pick(() => request.get('/departments'), () => delay(mock.departments)),

    // 部员报名
    signup: (taskId, data) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                if (!task.signups) task.signups = []
                if (!task.signups.some(s => s.name === data.name)) {
                    task.signups.push({ name: data.name, deptId: Number(data.deptId), status: 0 }) // 0-待确认
                }
            }
            return { success: true }
        })())
        : request.post(`/tasks/${taskId}/signup`, data),

    devices:     pick(() => request.get('/devices'), () => delay(mock.deviceList))
}

/* ================= 素材 F-11 ~ F-13 ================= */
export const materialApi = {
    // 入参：{ title, content, deptId, leaderName, startTime, endTime }
    search: pick(
        p => request.get('/materials', { params: p }),
        p => {
            const user = me()
            const role = mock.currentRole()
            let result = mock.filterMaterials(p)

            if (role === ROLE.MINISTER) {
                result = result.filter(m => Number(m.deptId) === Number(user.deptId))
            } else if (role === ROLE.MEMBER) {
                const myTaskIds = mock.tasks
                    .filter(t => (t.participants || []).some(part => part.name === user.name) || taskInDept(t, user.deptId))
                    .map(t => String(t.id))

                result = result.filter(m =>
                    m.author === user.name ||
                    (m.sharedDeptIds || []).includes(Number(user.deptId)) ||
                    myTaskIds.includes(String(m.taskId))
                )
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
    uploadFields:  pick(deptId => request.get('/upload/fields', { params: { deptId } }),
        deptId => delay(mock.uploadFieldMap[Number(deptId)] || mock.uploadFieldMap[101])),

    // 素材上传（加入内存）
    upload:        pick(d => request.post('/upload', d), (data) => {
        const user = me()
        const deptId = Number(data.deptId) || Number(user.deptId)
        const newMaterial = {
            id: Date.now(),
            title: data.title,
            type: MATERIAL_TYPE_BY_DEPT[deptId] || 1,
            deptId,
            author: user.name,
            createdAt: new Date().toLocaleString(),
            taskId: data.taskId,
            content: data.content || '',
            netdiskUrl: data.netdiskUrl || '',
            netdiskCode: data.netdiskCode || '',
            sharedDeptIds: (data.sharedDeptIds || []).map(Number),
            versions: [{ version: 'v1', updatedAt: new Date().toLocaleString(), size: '未知', author: user.name }],
            extracts: []
        }
        mock.materials.unshift(newMaterial)
        return delay({ success: true })
    }),

    // 编辑素材
    update: (id, data) => USE_MOCK
        ? delay((() => {
            const target = mock.materials.find(m => String(m.id) === String(id))
            if (target) Object.assign(target, data)
            return { success: true }
        })())
        : request.put(`/materials/${id}`, data),

    // 删除素材（软删除）
    remove: (id) => USE_MOCK
        ? delay((() => {
            const index = mock.materials.findIndex(m => String(m.id) === String(id))
            if (index >= 0) mock.materials.splice(index, 1)
            return { success: true }
        })())
        : request.delete(`/materials/${id}`)
}

/* ================= 设备申请 F-14 ================= */
export const deviceApi = {
    list:           pick(() => request.get('/devices'),                    () => delay(mock.deviceList)),

    // 申请设备（加入内存）
    apply:          pick(d => request.post('/device-applications', d), (data) => {
        const user = me()
        const newApp = {
            id: Date.now(),
            applicant: user.name,
            deptId: Number(user.deptId),
            phone: user.phone || '',
            equipmentId: Number(data.deviceId),
            device: data.deviceName,
            applyNum: data.applyNum || 1,
            startTime: data.startTime,
            endTime: data.endTime,
            purpose: data.purpose,
            taskName: '',
            status: 0, // 0-待审核
            opinion: ''
        }
        mock.deviceApplications.unshift(newApp)
        return delay({ success: true })
    }),

    // 当前用户自己的申请记录：必须同时匹配姓名与部门，避免同名成员串号
    myApplications: pick(
        () => request.get('/device-applications/my'),
        () => {
            if (!isLoggedIn()) return delay([])
            const user = me()
            return delay(mock.deviceApplications.filter(d =>
                d.applicant === user.name && Number(d.deptId) === Number(user.deptId)
            ))
        }
    ),

    // 申请通过后，由申请人手动确认取走/归还
    pickup: (id) => USE_MOCK
        ? delay((() => {
            const target = (mock.deviceApplications || []).find(d => String(d.id) === String(id))
            if (target) {
                target.status = 3
                target.pickupTime = new Date().toISOString()
            }
            return { success: true }
        })())
        : request.put(`/device-applications/${id}/pickup`),

    returnDevice: (id) => USE_MOCK
        ? delay((() => {
            const target = (mock.deviceApplications || []).find(d => String(d.id) === String(id))
            if (target) {
                target.status = 4
                target.returnTime = new Date().toISOString()
            }
            return { success: true }
        })())
        : request.put(`/device-applications/${id}/return`),

    // 任务界面设备区：摄制部直接从设备库取走/归还设备（对应 /admin/devices/{id}/take|return，带 taskId）
    takeEquipment: (id, taskId) => USE_MOCK
        ? delay((() => {
            const target = (mock.deviceList || []).find(d => String(d.id) === String(id))
            if (target) target.status = 1   // 1-外借
            return { success: true }
        })())
        : request.put(`/admin/devices/${id}/take`, null, { params: { taskId } }),

    returnEquipment: (id, taskId) => USE_MOCK
        ? delay((() => {
            const target = (mock.deviceList || []).find(d => String(d.id) === String(id))
            if (target) target.status = 0   // 0-在库
            return { success: true }
        })())
        : request.put(`/admin/devices/${id}/return`, null, { params: { taskId } })
}

/* ================= 部门管理区 (部长/主任) ================= */

/**
 * 选人候选项归一化：按用户去重，并把同一个人多行记录的部门合并成 deptIds。
 * 保证下拉框的 key/value 唯一（同一人只对应一个选项），
 * 避免重复 key 的残留选项，以及同一 value 被多个部门标签覆盖。
 */
const normalizeMemberOptions = (list) => {
    const map = new Map()
    for (const item of (Array.isArray(list) ? list : [])) {
        if (!item) continue
        const userId = item.userId != null ? item.userId : item.id
        const key = userId != null ? 'u' + userId : 'n' + item.name
        const depts = String(item.deptIds || item.deptId || '')
            .split(',').map(Number).filter(Boolean)
        const exist = map.get(key)
        if (exist) {
            depts.forEach(d => exist.depts.add(d))
        } else {
            map.set(key, {
                userId,
                name: item.name,
                deptId: item.deptId == null ? null : Number(item.deptId),
                depts: new Set(depts)
            })
        }
    }
    return Array.from(map.values()).map(m => ({
        userId: m.userId,
        name: m.name,
        deptId: m.deptId,
        deptIds: Array.from(m.depts).sort((a, b) => a - b).join(',')
    }))
}

export const adminApi = {
    // D-01 部门概览
    overview: (deptId) => USE_MOCK
        ? delay((() => {
            const all = isAllDept(deptId)
            const filteredMembers = all
                ? (mock.members || [])
                : (mock.members || []).filter(m => Number(m.deptId) === Number(deptId))
            const activeCount = filteredMembers.filter(m => Number(m.status) === 1).length

            let todos = []
            if (Number(deptId) === 101) {
                todos = [{ type: 'checkin', text: '今日打卡名单尚未核对，请及时处理', time: '2024-11-05 08:00' }]
            } else if (Number(deptId) === 104) {
                todos = [{ type: 'device', text: '张三 申请借用「佳能相机」，待审核', time: '2024-11-04 09:12' }]
            } else {
                todos = [{ type: 'signup', text: '陈存灿 报名「秋季运动会」任务，待确认', time: '2024-11-04 09:12' }]
            }
            if (all) todos.unshift({ type: 'global', text: '全中心 10 月份考评未发起', time: '2024-11-01' })

            return {
                ...mock.deptOverview,
                memberCount: filteredMembers.length,
                activeCount,
                todos,
                taskCount: all ? mock.tasks.length : mock.tasks.filter(t => taskInDept(t, deptId)).length,
                materialCount: all ? mock.materials.length : mock.materials.filter(m => Number(m.deptId) === Number(deptId)).length
            }
        })())
        : request.get('/admin/overview', { params: { deptId } }),

    // D-02 成员管理（后端分页）
    // 入参：{ deptId, role?, politicalStatus?, pageNum, pageSize }，返回 { total, rows }
    members: (params = {}, config = {}) => USE_MOCK
        ? delay(isAllDept(params.deptId)
            ? (mock.members || [])
            : (mock.members || []).filter(m => Number(m.deptId) === Number(params.deptId)))
        : request.get('/admin/members', { params, ...config }),

    // 选人候选：按用户去重，一人一行
    // 入参：{ deptId?, nameLike? }，返回 [{ userId, name, deptId, deptIds }]
    // deptId 为主部门，deptIds 为逗号分隔的全部所属部门，供下拉框展示「网宣部/设计部」
    // 这里再做一次客户端兜底去重：即使接口返回的是按部门展开的旧结构（一人多行），
    // 也不会出现重复 key 的幽灵选项，以及同一 value 对应多个部门标签互相覆盖的问题
    memberOptions: (params = {}, config = {}) => (USE_MOCK
        ? delay((() => {
            const list = isAllDept(params.deptId)
                ? (mock.members || [])
                : (mock.members || []).filter(m => Number(m.deptId) === Number(params.deptId))
            return list.map(m => ({ userId: m.id, name: m.name, deptId: m.deptId, deptIds: String(m.deptId) }))
        })())
        : request.get('/admin/members/options', { params, ...config })).then(normalizeMemberOptions),

    // 保存成员（加入内存）
    saveMember: (data) => USE_MOCK
        ? delay((() => {
            if (data.id) {
                const target = mock.members.find(m => m.id === data.id)
                if (target) Object.assign(target, data)
            } else {
                mock.members.unshift({
                    role: 0,
                    status: 1, // 1-在岗
                    deptId: 101,
                    ...data,
                    id: Date.now(),
                    email: `${data.name}@example.com`
                })
            }
            return { success: true }
        })())
        : (data.id ? request.put(`/admin/members/${data.id}`, data) : request.post('/admin/members', data)),

    // status：1-在岗 0-停用
    toggleMember: (id, status) => USE_MOCK
        ? delay((() => {
            const target = mock.members.find(m => String(m.id) === String(id))
            if (target) target.status = Number(status)
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
                { id: 1, date: '2024-11-05', task: '日常推文转发', status: 1 },
                { id: 2, date: '2024-11-04', task: '日常推文转发', status: 1 }
            ] : []

            const userMeetings = memberName ? [
                { id: 1, title: `${member?.title || ''} 11月例会`, time: '2024-11-04 14:00', status: 1 }
            ] : []

            return { tasks: userTasks, checkins: userCheckins, meetings: userMeetings, evaluations: userEvaluations }
        })())
        : request.get(`/admin/members/${id}/detail`),

    // 成员月度打卡汇总（多部门分别统计，不合并）
    // 入参：{ months = 12, deptId? }；deptId 为空表示成员全部所属部门
    // 返回项：{ month, deptId, deptName, recordDays, checkedDays, absentDays, unmarkedDays, deptRecordDays, rate }
    memberCheckinMonths: (userId, params = {}) =>
        request.get(`/admin/members/${userId}/checkin-months`, { params }),

    // 成员某月逐日打卡明细
    // 入参：{ month: 'yyyy-MM', deptId? }；deptId 与月度汇总保持一致，避免多部门月份串数据
    // 返回项：{ id, date, deptId, deptName, status(1已打卡/0未打卡/null未标记), markBy, markByName, markTime }
    memberCheckins: (userId, params = {}) =>
        request.get(`/admin/members/${userId}/checkins`, { params }),

    // D-04/D-10 任务参与管理
    tasks: (deptId) => USE_MOCK
        ? delay(isAllDept(deptId)
            ? mock.tasks
            : mock.tasks.filter(t => taskInDept(t, deptId)))
        : request.get('/admin/tasks', { params: { deptId } }),

    addParticipant: (taskId, data) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                if (!task.participants) task.participants = []
                if (!task.participants.some(p => p.name === data.name)) {
                    task.participants.push({ name: data.name, deptId: Number(data.deptId) })
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
                        task.participants.push({ name: signup.name, deptId: signup.deptId })
                    }
                    task.signups = task.signups.filter(s => s.name !== name)
                }
            }
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/signups/${name}/confirm`),

    // 拒绝报名：把报名状态置为 2（已拒绝），保留记录便于追溯
    rejectSignup: (taskId, name) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            const signup = (task?.signups || []).find(s => s.name === name)
            if (signup) signup.status = 2 // 2-已拒绝
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/signups/${encodeURIComponent(name)}/reject`),

    // 确认到场：把报名/参与记录的到场状态置为 1（签到），作为考评 task_join 基础分依据
    attendSignup: (taskId, name) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            const member = [task?.signups, task?.participants].flat().find(m => m && m.name === name)
            if (member) member.attend = 1
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/signups/${encodeURIComponent(name)}/attend`),

    // 撤销到场：误触时可撤回，attendStatus 置回 0
    undoAttend: (taskId, name) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            const member = [task?.signups, task?.participants].flat().find(m => m && m.name === name)
            if (member) member.attend = 0
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/signups/${encodeURIComponent(name)}/undo-attend`),

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

    // D-05 会议管理（deptId 100 为全中心会议）
    meetings: (deptId) => USE_MOCK
        ? delay(isAllDept(deptId)
            ? mock.adminMeetings
            : mock.adminMeetings.filter(m => Number(m.deptId) === Number(deptId) || Number(m.deptId) === ALL_DEPT_ID))
        : request.get('/admin/meetings', { params: { deptId } }),

    // 创建会议（加入内存）
    // memberIds 为 null/空数组时按默认规则生成应到名单：全中心=全体部长，部门=本部门成员
    createMeeting: (data) => USE_MOCK
        ? delay((() => {
            const deptId = Number(data.deptId)
            const defaults = mockNs.meetingDefaultMembers(deptId)
            const ids = Array.isArray(data.memberIds) && data.memberIds.length ? data.memberIds.map(Number) : null
            const chosen = ids ? defaults.filter(m => ids.includes(Number(m.id))) : defaults
            const meeting = {
                id: Date.now(),
                title: data.title,
                time: data.time,
                location: data.location,
                host: data.host || '当前用户',
                deptId,
                records: chosen.map(m => ({ memberId: m.id, name: m.name, deptId: m.deptId, status: 0 })),
                markedCount: 0,
                totalCount: chosen.length
            }
            mock.adminMeetings.unshift(meeting)
            return meeting
        })())
        : request.post('/admin/meetings', data),

    // records: [{ memberId, name, deptId, status: 1到场 2迟到 3请假 4缺席 }]，memberId 为权威匹配键
    saveMeetingRecords: (id, records) => USE_MOCK
        ? delay((() => {
            const target = mock.adminMeetings.find(m => String(m.id) === String(id))
            if (target) {
                const patch = new Map(records.map(r => [Number(r.memberId), r]))
                target.records = (target.records || []).map(r => {
                    const key = Number(r.memberId ?? r.userId)
                    return patch.has(key) ? { ...r, ...patch.get(key), status: Number(patch.get(key).status) } : r
                })
                target.markedCount = target.records.filter(r => Number(r.status) !== 0).length
                target.totalCount = target.records.length
            }
            return { success: true }
        })())
        : request.put(`/admin/meetings/${id}/records`, { records }),

    deleteMeeting: (id) => request.delete(`/admin/meetings/${id}`),

    // D-06/07/08 考评管理
    evaluations: (deptId) => USE_MOCK
        ? delay(isAllDept(deptId)
            ? mock.evaluations
            : mock.evaluations.filter(e => Number(e.deptId) === Number(deptId)))
        : request.get('/admin/evaluations', { params: { deptId } }),

    evaluationTemplate: () => USE_MOCK
        ? delay(mock.evaluationTemplate)
        : request.get('/admin/evaluations/template'),

    // 考评模板设置：查询某部门模板及明细（deptId 空/100 落回综合部）
    evalTemplateOf: (deptId) => USE_MOCK
        ? delay((() => {
            const id = isAllDept(deptId) ? 101 : Number(deptId)
            const deptName = { 101: '综合部', 102: '网宣部', 103: '影音部', 104: '摄制部', 105: '新闻部', 106: '设计部' }[id]
            return {
                deptId: id,
                templateId: id,
                hasCustom: !isAllDept(deptId),
                templateName: `${deptName} 考评模板`,
                items: (mock.evaluationTemplates[deptName] || mock.defaultEvaluationTemplate || []).map(it => ({
                    sourceKey: it.key,
                    itemName: it.name,
                    score: it.score,
                    enabled: 1,
                    type: it.type
                }))
            }
        })())
        : request.get('/admin/eval-templates', { params: { deptId } }),

    // 按部门保存考评模板分值（deptId 为路径参数；items 为 [{ sourceKey, itemName, score }]）
    saveEvalTemplate: (deptId, items) => USE_MOCK
        ? delay({ success: true })
        : request.put(`/admin/eval-templates/${deptId}`, { items }),

    // 考评额外加分（多次）：查询某成员的加分历史（month 可选）
    evalEvents: (userId, month) => USE_MOCK
        ? delay(mock.evalEvents || [])
        : request.get('/admin/eval-events', { params: { userId, month } }),

    // 添加一条额外加分：{ userId, deptId, month, score, remark }
    addEvalEvent: (data) => USE_MOCK
        ? delay({ success: true })
        : request.post('/admin/eval-events', data),

    // 删除一条额外加分记录
    deleteEvalEvent: (id) => USE_MOCK
        ? delay({ success: true })
        : request.delete(`/admin/eval-events/${id}`),

    previewEvaluation: (month, memberNames) => USE_MOCK
        ? delay((() => {
            return memberNames.map(name => {
                const memberInfo = mock.members.find(m => m.name === name)

                // 1. 打卡分（每次 0.5 分，status 1 为已打卡）
                const checkinCount = (mock.checkinRecords || []).filter(
                    r => r.member === name && r.date.startsWith(month) && Number(r.status) === 1
                ).length
                const checkinScore = checkinCount * 0.5

                // 2. 会议分（每次 1 分，status 1 为到场）
                let meetingCount = 0
                ;(mock.adminMeetings || []).forEach(m => {
                    if (m.records && m.records.some(r => r.name === name && Number(r.status) === 1)) meetingCount++
                })
                const meetingScore = meetingCount * 1

                // 3. 任务基础参与分（每次 1 分）
                const taskCount = mock.tasks.filter(t =>
                    t.participants && t.participants.some(p => p.name === name)
                ).length
                const taskBaseScore = taskCount * 1

                // 4. 任务附加分
                let taskExtraScore = 0
                mock.tasks.forEach(t => {
                    const p = (t.participants || []).find(x => x.name === name)
                    if (p && p.extraScore) taskExtraScore += p.extraScore
                })

                return {
                    name,
                    deptId: memberInfo?.deptId || 100,
                    autoScore: checkinScore + meetingScore + taskBaseScore,
                    taskExtraScore,
                    manualScore: 0,
                    level: 1, // 1-合格
                    reason: ''
                }
            })
        })())
        : request.post('/admin/evaluations/preview', { month, memberNames }),

    // 发起考评（自动联动真实明细并入库）
    createEvaluation: (data) => USE_MOCK
        ? delay((() => {
            data.members.forEach((m, idx) => {
                const name = m.name
                const month = data.month

                // 1. 打卡明细
                const userCheckins = (mock.checkinRecords || []).filter(
                    r => r.member === name && r.date.startsWith(month) && Number(r.status) === 1
                )
                const checkinDays = userCheckins.length
                const checkinScore = checkinDays * 0.5

                // 2. 会议明细
                const userMeetingList = []
                ;(mock.adminMeetings || []).forEach(meeting => {
                    const record = (meeting.records || []).find(r => r.name === name && Number(r.status) === 1)
                    if (record) userMeetingList.push({ title: meeting.title, score: 1 })
                })
                const meetingScore = userMeetingList.length * 1

                // 3. 任务明细
                const userTaskList = []
                let taskBaseScore = 0
                let taskExtraScore = 0
                mock.tasks.forEach(t => {
                    const p = (t.participants || []).find(x => x.name === name)
                    if (p) {
                        userTaskList.push({ title: t.title, score: 1 })
                        taskBaseScore += 1
                        if (p.extraScore) taskExtraScore += p.extraScore
                    }
                })

                // 自动分以 details 为唯一真源：打卡 + 会议 + 任务基础分 + 任务附加分
                // 前端传来的 autoScore 仅作展示，入库口径以此处计算为准，避免两套口径
                const autoScore = checkinScore + meetingScore + taskBaseScore + taskExtraScore
                const manualScore = Number(m.manualScore) || 0

                mock.evaluations.unshift({
                    id: Date.now() + idx,
                    month,
                    deptId: Number(m.deptId) || Number(mock.members.find(x => x.name === name)?.deptId) || 101,
                    member: name,
                    autoScore,
                    manualScore,
                    total: autoScore + manualScore,
                    level: Number(m.level ?? 1),     // 0不合格 1合格 2良好 3优秀
                    status: 1,                       // 1-已发布
                    createdAt: new Date().toLocaleString(),
                    details: {
                        extraNote: m.extraNote || '',
                        checkinDays,
                        checkinScore,
                        taskScore: taskBaseScore,
                        taskExtraScore,
                        meetingScore,
                        taskList: userTaskList,
                        meetingList: userMeetingList
                    }
                })
            })
            return { success: true }
        })())
        : request.post('/admin/evaluations', data),

    // 考评明细：从考评快照 / 打卡记录 / 任务参与关系实时推导，不再返回硬编码假数据
    memberEvalDetail: (memberName, month, deptId) => USE_MOCK
        ? delay((() => {
            const targetDeptId = deptId === undefined || deptId === null || deptId === '' ? null : Number(deptId)
            const evaluation = (mock.evaluations || []).find(e =>
                e.member === memberName &&
                e.month === month &&
                (targetDeptId === null || Number(e.deptId) === targetDeptId)
            )
            const details = evaluation?.details || {}
            const memberInfo = (mock.members || []).find(m =>
                m.name === memberName && (targetDeptId === null || Number(m.deptId) === targetDeptId)
            )

            // 打卡明细：以打卡记录为准，只取考评当月
            const checkinList = (mock.checkinRecords || [])
                .filter(r => r.member === memberName && String(r.date || '').startsWith(month))
                .sort((a, b) => String(a.date).localeCompare(String(b.date)))
                .map(r => ({ date: r.date, status: Number(r.status) }))

            // 任务明细：优先用考评入库时的快照；没有快照时按当前任务参与关系推导
            const taskList = Array.isArray(details.taskList) && details.taskList.length > 0
                ? details.taskList.map(t => ({
                    title: t.title,
                    role: '参与人',
                    extraScore: Number(t.extraScore || 0)
                }))
                : mock.tasks.map(t => {
                    const participant = (t.participants || []).find(p =>
                        p.name === memberName &&
                        (targetDeptId === null || Number(p.deptId) === targetDeptId)
                    )
                    return participant
                        ? { title: t.title, role: '参与人', extraScore: Number(participant.extraScore || 0) }
                        : null
                }).filter(Boolean)

            return {
                month,
                deptId: evaluation?.deptId ?? memberInfo?.deptId ?? null,
                details,
                checkinList,
                taskList
            }
        })())
        : request.get('/admin/evaluations/detail', { params: { memberName, month, deptId } }),

    // D-09 本部门素材（后端分页）
    // 入参：{ deptId, category?, pageNum, pageSize }，返回 { total, rows, categoryCounts }
    materials: (params = {}) => USE_MOCK
        ? delay(isAllDept(params.deptId)
            ? mock.materials
            : mock.materials.filter(m => Number(m.deptId) === Number(params.deptId)))
        : request.get('/admin/materials', { params }),

    // D-11 公告管理
    announcements: () => USE_MOCK ? delay(mock.announcements) : request.get('/admin/announcements'),

    // 保存公告（加入内存）
    saveAnnouncement: (data) => USE_MOCK
        ? delay((() => {
            if (data.id) {
                const target = mock.announcements.find(a => a.id === data.id)
                if (target) Object.assign(target, data)
            } else {
                mock.announcements.unshift({ ...data, scope: Number(data.scope) || 1, id: Date.now(), createdAt: new Date().toLocaleString() })
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

    // D-12 部门介绍设置（键为 deptId；config.cache === false 时跳过 GET 短缓存，保证切换部门后立即回源）
    deptProfile: (deptId, config) => USE_MOCK
        ? delay(mock.deptProfiles[Number(deptId)] || mock.deptProfiles[101])
        : request.get('/admin/dept-profile', { ...config, params: { deptId } }),

    // 保存部门介绍（加入内存）
    saveDeptProfile: (deptId, data) => USE_MOCK
        ? delay((() => {
            const key = Number(deptId)
            if (mock.deptProfiles[key]) {
                Object.assign(mock.deptProfiles[key], data)
            } else {
                mock.deptProfiles[key] = { ...data }
            }
            return { success: true }
        })())
        : request.put('/admin/dept-profile', { deptId, ...data }),

    // 保存全中心简介（后端固定写入 dept_id=100，字段结构与部门简介一致）
    saveCenterInfo: (data) => USE_MOCK
        ? delay((() => {
            const key = 100
            if (mock.deptProfiles[key]) {
                Object.assign(mock.deptProfiles[key], data)
            } else {
                mock.deptProfiles[key] = { ...data }
            }
            return { success: true }
        })())
        : request.put('/admin/center-info', data),

    // D-13/D-17 数据看板
    dashboard: () => USE_MOCK ? delay(mock.dashboardData) : request.get('/admin/dashboard'),
    dashboardImports: () => USE_MOCK ? delay([]) : request.get('/admin/dashboard/imports'),

    // 媒体数据详情页（后端分页 + 年份筛选）
    mediaList: (params) => USE_MOCK
        ? delay(mock.mediaListData(params))
        : request.get('/admin/media/list', { params }),

    uploadCsv: (type, file) => USE_MOCK ? delay({ success: true, rows: 128 }) : (() => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type)
        return request.post('/admin/dashboard/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    })(),

    // D-14 打卡记录（deptId 传 0 / 100 表示全部）
    // params: { date, deptId, status, keyword, pageNum, pageSize }
    // keyword —— 姓名或学号模糊匹配，空值不过滤
    checkins: (params) => USE_MOCK
        ? delay((() => {
            const { date, deptId, status, keyword, pageNum = 1, pageSize = 10 } = params || {}
            let targetMembers = (mock.members || []).filter(m => Number(m.status) === 1)
            // 打卡只针对部员（role 0）
            targetMembers = targetMembers.filter(m => Number(m.role) === 0)

            if (!isAllDept(deptId)) {
                targetMembers = targetMembers.filter(m => Number(m.deptId) === Number(deptId))
            }

            // 姓名/学号模糊搜索，空关键字不参与过滤
            const kw = String(keyword || '').trim()
            if (kw) {
                targetMembers = targetMembers.filter(m =>
                    String(m.name).includes(kw) || String(m.studentNo).includes(kw)
                )
            }

            const rows = targetMembers.map((m) => {
                const record = (mock.checkinRecords || []).find(r => r.date === date && Number(r.deptId) === Number(m.deptId) && r.member === m.name)
                return {
                    // 与后端一致：无记录的成员 id/status 均为 null，按未打卡展示，并带 userId 供成员级标记使用
                    id: record ? record.id : null,
                    userId: m.id,
                    date,
                    deptId: m.deptId,
                    member: m.name,
                    studentNo: m.studentNo,
                    status: record ? Number(record.status) : null
                }
            })
            // 状态筛选：-2 表示未标记（无记录或 status 为 NULL），其余按状态精确匹配
            const statusNum = status === null || status === undefined || status === '' ? null : Number(status)
            let filtered = rows
            if (statusNum === -2) {
                filtered = rows.filter(r => r.status === null)
            } else if (statusNum !== null && !Number.isNaN(statusNum)) {
                filtered = rows.filter(r => Number(r.status) === statusNum)
            }
            // 与真实接口一致：返回 { rows, total }，按 pageNum/pageSize 分页
            const start = (Number(pageNum) - 1) * Number(pageSize)
            return { rows: filtered.slice(start, start + Number(pageSize)), total: filtered.length }
        })())
        : request.get('/admin/checkins', { params }),

    markCheckin: (id, status, record) => USE_MOCK
        ? delay((() => {
            const target = (mock.checkinRecords || []).find(r => String(r.id) === String(id))
            if (target) {
                target.status = status == null ? null : Number(status)
            } else if (record) {
                mock.checkinRecords.push({
                    id: Date.now(),
                    date: record.date,
                    deptId: Number(record.deptId),
                    member: record.member,
                    status: status == null ? null : Number(status)
                })
            }
            return { success: true }
        })())
        : request.put(`/admin/checkins/${id}`, { status }),

    // 成员级标记：用于当天没有记录 id 的未打卡成员（有记录则更新、无记录则插入）
    // body 沿用 { status }，date 走查询参数（yyyy-MM-dd）
    markCheckinByMember: (userId, date, data) => USE_MOCK
        ? delay((() => {
            const member = (mock.members || []).find(m => Number(m.id) === Number(userId))
            const target = (mock.checkinRecords || []).find(r => {
                if (r.date !== date) return false
                if (r.userId !== undefined && r.userId !== null) return Number(r.userId) === Number(userId)
                return !!member && Number(r.deptId) === Number(member.deptId) && r.member === member.name
            })
            if (target) {
                target.status = data.status == null ? null : Number(data.status)
            } else if (member) {
                mock.checkinRecords.push({
                    id: Date.now(),
                    date,
                    deptId: Number(member.deptId),
                    member: member.name,
                    userId: Number(userId),
                    status: data.status == null ? null : Number(data.status)
                })
            }
            return { success: true }
        })())
        : request.put(`/admin/checkins/member/${userId}`, data, { params: { date } }),

    // 批量标记：userIds 与 allUnmarked=true 二选一；deptId 必须为具体部门；status 仅 0/1
    // 入参：{ date, deptId, status, userIds, allUnmarked }
    // 返回：{ date, deptId, status, created, updated, skipped, total }
    checkinBatchMark: (payload = {}) => USE_MOCK
        ? mockRejectable(() => mock.checkinBatchMark(payload))()
        : request.put('/admin/checkins/batch', payload),

    // D-15 综合部：打卡申诉审批
    checkinAppeals: () => USE_MOCK ? delay(mock.checkinAppeals) : request.get('/admin/checkins/appeals'),

    // 审批申诉（0待审批 1已通过 2已拒绝）
    reviewAppeal: (id, status) => USE_MOCK
        ? delay((() => {
            const target = mock.checkinAppeals.find(a => String(a.id) === String(id))
            if (target) target.status = Number(status)
            return { success: true }
        })())
        : request.put(`/admin/checkins/appeals/${id}`, { status }),

    // 打卡管理授权（综合部部长/主任分配）
    // 已授权的打卡管理员列表
    checkinManagers: () => USE_MOCK ? delay(mock.checkinManagers || []) : request.get('/admin/checkins/managers'),

    // 可授权部员候选列表（排除部长/主任/已授权者），支持 keyword 模糊过滤
    checkinManagerCandidates: (keyword) => USE_MOCK
        ? delay((mock.checkinManagerCandidates || []).filter(c => !keyword || c.name.includes(keyword)))
        : request.get('/admin/checkins/managers/candidates', { params: { keyword } }),

    // 授权部员为打卡管理员
    grantCheckinManager: (userId) => USE_MOCK
        ? delay((() => {
            if (!mock.checkinManagers) mock.checkinManagers = []
            mock.checkinManagers.push({ userId, name: 'mock部员', grantedAt: new Date().toLocaleString() })
            return { success: true }
        })())
        : request.put('/admin/checkins/managers', { userId }),

    // 取消部员的打卡管理权限
    revokeCheckinManager: (userId) => USE_MOCK
        ? delay((() => {
            mock.checkinManagers = (mock.checkinManagers || []).filter(m => String(m.userId) !== String(userId))
            return { success: true }
        })())
        : request.delete(`/admin/checkins/managers/${userId}`),

    // D-16 综合部：打卡统计
    checkinStats: () => USE_MOCK ? delay(mock.checkinStats) : request.get('/admin/checkins/stats'),

    // 打卡名单导入：预览（只解析匹配，不写库）
    // 入参：{ date, deptId, text, defaultStatus, source, fileName }
    checkinImportPreview: (payload) => USE_MOCK
        ? mockRejectable(() => mock.checkinImportPreview(payload))()
        : request.post('/admin/checkins/import/preview', payload),

    // 打卡名单导入：提交（后端单事务写库），入参额外带 picks / allowSkipUnmatched
    checkinImportCommit: (payload) => USE_MOCK
        ? mockRejectable(() => mock.checkinImportCommit(payload))()
        : request.post('/admin/checkins/import/commit', payload),

    // 打卡名单导入：撤销最近一个未撤销批次
    checkinImportRevoke: (importId) => USE_MOCK
        ? mockRejectable(() => mock.checkinImportRevoke(importId))()
        : request.post(`/admin/checkins/import/${importId}/revoke`),

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
                mock.deviceList.unshift({ status: 0, stock: 1, ...data, id: Date.now() })
            }
            return { success: true }
        })())
        : (data.id ? request.put(`/admin/devices/${data.id}`, data) : request.post('/admin/devices', data)),

    // 删除设备档案
    deleteDevice: (id) => USE_MOCK
        ? delay((() => {
            const i = mock.deviceList.findIndex(d => String(d.id) === String(id))
            if (i >= 0) mock.deviceList.splice(i, 1)
            return { success: true }
        })())
        : request.delete(`/admin/devices/${id}`),

    // D-19 摄制部：设备申请审核
    deviceApplications: () => USE_MOCK ? delay(mock.deviceApplications) : request.get('/admin/device-applications'),

    // 更新任务关联的设备清单（equipmentIds）
    updateTaskDevices: (taskId, equipmentIds) => USE_MOCK
        ? delay((() => {
            const task = mock.tasks.find(t => String(t.id) === String(taskId))
            if (task) {
                task.equipmentIds = (equipmentIds || []).map(Number)
            }
            return { success: true }
        })())
        : request.put(`/admin/tasks/${taskId}/devices`, { equipmentIds }),

    // 审核设备（0待审核 1已通过 2已拒绝 3使用中 4已归还）
    reviewDevice: (id, data) => USE_MOCK
        ? delay((() => {
            const target = mock.deviceApplications.find(d => String(d.id) === String(id))
            if (target) Object.assign(target, data)
            return { success: true }
        })())
        : request.put(`/admin/device-applications/${id}`, data),

    // 批量邮件待发送管理
    mailBatches: () => USE_MOCK ? delay([]) : request.get('/admin/mail-batches'),
    mailBatchDetail: (batchNo) => USE_MOCK ? delay([]) : request.get(`/admin/mail-batches/${batchNo}`),
    deleteMailRecipient: (batchNo, id) => USE_MOCK ? delay({ success: true }) : request.delete(`/admin/mail-batches/${batchNo}/recipients/${id}`),
    sendMailBatch: (batchNo) => USE_MOCK ? delay({ success: true }) : request.post(`/admin/mail-batches/${batchNo}/send`),
    cancelMailBatch: (batchNo) => USE_MOCK ? delay({ success: true }) : request.delete(`/admin/mail-batches/${batchNo}`),

    // 获取部门专属模块配置
    getDeptModules: (deptId) => USE_MOCK
        ? delay(mock.deptModuleConfig[Number(deptId)] || [])
        : request.get('/admin/dept-modules', { params: { deptId } }),

    // 保存部门模块配置
    saveDeptModules: (deptId, modules) => USE_MOCK
        ? delay((() => {
            mock.deptModuleConfig[Number(deptId)] = [...modules]
            return { success: true }
        })())
        : request.put('/admin/dept-modules', { deptId, modules }),

    // 获取管理区菜单（role：0部员 1部长 2主任）
    // 菜单的唯一真源：基础菜单 + 部门专属菜单；主任在全中心视角下看到所有专属菜单
    getMenus: (deptId, role) => USE_MOCK
        ? delay((() => {
            const menus = [...mock.baseAdminMenus]
            const id = Number(deptId)
            const centerView = Number.isNaN(id) || isAllDept(id)

            if (Number(role) === ROLE.DIRECTOR && centerView) {
                const allSpecial = Object.values(mock.specialAdminMenus).flat()
                const uniqueSpecial = Array.from(new Set(allSpecial.map(m => m.path)))
                    .map(path => allSpecial.find(m => m.path === path))
                return [...menus, ...uniqueSpecial]
            }

            if (Number.isNaN(id)) return menus
            return [...menus, ...(mock.specialAdminMenus[id] || [])]
        })())
        : request.get('/admin/menus', { params: { deptId, role } }),

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

    // ================= 换届管理 =================

    // 届次列表
    electionTerms: () => request.get('/admin/election/terms'),

    // 任职列表（termId 空=当前届）
    electionAppointments: (termId, deptId) =>
        request.get('/admin/election/appointments', { params: { termId, deptId } }),

    // 发起换届（创建新届，上一届自动结束）
    startElection: (data) => request.post('/admin/election/start', data),

    // 批量任命（写入新届任职并同步岗位/角色）
    applyElection: (data) => request.post('/admin/election/apply', data),

    // 当前届组织架构
    electionCurrent: () => request.get('/admin/election/current'),

    // 成员任职履历
    electionHistory: (userId) => request.get('/admin/election/history', { params: { userId } }),
}