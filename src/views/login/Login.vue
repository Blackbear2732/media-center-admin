<template>
  <div class="login-page">
    <!-- 左侧宣传图 -->
    <div class="login-visual">
      <div class="visual-inner">
        <div class="login-logos">
          <img src="/image/logo/school.png" alt="校徽" />
          <img src="/image/logo/league.png" alt="团徽" />
          <img src="/image/logo/media.png" alt="融媒Logo" class="main-logo" />
        </div>
        <h1>青年融媒体中心</h1>
        <p>山西农业大学 · 一次采集 · 多元生成 · 多端发布</p>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-panel">
      <div class="login-box">
        <h2>账号登录</h2>
        <p class="muted" style="margin:0 0 28px">请输入学号及密码</p>

        <el-form :model="form" size="large" @keyup.enter="handleLogin">
          <el-form-item>
            <el-input v-model="form.username" placeholder="学号 / 工号" :prefix-icon="User" clearable />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
          </el-form-item>

          <div class="forgot-row">
            <el-link type="primary" :underline="false" @click="openForgot">忘记密码？</el-link>
          </div>

          <button class="login-submit" type="button" :disabled="loading" @click.prevent="handleLogin">
            {{ loading ? '登 录 中…' : '登 录' }}
          </button>
        </el-form>

        <div style="text-align:center;margin-top:20px">
          <el-link type="primary" @click="router.push('/')">返回首页</el-link>
        </div>
      </div>
    </div>

    <!-- 找回密码对话框 -->
    <el-dialog
      v-model="forgotVisible"
      title="找回密码"
      width="420px"
      :close-on-click-modal="false"
      @closed="resetForgotForm"
    >
      <el-form label-position="top" size="large">
        <el-form-item label="绑定邮箱">
          <div class="code-row">
            <el-input v-model="forgotForm.email" placeholder="请输入账号绑定的邮箱" :prefix-icon="Message" clearable />
            <el-button
              type="primary"
              plain
              class="code-btn"
              :disabled="countdown > 0"
              :loading="sending"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="邮箱验证码">
          <el-input v-model="forgotForm.code" placeholder="6 位数字验证码" :prefix-icon="Key" maxlength="6" clearable />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="forgotForm.password" type="password" placeholder="6-20 位新密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="forgotForm.confirm" type="password" placeholder="再次输入新密码" :prefix-icon="Lock" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotVisible = false">取 消</el-button>
        <el-button type="primary" :loading="resetting" @click="handleReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { authApi, USE_MOCK } from '@/api'
import { userStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const form = reactive({ username: '', password: '' }) // 不在页面预填账号密码
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()

async function handleLogin() {
  if (!form.username || !form.password) {
    return ElMessage.warning('请输入账号和密码')
  }

  loading.value = true
  try {
    // 调用后端登录接口，后端应返回 { token, role, user }
    const res = await authApi.login({ username: form.username, password: form.password })

    // Mock 模式下账号/密码不匹配时接口静默返回 null（真实后端异常由拦截器弹提示），
    // 这里补一个提示，避免点击登录后没有任何反馈
    if (!res || !res.token) {
      ElMessage.warning(USE_MOCK ? '账号或密码错误（Mock 演示密码为 123456）' : '登录失败，请稍后重试')
      return
    }

    // 存入 Store
    userStore.login(res.token, res.role, res.user)
    ElMessage.success(`欢迎回来，${res.user?.name || form.username}`)

    // 根据角色跳转：主任/部长去管理后台；被授权打卡管理的部员直接进打卡管理；普通部员去前台首页
    let redirect = route.query.redirect
    if (!redirect) {
      redirect = Number(res.role) > 0 ? '/admin/overview' : (res.user?.checkinManager ? '/admin/checkins' : '/')
    }
    router.replace(redirect)
  } catch (e) {
    console.error(e)
    // request.js 拦截器已经弹出了错误信息，这里无需重复弹
  } finally {
    loading.value = false
  }
}

/* ================= 找回密码 ================= */
const forgotVisible = ref(false)
const sending = ref(false)
const resetting = ref(false)
const countdown = ref(0)
const forgotForm = reactive({ email: '', code: '', password: '', confirm: '' })
let countdownTimer = null

function openForgot() {
  forgotVisible.value = true
}

function resetForgotForm() {
  forgotForm.email = ''
  forgotForm.code = ''
  forgotForm.password = ''
  forgotForm.confirm = ''
  countdown.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

async function sendCode() {
  if (!forgotForm.email) {
    return ElMessage.warning('请输入账号绑定的邮箱')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(forgotForm.email)) {
    return ElMessage.warning('邮箱格式不正确')
  }
  sending.value = true
  try {
    await authApi.sendForgotCode(forgotForm.email.trim())
    ElMessage.success('验证码已发送，10 分钟内有效')
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (e) {
    console.error(e)
    // 错误信息由 request.js 拦截器统一弹出
  } finally {
    sending.value = false
  }
}

async function handleReset() {
  if (!forgotForm.code) {
    return ElMessage.warning('请输入邮箱验证码')
  }
  if (!forgotForm.password || forgotForm.password.length < 6 || forgotForm.password.length > 20) {
    return ElMessage.warning('新密码长度需在 6-20 位之间')
  }
  if (forgotForm.password !== forgotForm.confirm) {
    return ElMessage.warning('两次输入的密码不一致')
  }
  resetting.value = true
  try {
    await authApi.resetByEmail({
      email: forgotForm.email.trim(),
      code: forgotForm.code.trim(),
      password: forgotForm.password
    })
    ElMessage.success('密码已重置，请使用新密码登录')
    forgotVisible.value = false
  } catch (e) {
    console.error(e)
    // 错误信息由 request.js 拦截器统一弹出
  } finally {
    resetting.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped>
.login-page { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
.login-visual {
  background: linear-gradient(135deg, #153a56 0%, #2b5f8e 60%, #3d7aab 100%);
  color: #fff; display: flex; align-items: center; justify-content: center; padding: 48px;
}
.visual-inner { max-width: 440px; }
.login-logos { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.login-logos img { height: 52px; width: auto; background: rgba(255, 255, 255, 0.15); padding: 8px; border-radius: 12px; backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.2); }
.login-logos .main-logo { height: 64px; background: #fff; }
.visual-inner h1 { font-size: 30px; margin: 22px 0 10px; letter-spacing: 1px; }
.visual-inner p { color: rgba(255, 255, 255, .78); margin: 0; line-height: 1.8; }
.login-panel { display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 32px; }
.login-box { width: 380px; }
.login-box h2 { margin: 0 0 6px; font-size: 24px; }
.forgot-row { display: flex; justify-content: flex-end; margin: -8px 0 10px; font-size: 13px; }
.code-row { display: flex; gap: 8px; width: 100%; }
.code-row .el-input { flex: 1; }
.code-btn { flex-shrink: 0; min-width: 112px; }
.login-submit { width: 100%; height: 44px; border: none; border-radius: 12px; cursor: pointer; background: var(--brand); color: #fff; font-size: 15px; font-weight: 600; transition: all .2s; margin-top: 10px; }
.login-submit:hover { background: var(--brand-deep); }
@media (max-width: 900px) {
  .login-page { grid-template-columns: 1fr; }
  .login-visual { display: none; }
}
</style>