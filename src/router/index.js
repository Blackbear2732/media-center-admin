import { createRouter, createWebHashHistory } from 'vue-router'
import BasicLayout from '@/layout/BasicLayout.vue'

const routes = [
    {
        path: '/', component: BasicLayout,
        children: [
            { path: '', component: () => import('@/views/Home.vue'), meta: { title: '首页', public: true } },
            { path: 'profile', component: () => import('@/views/user/Profile.vue'), meta: { title: '个人信息' } },
            { path: 'my/tasks', component: () => import('@/views/user/MyTasks.vue'), meta: { title: '我的任务' } },
            { path: 'my/checkins', component: () => import('@/views/user/MyCheckins.vue'), meta: { title: '我的打卡' } },
            { path: 'my/meetings', component: () => import('@/views/user/MyMeetings.vue'), meta: { title: '我的会议' } },
            { path: 'my/devices', component: () => import('@/views/user/MyDevices.vue'), meta: { title: '我的设备' } },
            { path: 'my/messages', component: () => import('@/views/user/MyMessages.vue'), meta: { title: '我的消息' } },
            { path: 'tasks', component: () => import('@/views/task/TaskList.vue'), meta: { title: '任务列表' } },
            { path: 'tasks/create', component: () => import('@/views/task/TaskCreate.vue'), meta: { title: '发布任务', roles: ['minister', 'director'] } },
            { path: 'tasks/:id', component: () => import('@/views/task/TaskDetail.vue'), meta: { title: '任务详情' } },
            { path: 'materials', component: () => import('@/views/material/MaterialList.vue'), meta: { title: '素材库' } },
            { path: 'data-panel/:type', component: () => import('@/views/data/DataDetail.vue'), meta: { title: '数据详情' } },
            { path: 'materials/:id', component: () => import('@/views/material/MaterialDetail.vue'), meta: { title: '素材详情' } },
            { path: 'upload', component: () => import('@/views/material/Upload.vue'), meta: { title: '上传素材' } },
            { path: 'device-apply', component: () => import('@/views/device/DeviceApply.vue'), meta: { title: '设备申请' } }
        ]
    },
    {
        path: '/admin', component: BasicLayout, meta: { roles: ['minister', 'director'] },
        children: [
            {
                path: '', component: () => import('@/views/admin/AdminLayout.vue'),
                children: [
                    { path: '', redirect: '/admin/overview' },
                    { path: 'overview', component: () => import('@/views/admin/Overview.vue'), meta: { title: '部门概览' } },
                    { path: 'members', component: () => import('@/views/admin/Members.vue'), meta: { title: '成员管理' } },
                    { path: 'tasks', component: () => import('@/views/admin/Tasks.vue'), meta: { title: '任务参与管理' } },
                    { path: 'meetings', component: () => import('@/views/admin/Meetings.vue'), meta: { title: '会议管理' } },
                    { path: 'evaluations', component: () => import('@/views/admin/Evaluations.vue'), meta: { title: '考评管理' } },
                    { path: 'materials', component: () => import('@/views/admin/Materials.vue'), meta: { title: '本部门素材' } },
                    { path: 'announcements', component: () => import('@/views/admin/Announcements.vue'), meta: { title: '公告管理' } },
                    { path: 'dept-profile', component: () => import('@/views/admin/DeptProfile.vue'), meta: { title: '部门介绍' } },
                    { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '数据看板' } },
                    { path: 'checkins', component: () => import('@/views/admin/Checkins.vue'), meta: { title: '打卡管理', dept: '综合部' } },
                    { path: 'devices', component: () => import('@/views/admin/Devices.vue'), meta: { title: '设备管理', dept: '摄制部' } }
                ]
            }
        ]
    },
    { path: '/login', component: () => import('@/views/login/Login.vue'), meta: { title: '登录', public: true } }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to, from, next) => {
    document.title = `${to.meta.title || ''} - 山西农业大学青年融媒体中心`
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role') || 'member'

    try {
        if (!to.meta.public && !token) {
            return next({ path: '/login', query: { redirect: to.fullPath } })
        }
        if (to.meta.roles && !to.meta.roles.includes(role)) {
            return next({ path: '/' })
        }
        // 👇 删掉原来关于 meta.dept 的拦截，直接放行
        next()
    } catch (e) {
        console.error('路由守卫异常:', e)
        next(false)
    }
})

export default router