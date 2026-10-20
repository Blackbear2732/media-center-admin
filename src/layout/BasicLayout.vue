<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" @click="router.push('/')">
          <div class="brand-logos">
            <img src="/image/logo/school.png" alt="校徽" class="brand-icon" />
            <img src="/image/logo/league.png" alt="团徽" class="brand-icon" />
            <div class="divider"></div>
            <img src="/image/logo/media.png" alt="融媒Logo" class="brand-icon media-icon" />
          </div>
          <div class="brand-text">
            <span class="brand-name">山西农业大学青年融媒体中心</span>
            <span class="brand-sub">YOUTH MEDIA CENTER · SXAU</span>
          </div>
        </div>

        <nav class="nav">
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
          <template v-if="userStore.isLogin">
            <el-badge :value="msgCount" :hidden="!msgCount">
              <button class="icon-btn" title="消息" @click="router.push('/my/messages')">
                <el-icon :size="18"><Bell /></el-icon>
              </button>
            </el-badge>
            <el-dropdown @command="onCommand">
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
                  <!-- 👇 加上了 v-if，只有普通部员才显示 -->
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { messageApi } from '@/api'
import { userStore } from '@/store/user'
import { getRoleLabel } from '@/utils/dict'

const route = useRoute()
const router = useRouter()
const msgCount = ref(0)

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

onUnmounted(() => {
  window.removeEventListener('update-unread-count', updateMsgCount)
})

watch(() => route.path, updateMsgCount)

async function onCommand(cmd) {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录吗？', '提示', {type: 'warning'})
      userStore.logout()
      ElMessage.success('已退出登录')
      router.replace('/login')
    } catch (e) {
    }
    return
  }
  if (cmd) router.push(cmd)
}
</script>