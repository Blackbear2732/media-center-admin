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

        <!-- 主任 -->
        <div class="role-group">
          <h3>中心主任</h3>
          <button type="button" class="role-card director" :disabled="loading" @click.prevent="quickLogin('director')">
            <div class="role-icon" style="background: linear-gradient(135deg,#5a8f7b,#8fc4a9);">主</div>
            <div class="role-info">
              <div class="role-name">王主任</div>
              <div class="role-desc">查看全中心数据、所有部门成员与设备</div>
            </div>
            <el-icon class="role-arrow"><ArrowRight /></el-icon>
          </button>
        </div>

        <!-- 部长网格 -->
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

        <!-- 部员 -->
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
import { userStore } from '@/store/user'
import { MODULE_LABEL } from '@/utils/dict'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const depts = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']
const deptHints = {
  '综合部': MODULE_LABEL.checkin,
  '网宣部': MODULE_LABEL.article,
  '影音部': MODULE_LABEL.video,
  '摄制部': MODULE_LABEL.device,
  '新闻部': MODULE_LABEL.news,
  '设计部': MODULE_LABEL.design
}

async function quickLogin(role, dept) {
  loading.value = true
  try {
    const res = await authApi.login({role, dept})
    if (!res || !res.token) throw new Error('登录返回数据异常')

    // 统一走 Store 登录
    userStore.login(res.token, res.role, res.user)

    ElMessage.success(`已以「${res.user?.name}」身份登录`)

    let redirect = route.query.redirect
    if (!redirect) {
      redirect = res.role === 'member' ? '/' : '/admin/overview'
    }
    router.replace(redirect)
  } catch (e) {
    console.error('登录失败:', e)
    ElMessage.error(e.message || '登录发生异常')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ================== 页面左右分栏 ================== */
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
}

/* 左侧视觉区 */
.login-visual {
  background: linear-gradient(135deg, #153a56 0%, #2b5f8e 60%, #3d7aab 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.visual-inner {
  max-width: 440px;
}

.login-logos {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.login-logos img {
  height: 52px;
  width: auto;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px;
  border-radius: 12px;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-logos .main-logo {
  height: 64px;
  background: #fff;
}

.visual-inner h1 {
  font-size: 30px;
  margin: 22px 0 10px;
  letter-spacing: 1px;
}

.visual-inner p {
  color: rgba(255, 255, 255, .78);
  margin: 0 0 28px;
  line-height: 1.8;
}

.visual-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.visual-tags span {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .2);
}

/* 右侧面板 */
.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 32px;
  overflow-y: auto;
}

.login-box {
  width: 460px;
}

.login-box h2 {
  margin: 0 0 6px;
  font-size: 24px;
}

/* 角色分组 */
.role-group {
  margin-bottom: 24px;
}

.role-group h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-sub);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-group h3::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* 主任/部员 单行长卡片 */
.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all .18s;
  width: 100%;
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: #cfe0ee;
}

.role-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 17px;
  color: #fff;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 2px;
}

.role-desc {
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.5;
}

.role-arrow {
  color: var(--text-sub);
}

/* 👇 部长 3 列网格卡片 (补全了这部分 CSS) */
.dept-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.dept-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  transition: all .2s;
}

.dept-card:hover {
  transform: translateY(-3px);
  border-color: #cfe0ee;
  box-shadow: var(--shadow-md);
  background: #fafbfc;
}

.dept-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 16px;
}

.dept-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.dept-hint {
  font-size: 11px;
  color: var(--text-sub);
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    display: none;
  }
}
</style>