<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <!-- Logo 区域 -->
        <div class="brand" @click="router.push('/')">
          <div class="brand-logos">

            <img src="/image/logo/league.png" alt="团徽" class="brand-icon" />
            <img src="/image/logo/school.png" alt="校徽" class="brand-icon" />
            <div class="divider"></div>
            <img src="/image/logo/media.png" alt="融媒Logo" class="brand-icon media-icon" />
          </div>
          <div class="brand-text">
            <span class="brand-name">山西农业大学青年融媒体中心</span>
            <span class="brand-sub">YOUTH MEDIA CENTER · SXAU</span>
          </div>
        </div>

        <!-- PC 端导航栏 -->
        <nav class="nav pc-only">
          <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">首页</router-link>
          <template v-if="userStore.isLogin">
            <router-link to="/tasks" class="nav-item" :class="{ active: route.path.startsWith('/tasks') }">任务</router-link>
            <router-link to="/materials" class="nav-item" :class="{ active: route.path.startsWith('/materials') }">素材库</router-link>
            <router-link to="/upload" class="nav-item" :class="{ active: route.path === '/upload' }">上传</router-link>
            <router-link to="/device-apply" class="nav-item" :class="{ active: route.path === '/device-apply' }">设备</router-link>
            <router-link v-if="userStore.canManage" to="/admin" class="nav-item admin-link"
                         :class="{ active: route.path.startsWith('/admin') }">部门管理</router-link>
          </template>
        </nav>

        <div class="topbar-right">
          <!-- 手机端汉堡按钮 (仅手机显示) -->
          <button class="icon-btn mobile-only" @click="mobileMenuVisible = true">
            <el-icon :size="22"><Menu /></el-icon>
          </button>

          <!-- PC 端右侧用户信息 -->
          <template v-if="userStore.isLogin">
            <el-badge :value="msgCount" :hidden="!msgCount" class="pc-only">
              <button class="icon-btn" title="消息" @click="router.push('/my/messages')">
                <el-icon :size="18"><Bell /></el-icon>
              </button>
            </el-badge>
            <el-dropdown @command="onCommand" class="pc-only">
              <div class="user-chip">
                <div class="avatar">{{ (userStore.name || '?').slice(0, 1) }}</div>
                <div class="user-meta">
                  <span class="user-name">{{ userStore.name }}</span>
                  <span class="user-role">{{ roleLabel }} · {{ userStore.dept }}</span>
                </div>
                <el-icon :size="12"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="/profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="/my/tasks">我的任务</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isMember" command="/my/checkins">我的打卡</el-dropdown-item>
                  <el-dropdown-item command="/my/meetings">我的会议</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.canManage" command="/admin" divided>部门管理区</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <button v-else class="login-btn" @click="router.push('/login')">登录</button>
        </div>
      </div>
    </header>

    <!-- 手机端抽屉菜单 -->
    <el-drawer v-model="mobileMenuVisible" direction="rtl" size="70%" title="导航菜单">
      <div class="mobile-nav">
        <router-link to="/" class="mobile-nav-item" @click="mobileMenuVisible=false">首页</router-link>
        <template v-if="userStore.isLogin">
          <router-link to="/tasks" class="mobile-nav-item" @click="mobileMenuVisible=false">任务列表</router-link>
          <router-link to="/materials" class="mobile-nav-item" @click="mobileMenuVisible=false">素材库</router-link>
          <router-link to="/upload" class="mobile-nav-item" @click="mobileMenuVisible=false">上传素材</router-link>
          <router-link to="/device-apply" class="mobile-nav-item" @click="mobileMenuVisible=false">设备申请</router-link>
          <router-link v-if="userStore.canManage" to="/admin" class="mobile-nav-item" @click="mobileMenuVisible=false">部门管理</router-link>

          <div style="height: 1px; background: var(--border); margin: 16px 0;"></div>
          <router-link to="/profile" class="mobile-nav-item" @click="mobileMenuVisible=false">个人信息</router-link>
          <router-link to="/my/tasks" class="mobile-nav-item" @click="mobileMenuVisible=false">我的任务</router-link>
          <router-link to="/my/messages" class="mobile-nav-item" @click="mobileMenuVisible=false">我的消息 ({{ msgCount }})</router-link>
          <div class="mobile-nav-item" style="color: #f56c6c;" @click="onCommand('logout')">退出登录</div>
        </template>
        <router-link v-else to="/login" class="mobile-nav-item" @click="mobileMenuVisible=false">登录系统</router-link>
      </div>
    </el-drawer>

    <main class="main-area">
      <div class="main-inner"><router-view /></div>
    </main>

    <footer class="footer">
      <div class="footer-logos">
        <img src="/image/logo/school.png" alt="校徽" />
        <img src="/image/logo/league.png" alt="团徽" />
        <img src="/image/logo/media.png" alt="融媒Logo" />
      </div>
      <div class="footer-text">山西农业大学青年融媒体中心 · 一次采集 · 多元生成 · 多端发布</div>
    </footer>
  </div>
</template>

<script setup>
// 逻辑与之前完全一致，只是为了引入 Menu 图标和 drawer 状态增加了少许代码
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { messageApi, authApi } from '@/api'
import { userStore } from '@/store/user'
import { getRoleLabel } from '@/utils/dict'
import { Menu } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const msgCount = ref(0)
const mobileMenuVisible = ref(false) // 手机菜单可见性

const roleLabel = computed(() => getRoleLabel(userStore.role))

async function updateMsgCount() {
  if (!userStore.isLogin) {
    msgCount.value = 0
    return
  }
  try {
    const msgs = await messageApi.list()
    msgCount.value = Array.isArray(msgs) ? msgs.filter(m => !m.read).length : 0
  } catch (e) {}
}

onMounted(() => {
  updateMsgCount()
  window.addEventListener('update-unread-count', updateMsgCount)
})
onUnmounted(() => window.removeEventListener('update-unread-count', updateMsgCount))
watch(() => route.path, () => { updateMsgCount(); mobileMenuVisible.value = false; })

async function onCommand(cmd) {
  if (cmd === 'logout') {
    mobileMenuVisible.value = false
    try {
      await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })
      userStore.logout()
      ElMessage.success('已退出登录')
      router.replace('/login')
    } catch (e) {}
    return
  }
  if (cmd) router.push(cmd)
}
</script>

<style scoped>
/* 保留之前的样式，并在末尾添加响应式控制 */
.topbar { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, .86); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.topbar-inner { max-width: 1200px; margin: 0 auto; height: 64px; padding: 0 24px; display: flex; align-items: center; gap: 32px; }
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.brand-logos { display: flex; align-items: center; gap: 8px; }
.brand-icon { height: 32px; width: auto; object-fit: contain; }
.media-icon { height: 36px; }
.brand-logos .divider { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
.brand-text { display: flex; flex-direction: column; line-height: 1.2; }
.brand-name { font-weight: 700; font-size: 16px; letter-spacing: .5px; color: var(--text); }
.brand-sub { font-size: 10px; color: var(--text-sub); letter-spacing: 1px; }
.nav { display: flex; gap: 6px; flex: 1; }
.nav-item { padding: 8px 14px; border-radius: 8px; color: var(--text-sub); text-decoration: none; font-size: 14px; transition: all .18s; }
.nav-item:hover, .nav-item.active { color: var(--brand); background: var(--brand-soft); font-weight: 600; }
.admin-link { color: var(--accent) !important; }
.admin-link.active { background: #fdf1e6 !important; }
.topbar-right { display: flex; align-items: center; gap: 14px; }
.icon-btn { border: none; background: transparent; cursor: pointer; color: var(--text-sub); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 10px 4px 4px; border-radius: 999px; transition: background .18s; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--brand), var(--accent)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.user-meta { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-size: 13px; font-weight: 500; }
.user-role { font-size: 10px; color: var(--text-sub); }
.login-btn { padding: 8px 20px; border-radius: 999px; border: none; background: var(--brand); color: #fff; font-size: 13px; cursor: pointer; }
.main-area { min-height: calc(100vh - 64px - 56px); }
.main-inner { max-width: 1200px; margin: 0 auto; padding: 24px; }
.footer { text-align: center; padding: 24px 20px; color: var(--text-sub); font-size: 12px; border-top: 1px solid var(--border); background: #fff; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.footer-logos { display: flex; gap: 16px; align-items: center; }
.footer-logos img { height: 28px; width: auto; opacity: 0.8; }

/* 手机端抽屉菜单样式 */
.mobile-nav { display: flex; flex-direction: column; gap: 4px; }
.mobile-nav-item { padding: 12px 16px; font-size: 15px; color: var(--text); text-decoration: none; border-radius: 8px; transition: background 0.2s; cursor: pointer; }
.mobile-nav-item:hover { background: var(--brand-soft); color: var(--brand); }

/* 隐藏/显示控制 */
.mobile-only { display: none; }
@media (max-width: 768px) {
  .pc-only { display: none !important; }
  .mobile-only { display: flex; }
  .topbar-inner { padding: 0 16px; justify-content: space-between; gap: 0; }
  .brand-text { display: none; } /* 手机端隐藏文字，只留 Logo */
  .main-inner { padding: 12px; }
}
</style>