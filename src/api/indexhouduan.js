import request from './request'

/* ================= 首页 F-01 ================= */
export const homeApi = {
    // F-01 获取中心基本信息（名称、简介、统计数据等）
    centerInfo:   () => request.get('/center'),

    // 获取全部部门列表（用于首页部门展示、下拉选择）
    departments:  () => request.get('/departments'),

    // 获取最新任务（首页展示用，后端按当前登录人权限返回）
    latestTasks:  () => request.get('/tasks/latest')
}

/* ================= 登录认证 ================= */
export const authApi = {
    // 登录
    // 入参：接入若依后为 { username, password }
    // 返回：{ token, role, label, user }
    login:  (payload = {}) => request.post('/auth/login', payload),

    // 退出登录，清除服务端会话/token
    logout: () => request.post('/auth/logout')
}

/* ================= 个人区 F-02 ~ F-06 ================= */
export const userApi = {
    // F-02 获取当前登录人个人信息
    profile:        () => request.get('/user/profile'),

    // F-02 修改个人信息
    // 入参：{ name, phone, email, avatar, ... }
    updateProfile:  d => request.put('/user/profile', d),

    // F-02 修改密码
    // 入参：{ oldPassword, newPassword }
    updatePassword: d => request.put('/user/password', d),

    // F-03 我的任务列表（后端按当前登录人参与/所在部门过滤）
    myTasks:        () => request.get('/user/tasks'),

    // F-04 我的考勤/打卡记录
    attendance:     () => request.get('/user/attendance'),

    // F-04 打卡申诉
    // 入参：{ date, reason, ... }
    appeal:         d => request.post('/user/attendance/appeal', d),

    // F-05 我的会议列表
    myMeetings:     () => request.get('/user/meetings'),

    // F-06 我的设备申请/借用记录
    myDevices:      () => request.get('/user/devices'),

    // F-05 部员查看个人考评结果
    myEvaluations:  () => request.get('/user/evaluations')
}

/* ================= 消息 F-07 ================= */
export const messageApi = {
    // F-07 消息列表（后端按当前登录人角色过滤）
    list:        () => request.get('/messages'),

    // F-07 将指定消息标记为已读
    // 入参：id 消息ID
    markRead:    id => request.put(`/messages/${id}/read`),

    // F-07 将全部消息标记为已读
    markAllRead: () => request.put('/messages/read-all')
}

/* ================= 任务 F-08 ~ F-10 ================= */
export const taskApi = {
    // F-08 任务列表
    // 入参：{ status: -1|0|1|2, deptId?: number }
    //   status: -1全部 0筹备中 1进行中 2已完成
    list:        p => request.get('/tasks', { params: p }),

    // F-09 任务详情
    // 入参：id 任务ID
    detail:      id => request.get(`/tasks/${id}`),

    // F-09 新建任务
    // 入参：{ title, content, deptIds, relatedDeptIds, startTime, endTime, equipmentIds, ... }
    create:      d => request.post('/tasks', d),

    // F-11 获取指定任务关联的素材列表
    // 入参：id 任务ID
    materials:   id => request.get(`/tasks/${id}/materials`),

    // 获取部门列表（任务创建/筛选时下拉用）
    departments: () => request.get('/departments'),

    // F-10 部员报名任务
    // 入参：taskId 任务ID；data { name, deptId }
    signup:      (taskId, data) => request.post(`/tasks/${taskId}/signup`, data),

    // 获取可用设备列表（创建任务时选择设备）
    devices:     () => request.get('/devices')
}

/* ================= 素材 F-11 ~ F-13 ================= */
export const materialApi = {
    // F-11 素材检索
    // 入参：{ title, content, deptId, leaderName, startTime, endTime }
    // 后端按当前登录人角色/部门过滤可见范围
    search:       p => request.get('/materials', { params: p }),

    // F-12 素材详情
    // 入参：id 素材ID
    detail:       id => request.get(`/materials/${id}`),

    // F-12 素材历史版本列表
    // 入参：id 素材ID
    versions:     id => request.get(`/materials/${id}/versions`),

    // F-12 记录一次素材提取（下载/引用行为）
    // 入参：id 素材ID
    recordExtract: id => request.post(`/materials/${id}/extract`),

    // F-13 获取上传表单字段（不同部门字段不同）
    // 入参：deptId 部门ID
    uploadFields: deptId => request.get('/upload/fields', { params: { deptId } }),

    // F-13 上传素材
    // 入参：{ title, content, deptId, taskId, netdiskUrl, netdiskCode, sharedDeptIds, ... }
    upload:       d => request.post('/upload', d)
}

/* ================= 设备申请 F-14 ================= */
export const deviceApi = {
    // F-14 获取可申请设备列表（含库存、状态）
    list:           () => request.get('/devices'),

    // F-14 提交设备借用申请
    // 入参：{ deviceId, deviceName, applyNum, startTime, endTime, purpose }
    apply:          d => request.post('/device-applications', d),

    // F-14 我的设备申请记录
    myApplications: () => request.get('/device-applications/my')
}

/* ================= 部门管理区 (部长/主任) ================= */
export const adminApi = {
    // D-01 部门概览
    // 入参：deptId 部门ID（100 表示全中心，仅主任可用）
    overview: (deptId) => request.get('/admin/overview', { params: { deptId } }),

    // D-02 成员列表
    // 入参：deptId 部门ID（100 表示全中心）
    members: (deptId) => request.get('/admin/members', { params: { deptId } }),

    // D-02 新增/编辑成员
    // 入参：{ id?, name, studentNo, deptId, role, phone, ... }（有 id 为编辑，无 id 为新增）
    saveMember: (data) => data.id
        ? request.put(`/admin/members/${data.id}`, data)
        : request.post('/admin/members', data),

    // D-02 启用/停用成员
    // 入参：id 成员ID；status 1-在岗 0-停用
    toggleMember: (id, status) => request.put(`/admin/members/${id}/status`, { status }),

    // D-03 成员详情（任务、打卡、会议、考评等汇总）
    // 入参：id 成员ID
    memberDetail: (id) => request.get(`/admin/members/${id}/detail`),

    // D-04/D-10 任务参与管理列表
    // 入参：deptId 部门ID（100 表示全中心）
    tasks: (deptId) => request.get('/admin/tasks', { params: { deptId } }),

    // D-04 为任务添加参与人
    // 入参：taskId 任务ID；data { name, deptId }
    addParticipant:    (taskId, data) => request.post(`/admin/tasks/${taskId}/participants`, data),

    // D-04 移除任务参与人
    // 入参：taskId 任务ID；name 参与人姓名
    removeParticipant: (taskId, name) => request.delete(`/admin/tasks/${taskId}/participants`, { data: { name } }),

    // D-04 确认部员报名（将报名人转正为参与人）
    // 入参：taskId 任务ID；name 报名人姓名
    confirmSignup:     (taskId, name) => request.put(`/admin/tasks/${taskId}/signups/${name}/confirm`),

    // D-04 编辑任务
    // 入参：id 任务ID；data 任务字段
    updateTask:        (id, data)     => request.put(`/admin/tasks/${id}`, data),

    // D-04 删除任务
    // 入参：id 任务ID
    deleteTask:        (id)           => request.delete(`/admin/tasks/${id}`),

    // D-05 会议列表
    // 入参：deptId 部门ID（100 表示全中心会议）
    meetings:      (deptId) => request.get('/admin/meetings', { params: { deptId } }),

    // D-05 创建会议
    // 入参：{ title, deptId, time, location, content, ... }
    createMeeting: (data)   => request.post('/admin/meetings', data),

    // D-05 保存会议考勤记录
    // 入参：id 会议ID；records [{ memberId, name, deptId, status }]
    //   status: 1到场 2迟到 3请假 4缺席
    saveMeetingRecords: (id, records) => request.put(`/admin/meetings/${id}/records`, { records }),
    deleteMeeting: (id) => request.delete(`/admin/meetings/${id}`),

    // D-06 考评列表
    // 入参：deptId 部门ID（100 表示全中心）
    evaluations:        (deptId) => request.get('/admin/evaluations', { params: { deptId } }),

    // D-07 获取考评模板（评分项、权重等）
    evaluationTemplate: ()       => request.get('/admin/evaluations/template'),

    // D-07 考评预览（根据打卡、会议、任务自动算分）
    // 入参：month 月份 yyyy-MM；memberNames 成员姓名数组
    previewEvaluation: (month, memberNames) =>
        request.post('/admin/evaluations/preview', { month, memberNames }),

    // D-08 发起/发布考评
    // 入参：{ month, members: [{ name, deptId, autoScore, manualScore, level, extraNote }] }
    createEvaluation: (data) => request.post('/admin/evaluations', data),

    // D-08 查看某成员某月考评明细
    // 入参：memberName 成员姓名；month 月份 yyyy-MM
    memberEvalDetail: (memberName, month) =>
        request.get('/admin/evaluations/detail', { params: { memberName, month } }),

    // D-09 本部门素材列表
    // 入参：deptId 部门ID（100 表示全中心）
    materials: (deptId) => request.get('/admin/materials', { params: { deptId } }),

    // D-11 公告列表
    announcements: () => request.get('/admin/announcements'),

    // D-11 新增/编辑公告
    // 入参：{ id?, title, content, scope, ... }（有 id 为编辑，无 id 为新增）
    saveAnnouncement: (data) => data.id
        ? request.put(`/admin/announcements/${data.id}`, data)
        : request.post('/admin/announcements', data),

    // D-11 删除公告
    // 入参：id 公告ID
    deleteAnnouncement: (id) => request.delete(`/admin/announcements/${id}`),

    // D-12 获取部门介绍
    // 入参：deptId 部门ID
    deptProfile: (deptId) => request.get('/admin/dept-profile', { params: { deptId } }),

    // D-12 保存部门介绍
    // 入参：deptId 部门ID；data { intro, leader, membersIntro, ... }
    saveDeptProfile: (deptId, data) => request.put('/admin/dept-profile', { deptId, ...data }),

    // D-13/D-17 数据看板（统计图表数据）
    dashboard: () => request.get('/admin/dashboard'),

    // D-13 上传 CSV 导入看板数据
    // 入参：type 数据类型；file 文件对象
    uploadCsv: (type, file) => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('type', type)
        return request.post('/admin/dashboard/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // D-14 打卡记录列表
    // 入参：{ date: 'yyyy-MM-dd', deptId }（deptId 传 0/100 表示全部）
    checkins: (params) => request.get('/admin/checkins', { params }),

    // D-14 手动标记打卡状态
    // 入参：id 记录ID；status 1-已打卡 0-未打卡
    markCheckin: (id, status /* , record 保留兼容，不再需要 */) =>
        request.put(`/admin/checkins/${id}`, { status }),

    // D-15 打卡申诉列表（综合部专用）
    checkinAppeals: () => request.get('/admin/checkins/appeals'),

    // D-15 审批打卡申诉
    // 入参：id 申诉ID；status 0待审批 1已通过 2已拒绝
    reviewAppeal: (id, status) => request.put(`/admin/checkins/appeals/${id}`, { status }),

    // D-16 打卡统计（综合部专用，按部门/时间段汇总）
    checkinStats: () => request.get('/admin/checkins/stats'),

    // D-18 设备档案列表（摄制部专用）
    devices: () => request.get('/admin/devices'),

    // D-18 新增/编辑设备档案
    // 入参：{ id?, name, model, stock, status, ... }（有 id 为编辑，无 id 为新增）
    saveDevice: (data) => data.id
        ? request.put(`/admin/devices/${data.id}`, data)
        : request.post('/admin/devices', data),

    // D-19 设备申请审核列表（摄制部专用）
    deviceApplications: () => request.get('/admin/device-applications'),

    // 更新任务关联的设备清单
    // 入参：taskId 任务ID；equipmentIds 设备ID数组
    updateTaskDevices: (taskId, equipmentIds) =>
        request.put(`/admin/tasks/${taskId}/devices`, { equipmentIds }),

    // D-19 审核设备申请
    // 入参：id 申请ID；data { status, opinion }
    //   status: 0待审核 1已通过 2已拒绝 3使用中 4已归还
    reviewDevice: (id, data) => request.put(`/admin/device-applications/${id}`, data),

    // 获取部门专属模块配置（决定该部门管理区显示哪些菜单）
    // 入参：deptId 部门ID
    getDeptModules: (deptId) => request.get('/admin/dept-modules', { params: { deptId } }),

    // 保存部门专属模块配置
    // 入参：deptId 部门ID；modules 模块路径数组
    saveDeptModules: (deptId, modules) => request.put('/admin/dept-modules', { deptId, modules }),

    // 获取管理区菜单（按部门+角色动态返回）
    // 入参：deptId 部门ID；role 角色 0部员 1部长 2主任
    getMenus: (deptId, role) => request.get('/admin/menus', { params: { deptId, role } }),

    // 为任务参与人打附加分（用于考评加分）
    // 入参：taskId 任务ID；memberName 成员姓名；score 分值；reason 加分理由
    updateTaskScore: (taskId, memberName, score, reason) =>
        request.put(`/admin/tasks/${taskId}/score`, { memberName, score, reason })
}