<template>
  <div class="page" v-loading="loading">
    <section class="hero">
      <div class="hero-content">
        <div class="hero-logos">
          <img src="/image/logo/school.png" alt="校徽" />
          <img src="/image/logo/league.png" alt="团徽" />
          <img src="/image/logo/media.png" alt="融媒Logo" />
        </div>
        <div class="hero-eyebrow">SHANXI AGRICULTURAL UNIVERSITY · YOUTH MEDIA CENTER</div>
        <h1>{{ center.name || '融媒体中心' }}</h1>
        <p>{{ center.desc }}</p>
        <div class="hero-actions">
          <button class="hero-primary" @click="goWorkspace">{{ isLogin ? '进入工作台' : '登录系统' }}</button>
          <button class="hero-ghost" @click="scrollToSection('depts')">了解部门</button>
        </div>
        <div class="hero-stats">
          <div><b>6</b><span>部门</span></div>
          <div><b>14</b><span>功能模块</span></div>
          <div><b>100+</b><span>素材沉淀</span></div>
        </div>
      </div>
      <div class="hero-art">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="art-card art-card-1">新闻稿</div>
        <div class="art-card art-card-2">视频</div>
        <div class="art-card art-card-3">设计图</div>
      </div>
    </section>

    <div class="section-head" id="depts">
      <div>
        <h3>六大部门</h3>
        <div class="sub">从采编到技术，协同完成每一次内容生产</div>
      </div>
    </div>
    <div class="dept-grid">
      <div v-for="(d, i) in departments" :key="d.id" class="dept-card surface-card">
        <div class="dept-banner" :style="{ background: deptGradients[i % deptGradients.length] }">
          <span class="dept-initial">{{ d.name.slice(0, 1) }}</span>
        </div>
        <div class="dept-body">
          <div class="dept-name">{{ d.name }}</div>
          <div class="dept-intro">{{ d.intro }}</div>
          <div class="dept-photos">
            <div v-for="n in 3" :key="n" class="photo-thumb"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="split">
      <div class="split-main">
        <div class="section-head">
          <div><h3>最新任务</h3><div class="sub">按发布时间排序</div></div>
          <span class="muted" style="cursor:pointer" @click="router.push(isLogin ? '/tasks' : '/login')">查看全部 →</span>
        </div>
        <div class="task-list">
          <div v-for="t in tasks" :key="t.id" class="task-row surface-card" @click="goTask(t)">
            <span class="status-dot" :class="dotClass(t.status)"></span>
            <div class="task-row-main">
              <div class="task-row-title">{{ t.title }}</div>
              <div class="task-row-meta">{{ t.startTime }} · {{ t.location }}</div>
            </div>
            <span class="tag-soft">{{ t.status }}</span>
            <el-icon class="task-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
      <aside class="split-side">
        <div class="section-head">
          <div><h3>最新视频</h3><div class="sub">校园影像精选</div></div>
        </div>
        <div class="video-grid">
          <div v-for="(v, i) in videos" :key="v.id" class="video-card surface-card">
            <div class="video-cover" :style="{ background: videoGradients[i % 4] }">
              <el-icon :size="26"><VideoPlay /></el-icon>
              <span class="video-duration">{{ v.duration }}</span>
            </div>
            <div class="video-title">{{ v.title }}</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const center = ref({})
const departments = ref([])
const tasks = ref([])
const videos = ref([])
const isLogin = computed(() => !!localStorage.getItem('token'))

const deptGradients = [
  'linear-gradient(135deg,#3d7aab,#6fa8d4)',
  'linear-gradient(135deg,#e8833a,#f2b279)',
  'linear-gradient(135deg,#5a8f7b,#8fc4a9)',
  'linear-gradient(135deg,#7b6fa8,#a99bd4)',
  'linear-gradient(135deg,#c26a6a,#e5a0a0)',
  'linear-gradient(135deg,#4d7a8f,#7ba6b8)'
]
const videoGradients = [
  'linear-gradient(135deg,#4a6fa5,#7fa3cf)',
  'linear-gradient(135deg,#a56a4a,#d5a07f)',
  'linear-gradient(135deg,#4a8a7a,#7fc4b0)',
  'linear-gradient(135deg,#7a4a8a,#b07fc4)'
]
const dotClass = (s) => ({
  '筹备': 'dot-prepare',
  '进行中': 'dot-doing',
  '已结束': 'dot-done'
}[s] || 'dot-prepare')

function goWorkspace() { router.push(isLogin.value ? '/tasks' : '/login') }
function goTask(t) { router.push(isLogin.value ? '/tasks/' + t.id : '/login') }
function scrollToSection(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }

onMounted(async () => {
  loading.value = true
  try {
    const [c, d, t, v] = await Promise.all([
      homeApi.centerInfo(),
      homeApi.departments(),
      homeApi.latestTasks(),
      homeApi.latestVideos()
    ])
    // 增加容错赋值，防止 undefined 导致模板渲染崩溃
    center.value = c || {}
    departments.value = d || []
    tasks.value = t || []
    videos.value = v || []
  } catch (e) {
    console.error('首页数据加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>