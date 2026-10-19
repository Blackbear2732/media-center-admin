<template>
  <div class="login-page">
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

    <div class="login-panel">
      <div class="login-box">
        <h2>选择身份进入</h2>
        <p class="muted" style="margin:0 0 22px">演示环境，无需密码，点击即可登录</p>

        <div class="role-cards">
          <button v-for="r in roleList" :key="r.key" type="button" class="role-card" :class="r.key"
                  :disabled="loading" @click.prevent="quickLogin(r.key)">
            <div class="role-icon">{{ r.icon }}</div>
            <div class="role-info">
              <div class="role-name">{{ r.label }}</div>
              <div class="role-desc">{{ r.desc }}</div>
            </div>
            <el-icon class="role-arrow"><ArrowRight /></el-icon>
          </button>
        </div>

        <div style="text-align:center;margin-top:24px">
          <el-link type="primary" @click="router.push('/')">返回首页</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const roleList = [
  { key: 'member', label: '部员', icon: '部', desc: '新闻部 · 张三 · 查看任务与个人记录' },
  { key: 'minister', label: '部长', icon: '长', desc: '新闻部部长 · 李四 · 管理本部门' },
  { key: 'director', label: '中心主任', icon: '主', desc: '王主任 · 查看全部部门与数据' }
]

async function quickLogin(role) {
  loading.value = true
  try {
    // 安全清理特定的 key，避免把系统内部状态弄崩
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    localStorage.removeItem('adminDept')

    const res = await authApi.login({ role })
    if (!res || !res.token) {
      throw new Error('登录返回数据异常')
    }

    // 写入本地存储
    localStorage.setItem('token', res.token)
    localStorage.setItem('role', res.role || 'member')
    localStorage.setItem('user', JSON.stringify(res.user || {}))
    localStorage.setItem('adminDept', res.role === 'director' ? '' : (res.user?.dept || '新闻部'))

    ElMessage.success(`已以「${res.label}」身份登录`)

    // 计算跳转路径：优先走重定向，否则按角色跳转
    let redirect = route.query.redirect
    if (!redirect) {
      redirect = res.role === 'member' ? '/' : '/admin/overview'
    }

    // 使用 replace 清空历史栈，并强制触发页面刷新
    await router.replace(redirect)

    // 延迟重载，确保状态同步
    setTimeout(() => {
      window.location.reload()
    }, 100)

  } catch (e) {
    console.error('登录失败:', e)
    ElMessage.error(e.message || '登录发生异常')
  } finally {
    loading.value = false
  }
}
</script>