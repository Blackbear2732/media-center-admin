<template>
  <div ref="pageRef" class="page gantt-page">
    <div class="list-head">
      <div>
        <h2>任务甘特图</h2>
        <p class="muted" style="margin: 8px 0 0;">
          共 {{ tasks.length }} 个任务<span v-if="pendingCount"> · 其中 {{ pendingCount }} 个时间待定</span>
        </p>
      </div>
      <div class="head-actions">
        <span class="pill active">甘特图</span>
        <router-link class="pill" :to="{ path: '/tasks', query: statusQuery }">列表</router-link>
      </div>
    </div>

    <div class="gantt-toolbar surface-card">
      <el-radio-group v-model="viewMode" size="small" @change="onViewModeChange">
        <el-radio-button value="Day">日</el-radio-button>
        <el-radio-button value="Week">周</el-radio-button>
        <el-radio-button value="Month">月</el-radio-button>
      </el-radio-group>

      <el-select v-model="deptId" size="small" class="toolbar-select" :disabled="!userStore.isDirector" @change="loadTasks">
        <el-option v-for="d in deptOptions" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>

      <el-select v-model="status" size="small" class="toolbar-select" @change="loadTasks">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>

      <el-date-picker
          v-model="range"
          type="daterange"
          size="small"
          class="toolbar-range"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadTasks"
      />

      <div class="gantt-legend">
        <span class="legend-item"><i class="legend-dot legend-prepare"></i>筹备</span>
        <span class="legend-item"><i class="legend-dot legend-doing"></i>进行中</span>
        <span class="legend-item"><i class="legend-dot legend-done"></i>已结束</span>
        <span class="legend-item"><i class="legend-dot legend-pending"></i>时间待定</span>
      </div>
    </div>

    <div class="gantt-card surface-card" v-loading="loading">
      <div v-if="error" class="gantt-state">
        <p class="gantt-state-title">甘特图加载失败</p>
        <p class="muted">{{ error }}</p>
        <el-button type="primary" size="small" @click="loadTasks">重新加载</el-button>
      </div>
      <el-empty v-else-if="!loading && !tasks.length" description="当前筛选条件下暂无任务" />
      <div
          ref="chartRef"
          class="gantt-chart"
          :class="{ 'gantt-chart-hidden': !!error || (!loading && !tasks.length) }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Gantt from 'frappe-gantt'
import 'frappe-gantt/dist/frappe-gantt.css'
import { taskApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  DEPARTMENTS_OPTIONS,
  TASK_STATUS_OPTIONS,
  getDeptLabel
} from '@/utils/dict'
import { useDelayedLoading } from '@/utils/loading'

const router = useRouter()
const route = useRoute()

const tasks = ref([])
const error = ref('')
const loading = useDelayedLoading()
const chartRef = ref()
const pageRef = ref()
let gantt = null
let resizeTimer = null

// 默认值：列表页筛选可通过 ?status= 带过来
const status = ref(route.query.status !== undefined && route.query.status !== '' ? Number(route.query.status) : -1)
const deptId = ref(userStore.isDirector ? ALL_DEPT_ID : (userStore.deptId ?? ALL_DEPT_ID))
// 默认日视图；不再自动切月，手动切换后始终由用户控制
const viewMode = ref('Day')
const range = ref(defaultRange())

const statusOptions = [{ value: -1, label: '全部状态' }, ...TASK_STATUS_OPTIONS]

// 主任可选全中心/任意部门；部长、部员只能看到自己部门
const deptOptions = computed(() => {
  if (userStore.isDirector) {
    return [{ value: ALL_DEPT_ID, label: '全部部门' }, ...DEPARTMENTS_OPTIONS]
  }
  const own = userStore.deptId
  return [{ value: own ?? ALL_DEPT_ID, label: own ? getDeptLabel(own) : '全部部门' }]
})

const statusQuery = computed(() => (status.value === -1 ? {} : { status: status.value }))
const pendingCount = computed(() => tasks.value.filter(t => t.timePending).length)

function toDateStr(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultRange() {
  const start = new Date()
  start.setDate(start.getDate() - 90)
  const end = new Date()
  end.setDate(end.getDate() + 180)
  return [toDateStr(start), toDateStr(end)]
}

async function loadTasks() {
  loading.value = true
  error.value = ''
  try {
    const params = { startDate: range.value?.[0], endDate: range.value?.[1] }
    if (deptId.value !== null && deptId.value !== undefined && Number(deptId.value) !== ALL_DEPT_ID) {
      params.deptId = deptId.value
    }
    if (status.value !== -1) params.status = status.value
    const data = await taskApi.gantt(params)
    // 请求被后续筛选取消时 request 封装会 resolve(null)，此时保留当前图表，不要当成空数据
    if (data === null) return
    tasks.value = Array.isArray(data) ? data : []
    await nextTick()
    renderChart()
  } catch (e) {
    console.error('加载任务甘特图失败:', e)
    tasks.value = []
    // 后端错误统一 200 + code:500 + msg，request 拦截器已把 msg 包成 Error，这里直接展示
    error.value = e?.response?.data?.msg || e?.message || '请检查网络或筛选条件后重试'
    clearChart()
  } finally {
    loading.value = false
  }
}

const STATUS_CLASS = { 0: 'prepare', 1: 'doing', 2: 'done' }

/* ===== 甘特图中文表头 =====
 * frappe-gantt 1.2.2 没有 zh 语言包，它的 view_modes 是公开可配置项：
 * 传自定义 view_modes（upper_text / lower_text 回调）即可全部中文，且切换日/周/月都会重新调用。
 * 不 patch node_modules，也不依赖库内部 DOM（唯一例外是「今天」按钮文案，见 localizeTodayButton）。
 */
const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const zhYearMonth = d => `${d.getFullYear()}年${d.getMonth() + 1}月`
const addDays = (d, n) => {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}
// 只保留 Day / Week / Month 三个模式（工具栏只提供这三种）
const ZH_VIEW_MODES = [
  {
    name: 'Day',
    padding: '7d',
    step: '1d',
    date_format: 'YYYY-MM-DD',
    column_width: 84, // 需要容纳「3日 周一」
    lower_text: d => `${d.getDate()}日 ${WEEKDAYS_ZH[d.getDay()]}`,
    upper_text: (d, ld) => (!ld || d.getMonth() !== ld.getMonth() || d.getFullYear() !== ld.getFullYear())
        ? zhYearMonth(d)
        : '',
    thick_line: d => d.getDay() === 1
  },
  {
    name: 'Week',
    padding: '1m',
    step: '7d',
    date_format: 'YYYY-MM-DD',
    column_width: 150,
    lower_text: d => {
      const end = addDays(d, 6)
      return `${d.getMonth() + 1}月${d.getDate()}日-${end.getMonth() + 1}月${end.getDate()}日`
    },
    upper_text: (d, ld) => (!ld || d.getMonth() !== ld.getMonth() || d.getFullYear() !== ld.getFullYear())
        ? zhYearMonth(d)
        : '',
    thick_line: d => d.getDate() >= 1 && d.getDate() <= 7,
    upper_text_frequency: 4
  },
  {
    name: 'Month',
    padding: '2m',
    step: '1m',
    date_format: 'YYYY-MM',
    column_width: 110,
    lower_text: d => `${d.getMonth() + 1}月`,
    upper_text: (d, ld) => (!ld || d.getFullYear() !== ld.getFullYear()) ? `${d.getFullYear()}年` : '',
    thick_line: d => d.getMonth() % 3 === 0,
    snap_at: '7d'
  }
]

// 图表库把「Today」写死在按钮里（无公开文案选项），渲染后改一次文本；依赖 .today-button 类名
function localizeTodayButton() {
  const btn = chartRef.value?.querySelector('.today-button')
  if (btn) btn.textContent = '今天'
}

// 后端 progress 已算好（0-100），这里只做范围保护，不重复计算
function normalizeProgress(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function toGanttTasks(list) {
  return list.map(t => {
    // frappe-gantt 用 classList.add(custom_class)，只接受单个 token，因此把「状态 + 待定」拼成一个类名
    const statusKey = STATUS_CLASS[t.status] || STATUS_CLASS[0]
    return {
      id: String(t.id),
      name: t.title,
      start: t.startTime,
      end: t.endTime,
      progress: normalizeProgress(t.progress),
      custom_class: `gantt-status-${statusKey}${t.timePending ? '-pending' : ''}`
    }
  })
}

function clearChart() {
  gantt = null
  if (chartRef.value) chartRef.value.innerHTML = ''
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]))

// tooltip 日期统一中文：2026年11月2日 09:00（甘特接口时间带秒，独立于任务列表的格式化）
const fmtTime = v => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/)
  if (!m) return String(v || '').slice(0, 16) || '—'
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日 ${m[4]}`
}

// 部门展示：后端新字段 deptNames / deptIds 返回全部部门，旧的 deptId / deptName 兜底。
// 后端暂不区分「参与 / 联动」，按数组顺序用顿号连接
function deptText(t) {
  const names = Array.isArray(t.deptNames)
      ? t.deptNames.map(v => String(v ?? '').trim()).filter(Boolean)
      : []
  if (names.length) return names.join('、')
  const legacy = String(t.deptName ?? '').trim()
  if (legacy) return legacy
  const ids = Array.isArray(t.deptIds) ? t.deptIds : (t.deptId ? [t.deptId] : [])
  const labels = ids.filter(Boolean).map(getDeptLabel).filter(Boolean)
  return labels.length ? labels.join('、') : '未知部门'
}

// tooltip 内容：标题 / 部门 / 发布人 / 起止时间 / 进度
// 后端可能返回 deptId=null、deptName / publishByName 空串，统一兜底，避免空行或 undefined
function tooltipHtml(t) {
  const dept = deptText(t)
  const publisher = String(t.publishByName ?? '').trim() || '未知发布人'
  const title = String(t.title ?? '').trim() || '未命名任务'
  return `<div class="gantt-tip">
    <div class="gantt-tip-title">${esc(title)}</div>
    <div class="gantt-tip-row"><span>部门</span><b>${esc(dept)}</b></div>
    <div class="gantt-tip-row"><span>发布人</span><b>${esc(publisher)}</b></div>
    <div class="gantt-tip-row"><span>起止</span><b>${esc(fmtTime(t.startTime))} ~ ${esc(fmtTime(t.endTime))}</b></div>
    <div class="gantt-tip-row"><span>进度</span><b>${normalizeProgress(t.progress)}%</b></div>
    ${t.timePending ? '<div class="gantt-tip-pending">时间待定：原始时间缺失，按兜底时间展示</div>' : ''}
  </div>`
}

function renderChart() {
  clearChart()
  if (!chartRef.value || !tasks.value.length) return
  const rawById = new Map(tasks.value.map(t => [String(t.id), t]))
  // 初始滚动到最早任务，避免视图左侧留出一整段空白（padding 会把起始时间再往前推）
  const earliestStart = tasks.value
      .map(t => String(t.startTime || '').slice(0, 10))
      .filter(Boolean)
      .sort()[0]
  gantt = new Gantt(chartRef.value, toGanttTasks(tasks.value), {
    view_mode: viewMode.value,
    view_modes: ZH_VIEW_MODES,      // 中文表头，见文件上方说明
    language: 'zh-CN',
    readonly: true,          // 本轮不做拖拽改时间
    readonly_dates: true,
    readonly_progress: true,
    infinite_padding: false,
    scroll_to: earliestStart || 'start',
    bar_height: 26,
    padding: 18,
    container_height: 'auto',
    popup_on: 'hover',
    popup: ({ task }) => tooltipHtml(rawById.get(String(task.id)) || {}),
    on_click: task => router.push('/tasks/' + task.id)
  })
  // 库的 setup_options 在传入自定义 view_modes 时会强制取 view_modes[0]（Day），
  // 这里再显式切回当前应展示的视图（默认 Day，用户手动切周/月后保持一致）
  if (gantt.options.view_mode?.name !== viewMode.value) gantt.change_view_mode(viewMode.value)
  localizeTodayButton()
}

function onViewModeChange(mode) {
  if (gantt) {
    gantt.change_view_mode(mode)
    localizeTodayButton()
  }
}

// 图表库按鼠标位置绝对定位 tooltip，窄屏/靠右的任务条会把浮层顶出可视区，这里做一次位置回收到容器内
let clampTimer = null
function scheduleClampPopup() {
  if (clampTimer) clearTimeout(clampTimer)
  clampTimer = setTimeout(clampPopup, 260)
}

function clampPopup() {
  clampTimer = null
  const container = chartRef.value?.querySelector('.gantt-container')
  const popup = chartRef.value?.querySelector('.popup-wrapper')
  if (!container || !popup || popup.classList.contains('hide')) return
  const margin = 8
  const c = container.getBoundingClientRect()
  const p = popup.getBoundingClientRect()
  let left = parseFloat(popup.style.left) || 0
  let top = parseFloat(popup.style.top) || 0
  if (p.right > c.right - margin) left -= p.right - c.right + margin
  if (p.left < c.left + margin) left += c.left + margin - p.left
  if (p.top < c.top + margin) top += c.top + margin - p.top
  popup.style.left = `${left}px`
  popup.style.top = `${top}px`
}

/* ===== 页面高度铺满视口 =====
 * 页面高度 = 可视高度 - 页面在视口中的起始偏移 - main-inner 的下内边距（实测，不写死）。
 * 页头/工具栏的实际占用由 flex 自动让出，图表卡片吃掉剩余高度；
 * 图表竖向滚动交给库自带的 .gantt-container（overflow:auto），页面本身不滚动。
 */
const viewportHeight = () => window.visualViewport?.height || window.innerHeight

function syncPageHeight() {
  const page = pageRef.value
  if (!page) return
  const top = page.getBoundingClientRect().top
  const parent = page.parentElement
  const padBottom = parent ? parseFloat(getComputedStyle(parent).paddingBottom) || 0 : 0
  // 取整避免多出 1px 触发外层滚动
  page.style.height = `${Math.max(320, Math.floor(viewportHeight() - top - padBottom))}px`
}

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    syncPageHeight()
    // 重新按当前视图模式布局，避免窄屏切换后列宽残留
    if (gantt) gantt.change_view_mode(viewMode.value)
  }, 200)
}

onMounted(() => {
  syncPageHeight()
  loadTasks()
  chartRef.value?.addEventListener('mouseover', scheduleClampPopup)
  window.addEventListener('resize', onResize)
  // 移动端地址栏收起/展开时 innerHeight 可能滞后，visualViewport 更准
  window.visualViewport?.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  chartRef.value?.removeEventListener('mouseover', scheduleClampPopup)
  if (clampTimer) clearTimeout(clampTimer)
  clampTimer = null
  window.removeEventListener('resize', onResize)
  window.visualViewport?.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = null
  clearChart()
})
</script>

<style scoped>
.head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.gantt-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 14px; margin-bottom: 14px;
}
.toolbar-select { width: 132px; }
.toolbar-range { width: 280px; }

.gantt-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-left: auto; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-sub); }
.legend-dot { width: 12px; height: 10px; border-radius: 3px; display: inline-block; }
.legend-prepare { background: #c8cdd4; }
.legend-doing { background: #eb9a3d; }
.legend-done { background: #67b97c; }
.legend-pending { background: transparent; border: 1px dashed #909399; }

/* 页面铺满视口：页头/工具栏按内容高度，图表卡片吃掉剩余高度（页面高度由 syncPageHeight 实测写入） */
.gantt-page { display: flex; flex-direction: column; min-height: 0; }
.gantt-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding: 10px 12px 14px; overflow: hidden; }
.gantt-chart { flex: 1 1 auto; min-height: 0; width: 100%; max-width: 100%; overflow: hidden; }
/* 库在 container_height:'auto' 时会给 .gantt-container 写行内高度（=内容高度），这里强制铺满卡片；
   横向/竖向滚动都交给库自带的 .gantt-container{overflow:auto}，页面外层不再出现第二个滚动条 */
:deep(.gantt-container) { height: 100% !important; width: 100%; max-width: 100%; }
.gantt-chart-hidden { display: none; }

.gantt-state { padding: 36px 16px; text-align: center; }
.gantt-state-title { margin: 0 0 6px; font-weight: 600; }
.gantt-state .muted { margin: 0 0 14px; }

/* 任务条颜色：筹备（灰）/ 进行中（橙）/ 已结束（绿）/ 时间待定（虚线）
   .bar-wrapper 上带 custom_class（单 token：状态 + -pending），叠一层类名以压过库内 `.gantt .bar-wrapper .bar` */
:deep(.bar-wrapper.gantt-status-prepare .bar),
:deep(.bar-wrapper.gantt-status-prepare-pending .bar) { fill: #c8cdd4; }
:deep(.bar-wrapper.gantt-status-prepare .bar-progress),
:deep(.bar-wrapper.gantt-status-prepare-pending .bar-progress) { fill: #a8b2be; }
:deep(.bar-wrapper.gantt-status-doing .bar),
:deep(.bar-wrapper.gantt-status-doing-pending .bar) { fill: #f5d1ab; }
:deep(.bar-wrapper.gantt-status-doing .bar-progress),
:deep(.bar-wrapper.gantt-status-doing-pending .bar-progress) { fill: #eb9a3d; }
:deep(.bar-wrapper.gantt-status-done .bar),
:deep(.bar-wrapper.gantt-status-done-pending .bar) { fill: #c6e6cd; }
:deep(.bar-wrapper.gantt-status-done .bar-progress),
:deep(.bar-wrapper.gantt-status-done-pending .bar-progress) { fill: #67b97c; }
:deep(.bar-wrapper.gantt-status-prepare-pending .bar),
:deep(.bar-wrapper.gantt-status-doing-pending .bar),
:deep(.bar-wrapper.gantt-status-done-pending .bar) {
  stroke: #909399; stroke-width: 2px; stroke-dasharray: 5 4;
}

/* tooltip（由图表库动态插入，需用 :deep 才生效）
   pointer-events:none：浮层若盖住任务条会触发 mouseleave -> 反复显示/隐藏的闪烁 */
:deep(.popup-wrapper) { max-width: calc(100% - 16px); pointer-events: none; }
:deep(.gantt-tip) { min-width: 190px; font-size: 12px; color: #303133; }
:deep(.gantt-tip-title) { font-weight: 600; margin-bottom: 6px; font-size: 13px; }
:deep(.gantt-tip-row) { display: flex; gap: 8px; line-height: 1.75; }
:deep(.gantt-tip-row span) { color: #909399; min-width: 42px; flex: 0 0 auto; }
:deep(.gantt-tip-row b) { font-weight: 500; word-break: break-all; }
:deep(.gantt-tip-pending) { margin-top: 6px; color: #e6a23c; }

@media (max-width: 768px) {
  .gantt-toolbar { padding: 12px; }
  .gantt-legend { margin-left: 0; width: 100%; }
}

@media (max-width: 480px) {
  .head-actions { width: 100%; }
  .gantt-toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .toolbar-select,
  .toolbar-range { width: 100%; }
  .gantt-toolbar :deep(.el-radio-group) { width: 100%; display: flex; }
  .gantt-toolbar :deep(.el-radio-button) { flex: 1; }
  .gantt-toolbar :deep(.el-radio-button__inner) { width: 100%; }
  .gantt-card { padding: 8px; }
}
</style>
