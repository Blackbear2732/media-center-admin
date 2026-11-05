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
            <router-link to="/announcements" class="nav-item" :class="{ active: route.path === '/announcements' }">公告栏</router-link>
            <router-link to="/materials" class="nav-item" :class="{ active: route.path.startsWith('/materials') }">素材库</router-link>
            <router-link to="/upload" class="nav-item" :class="{ active: route.path === '/upload' }">上传</router-link>
            <router-link to="/device-apply" class="nav-item" :class="{ active: route.path === '/device-apply' }">设备</router-link>
            <router-link v-if="userStore.canManage || userStore.isCheckinManager"
                         :to="userStore.canManage ? '/admin' : '/admin/checkins'" class="nav-item admin-link"
                         :class="{ active: route.path.startsWith('/admin') }">
              {{ userStore.canManage ? '部门管理' : '打卡管理' }}
            </router-link>
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
                  <span class="user-role">{{ roleLabel }} · {{ userStore.deptLabel }}</span>
                </div>
                <el-icon :size="12"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="/profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="/my/tasks">我的任务</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isMember" command="/my/checkins">我的打卡</el-dropdown-item>
                  <el-dropdown-item command="/my/meetings">我的会议</el-dropdown-item>
                  <el-dropdown-item command="/my/evaluations">我的考评</el-dropdown-item>
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
          <router-link to="/announcements" class="mobile-nav-item" @click="mobileMenuVisible=false">公告栏</router-link>
          <router-link to="/materials" class="mobile-nav-item" @click="mobileMenuVisible=false">素材库</router-link>
          <router-link to="/upload" class="mobile-nav-item" @click="mobileMenuVisible=false">上传素材</router-link>
          <router-link to="/device-apply" class="mobile-nav-item" @click="mobileMenuVisible=false">设备申请</router-link>
          <router-link v-if="userStore.canManage || userStore.isCheckinManager"
                       :to="userStore.canManage ? '/admin' : '/admin/checkins'" class="mobile-nav-item" @click="mobileMenuVisible=false">
            {{ userStore.canManage ? '部门管理' : '打卡管理' }}
          </router-link>

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
      <div class="main-inner">
        <!-- 懒加载组件下载时显示的 loading 遮罩，替代白屏闪一下 -->
        <div v-if="routeLoading.value" class="route-loading-mask">
          <div class="route-loading-spinner"></div>
          <span class="route-loading-text">{{ routeLoading.text || '加载中...' }}</span>
        </div>
        <router-view />
      </div>
    </main>

    <!-- 甘特图页需要铺满视口且不产生外层滚动，隐藏页脚（其他页面保持原样） -->
    <footer v-if="!isGanttPage" class="footer">
      <div class="footer-logos">
        <img src="/image/logo/school.png" alt="校徽" />
        <img src="/image/logo/league.png" alt="团徽" />
        <img src="/image/logo/media.png" alt="融媒Logo" />
      </div>
      <div class="footer-text">山西农业大学青年融媒体中心 · 一次采集 · 多元生成 · 多端发布</div>
    </footer>

    <!-- 首次登录补全邮箱：不阻断路由跳转，登录后由 store 标记触发 -->
    <el-dialog
        v-model="emailBindVisible"
        title="补全邮箱"
        width="480px"
        class="email-bind-dialog"
        :close-on-click-modal="false"
        @closed="onEmailBindClosed"
    >
      <p class="email-bind-tip">邮箱用于接收任务、会议与公告通知，也是找回密码的唯一凭证，请填写常用真实邮箱。</p>
      <el-form label-position="top" @submit.prevent>
        <el-form-item label="邮箱" required>
          <el-input
              ref="emailInputRef"
              v-model="emailForm.email"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              clearable
              @input="emailError = ''"
              @keyup.enter="sendEmailCode"
          />
        </el-form-item>
        <el-form-item label="邮箱验证码" required>
          <div class="code-row">
            <el-input
                v-model="emailForm.code"
                class="code-input"
                maxlength="6"
                placeholder="6 位数字验证码"
                clearable
                @input="emailError = ''"
                @keyup.enter="saveEmailBind"
            />
            <el-button
                class="code-btn"
                :disabled="codeCountdown > 0"
                :loading="codeSending"
                @click="sendEmailCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <p v-if="emailError" class="email-bind-error">{{ emailError }}</p>
      <template #footer>
        <div class="email-bind-footer">
          <el-button @click="laterEmailBind">稍后再说</el-button>
          <el-button type="primary" :loading="emailSaving" @click="saveEmailBind">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 逻辑与之前完全一致，只是为了引入 Menu 图标和 drawer 状态增加了少许代码
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { messageApi, userApi } from '@/api'
import { getFriendlyErrorMessage } from '@/api/request'
import { userStore } from '@/store/user'
import { getRoleLabel } from '@/utils/dict'
import { routeLoading } from '@/router'
import { Menu, Bell, ArrowDown, ChatDotRound } from '@element-plus/icons-vue'
const route = useRoute()
const router = useRouter()
const msgCount = ref(0)
const mobileMenuVisible = ref(false) // 手机菜单可见性
const roleLabel = computed(() => getRoleLabel(userStore.role))
const isGanttPage = computed(() => route.path === '/task/gantt')

async function updateMsgCount() {
  if (!userStore.isLogin) {
    msgCount.value = 0
    return
  }
  try {
    const msgs = await messageApi.list()
    // is_read：0 未读 / 1 已读
    msgCount.value = Array.isArray(msgs) ? msgs.filter(m => Number(m.isRead) === 0).length : 0
  } catch (e) {}
}

let msgDebounce = null
function debouncedUpdateMsg() {
  if (msgDebounce) clearTimeout(msgDebounce)
  msgDebounce = setTimeout(updateMsgCount, 500) // 500ms 防抖
}

onMounted(() => {
  updateMsgCount()
  window.addEventListener('update-unread-count', debouncedUpdateMsg)
})
onUnmounted(() => {
  if (msgDebounce) clearTimeout(msgDebounce)
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = null
  window.removeEventListener('update-unread-count', debouncedUpdateMsg)
})
watch(() => route.path, () => { debouncedUpdateMsg(); mobileMenuVisible.value = false; })

// ============ 首次登录补全邮箱 ============
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EMAIL_DISMISS_PREFIX = 'media:emailBindDismissedAt:'
// 当前页面实例的挂载时间：用于区分“本次浏览”和刷新后的新页面
const emailBindMountedAt = Date.now()
const emailBindVisible = ref(false)
const emailSaving = ref(false)
const emailError = ref('')
const emailInputRef = ref()
const emailForm = reactive({ email: '', code: '' })
const codeSending = ref(false)
const codeCountdown = ref(0)
let codeTimer = null

function emailDismissKey() {
  const uid = userStore.userInfo?.userId || userStore.userInfo?.id || 'anonymous'
  return EMAIL_DISMISS_PREFIX + uid
}

function openEmailBind() {
  const dismissedAt = Number(sessionStorage.getItem(emailDismissKey()) || 0)
  // 同一页面浏览内点过“稍后再说”就不再弹；刷新后挂载时间更新，会重新提示
  if (dismissedAt >= emailBindMountedAt) return
  emailForm.email = ''
  emailForm.code = ''
  emailError.value = ''
  emailBindVisible.value = true
  nextTick(() => emailInputRef.value?.focus())
}

function laterEmailBind() {
  sessionStorage.setItem(emailDismissKey(), String(Date.now()))
  emailBindVisible.value = false
}

function onEmailBindClosed() {
  emailError.value = ''
}

function stopCodeCountdown() {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
  codeCountdown.value = 0
}

function startCodeCountdown() {
  stopCodeCountdown()
  codeCountdown.value = 60
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) stopCodeCountdown()
  }, 1000)
}

// 真实接口的中文提示在响应体 msg 里（拦截器另外会弹一次），这里取出来展示在弹窗内；
// 技术类错误（SQL/堆栈）由兜底函数换成可读文案，原文只写控制台
function apiErrMsg(e, fallback) {
  return getFriendlyErrorMessage(e, fallback)
}

async function sendEmailCode() {
  const email = emailForm.email.trim()
  if (!email) {
    emailError.value = '请先填写邮箱，再获取验证码'
    nextTick(() => emailInputRef.value?.focus())
    return
  }
  if (!EMAIL_RE.test(email)) {
    emailError.value = '邮箱格式不正确，请填写类似 name@example.com 的地址'
    return
  }
  codeSending.value = true
  emailError.value = ''
  try {
    await userApi.sendEmailCode(email)
    ElMessage.success('验证码已发送，请到该邮箱查收（10 分钟内有效）')
    startCodeCountdown()
  } catch (e) {
    console.error('发送邮箱验证码失败:', e)
    emailError.value = apiErrMsg(e, '验证码发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

async function saveEmailBind() {
  const email = emailForm.email.trim()
  const code = emailForm.code.trim()
  if (!email) {
    emailError.value = '请输入邮箱'
    nextTick(() => emailInputRef.value?.focus())
    return
  }
  if (!EMAIL_RE.test(email)) {
    emailError.value = '邮箱格式不正确，请填写类似 name@example.com 的地址'
    return
  }
  if (!/^\d{6}$/.test(code)) {
    emailError.value = '请输入 6 位邮箱验证码'
    return
  }
  emailSaving.value = true
  emailError.value = ''
  try {
    await userApi.bindEmail({ email, code })
    userStore.setNeedEmailBind(false)
    if (userStore.userInfo) userStore.userInfo.email = email
    sessionStorage.removeItem(emailDismissKey())
    stopCodeCountdown()
    ElMessage.success('邮箱已绑定，后续通知将发送至该邮箱')
    emailBindVisible.value = false
  } catch (e) {
    // 验证码错误/过期/已使用/邮箱被占用等：留在弹窗内提示，方便用户修改
    console.error('绑定邮箱失败:', e)
    emailError.value = apiErrMsg(e, '邮箱绑定失败，请检查验证码后重试')
  } finally {
    emailSaving.value = false
  }
}

watch(() => userStore.needEmailBind, value => {
  if (!value) {
    emailBindVisible.value = false
    return
  }
  openEmailBind()
}, { immediate: true })

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

/* 补全邮箱弹窗 */
.email-bind-tip { margin: 0 0 16px; color: var(--text-sub); font-size: 13px; line-height: 1.7; }
.email-bind-error { margin: 6px 0 0; color: #f56c6c; font-size: 12px; }
.email-bind-footer { display: flex; justify-content: flex-end; gap: 8px; }
/* 验证码：输入框占满剩余宽度，按钮固定，窄屏放不下时整行换行 */
.code-row { display: flex; align-items: center; gap: 8px; width: 100%; flex-wrap: wrap; }
.code-row .code-input { flex: 1 1 140px; min-width: 0; }
.code-row .code-btn { flex: 0 0 auto; margin-left: 0; }
@media (max-width: 480px) {
  .email-bind-footer { flex-direction: column-reverse; }
  .email-bind-footer .el-button.el-button { width: 100%; margin-left: 0; }
}
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
/* 手机端适配弹窗尺寸 */
@media (max-width: 768px) {
  .survey-btn {
    right: 16px;
    bottom: 60px;
    padding: 10px 16px;
    font-size: 13px;
  }
  :deep(.survey-dialog) {
    width: 95% !important;
  }
  :deep(.survey-dialog .el-dialog__body) {
    padding: 10px;
  }
  :deep(.survey-dialog iframe) {
    height: 65vh !important; /* 手机端高度自适应 */
  }
}

/* 路由切换 loading 遮罩：替代白屏闪一下 */
.route-loading-mask {
    position: fixed;
    inset: 0;
    background: #fff;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding-top: 64px; /* 避开顶部导航栏 */
}
.route-loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e8ecf1;
    border-top-color: var(--brand, #409eff);
    border-radius: 50%;
    animation: route-spin 0.7s linear infinite;
}
.route-loading-text {
    font-size: 13px;
    color: var(--text-sub, #909399);
}
@keyframes route-spin {
    to { transform: rotate(360deg); }
}
</style>