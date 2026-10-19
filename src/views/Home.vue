<template>
  <div class="page" v-loading="loading">
    <section class="hero">
      <div class="hero-content">
        <div class="hero-eyebrow">XX UNIVERSITY · MEDIA CENTER</div>
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

<style scoped>
/* 此处保留你之前的样式，不用改动，直接复制即可 */
.hero { position: relative; overflow: hidden; border-radius: 24px; background: linear-gradient(120deg, #153a56 0%, #2b5f8e 55%, #3d7aab 100%); color: #fff; padding: 56px; display: grid; grid-template-columns: 1.4fr 1fr; gap: 32px; }
.hero-content h1 { margin: 10px 0 16px; font-size: 34px; line-height: 1.2; letter-spacing: 1px; }
.hero-content p { margin: 0; line-height: 1.9; color: rgba(255,255,255,.82); max-width: 620px; }
.hero-eyebrow { font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,.6); }
.hero-actions { display: flex; gap: 12px; margin-top: 28px; }
.hero-primary { padding: 12px 28px; border-radius: 999px; border: none; cursor: pointer; background: #fff; color: var(--brand-deep); font-weight: 600; font-size: 14px; transition: all .2s; }
.hero-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.2); }
.hero-ghost { padding: 12px 28px; border-radius: 999px; cursor: pointer; background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.28); font-size: 14px; transition: all .2s; }
.hero-ghost:hover { background: rgba(255,255,255,.2); }
.hero-stats { display: flex; gap: 40px; margin-top: 36px; }
.hero-stats b { display: block; font-size: 24px; font-weight: 700; }
.hero-stats span { font-size: 12px; color: rgba(255,255,255,.7); }
.hero-art { position: relative; }
.orb { position: absolute; border-radius: 50%; opacity: .4; }
.orb-1 { width: 220px; height: 220px; background: radial-gradient(circle, #8ec5ff, transparent 70%); top: -60px; right: -40px; }
.orb-2 { width: 160px; height: 160px; background: radial-gradient(circle, #ffb27a, transparent 70%); bottom: -30px; left: 20px; }
.art-card { position: absolute; padding: 10px 18px; border-radius: 12px; font-size: 13px; background: rgba(255,255,255,.14); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,.18); }
.art-card-1 { top: 18%; right: 8%; transform: rotate(-4deg); }
.art-card-2 { top: 46%; right: 30%; transform: rotate(3deg); }
.art-card-3 { top: 70%; right: 6%; transform: rotate(-2deg); }
.dept-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.dept-card { overflow: hidden; transition: all .2s; }
.dept-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.dept-banner { height: 84px; display: flex; align-items: center; justify-content: center; }
.dept-initial { font-size: 34px; font-weight: 700; color: rgba(255,255,255,.92); }
.dept-body { padding: 16px 18px 18px; }
.dept-name { font-weight: 600; font-size: 15px; margin-bottom: 6px; }
.dept-intro { color: var(--text-sub); font-size: 13px; line-height: 1.7; min-height: 44px; }
.dept-photos { display: flex; gap: 6px; margin-top: 12px; }
.photo-thumb { width: 44px; height: 30px; border-radius: 6px; background: linear-gradient(135deg, #e8f0f7, #d4e3ef); }
.split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 28px; margin-top: 8px; }
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-row { display: flex; align-items: center; gap: 12px; padding: 16px 18px; cursor: pointer; transition: all .2s; }
.task-row:hover { transform: translateX(3px); border-color: #cfe0ee; box-shadow: var(--shadow-md); }
.task-row-main { flex: 1; min-width: 0; }
.task-row-title { font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-row-meta { color: var(--text-sub); font-size: 12px; margin-top: 4px; }
.task-arrow { color: var(--text-sub); }
.video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.video-card { overflow: hidden; transition: all .2s; cursor: pointer; }
.video-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.video-cover { height: 92px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.92); position: relative; }
.video-duration { position: absolute; right: 6px; bottom: 6px; font-size: 11px; background: rgba(0,0,0,.55); padding: 1px 6px; border-radius: 3px; }
.video-title { padding: 10px 12px 12px; font-size: 13px; line-height: 1.4; }
@media (max-width: 900px) { .hero { grid-template-columns: 1fr; padding: 36px; } .hero-art { display: none; } .dept-grid { grid-template-columns: 1fr 1fr; } .split { grid-template-columns: 1fr; } }
</style>