<template>
  <div class="page">
    <div class="list-head">
      <div><h2>我的任务</h2><p class="muted">{{ activeList.length }} 个参与中的任务 · {{ doneList.length }} 个已结束的任务</p></div>
    </div>

    <!-- 参与中的任务（筹备中 / 进行中） -->
    <h3 class="section-title">参与中的任务</h3>
    <div class="task-grid" v-loading="loading">
      <div v-for="t in activeList" :key="t.id" class="task-card surface-card" @click="router.push('/tasks/' + t.id)">
        <div class="task-card-head">
          <span class="status-dot" :class="getTaskDotClass(t.status)"></span>
          <span>{{ getTaskStatusLabel(t.status) }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
        <div class="task-card-meta">📍 {{ t.location }}</div>
        <div class="task-card-tags">
          <span v-for="id in (t.deptIds || [])" :key="id" class="tag-soft">{{ getDeptLabel(id) }}</span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && activeList.length === 0" description="暂无参与中的任务" />

    <!-- 已结束的任务 -->
    <template v-if="doneList.length">
      <h3 class="section-title" style="margin-top:28px;">已结束的任务</h3>
      <div class="surface-card" style="padding:8px 0;" v-loading="loading">
        <div v-for="t in doneList" :key="t.id" class="done-row" @click="router.push('/tasks/' + t.id)">
          <div class="done-info">
            <span class="status-dot dot-done"></span>
            <span style="font-weight:600;">{{ t.title }}</span>
            <span class="tag-soft" style="margin-left:10px;">{{ getTaskStatusLabel(t.status) }}</span>
            <span class="muted" style="margin-left:14px; font-size:13px;">📍 {{ t.location }}</span>
          </div>
          <span class="muted" style="font-size:13px;">{{ t.startTime }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api'
import { getDeptLabel, getTaskDotClass, getTaskStatusLabel } from '@/utils/dict'

const router = useRouter()
const list = ref([]), loading = ref(false)

// 参与中的任务：筹备中(0) / 进行中(1)；已结束(2) 单放一组
const activeList = computed(() => list.value.filter(t => Number(t.status) !== 2))
const doneList = computed(() => list.value.filter(t => Number(t.status) === 2))

onMounted(async () => {
  loading.value = true
  try { list.value = await userApi.myTasks() } finally { loading.value = false }
})
</script>

<style scoped>
.section-title {
  font-size: 16px;
  margin: 0 0 12px;
  color: var(--text);
}
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.done-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
}
.done-row:last-child { border-bottom: none; }
.done-row:hover { background: #fafbfc; }
.done-info { display: flex; align-items: center; min-width: 0; }
@media (max-width: 768px) {
  .done-info { flex-wrap: wrap; gap: 6px; }
}
</style>
