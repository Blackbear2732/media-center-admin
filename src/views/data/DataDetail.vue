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
      <el-table :data="pagedList" stripe style="width: 100%;" :header-cell-style="{ background: '#fafbfc' }">
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
        <el-table-column prop="views" label="浏览量" width="120" sortable>
          <template #default="{ row }">
            <span style="font-weight: 600; color: var(--brand);">{{ formatNumber(row.views) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="likes" label="点赞/喜欢" width="120" sortable>
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
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
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
const loading = ref(false)
const dashboard = ref({})

// 路由参数只允许 wx / yy，避免用户手输 /data-panel/foo 时把未知类型当成影音数据展示
const VALID_TYPES = ['wx', 'yy']
const type = computed(() => String(route.params.type || 'wx'))
const isValidType = computed(() => VALID_TYPES.includes(type.value))
const isWx = computed(() => type.value === 'wx')

const list = computed(() => {
  return dashboard.value.list || []
})

// 年份筛选：空字符串表示全部年份，各年份选项由数据中的发布时间自动提取
const selectedYear = ref('')
const yearOptions = computed(() => {
  const years = new Set()
  for (const d of list.value) {
    const y = formatYear(d.date)
    if (y) years.add(y)
  }
  return [...years].sort().reverse()
})
const yearList = computed(() => {
  if (!selectedYear.value) return list.value
  return list.value.filter(d => formatYear(d.date) === selectedYear.value)
})
watch(selectedYear, () => {
  page.value = 1
})

// 统计卡片：全部年份沿用后端聚合值；按年筛选时由该年数据本地重算
const summary = computed(() => {
  if (!selectedYear.value) return dashboard.value.summary || {}
  let totalViews = 0
  let totalLikes = 0
  for (const d of yearList.value) {
    totalViews += d.views || 0
    totalLikes += d.likes || 0
  }
  return { totalViews, totalLikes, totalCount: yearList.value.length }
})

// 月度趋势：全部年份沿用后端按月聚合；按年筛选时由该年数据本地按月归组
const trend = computed(() => {
  if (!selectedYear.value) return dashboard.value.trend || []
  const map = new Map()
  for (const d of yearList.value) {
    const month = localMonth(d.date)
    if (!month) continue
    const v = map.get(month) || { views: 0, likes: 0 }
    v.views += d.views || 0
    v.likes += d.likes || 0
    map.set(month, v)
  }
  return [...map.entries()]
    .map(([month, v]) => ({ month, views: v.views, likes: v.likes }))
    .sort((a, b) => a.month.localeCompare(b.month))
})

const page = ref(1)
const pageSize = ref(20)
const total = computed(() => yearList.value.length)
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return yearList.value.slice(start, start + pageSize.value)
})
const trendMinWidth = computed(() => `${Math.max(600, trend.value.length * COLUMN_PITCH)}px`)
const indexMethod = (index) => (page.value - 1) * pageSize.value + index + 1

// 时间轴每根柱子的固定列宽，供月份/年份标签对齐
const COLUMN_PITCH = 56

// 按年份归组连续月份，用于时间轴底部的年份区间标签
const yearGroups = computed(() => {
  const groups = []
  let cur = null
  trend.value.forEach((t, i) => {
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

// 从月份字段中提取“年”数字，兼容后端返回的 yyyy-MM、yyyy-MM-dd、yyyy-MM-dd HH:mm:ss 等格式
const formatYear = (month) => {
  if (!month) return ''
  const part = String(month).split(' ')[0].split('-')[0]
  return part ? part : String(month)
}

// 从月份字段中提取“月”数字，兼容后端返回的 yyyy-MM、yyyy-MM-dd、yyyy-MM-dd HH:mm:ss 等格式
const formatMonth = (month) => {
  if (!month) return ''
  const part = String(month).split(' ')[0].split('-')[1]
  return part ? String(parseInt(part, 10)) : String(month)
}

// 从日期字段中提取“yyyy-MM”，用于按年筛选时本地按月归组
const localMonth = (date) => {
  if (!date) return ''
  const part = String(date).split(' ')[0]
  return part.length >= 7 ? part.slice(0, 7) : ''
}

function openLink(url) {
  if (url) window.open(url, '_blank')
}

onMounted(async () => {
  if (!isValidType.value) {
    ElMessage.warning('数据看板类型不存在，已返回首页')
    router.replace('/')
    return
  }
  loading.value = true
  try {
    // dashboard 后端查询慢，设置 20s 超时；超时后友好提示，防止无限转圈
    const res = await adminApi.dashboard({ timeout: 20000 })
    if (res) {
      dashboard.value = isWx.value ? (res.wx || {}) : (res.yy || {})
    }
  } catch (e) {
    if (e?.code === 'ERR_CANCELED' || e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) {
      ElMessage.warning('数据看板加载较慢，请稍后刷新重试')
    } else {
      console.error('加载详情数据失败', e)
    }
  } finally {
    loading.value = false
  }
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