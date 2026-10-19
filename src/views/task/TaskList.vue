<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>任务中心</h2>
        <p class="muted">{{ list.length }} 个任务 · 按状态筛选</p>
      </div>
      <button class="pill active" @click="router.push('/tasks/create')">+ 发布任务</button>
    </div>

    <div class="filter-pills">
      <span v-for="s in tabs" :key="s" class="pill" :class="{ active: active === s }" @click="changeTab(s)">{{ s }}</span>
    </div>

    <div class="task-grid" v-loading="loading">
      <div v-for="t in list" :key="t.id" class="task-card surface-card" @click="router.push('/tasks/' + t.id)">
        <div class="task-card-head">
          <span class="status-dot" :class="dotClass(t.status)"></span>
          <span>{{ t.status }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
        <div class="task-card-meta">📍 {{ t.location }}</div>
        <div class="task-card-tags">
          <span v-for="d in t.departments" :key="d" class="tag-soft">{{ d }}</span>
        </div>
        <div class="task-card-foot">
          <div class="avatars">
            <span v-for="p in (t.participants || []).slice(0, 3)" :key="p.name" class="mini-avatar">{{ p.name.slice(0, 1) }}</span>
          </div>
          <span class="muted">{{ (t.participants || []).length }} 人参与</span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && !list.length" description="该状态下暂无任务" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { taskApi } from '@/api'

const router = useRouter()
const tabs = ['全部', '筹备', '进行', '完成']
const active = ref('全部')
const list = ref([])
const loading = ref(false)
const dotClass = (s) => ({ '筹备': 'dot-prepare', '进行': 'dot-doing', '完成': 'dot-done' }[s] || 'dot-prepare')

async function load() {
  loading.value = true
  try { list.value = await taskApi.list({ status: active.value }) } finally { loading.value = false }
}
function changeTab(s) { active.value = s; load() }
onMounted(load)
</script>

<style scoped>
.list-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.list-head h2 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.list-head p { margin: 6px 0 0; }
.filter-pills { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
</style>