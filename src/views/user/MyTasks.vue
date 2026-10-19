<template>
  <div class="page">
    <div class="list-head">
      <div><h2>我的任务</h2><p class="muted">{{ list.length }} 个参与中的任务</p></div>
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
      </div>
    </div>
    <el-empty v-if="!loading && !list.length" description="暂无参与的任务" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api'

const router = useRouter()
const list = ref([]), loading = ref(false)
const dotClass = (s) => ({ '筹备': 'dot-prepare', '进行': 'dot-doing', '完成': 'dot-done' }[s] || 'dot-prepare')

onMounted(async () => {
  loading.value = true
  try { list.value = await userApi.myTasks() } finally { loading.value = false }
})
</script>

<style scoped>
.list-head { margin-bottom: 18px; }
.list-head h2 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.list-head p { margin: 6px 0 0; }
</style>