// 👇 1. 把 createWebHashHistory 换成 createWebHistory
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { reactive } from 'vue'
import BasicLayout from '@/layout/BasicLayout.vue'
import { abortPendingRequests } from '@/api/request'

// 全局路由 loading 状态：供 BasicLayout 显示切换遮罩
export const routeLoading = reactive({ value: false, text: '' })

// loading 引用计数 + 兜底超时，防止任何竞态/异常导致 loading 永远不关
let loadingCount = 0
let loadingFallbackTimer = null

function openLoading(text) {
    loadingCount++
    routeLoading.text = text || '加载中'
    routeLoading.value = true
    // 兜底：10 秒后强制关，防止任何情况下忘记关
    if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer)
    loadingFallbackTimer = setTimeout(() => closeLoading(true), 10000)
}

function closeLoading(force = false) {
    if (loadingFallbackTimer) { clearTimeout(loadingFallbackTimer); loadingFallbackTimer = null }
    loadingCount = force ? 0 : Math.max(0, loadingCount - 1)
    if (loadingCount === 0) routeLoading.value = false
}

const routes = [
    {
        path: '/', component: BasicLayout,
        children: [
            { path: '', component: () => import('@/views/Home.vue'), meta: { title: '首页', public: true } },
            { path: 'profile', component: () => import('@/views/user/Profile.vue'), meta: { title: '个人信息' } },
            // 👇 新增：MeoW 昵称获取教程
            { path: 'profile/meow-guide', component: () => import('@/views/user/MeowGuide.vue'), meta: { title: 'MeoW 昵称获取教程' } },
            { path: 'my/tasks', component: () => import('@/views/user/MyTasks.vue'), meta: { title: '我的任务' } },
            { path: 'my/checkins', component: () => import('@/views/user/MyCheckins.vue'), meta: { title: '我的打卡', roles: [0] } },
            { path: 'my/evaluations', component: () => import('@/views/user/MyEvaluations.vue'), meta: { title: '我的考评' } },
            { path: 'my/meetings', component: () => import('@/views/user/MyMeetings.vue'), meta: { title: '我的会议' } },
            { path: 'my/messages', component: () => import('@/views/user/MyMessages.vue'), meta: { title: '我的消息' } },
            { path: 'announcements', component: () => import('@/views/user/Announcements.vue'), meta: { title: '公告栏' } },
            { path: 'tasks', component: () => import('@/views/task/TaskList.vue'), meta: { title: '任务列表' } },
            { path: 'tasks/create', component: () => import('@/views/task/TaskCreate.vue'), meta: { title: '发布任务', roles: [1, 2] } },
            { path: 'tasks/:id', component: () => import('@/views/task/TaskDetail.vue'), meta: { title: '任务详情' } },
            { path: 'materials', component: () => import('@/views/material/MaterialList.vue'), meta: { title: '素材库' } },
            { path: 'materials/:id', component: () => import('@/views/material/MaterialDetail.vue'), meta: { title: '素材详情' } },
            { path: 'upload', component: () => import('@/views/material/Upload.vue'), meta: { title: '上传素材' } },
            { path: 'device-apply', component: () => import('@/views/device/DeviceApply.vue'), meta: { title: '设备申请' } },
            { path: 'data-panel/:type', component: () => import('@/views/data/DataDetail.vue'), meta: { title: '数据详情' } },
            { path: 'dept/:deptId', component: () => import('@/views/dept/DeptShowcase.vue'), meta: { title: '部门风采' } }
        ]
    },
    {
        path: '/admin', component: BasicLayout, meta: { roles: [1, 2] },
        children: [
            {
                path: '', component: () => import('@/views/admin/AdminLayout.vue'),
                children: [
                    { path: '', redirect: '/admin/overview' },
                    { path: 'overview', component: () => import('@/views/admin/Overview.vue'), meta: { title: '部门概览' } },
                    { path: 'members', component: () => import('@/views/admin/Members.vue'), meta: { title: '成员管理' } },
                    { path: 'tasks', component: () => import('@/views/admin/Tasks.vue'), meta: { title: '任务参与' } },
                    { path: 'meetings', component: () => import('@/views/admin/Meetings.vue'), meta: { title: '会议管理' } },
                    { path: 'evaluations', component: () => import('@/views/admin/Evaluations.vue'), meta: { title: '考评管理' } },
                    { path: 'eval-templates', component: () => import('@/views/admin/eval-templates.vue'), meta: { title: '考评模板' } },
                    { path: 'materials', component: () => import('@/views/admin/Materials.vue'), meta: { title: '本部门素材' } },
                    { path: 'announcements', component: () => import('@/views/admin/Announcements.vue'), meta: { title: '公告管理' } },
                    { path: 'dept-profile', component: () => import('@/views/admin/DeptProfile.vue'), meta: { title: '部门介绍' } },
                    { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '数据看板' } },
                    { path: 'checkins', component: () => import('@/views/admin/Checkins.vue'), meta: { title: '打卡管理' } },
                    { path: 'devices', component: () => import('@/views/admin/Devices.vue'), meta: { title: '设备管理' } },
                    { path: 'module-config', component: () => import('@/views/admin/ModuleConfig.vue'), meta: { title: '模块配置', roles: [2] } },
                    { path: 'mail-batches', component: () => import('@/views/admin/MailBatches.vue'), meta: { title: '邮件管理', roles: [2] } },
                    { path: 'election', component: () => import('@/views/admin/Election.vue'), meta: { title: '换届管理', roles: [2] } }
                ]
            }
        ]
    },
    { path: '/login', component: () => import('@/views/login/Login.vue'), meta: { title: '登录', public: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), scrollBehavior() { return { top: 0 } }, routes })

router.beforeEach((to, from, next) => {
    // 路由切换时取消上一页所有未完成的请求，避免旧数据回填 + 节省带宽
    if (from !== START_LOCATION) abortPendingRequests()

    document.title = `${to.meta.title || ''} - 山西农业大学青年融媒体中心`
    // 只在跨 chunk 切换（目标组件是懒加载）时才显示 loading，已预加载过的瞬间切换不会闪
    if (to !== from) openLoading(to.meta.title || '加载中')

    const token = localStorage.getItem('token')
    // 角色统一为数字：0 部员 / 1 部长 / 2 主任
    const rawRole = localStorage.getItem('role')
    const role = rawRole === null || rawRole === '' ? null : Number(rawRole)

    if (!to.meta.public && !token) {
        closeLoading(true)
        return next({ path: '/login', query: { redirect: to.fullPath } })
    }
    // 已登录用户访问登录页：直接回到首页，避免重复登录
    if (token && to.path === '/login') {
        return next('/')
    }
    if (to.meta.roles && !to.meta.roles.includes(role)) {
        // 被授权打卡管理的部员可进入管理区，但仅放行打卡管理页
        if (role === 0) {
            let checkinManager = false
            try {
                checkinManager = !!(JSON.parse(localStorage.getItem('user') || '{}').checkinManager)
            } catch (e) { /* ignore */ }
            if (checkinManager && to.path.startsWith('/admin')) {
                return next(to.path.startsWith('/admin/checkins') ? undefined : { path: '/admin/checkins' })
            }
        }
        closeLoading(true)
        return next({ path: '/' })
    }
    next()
})

// 懒加载组件下载完成后关掉 loading
router.afterEach(() => {
    // 延迟 50ms 再关，避免组件刚挂载完还在 onMounted 里做重活就又没遮罩了
    setTimeout(closeLoading, 50)
})

// 预加载 admin 管理区所有 chunk：首页加载完后浏览器空闲时偷偷下载，
// 用户第一次点管理菜单时 chunk 已经在缓存里了，不会闪一下
const adminChunks = () => [
    import('@/views/admin/AdminLayout.vue'),
    import('@/views/admin/Overview.vue'),
    import('@/views/admin/Members.vue'),
    import('@/views/admin/Tasks.vue'),
    import('@/views/admin/Meetings.vue'),
    import('@/views/admin/Evaluations.vue'),
    import('@/views/admin/eval-templates.vue'),
    import('@/views/admin/Materials.vue'),
    import('@/views/admin/Announcements.vue'),
    import('@/views/admin/DeptProfile.vue'),
    import('@/views/admin/Dashboard.vue'),
    import('@/views/admin/Checkins.vue'),
    import('@/views/admin/Devices.vue'),
    import('@/views/admin/ModuleConfig.vue'),
    import('@/views/admin/MailBatches.vue'),
    import('@/views/admin/Election.vue'),
    import('@/views/login/Login.vue'),
]
function idlePrefetch() {
    // requestIdleCallback 在浏览器空闲时执行（不阻塞主线程）
    const cb = () => { adminChunks() }
    if ('requestIdleCallback' in window) {
        requestIdleCallback(cb, { timeout: 10000 })
    } else {
        setTimeout(cb, 3000) // 降级：3s 后
    }
}
// 首页（首次路由 resolve 后）才触发预加载，避免非管理用户也下载一堆没用的
router.beforeResolve((to, _from, next) => {
    if (_from === START_LOCATION) {
        idlePrefetch()
    }
    next()
})

export default router