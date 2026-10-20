/* ==========================================
 * 1. 任务状态配置 (0-筹备 1-进行中 2-已结束)
 * ========================================== */
export const TASK_STATUS = {
    PREPARE: 0,
    DOING: 1,
    DONE: 2
}

export const TASK_STATUS_MAP = {
    0: '筹备中',
    1: '进行中',
    2: '已结束'
}
// 供下拉框使用
export const TASK_STATUS_OPTIONS = Object.keys(TASK_STATUS_MAP).map(key => ({
    value: Number(key),
    label: TASK_STATUS_MAP[key]
}))

// 获取任务状态的圆点 CSS 类名
export const getTaskDotClass = (status) => {
    const map = {
        0: 'dot-prepare',
        1: 'dot-doing',
        2: 'dot-done'
    }
    return map[status] || 'dot-prepare'
}

// 获取任务状态的 Element Plus Tag 类型
export const getTaskTagType = (status) => {
    const map = {
        0: 'info',
        1: 'warning',
        2: 'success'
    }
    return map[status] || 'info'
}

/* ==========================================
 * 2. 角色配置 (0-部员 1-部长 2-主任)
 * ========================================== */
export const ROLE_LABEL = {
    0: '部员',
    1: '部长',
    2: '中心主任'
}

export const getRoleLabel = (role) => ROLE_LABEL[role] || '部员'

/* ==========================================
 * 3. 部门配置 (100-全中心, 101~106 各部门)
 * ========================================== */
export const DEPT_MAP = {
    100: '全中心',
    101: '综合部',
    102: '网宣部',
    103: '影音部',
    104: '摄制部',
    105: '新闻部',
    106: '设计部'
}
export const DEPT_OPTIONS = Object.keys(DEPT_MAP).map(key => ({
    value: Number(key),
    label: DEPT_MAP[key]
}))

/* ==========================================
 * 4. 部门模块配置映射 (保持英文Code不变)
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
 * 5. 通用业务状态映射 (全部改为数字)
 * ========================================== */
export const getStatusTagType = (status) => {
    // 兼容传入的是数字或者字符串数字
    const s = Number(status)
    const map = {
        // 打卡
        0: 'danger',   // 未打卡
        1: 'success',  // 已打卡
        // 设备
        // 0: 'success', // 可用 (与打卡0冲突，设备可单独用下面的 DEVICE_STATUS_MAP)
        // 1: 'warning', // 借出
        // 审核/审批
        3: 'info',     // 待审核/待审批
        4: 'success',  // 已通过
        5: 'danger',   // 已拒绝
        6: 'warning',  // 使用中/审批中
        7: 'info',     // 在岗
        8: 'info'      // 停用
    }
    return map[s] || 'info'
}

// 由于数字会冲突（比如设备0是可用，打卡0是未打卡），建议在页面里直接用具体的 Map
export const DEVICE_STATUS_MAP = { 0: '可用', 1: '借出', 2: '维修', 3: '报废' }
export const getDeviceStatusType = (status) => ({ 0: 'success', 1: 'warning', 2: 'danger', 3: 'info' }[status] || 'info')

export const MEETING_STATUS_MAP = { 1: '到场', 2: '迟到', 3: '请假', 4: '缺席' }
export const getMeetingStatusType = (status) => ({ 1: 'success', 2: 'warning', 3: 'info', 4: 'danger' }[status] || 'info')

export const APPLY_STATUS_MAP = { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '使用中', 4: '已归还' }
export const getApplyStatusType = (status) => ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'warning', 4: 'success' }[status] || 'info')

// 角色 Tag 颜色
export const getRoleTagType = (role) => ({ 0: 'info', 1: 'warning', 2: 'danger' }[role] || 'info')
// 任务状态 Tag 颜色
export const getTaskStatusType = (status) => ({ 0: 'info', 1: 'warning', 2: 'success' }[status] || 'info')