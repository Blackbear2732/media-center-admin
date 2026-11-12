<template>
  <div class="page" v-loading="loading">
    <!-- 顶部标题与返回 -->
    <div class="flex-between" style="margin-bottom: 24px;">
      <div>
        <h2 style="margin: 0; font-size: 24px; color: var(--text);">
          {{ isWx ? '网宣数据详情' : '影音数据详情' }}
        </h2>
        <div class="muted" style="margin-top: 6px;">
          {{ isWx ? '微信公众号推文表现概览' : '微信视频号播放表现概览' }}
        </div>
      </div>
      <button class="pill" @click="router.back()">返回首页</button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
      <div class="surface-card stat-card">
        <div class="stat-num">{{ formatNumber(summary.totalViews) }}</div>
        <div class="stat-label">{{ isWx ? '总阅读量' : '总播放量' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ formatNumber(summary.totalLikes) }}</div>
        <div class="stat-label">{{ isWx ? '总点赞量' : '总喜欢量' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ summary.totalCount || 0 }}</div>
        <div class="stat-label">{{ isWx ? '推文总数' : '视频总数' }}</div>
      </div>
    </div>

    <!-- 趋势图 -->
    <div class="surface-card" style="padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 600;">月度趋势（{{ isWx ? '阅读' : '播放' }}量）</div>
        <el-select v-model="selectedYear" style="width: 140px;" aria-label="年份筛选">
          <el-option label="全部年份" value="" />
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
      </div>
      <div class="trend-scroll">
        <div class="trend-track" :style="{ minWidth: trendMinWidth }">
          <div v-for="t in trend" :key="t.month" class="trend-item">
            <div class="trend-value">{{ formatNumber(t.views) }}</div>

            <!-- 柱子 -->
            <div
                :style="{
                height: getBarHeight(t.views) + 'px',
                width: '100%',
                maxWidth: '40px',
                background: isWx ? 'linear-gradient(180deg, #6fa8d4, #2b5f8e)' : 'linear-gradient(180deg, #f2b279, #e8833a)',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.3s'
              }"
            ></div>

            <!-- 月份（每根柱子下方） -->
            <div class="trend-month">{{ formatMonth(t.month) }}月</div>
          </div>
        </div>
        <!-- 年份（跨月按年归组，形成时间轴） -->
        <div class="trend-year-row" :style="{ minWidth: trendMinWidth }">
          <div
              v-for="(g, gi) in yearGroups"
              :key="gi"
              class="trend-year-cell"
              :style="{ width: g.count * COLUMN_PITCH + 'px' }"
          >{{ g.year }}年</div>
        </div>
      </div>
    </div>

    <!-- 数据列表 -->
    <div class="surface-card" style="padding: 0; overflow: hidden;">
      <el-table
        :data="pagedList"
        stripe
        style="width: 100%;"
        :header-cell-style="{ background: '#fafbfc' }"
        @sort-change="handleSortChange"
      >
        <el-table-column type="index" :index="indexMethod" label="排名" width="80" align="center" />
        <el-table-column prop="title" label="标题" min-width="300">
          <template #default="{ row }">
            <el-link type="primary" :href="row.url" target="_blank" :underline="false" style="font-weight: 500;">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :type="isWx ? 'primary' : 'warning'">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="发布时间" width="140" />
        <el-table-column prop="views" label="浏览量" width="120" sortable="custom" :sort-orders="SORT_ORDERS">
          <template #default="{ row }">
            <span style="font-weight: 600; color: var(--brand);">{{ formatNumber(row.views) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="likes" label="点赞/喜欢" width="120" sortable="custom" :sort-orders="SORT_ORDERS">
          <template #default="{ row }">
            <span style="color: var(--accent);">{{ formatNumber(row.likes) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openLink(row.url)">查看原文</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-pagination">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const route = useRoute()
const router = useRouter()
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()

// 路由参数只允许 wx / yy，避免用户手输 /data-panel/foo 时把未知类型当成影音数据展示
const VALID_TYPES = ['wx', 'yy']
const type = computed(() => String(route.params.type || 'wx'))
const isValidType = computed(() => VALID_TYPES.includes(type.value))
const isWx = computed(() => type.value === 'wx')

// 后端返回的数据源
const summary = ref({})
const trend = ref([])
const rows = ref([])
const total = ref(0)

// 分页状态
const page = ref(1)
const pageSize = ref(20)

// 年份筛选
const selectedYear = ref('')

// 年份选项：只在「全部年份」查询时刷新（取全量趋势里的年份），
// 不随当前筛选结果变化，避免选中某一年后其他年份从下拉框消失
const allYears = ref([])
const yearOptions = computed(() => allYears.value)

// 排序：后端分页接口固定按发布时间倒序，表格若在前端对当前页排序只能覆盖本页，
// 因此排序时先取当前筛选条件下的全量数据，再在前端排序并按页切片
const sortProp = ref('')
const sortOrder = ref('')
const hasSort = computed(() => Boolean(sortProp.value && sortOrder.value))

// 当前筛选条件下的全量数据缓存（仅排序态使用）
const fullRows = ref(null)
const fullRowsKey = ref('')

const filterKey = computed(() => `${type.value}|${selectedYear.value}`)

// 全量数据按排序字段排序后的结果
const sortedRows = computed(() => {
  if (!fullRows.value) return []
  const dir = sortOrder.value === 'ascending' ? 1 : -1
  const prop = sortProp.value
  return [...fullRows.value].sort((a, b) => ((Number(a[prop]) || 0) - (Number(b[prop]) || 0)) * dir)
})

// 表格展示：排序态下按页切片全量排序结果；默认态直接用后端分页结果
const pagedList = computed(() => {
  if (!hasSort.value) return rows.value
  const start = (page.value - 1) * pageSize.value
  return sortedRows.value.slice(start, start + pageSize.value)
})

const trendMinWidth = computed(() => `${Math.max(600, trend.value.length * COLUMN_PITCH)}px`)
const indexMethod = (index) => (page.value - 1) * pageSize.value + index + 1

// 时间轴每根柱子的固定列宽，供月份/年份标签对齐
const COLUMN_PITCH = 56

// 排序列表头点击顺序：降序 → 升序 → 取消排序（取消后回到后端默认的发布时间倒序）
const SORT_ORDERS = ['descending', 'ascending', null]

// 按年份归组连续月份，用于时间轴底部的年份区间标签
const yearGroups = computed(() => {
  const groups = []
  let cur = null
  trend.value.forEach((t) => {
    const y = formatYear(t.month)
    if (!cur) cur = { year: y, count: 1 }
    else if (cur.year === y) cur.count++
    else { groups.push(cur); cur = { year: y, count: 1 } }
  })
  if (cur) groups.push(cur)
  return groups
})

// 计算柱状图相对高度
const getBarHeight = (views) => {
  const allViews = trend.value.map(t => t.views)
  let max = 1
  for (let i = 0; i < allViews.length; i++) {
    if (allViews[i] > max) max = allViews[i]
  }
  return Math.max(10, Math.round((views / max) * 120))
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num
}

// 从月份字段中提取"年"数字，兼容后端返回的 yyyy-MM、yyyy-MM-dd、yyyy-MM-dd HH:mm:ss 等格式
const formatYear = (month) => {
  if (!month) return ''
  const part = String(month).split(' ')[0].split('-')[0]
  return part ? part : String(month)
}

// 从月份字段中提取"月"数字，兼容后端返回的 yyyy-MM、yyyy-MM-dd、yyyy-MM-dd HH:mm:ss 等格式
const formatMonth = (month) => {
  if (!month) return ''
  const part = String(month).split(' ')[0].split('-')[1]
  return part ? String(parseInt(part, 10)) : String(month)
}

function openLink(url) {
  if (url) window.open(url, '_blank')
}

/** 从趋势数据中提取去重后的年份（倒序），作为「全部年份」下的完整年份选项 */
function extractYears(trendData) {
  const years = new Set()
  for (const t of trendData || []) {
    const y = formatYear(t.month)
    if (y) years.add(y)
  }
  return [...years].sort().reverse()
}

// 请求序号：快速切换年份时丢弃过期响应，避免旧筛选结果覆盖新筛选结果
let requestSeq = 0

/** 调用后端分页接口加载数据 */
async function loadData() {
  const seq = ++requestSeq
  loading.value = true
  try {
    const params = {
      type: type.value,
      pageNum: page.value,
      pageSize: pageSize.value
    }
    if (selectedYear.value) {
      params.year = selectedYear.value
    }
    const res = await adminApi.mediaList(params)
    if (seq !== requestSeq) return
    if (res) {
      summary.value = res.summary || {}
      trend.value = res.trend || []
      rows.value = res.rows || []
      total.value = res.total || 0
      // 仅在「全部年份」查询时刷新年份选项，选中具体年份后不再覆盖
      if (!selectedYear.value) {
        allYears.value = extractYears(res.trend)
      }
    }
  } catch (e) {
    if (e?.code !== 'ERR_CANCELED' && e?.code !== 'ECONNABORTED' && !e?.message?.includes('timeout')) {
      console.error('加载详情数据失败', e)
    }
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

/** 排序态：拉取当前筛选条件下的全量数据，供前端按排序字段全量排序 */
async function loadFullRows() {
  // 已有同一筛选条件的全量缓存则直接复用
  if (fullRows.value && fullRowsKey.value === filterKey.value) return

  // 记录本次请求对应的筛选条件，响应回来时若筛选已变化则丢弃
  const key = filterKey.value

  // 先走一次普通分页查询，拿到当前筛选条件下的总数（同时刷新 summary / trend）
  await loadData()
  if (key !== filterKey.value) return
  if (total.value <= pageSize.value) {
    // 不足一页，当前结果本身即全量
    fullRows.value = rows.value
    fullRowsKey.value = key
    return
  }

  const seq = ++requestSeq
  loading.value = true
  try {
    const params = {
      type: type.value,
      pageNum: 1,
      pageSize: total.value
    }
    if (selectedYear.value) {
      params.year = selectedYear.value
    }
    const res = await adminApi.mediaList(params)
    if (seq !== requestSeq || key !== filterKey.value) return
    if (res) {
      fullRows.value = Array.isArray(res.rows) ? res.rows : []
      fullRowsKey.value = key
      total.value = res.total || fullRows.value.length
    }
  } catch (e) {
    if (e?.code !== 'ERR_CANCELED' && e?.code !== 'ECONNABORTED' && !e?.message?.includes('timeout')) {
      console.error('加载全量排序数据失败', e)
    }
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

/** 按当前筛选 + 排序状态重新加载 */
async function reload() {
  if (!hasSort.value) {
    // 退出排序态：清掉全量缓存，回到后端分页（发布时间倒序）
    fullRows.value = null
    fullRowsKey.value = ''
    await loadData()
    return
  }
  await loadFullRows()
}

/** 表头排序变化：排序态下由前端在全量数据上排序，取消排序则回退到后端分页顺序 */
function handleSortChange({ prop, order }) {
  const valid = Boolean(order) && (prop === 'views' || prop === 'likes')
  sortProp.value = valid ? prop : ''
  sortOrder.value = valid ? order : ''
  page.value = 1
  reload()
}

function handlePageChange(next) {
  if (next === page.value) return
  page.value = next
  // 排序态下的分页在前端切片，无需再请求后端
  if (!hasSort.value) loadData()
}

function handleSizeChange(size) {
  if (size === pageSize.value) return
  pageSize.value = size
  page.value = 1
  if (!hasSort.value) loadData()
}

// 年份改变 → 重置页码并重新加载（排序态下会对新年份的全量数据重新排序）
watch(selectedYear, () => {
  page.value = 1
  reload()
})

onMounted(async () => {
  if (!isValidType.value) {
    ElMessage.warning('数据看板类型不存在，已返回首页')
    router.replace('/')
    return
  }
  await reload()
})
</script>

<style scoped>
.trend-scroll {
  overflow-x: auto;
  padding-bottom: 6px;
}

.trend-track {
  overflow: visible;
  display: flex;
  align-items: flex-end;
  height: 200px;
  padding: 8px 4px 2px;
  border-bottom: 1px solid var(--border);
}

.trend-item {
  flex: 0 0 56px;
  width: 56px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

/* 时间轴底部的年份行：与上方柱子同宽同左对齐 */
.trend-year-row {
  display: flex;
  padding: 4px 4px 0;
  border-bottom: 1px solid var(--border);
}

.trend-year-cell {
  flex: 0 0 auto;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

.trend-value {
  font-size: 11px;
  color: var(--brand);
  white-space: nowrap;
}

.trend-month {
  font-size: 11px;
  color: var(--text-secondary, #909399);
  white-space: nowrap;
}
</style>
