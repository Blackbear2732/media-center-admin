<template>
  <div v-loading="loading">
    <div class="surface-card upload-card" v-if="canUpload">
      <div>
        <b>CSV 数据上传</b>
        <div class="muted">综合部上传微信后台导出的 CSV，解析后进入看板</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <input ref="fileRef" type="file" accept=".csv" style="display:none" @change="onFile" />
        <button class="pill" @click="fileRef.click()">选择文件</button>
        <span class="muted">{{ fileName || '未选择文件' }}</span>
        <button class="pill active" :disabled="!fileName || uploading" @click="upload">{{ uploading ? '上传中…' : '上传并解析' }}</button>
      </div>
    </div>

    <div class="section-head"><div><h3>年度 Top 10</h3><div class="sub">按阅读量排序</div></div></div>
    <div class="surface-card" style="padding:18px">
      <div v-for="(t, i) in top10" :key="t.title" class="top-row">
        <span class="top-rank" :class="{ gold: i === 0, silver: i === 1, bronze: i === 2 }">{{ i + 1 }}</span>
        <span class="top-title">{{ t.title }}</span>
        <div class="top-bar-wrap"><div class="top-bar" :style="{ width: barWidth(t.views) }"></div></div>
        <span class="muted" style="width:90px;text-align:right">{{ t.views }} 阅</span>
      </div>
    </div>

    <div class="section-head"><div><h3>历史趋势</h3><div class="sub">月度阅读量</div></div></div>
    <div class="surface-card trend-card">
      <div v-for="t in trend" :key="t.month" class="trend-item">
        <div class="trend-bar" :style="{ height: trendHeight(t.views) }"></div>
        <div class="muted" style="font-size:11px">{{ t.month.slice(5) }}月</div>
        <div class="muted" style="font-size:11px">{{ t.views }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const dept = localStorage.getItem('adminDept') || '新闻部'
const role = localStorage.getItem('role') || 'member'
const canUpload = computed(() => dept === '综合部' && (role === 'director' || role === 'minister'))
const loading = ref(false), uploading = ref(false)
const data = ref({ top10: [], trend: [] })
const fileRef = ref(null), fileName = ref(''), fileObj = ref(null)

const top10 = computed(() => data.value.top10 || [])
const trend = computed(() => data.value.trend || [])
const maxViews = computed(() => Math.max(...top10.value.map(t => t.views), 1))
const barWidth = (v) => Math.round((v / maxViews.value) * 100) + '%'
const maxTrend = computed(() => Math.max(...trend.value.map(t => t.views), 1))
const trendHeight = (v) => Math.max(8, Math.round((v / maxTrend.value) * 110)) + 'px'

function onFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  fileObj.value = f
  fileName.value = f.name
}
async function upload() {
  if (!fileObj.value) return
  uploading.value = true
  try {
    const res = await adminApi.uploadCsv(fileObj.value)
    ElMessage.success(`解析完成，共 ${res.rows} 条数据`)
    fileName.value = ''; fileObj.value = null
  } finally { uploading.value = false }
}
onMounted(async () => {
  loading.value = true
  try { data.value = await adminApi.dashboard() } finally { loading.value = false }
})
</script>

<style scoped>
.upload-card { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; margin-bottom: 8px; }
.top-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.top-rank {
  width: 24px; height: 24px; border-radius: 8px; background: #eef2f6; color: var(--text-sub);
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
}
.top-rank.gold { background: #fdf3d8; color: #b8860b; }
.top-rank.silver { background: #eef1f5; color: #7a8a9a; }
.top-rank.bronze { background: #f8ecdf; color: #a0714a; }
.top-title { width: 220px; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-bar-wrap { flex: 1; height: 8px; background: #f0f3f7; border-radius: 999px; overflow: hidden; }
.top-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--brand), #6fa8d4); }
.trend-card { display: flex; align-items: flex-end; gap: 32px; padding: 24px; min-height: 180px; }
.trend-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.trend-bar { width: 42px; border-radius: 8px 8px 0 0; background: linear-gradient(180deg, #6fa8d4, var(--brand)); }
</style>