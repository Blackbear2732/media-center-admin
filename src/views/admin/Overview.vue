<template>
  <div v-loading="loading">
    <div class="stat-grid">
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.memberCount || 0 }}</div>
        <div class="stat-label">{{ dept ? '部门成员' : '全中心总人数' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.activeCount || 0 }}</div>
        <div class="stat-label">{{ dept ? '在岗人数' : '全中心在岗' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.taskCount || 0 }}</div>
        <div class="stat-label">{{ dept ? '参与任务' : '全中心任务' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.materialCount || 0 }}</div>
        <div class="stat-label">{{ dept ? '素材数量' : '全中心素材' }}</div>
      </div>
    </div>

    <div class="section-head">
      <div>
        <h3>待办事项</h3>
        <div class="sub">需要您处理的事项</div>
      </div>
    </div>
    <div class="surface-card todo-list">
      <div v-if="!data.todos || data.todos.length === 0" class="muted" style="padding: 20px; text-align: center;">
        暂无待办事项
      </div>
      <div v-else v-for="(t, i) in data.todos" :key="i" class="todo-row">
        <span class="tag-soft">{{ todoLabel(t.type) }}</span>
        <span class="todo-text">{{ t.text }}</span>
        <span class="muted">{{ t.time }}</span>
      </div>
    </div>

    <div class="section-head">
      <div>
        <h3>最近任务</h3>
      </div>
    </div>
    <div class="task-grid">
      <div
          v-for="t in data.recentTasks"
          :key="t.id"
          class="task-card surface-card"
          @click="goTask(t.id)"
      >
        <div class="task-card-head">
          <span class="status-dot" :class="dotClass(t.status)"></span>
          <span>{{ t.status }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const dept = ref('')
const data = ref({
  memberCount: 0,
  activeCount: 0,
  taskCount: 0,
  materialCount: 0,
  todos: [],
  recentTasks: []
})

const dotClass = (s) => {
  const map = { '筹备': 'dot-prepare', '进行中': 'dot-doing', '已结束': 'dot-done' }
  return map[s] || 'dot-prepare'
}

const todoLabel = (t) => {
  const map = { signup: '报名确认', material: '素材归档', evaluation: '考评提醒' }
  return map[t] || '待办'
}

function goTask(id) {
  router.push('/tasks/' + id)
}

onMounted(async () => {
  loading.value = true
  try {
    dept.value = localStorage.getItem('adminDept') || '' // 主任这里为空
    const res = await adminApi.overview(dept.value)
    if (res) {
      data.value = res
    }
  } catch (e) {
    console.error('概览加载失败', e)
  } finally {
    loading.value = false
  }
})
</script>