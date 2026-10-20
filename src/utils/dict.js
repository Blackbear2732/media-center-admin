/**
 * 前端字典中心
 *
 * 约定（与若依后端 / 数据库设计一致）：
 * 1. 所有枚举字段在前端只存「数字」，中文只在这里出现一次；
 * 2. 部门统一使用 deptId（100 = 全中心，101~106 = 各业务部门）；
 * 3. 角色统一使用 role（0 部员 / 1 部长 / 2 主任）；
 * 4. 页面里不要再写 '新闻部' / '进行中' / '在岗' 这类中文字面量，
 *    下拉框取 *_OPTIONS，表格展示取 *_MAP，标签颜色取 get*Type()。
 *
 * 后续接入若依后，可以把 *_MAP 换成 GET /system/dict/data/type/{dictType}
 * 的返回值，页面代码不需要再改。
 */

/* ==========================================
 * 1. 部门字典（sys_dept）
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

// 全中心 + 六个部门（用于主任切换部门视角）
export const DEPT_OPTIONS = Object.keys(DEPT_MAP).map(key => ({
    value: Number(key),
    label: DEPT_MAP[key]
}))

// 仅业务部门（发布任务、上传素材、新增成员时不能选「全中心」）
export const DEPARTMENTS_OPTIONS = DEPT_OPTIONS.filter(item => item.value !== 100)

export const ALL_DEPT_ID = 100

export const getDeptLabel = (deptId) => DEPT_MAP[deptId] || '未知部门'

// 是否全中心视角（主任默认视角）
export const isAllDept = (deptId) => !deptId || Number(deptId) === ALL_DEPT_ID

/* ==========================================
 * 2. 角色字典（sys_role）
 * ========================================== */
export const ROLE = {
    MEMBER: 0,
    MINISTER: 1,
    DIRECTOR: 2
}

export const ROLE_LABEL = {
    0: '部员',
    1: '部长',
    2: '中心主任'
}

export const ROLE_OPTIONS = Object.keys(ROLE_LABEL).map(key => ({
    value: Number(key),
    label: ROLE_LABEL[key]
}))

export const getRoleLabel = (role) => ROLE_LABEL[role] || '部员'

export const getRoleTagType = (role) => ({ 0: 'info', 1: 'warning', 2: 'danger' }[role] || 'info')

/* ==========================================
 * 3. 成员状态（biz_user_profile.status / sys_user.status）
 * ========================================== */
export const MEMBER_STATUS_MAP = { 0: '停用', 1: '在岗' }
export const MEMBER_STATUS_OPTIONS = Object.keys(MEMBER_STATUS_MAP).map(key => ({
    value: Number(key),
    label: MEMBER_STATUS_MAP[key]
}))
export const getMemberStatusType = (status) => (Number(status) === 1 ? 'success' : 'info')

/* ==========================================
 * 4. 任务状态（biz_task.status）
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

export const TASK_STATUS_OPTIONS = Object.keys(TASK_STATUS_MAP).map(key => ({
    value: Number(key),
    label: TASK_STATUS_MAP[key]
}))

// 任务列表筛选：-1 代表全部
export const TASK_STATUS_FILTER_OPTIONS = [{ value: -1, label: '全部' }, ...TASK_STATUS_OPTIONS]

export const getTaskStatusLabel = (status) => TASK_STATUS_MAP[status] || '筹备中'

// 获取任务状态的圆点 CSS 类名
export const getTaskDotClass = (status) => ({
    0: 'dot-prepare',
    1: 'dot-doing',
    2: 'dot-done'
}[status] || 'dot-prepare')

// 获取任务状态的 Element Plus Tag 类型
export const getTaskTagType = (status) => ({
    0: 'info',
    1: 'warning',
    2: 'success'
}[status] || 'info')

// 兼容旧命名
export const getTaskStatusType = getTaskTagType

/* ==========================================
 * 5. 任务报名状态（biz_task_member.apply_status）
 * ========================================== */
export const SIGNUP_STATUS_MAP = { 0: '待确认', 1: '已确认', 2: '已拒绝' }

/* ==========================================
 * 6. 素材类型（biz_material.type：1新闻稿 2推文图片 3海报设计图 4视频素材 5视频成片 6原创推文）
 * ========================================== */
export const MATERIAL_TYPE = {
    NEWS: 1,
    IMAGE: 2,
    POSTER: 3,
    VIDEO_RAW: 4,
    VIDEO_FINAL: 5,
    ARTICLE: 6
}

export const MATERIAL_TYPE_MAP = {
    1: '新闻稿',
    2: '推文图片',
    3: '海报设计图',
    4: '视频素材',
    5: '视频成片',
    6: '原创推文'
}

export const MATERIAL_TYPE_OPTIONS = Object.keys(MATERIAL_TYPE_MAP).map(key => ({
    value: Number(key),
    label: MATERIAL_TYPE_MAP[key]
}))

export const getMaterialTypeLabel = (type) => MATERIAL_TYPE_MAP[type] || '其他素材'
export const getMaterialTypeTagType = (type) => ({
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: 'danger',
    6: 'success'
}[type] || 'info')

/* ==========================================
 * 7. 设备状态（biz_equipment.status）
 * ========================================== */
export const DEVICE_STATUS = { AVAILABLE: 0, LENT: 1, REPAIR: 2, SCRAPPED: 3 }

export const DEVICE_STATUS_MAP = { 0: '可用', 1: '借出', 2: '维修', 3: '报废' }
export const DEVICE_STATUS_OPTIONS = Object.keys(DEVICE_STATUS_MAP).map(key => ({
    value: Number(key),
    label: DEVICE_STATUS_MAP[key]
}))
export const getDeviceStatusType = (status) => ({
    0: 'success', 1: 'warning', 2: 'danger', 3: 'info'
}[status] || 'info')

/* ==========================================
 * 8. 设备申请状态（biz_equipment_apply.status）
 * ========================================== */
export const APPLY_STATUS_MAP = { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '使用中', 4: '已归还' }
export const APPLY_STATUS_OPTIONS = Object.keys(APPLY_STATUS_MAP).map(key => ({
    value: Number(key),
    label: APPLY_STATUS_MAP[key]
}))
export const getApplyStatusType = (status) => ({
    0: 'info', 1: 'success', 2: 'danger', 3: 'warning', 4: 'success'
}[status] || 'info')

/* ==========================================
 * 9. 打卡状态（biz_checkin_record.status：0未转发 1已转发）
 * ========================================== */
export const CHECKIN_STATUS_MAP = { 0: '未打卡', 1: '已打卡' }
export const getCheckinStatusType = (status) => (Number(status) === 1 ? 'success' : 'danger')

// 个人考勤明细（正常 / 迟到 / 缺勤）
export const ATTENDANCE_STATUS = { NONE: 0, NORMAL: 1, LATE: 2, ABSENT: 3 }

export const ATTENDANCE_STATUS_MAP = { 0: '未打卡', 1: '正常', 2: '迟到', 3: '缺勤' }
export const getAttendanceStatusType = (status) => ({
    0: 'info', 1: 'success', 2: 'warning', 3: 'danger'
}[status] || 'info')

/* ==========================================
 * 10. 打卡申诉状态（biz_checkin_appeal.status）
 * ========================================== */
export const APPEAL_STATUS_MAP = { 0: '待审批', 1: '已通过', 2: '已拒绝' }
export const getAppealStatusType = (status) => ({
    0: 'info', 1: 'success', 2: 'danger'
}[status] || 'info')

/* ==========================================
 * 11. 会议签到状态（biz_meeting_member.status：1到场 2迟到 3请假 4缺席）
 * ========================================== */
export const MEETING_STATUS_MAP = { 1: '到场', 2: '迟到', 3: '请假', 4: '缺席' }
export const MEETING_STATUS_OPTIONS = Object.keys(MEETING_STATUS_MAP).map(key => ({
    value: Number(key),
    label: MEETING_STATUS_MAP[key]
}))
export const getMeetingStatusType = (status) => ({
    1: 'success', 2: 'warning', 3: 'info', 4: 'danger'
}[status] || 'info')

// 个人参会状态（0待参加 1已参加）
export const MEETING_JOIN_STATUS_MAP = { 0: '待参加', 1: '已参加' }
export const getMeetingJoinStatusType = (status) => (Number(status) === 1 ? 'success' : 'info')

/* ==========================================
 * 12. 考评等级（biz_evaluation_detail：0不合格 1合格 2良好 3优秀）
 * ========================================== */
export const EVAL_LEVEL_MAP = { 0: '不合格', 1: '合格', 2: '良好', 3: '优秀' }
export const EVAL_LEVEL_OPTIONS = Object.keys(EVAL_LEVEL_MAP).map(key => ({
    value: Number(key),
    label: EVAL_LEVEL_MAP[key]
}))
export const getEvalLevelLabel = (level) => EVAL_LEVEL_MAP[level] || '未评级'
export const getEvalLevelType = (level) => ({
    0: 'info', 1: 'primary', 2: 'warning', 3: 'danger'
}[level] || 'info')

// 考评状态（biz_evaluation.status：0草稿 1已发布）
export const EVAL_STATUS_MAP = { 0: '草稿', 1: '已发布' }

/* ==========================================
 * 13. 公告范围（biz_notice）
 * ========================================== */
export const NOTICE_SCOPE_MAP = { 1: '全体', 2: '本部门' }
export const NOTICE_SCOPE_OPTIONS = Object.keys(NOTICE_SCOPE_MAP).map(key => ({
    value: Number(key),
    label: NOTICE_SCOPE_MAP[key]
}))
export const getNoticeScopeLabel = (scope) => NOTICE_SCOPE_MAP[scope] || '全体'

/* ==========================================
 * 14. 部门业务模块（biz_dept_module.module_key）
 * ========================================== */
export const MODULE_LABEL = {
    checkin: '打卡管理',
    dashboard: '数据看板',
    device: '设备管理',
    equipment: '设备管理',
    article: '推文运营',
    video: '视频制作',
    raw: '现场摄制',
    news: '新闻采编',
    design: '视觉设计'
}

/* ==========================================
 * 15. 兼容旧代码的通用标签颜色（新代码请用上面具体的 getXxxType）
 * ========================================== */
export const getStatusTagType = (status) => ({
    0: 'danger',
    1: 'success',
    2: 'warning',
    3: 'info'
}[Number(status)] || 'info')
