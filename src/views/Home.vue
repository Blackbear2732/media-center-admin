<template>
  <div class="page" v-loading="loading">
    <section class="hero">
      <div class="hero-content">
        <div class="hero-logos">

          <img src="/image/logo/league.png" alt="团徽" />
          <img src="/image/logo/school.png" alt="校徽" />

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



    <!-- 数据面板 (点击跳转详情) -->
    <div class="data-panels">
      <!-- 网宣数据 -->
      <div class="data-panel surface-card" @click="openPanel('wx')">
        <div class="panel-head">
          <div class="panel-title">
            <span class="dot" style="background:#3d7aab"></span>
            网宣数据看板
          </div>
          <span class="muted" style="display:flex;align-items:center;gap:4px;color:var(--brand)">
            {{ isLogin ? '查看详情' : '登录后查看' }} <el-icon><ArrowRight /></el-icon>
          </span>
        </div>
        <div class="panel-body">
          <div class="summary-stats">
            <div><b>{{ formatNumber(dashboard?.wx?.summary?.totalViews || 0) }}</b><span>总阅读量</span></div>
            <div><b>{{ formatNumber(dashboard?.wx?.summary?.totalLikes || 0) }}</b><span>总点赞量</span></div>
            <div><b>{{ dashboard?.wx?.summary?.totalOriginal || 0 }}</b><span>原创推文</span></div>
          </div>
          <div class="top-list">
            <div v-for="(item, idx) in (dashboard?.wx?.list || []).slice(0, 3)" :key="idx" class="top-item">
              <div class="top-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</div>
              <div class="top-content">
                <div class="top-title" :title="item.title">{{ item.title }}</div>
                <div class="top-meta">
                  <span>{{ item.type }}</span>
                  <span>{{ formatNumber(item.views) }} 阅</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 影音数据 -->
      <div class="data-panel surface-card" @click="openPanel('yy')">
        <div class="panel-head">
          <div class="panel-title">
            <span class="dot" style="background:#e8833a"></span>
            影音数据看板
          </div>
          <span class="muted" style="display:flex;align-items:center;gap:4px;color:var(--accent)">
            {{ isLogin ? '查看详情' : '登录后查看' }} <el-icon><ArrowRight /></el-icon>
          </span>
        </div>
        <div class="panel-body">
          <div class="summary-stats">
            <div><b>{{ formatNumber(dashboard?.yy?.summary?.totalViews || 0) }}</b><span>总播放量</span></div>
            <div><b>{{ formatNumber(dashboard?.yy?.summary?.totalLikes || 0) }}</b><span>总喜欢量</span></div>
            <div><b>{{ dashboard?.yy?.summary?.totalVideos || 0 }}</b><span>发布视频数</span></div>
          </div>
          <div class="top-list">
            <div v-for="(item, idx) in (dashboard?.yy?.list || []).slice(0, 3)" :key="idx" class="top-item">
              <div class="top-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</div>
              <div class="top-content">
                <div class="top-title" :title="item.title">{{ item.title }}</div>
                <div class="top-meta">
                  <span>{{ item.type }}</span>
                  <span>{{ formatNumber(item.views) }} 播</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <div class="split">
      <div class="split-main">
        <div class="section-head">
          <div><h3>最新公告</h3><div class="sub">中心通知与部门公告</div></div>
          <span class="muted" style="cursor:pointer" @click="router.push(isLogin ? '/announcements' : '/login')">查看全部 →</span>
        </div>
        <div class="notice-list">
          <div v-for="(n, idx) in notices" :key="n.id" class="task-row surface-card" @click="goNotice(n)">
            <span class="status-dot" :class="idx % 2 === 0 ? 'dot-new' : 'dot-old'"></span>
            <div class="task-row-main">
              <div class="task-row-title">{{ n.title }}</div>
              <div class="task-row-meta">{{ getNoticeScopeLabel(n.scope) }} · {{ n.author }} · {{ n.publishTime || n.createdAt }}</div>
            </div>
            <el-icon class="task-arrow"><ArrowRight /></el-icon>
          </div>
          <div v-if="notices.length === 0" class="muted" style="padding: 20px 0; text-align:center;">暂无公告</div>
        </div>

        <div class="section-head" style="margin-top: 28px;">
          <div><h3>最新任务</h3><div class="sub">按发布时间排序</div></div>
          <span class="muted" style="cursor:pointer" @click="router.push(isLogin ? '/tasks' : '/login')">查看全部 →</span>
        </div>
        <div class="task-list">
          <div v-for="t in tasks" :key="t.id" class="task-row surface-card" @click="goTask(t)">
            <span class="status-dot" :class="getTaskDotClass(t.status)"></span>
            <div class="task-row-main">
              <div class="task-row-title">{{ t.title }}</div>
              <div class="task-row-meta">{{ t.startTime }} · {{ t.location }}</div>
            </div>
            <span class="tag-soft">{{ getTaskStatusLabel(t.status) }}</span>
            <el-icon class="task-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { homeApi, adminApi } from '@/api'
// 顶部引入
import { getTaskDotClass, getTaskStatusLabel, getNoticeScopeLabel } from '@/utils/dict'

const router = useRouter()
const loading = ref(false)
const center = ref({})
const departments = ref([])
const tasks = ref([])
const notices = ref([])
const isLogin = computed(() => !!localStorage.getItem('token'))
const dashboard = ref(null)
const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num
}
const deptGradients = [
  'linear-gradient(135deg,#3d7aab,#6fa8d4)',
  'linear-gradient(135deg,#e8833a,#f2b279)',
  'linear-gradient(135deg,#5a8f7b,#8fc4a9)',
  'linear-gradient(135deg,#7b6fa8,#a99bd4)',
  'linear-gradient(135deg,#c26a6a,#e5a0a0)',
  'linear-gradient(135deg,#4d7a8f,#7ba6b8)'
]
function goWorkspace() { router.push(isLogin.value ? '/tasks' : '/login') }
function goTask(t) { router.push(isLogin.value ? '/tasks/' + t.id : '/login') }
function goNotice(n) { router.push(isLogin.value ? '/announcements' : '/login') }
function scrollToSection(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }

// 数据看板：未登录也能看到概览数据，但进入详情需要登录
function openPanel(type) {
  if (isLogin.value) return router.push(`/data-panel/${type}`)
  ElMessage.info('请先登录，即可查看详细数据看板')
  router.push({ path: '/login', query: { redirect: `/data-panel/${type}` } })
}

onMounted(async () => {
  loading.value = true
  try {
    // 首页是公开页：任何单个接口失败都不应拖垮整页（dashboard 已开放匿名访问，未登录也能看到看板数据）
    const results = await Promise.allSettled([
      homeApi.centerInfo(),
      homeApi.departments(),
      homeApi.latestTasks(),
      adminApi.dashboard(),
      adminApi.announcements()
    ])
    const [c, d, t, dash, an] = results.map(r => r.status === 'fulfilled' ? r.value : null)

    center.value = c || {}
    departments.value = Array.isArray(d) ? d.filter(Boolean) : []
    tasks.value = Array.isArray(t) ? t.filter(Boolean) : []
    dashboard.value = dash
    notices.value = Array.isArray(an) ? an.filter(Boolean).slice(0, 4) : []

    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length > 0) console.warn('部分首页数据加载失败', failed)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@media (max-width: 768px) {
  .hero { padding: 24px; grid-template-columns: 1fr; }
  .hero-art { display: none; } /* 隐藏右侧装饰 */
  .hero-content h1 { font-size: 24px; }
  .hero-stats { flex-wrap: wrap; gap: 20px; }
}
</style>
