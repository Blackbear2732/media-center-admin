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

          <button class="login-submit" type="button" :disabled="loading" @click.prevent="handleLogin">
            {{ loading ? '登 录 中…' : '登 录' }}
          </button>
        </el-form>

        <div style="text-align:center;margin-top:20px">
          <el-link type="primary" @click="router.push('/')">返回首页</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api'
import { userStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const form = reactive({ username: '', password: '' }) // 不在页面预填账号密码
const loading = ref(false)

async function handleLogin() {
  if (!form.username || !form.password) {
    return ElMessage.warning('请输入账号和密码')
  }

  loading.value = true
  try {
    // 调用后端登录接口，后端应返回 { token, role, user }
    const res = await authApi.login({ username: form.username, password: form.password })

    if (!res || !res.token) throw new Error('登录返回数据异常')

    // 存入 Store
    userStore.login(res.token, res.role, res.user)
    ElMessage.success(`欢迎回来，${res.user?.name || form.username}`)

    // 根据角色跳转：主任/部长去管理后台，部员去前台首页
    let redirect = route.query.redirect
    if (!redirect) {
      redirect = Number(res.role) > 0 ? '/admin/overview' : '/'
    }
    router.replace(redirect)
  } catch (e) {
    console.error(e)
    // request.js 拦截器已经弹出了错误信息，这里无需重复弹
  } finally {
    loading.value = false
  }
}
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
.login-submit { width: 100%; height: 44px; border: none; border-radius: 12px; cursor: pointer; background: var(--brand); color: #fff; font-size: 15px; font-weight: 600; transition: all .2s; margin-top: 10px; }
.login-submit:hover { background: var(--brand-deep); }
@media (max-width: 900px) {
  .login-page { grid-template-columns: 1fr; }
  .login-visual { display: none; }
}
</style>