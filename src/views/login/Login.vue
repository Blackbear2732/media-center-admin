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
        <div class="visual-tags">
          <span>综合部</span><span>网宣部</span><span>影音部</span>
          <span>摄制部</span><span>新闻部</span><span>设计部</span>
        </div>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-box">
        <h2>选择身份进入</h2>
        <p class="muted" style="margin:0 0 22px">点击下方角色即可登录，体验不同的部门管理功能</p>

        <div class="role-group">
          <h3>中心主任</h3>
          <button type="button" class="role-card director" :disabled="loading" @click.prevent="quickLogin('director')">
            <div class="role-icon" style="background: linear-gradient(135deg,#5a8f7b,#8fc4a9);">主</div>
            <div class="role-info">
              <div class="role-name">张主任</div>
              <div class="role-desc">查看全中心数据、所有部门成员与设备</div>
            </div>
            <el-icon class="role-arrow"><ArrowRight /></el-icon>
          </button>
        </div>

        <div class="role-group">
          <h3>部门部长 (点击体验专属模块)</h3>
          <div class="dept-cards">
            <button v-for="d in depts" :key="d" type="button" class="dept-card" :disabled="loading" @click.prevent="quickLogin('minister', d)">
              <div class="dept-icon">{{ d.slice(0,1) }}</div>
              <div class="dept-name">{{ d }}</div>
              <div class="dept-hint">{{ deptHints[d] }}</div>
            </button>
          </div>
        </div>

        <div class="role-group">
          <h3>普通部员</h3>
          <button type="button" class="role-card member" :disabled="loading" @click.prevent="quickLogin('member')">
            <div class="role-icon" style="background: linear-gradient(135deg,#3d7aab,#6fa8d4);">部</div>
            <div class="role-info">
              <div class="role-name">徐钰婷</div>
              <div class="role-desc">新闻部 · 查看我的任务与个人记录</div>
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

const depts = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']
const deptHints = {
  '综合部': '打卡管理',
  '网宣部': '推文数据',
  '影音部': '成片上传',
  '摄制部': '设备管理',
  '新闻部': '新闻稿件',
  '设计部': '设计图库'
}

async function quickLogin(role, dept) {
  loading.value = true
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    localStorage.removeItem('adminDept')

    const res = await authApi.login({ role, dept })
    if (!res || !res.token) throw new Error('登录返回数据异常')

    localStorage.setItem('token', res.token)
    localStorage.setItem('role', res.role || 'member')
    localStorage.setItem('user', JSON.stringify(res.user || {}))

    // 主任默认全部部门，部长锁定自己部门
    localStorage.setItem('adminDept', res.role === 'director' ? '' : (res.user?.dept || '新闻部'))

    ElMessage.success(`已以「${res.user?.name}」身份登录`)

    let redirect = route.query.redirect
    if (!redirect) {
      redirect = res.role === 'member' ? '/' : '/admin/overview'
    }

    await router.replace(redirect)
    setTimeout(() => { window.location.reload() }, 100)
  } catch (e) {
    console.error('登录失败:', e)
    ElMessage.error(e.message || '登录发生异常')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 登录页多部门卡片 */
.login-box { width: 460px; }
.role-group { margin-bottom: 24px; }
.role-group h3 { font-size: 14px; font-weight: 600; color: var(--text-sub); margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.role-group h3::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.dept-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.dept-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 14px 10px; border-radius: 12px; border: 1px solid var(--border);
  background: #fff; cursor: pointer; transition: all .2s;
}
.dept-card:hover { transform: translateY(-2px); border-color: #cfe0ee; box-shadow: var(--shadow-sm); background: #fafbfc; }
.dept-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff; font-weight: 600; display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px; font-size: 15px;
}
.dept-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.dept-hint { font-size: 11px; color: var(--text-sub); }
</style>