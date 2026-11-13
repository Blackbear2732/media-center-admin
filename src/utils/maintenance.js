/**
 * 后端维护（定时关机）相关逻辑
 *
 * 后端每天 23:00 - 次日 07:00 定时关机，关机期间请求拿不到任何响应。
 * 这里集中维护三件事，避免各页面各写一套：
 * - 时段判断（决定维护页展示「计划维护」还是「意外不可用」）
 * - 跳转维护页（统一 router.replace，并带 type 参数）
 * - 防重入锁（同一页并发多个请求同时失败时只跳一次）
 */

export const MAINTENANCE_PATH = '/maintenance'

export const MAINTENANCE_TYPE = {
    PLANNED: 'planned', // 计划维护（23:00 - 次日 07:00）
    UNPLANNED: 'unplanned' // 意外不可用
}

// 计划维护时段：23:00 起，至次日 07:00 结束
const PLANNED_START_HOUR = 23
const PLANNED_END_HOUR = 7

/**
 * 当前时间是否处于计划维护时段（23:00 - 次日 07:00）
 * @param {Date} [date] 待判断的时间，默认当前时间
 * @returns {boolean}
 */
export function isPlannedMaintenanceTime(date = new Date()) {
    const hour = date.getHours()
    return hour >= PLANNED_START_HOUR || hour < PLANNED_END_HOUR
}

/**
 * 维护类型：计划维护 / 意外不可用
 * @param {Date} [date] 待判断的时间，默认当前时间
 * @returns {'planned'|'unplanned'}
 */
export function getMaintenanceType(date = new Date()) {
    return isPlannedMaintenanceTime(date) ? MAINTENANCE_TYPE.PLANNED : MAINTENANCE_TYPE.UNPLANNED
}

// 防重入锁：跳转发起后置位，跳转完成后释放，用户「重新连接」后可再次触发
let redirecting = false

/**
 * 跳转维护页
 * - 用 router.replace（不是 push），避免用户点返回又回到出错页面；
 *   也不用整页跳转，避免刷新时再次触发一串失败请求
 * - request.js 被 router 静态引用，这里用动态 import 取 router，避免循环依赖
 * - 并发请求同时失败时只跳一次
 */
export async function redirectToMaintenance() {
    if (redirecting) return
    redirecting = true
    try {
        const { default: router } = await import('@/router')
        if (router.currentRoute.value.path === MAINTENANCE_PATH) return
        await router.replace({
            path: MAINTENANCE_PATH,
            query: { type: getMaintenanceType() }
        })
    } catch (e) {
        console.error('跳转维护页失败', e)
    } finally {
        redirecting = false
    }
}
