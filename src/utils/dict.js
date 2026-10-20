/* ==========================================
 * 1. 任务状态配置
 * ========================================== */
export const TASK_STATUS = {
    PREPARE: '筹备',
    DOING: '进行中',
    DONE: '已结束'
}

// 获取任务状态的圆点 CSS 类名
export const getTaskDotClass = (status) => {
    const map = {
        [TASK_STATUS.PREPARE]: 'dot-prepare',
        [TASK_STATUS.DOING]: 'dot-doing',
        [TASK_STATUS.DONE]: 'dot-done'
    }
    return map[status] || 'dot-prepare'
}

// 获取任务状态的 Element Plus Tag 类型
export const getTaskTagType = (status) => {
    const map = {
        [TASK_STATUS.PREPARE]: 'info',
        [TASK_STATUS.DOING]: 'warning',
        [TASK_STATUS.DONE]: 'success'
    }
    return map[status] || 'info'
}

/* ==========================================
 * 2. 角色配置
 * ========================================== */
export const ROLE_LABEL = {
    member: '部员',
    minister: '部长',
    director: '中心主任'
}

export const getRoleLabel = (role) => ROLE_LABEL[role] || '部员'

/* ==========================================
 * 3. 部门模块配置映射
 * ========================================== */
export const MODULE_LABEL = {
    checkin: '打卡管理',
    dashboard: '数据看板',
    device: '设备管理',
    article: '推文运营',
    video: '视频制作',
    raw: '现场摄制',
    news: '新闻采编',
    design: '视觉设计'
}

/* ==========================================
 * 4. 通用业务状态映射 (Tag 类型)
 * ========================================== */
export const getStatusTagType = (status) => {
    const map = {
        // 任务
        '筹备': 'info',
        '进行中': 'warning',
        '已结束': 'success',
        // 考勤/打卡
        '正常': 'success',
        '迟到': 'warning',
        '缺勤': 'danger',
        '已打卡': 'success',
        '未打卡': 'danger',
        // 设备
        '可用': 'success',
        '借出': 'warning',
        '维修': 'danger',
        '报废': 'info',
        '使用中': 'warning',
        '已归还': 'success',
        // 审核/审批
        '待审核': 'info',
        '待审批': 'info',
        '审批中': 'warning',
        '已通过': 'success',
        '已拒绝': 'danger',
        // 会议
        '已参加': 'success',
        '待参加': 'info',
        // 人员
        '在岗': 'success',
        '停用': 'info'
    }
    return map[status] || 'info'
}