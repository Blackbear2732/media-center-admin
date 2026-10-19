<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" @click="router.push('/')">
          <div class="brand-mark">融</div>
          <div>
            <span class="brand-name">山西农业大学青年融媒体中心</span>
            <span class="brand-sub">YOUTH MEDIA CENTER · SXAU</span>
          </div>
        </div>

        <nav class="nav">
          <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">首页</router-link>
          <template v-if="isLogin">
            <router-link to="/tasks" class="nav-item" :class="{ active: route.path.startsWith('/tasks') }">任务</router-link>
            <router-link to="/materials" class="nav-item" :class="{ active: route.path.startsWith('/materials') }">素材库</router-link>
            <router-link to="/upload" class="nav-item" :class="{ active: route.path === '/upload' }">上传</router-link>
            <router-link to="/device-apply" class="nav-item" :class="{ active: route.path === '/device-apply' }">设备</router-link>
            <router-link v-if="canManage" to="/admin" class="nav-item admin-link"
                         :class="{ active: route.path.startsWith('/admin') }">部门管理</router-link>
          </template>
        </nav>

        <div class="topbar-right">
          <template v-if="isLogin">
            <el-badge :value="msgCount" :hidden="!msgCount">
              <button class="icon-btn" title="消息" @click="router.push('/my/messages')">
                <el-icon :size="18"><Bell /></el-icon>
              </button>
            </el-badge>
            <el-dropdown @command="onCommand">
              <div class="user-chip">
                <div class="avatar">{{ (userName || '未登录').slice(0, 1) }}</div>
                <div class="user-meta">
                  <span class="user-name">{{ userName }}</span>
                  <span class="user-role">{{ roleLabel }} · {{ userDept }}</span>
                </div>
                <el-icon :size="12"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="/profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="/my/tasks">我的任务</el-dropdown-item>
                  <el-dropdown-item command="/my/checkins">我的打卡</el-dropdown-item>
                  <el-dropdown-item command="/my/meetings">我的会议</el-dropdown-item>
                  <el-dropdown-item command="/my/devices">我的设备</el-dropdown-item>
                  <el-dropdown-item v-if="canManage" command="/admin" divided>部门管理区</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <button v-else class="login-btn" @click="router.push('/login')">登录</button>
        </div>
      </div>
    </header>

    <main class="main-area">
      <div class="main-inner"><router-view /></div>
    </main>

    <footer class="footer">山西农业大学青年融媒体中心 · 一次采集 · 多元生成 · 多端发布</footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi, authApi, messageApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userName = ref('')
const userDept = ref('')
const roleLabel = ref('')
const msgCount = ref(0)
// ✅ 将 isLogin 改为响应式变量，退出时可以直接修改它
const isLogin = ref(!!localStorage.getItem('token'))

const role = computed(() => localStorage.getItem('role') || 'member')
const canManage = computed(() => role.value === 'minister' || role.value === 'director')


async function loadTop() {
  if (!localStorage.getItem('token')) {
    isLogin.value = false
    userName.value = ''
    userDept.value = ''
    msgCount.value = 0
    return
  }
  isLogin.value = true
  try {
    const u = await userApi.profile()
    if (u) {
      userName.value = u.name || '用户'
      userDept.value = u.dept || ''
    } else {
      userName.value = '数据丢失'
    }
    roleLabel.value = { member: '部员', minister: '部长', director: '中心主任' }[role.value] || '部员'

    const msgs = await messageApi.list()
    msgCount.value = Array.isArray(msgs) ? msgs.filter(m => !m.read).length : 0
  } catch (e) {
    console.error('顶部信息加载失败:', e)
    // 如果加载失败，说明 token 可能过期或无效，直接踢下线
    localStorage.clear()
    isLogin.value = false
    router.push('/login')
  }
}

onMounted(loadTop)
watch(() => route.path, loadTop)

async function onCommand(cmd) {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })

      await authApi.logout()

      // 彻底清理本地缓存
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('adminDept')
      localStorage.removeItem('user')

      // ✅ 立即清空页面顶部状态
      isLogin.value = false
      userName.value = ''
      userDept.value = ''
      msgCount.value = 0

      ElMessage.success('已退出登录')
      // ✅ 强制跳转到登录页
      router.replace('/login')
    } catch (e) {
      // 用户取消确认框时什么都不做
      if (e !== 'cancel') console.error(e)
    }
    return
  }
  if (cmd) router.push(cmd)
}
</script>

<style scoped>
.topbar { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, .86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.topbar-inner { max-width: 1200px; margin: 0 auto; height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 32px; }
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.brand-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--brand), #4a86b8); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
.brand-name { font-weight: 700; font-size: 16px; letter-spacing: .5px; display: block; line-height: 1.1; }
.brand-sub { font-size: 10px; color: var(--text-sub); letter-spacing: 1px; }
.nav { display: flex; gap: 6px; flex: 1; }
.nav-item { padding: 8px 14px; border-radius: 8px; color: var(--text-sub); text-decoration: none; font-size: 14px; transition: all .18s; }
.nav-item:hover { color: var(--brand); background: var(--brand-soft); }
.nav-item.active { color: var(--brand); font-weight: 600; background: var(--brand-soft); }
.topbar-right { display: flex; align-items: center; gap: 14px; }
.icon-btn { border: none; background: transparent; cursor: pointer; color: var(--text-sub); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--brand-soft); color: var(--brand); }
.user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 10px 4px 4px; border-radius: 999px; transition: background .18s; }
.user-chip:hover { background: var(--brand-soft); }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--brand), var(--accent)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.user-meta { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-size: 13px; font-weight: 500; }
.user-role { font-size: 10px; color: var(--text-sub); }
.login-btn { padding: 8px 20px; border-radius: 999px; border: none; background: var(--brand); color: #fff; font-size: 13px; cursor: pointer; transition: all .18s; }
.login-btn:hover { background: var(--brand-deep); }
.admin-link { color: var(--accent) !important; }
.admin-link.active { background: #fdf1e6 !important; }
.main-area { min-height: calc(100vh - 64px - 56px); }
.main-inner { max-width: 1200px; margin: 0 auto; padding: 24px; }
.footer { text-align: center; padding: 20px; color: var(--text-sub); font-size: 12px; border-top: 1px solid var(--border); background: #fff; }
</style>