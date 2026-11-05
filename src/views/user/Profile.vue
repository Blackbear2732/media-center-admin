<template>
  <div class="page" v-loading="loading">
    <div class="page-head">
      <div>
        <h2>个人信息</h2>
        <p class="sub muted">维护基本资料与账号安全设置</p>
      </div>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><b>基本信息</b></template>
          <el-form :model="form" label-width="96px">
            <el-form-item label="学号"><el-input v-model="form.studentNo" disabled /></el-form-item>
            <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="form.nickname" placeholder="可自定义，不填则显示姓名" />
            </el-form-item>
            <el-form-item label="学院"><el-input v-model="form.college" /></el-form-item>
            <el-form-item label="班级"><el-input v-model="form.className" /></el-form-item>
            <el-form-item label="电话"><el-input v-model="form.phone" placeholder="用于接收通知" /></el-form-item>
            <el-form-item label="邮箱" required>
              <div class="email-row">
                <el-input ref="emailInputRef" v-model="form.email" placeholder="必填，用于接收系统通知" />
                <el-button
                    class="code-btn"
                    :disabled="codeCountdown > 0 || !emailChanged"
                    :loading="codeSending"
                    :title="emailChanged ? '' : '邮箱未修改，无需验证'"
                    @click="sendCode"
                >
                  {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
                </el-button>
              </div>
              <div v-if="!form.email" class="email-unbound">
                未绑定，将无法接收通知与找回密码
                <el-link type="primary" :underline="false" @click="focusEmail">立即填写</el-link>
              </div>
              <div v-else class="muted" style="margin-top:4px">邮箱为必填项，任务与会议通知将发送至此邮箱</div>
            </el-form-item>
            <el-form-item v-if="emailChanged" label="邮箱验证码" required>
              <el-input v-model="emailCode" maxlength="6" placeholder="6 位数字验证码" />
              <div class="muted" style="margin-top:4px">修改邮箱需验证：验证码发送至上面填写的新邮箱</div>
            </el-form-item>


            <el-form-item label="MeoW昵称">
              <el-input v-model="form.meowNick" placeholder="填写后在鸿蒙手机 MeoW 上接收系统通知" />
              <div class="muted" style="margin-top:4px">
                可选。在华为鸿蒙5以上手机安装 MeoW 并注册昵称后填写，任务/会议/公告通知将同步推送到手机
                <router-link to="/profile/meow-guide" class="guide-link">
                  如何获取昵称？ →
                </router-link>
              </div>
            </el-form-item>



            <el-form-item>
              <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
              <el-button @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header><b>账号安全</b></template>
          <el-form :model="pwd" label-width="96px">
            <el-form-item label="原密码"><el-input v-model="pwd.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密码"><el-input v-model="pwd.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="确认密码"><el-input v-model="pwd.confirmPassword" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="pwdSaving" @click="changePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'
import { getFriendlyErrorMessage } from '@/api/request'
import { userStore } from '@/store/user'
// 可选：如果想让标签更醒目
import { QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()
const form = reactive({ studentNo: '', name: '', nickname: '', college: '', className: '', phone: '', email: '', meowNick: '' })
const pwd = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading(), saving = ref(false), pwdSaving = ref(false)
const emailInputRef = ref()
// 原始资料（响应式，改绑邮箱后 origin 变化要让 emailChanged 及时失效）
const origin = reactive({})

// ============ 邮箱验证码（改绑邮箱时校验） ============
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const emailCode = ref('')
const codeSending = ref(false)
const codeCountdown = ref(0)
let codeTimer = null
// 邮箱与当前绑定值不同时才需要验证码
const emailChanged = computed(() => (form.email || '').trim() !== String(origin.email || '').trim())

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

// 真实接口的中文提示在响应体 msg 里；技术类错误（SQL/堆栈）由兜底函数换成可读文案
function apiErrMsg(e, fallback) {
  return getFriendlyErrorMessage(e, fallback)
}

async function sendCode() {
  const email = form.email.trim()
  if (!email) {
    focusEmail()
    return ElMessage.warning('请先填写邮箱，再获取验证码')
  }
  if (!EMAIL_RE.test(email)) return ElMessage.warning('邮箱格式不正确，请填写类似 name@example.com 的地址')
  codeSending.value = true
  try {
    await userApi.sendEmailCode(email)
    ElMessage.success('验证码已发送，请到该邮箱查收（10 分钟内有效）')
    startCodeCountdown()
  } catch (e) {
    console.error('发送邮箱验证码失败:', e)
    ElMessage.error(apiErrMsg(e, '验证码发送失败，请稍后重试'))
  } finally {
    codeSending.value = false
  }
}

onUnmounted(() => {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
})

function focusEmail() {
  emailInputRef.value?.focus()
}

onMounted(async () => {
  loading.value = true
  try {
    const u = await userApi.profile()   // GET /api/user/profile
    Object.assign(form, u); Object.assign(origin, u)
  } finally { loading.value = false }
})
function reset() {
  Object.assign(form, origin)
  emailCode.value = ''
  stopCodeCountdown()
}

async function save() {
  const email = form.email.trim()
  if (!email) return ElMessage.warning('邮箱为必填项')
  if (!EMAIL_RE.test(email)) return ElMessage.warning('邮箱格式不正确，请填写类似 name@example.com 的地址')

  // 邮箱有变化：先走验证码绑定接口，再保存其它资料；未变化时保持原有保存路径
  if (emailChanged.value) {
    if (!/^\d{6}$/.test(emailCode.value.trim())) return ElMessage.warning('请输入 6 位邮箱验证码')
    saving.value = true
    try {
      await userApi.bindEmail({ email, code: emailCode.value.trim() })  // POST /api/user/email/bind
      userStore.setNeedEmailBind(false)
      if (userStore.userInfo) userStore.userInfo.email = email
      emailCode.value = ''
      stopCodeCountdown()
      await userApi.updateProfile({ ...form })  // PUT /api/user/profile（其余资料）
      Object.assign(origin, form)
      ElMessage.success('邮箱已绑定，其它资料已保存')
    } catch (e) {
      console.error('绑定邮箱失败:', e)
      ElMessage.error(apiErrMsg(e, '邮箱绑定失败，请检查验证码后重试'))
    } finally { saving.value = false }
    return
  }

  saving.value = true
  try {
    await userApi.updateProfile({ ...form })  // PUT /api/user/profile
    Object.assign(origin, form)
    // 邮箱已补全，同步登录态，避免再次弹补填提示
    userStore.setNeedEmailBind(false)
    if (userStore.userInfo) userStore.userInfo.email = form.email
    ElMessage.success('保存成功')
  } finally { saving.value = false }
}
async function changePwd() {
  if (!pwd.oldPassword || !pwd.newPassword) return ElMessage.warning('请填写完整')
  if (pwd.newPassword !== pwd.confirmPassword) return ElMessage.warning('两次输入的新密码不一致')
  pwdSaving.value = true
  try {
    await userApi.updatePassword({ ...pwd })  // PUT /api/user/password
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
    router.replace('/login')
  } finally { pwdSaving.value = false }
}
</script>
<style scoped>
.guide-link {
  color: var(--brand);
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}
.guide-link:hover { text-decoration: underline; }
.email-unbound { margin-top: 4px; color: #e6a23c; font-size: 12px; }
.email-unbound .el-link { margin-left: 4px; font-size: 12px; vertical-align: baseline; }
/* 邮箱 + 获取验证码：输入框占满剩余宽度，窄屏放不下时整行换行 */
.email-row { display: flex; align-items: center; gap: 8px; width: 100%; flex-wrap: wrap; }
.email-row .el-input { flex: 1 1 140px; min-width: 0; }
.email-row .code-btn { flex: 0 0 auto; margin-left: 0; }
</style>
