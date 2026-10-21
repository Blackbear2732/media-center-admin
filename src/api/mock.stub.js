/**
 * `VITE_USE_MOCK=false` 构建时，vite.config.js 会把 `@/api/mock` 别名到这里。
 *
 * 作用：
 * 1. 保持与 mock.js 相同的导出名，避免打包阶段出现「模块未导出」的告警；
 * 2. 让数百 KB 的演示数据（成员名单、任务、素材等）完全不进入生产产物。
 *
 * 真实后端模式下所有 mock 分支都不会被执行，因此这里的空值不会被页面读取。
 */
export const centerInfo = {}
export const departments = []
export const accounts = []
export const members = []
export const tasks = []
export const materials = []
export const attendance = {}
export const meetings = []
export const myDevices = []
export const messages = []
export const deviceList = []
export const deviceNames = []
export const deviceApplications = []
export const uploadFieldMap = {}
export const deptOverview = {}
export const adminMeetings = []
export const evaluationTemplates = {}
export const defaultEvaluationTemplate = []
export const evaluations = []
export const evaluationTemplate = []
export const checkinRecords = []
export const checkinAppeals = []
export const checkinStats = []
export const dashboardData = {}
export const announcements = []
export const deptProfiles = {}
export const baseAdminMenus = []
export const specialAdminMenus = {}
export const deptModuleConfig = {}
export const videos = []

export function findAccount() { return null }
export function currentUser() { return {} }
export function currentRole() { return 0 }
export function currentDeptId() { return 100 }
export function filterTasks() { return [] }
export function filterMaterials() { return [] }
