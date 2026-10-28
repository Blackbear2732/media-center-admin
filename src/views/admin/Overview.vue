<template>
  <div v-loading="loading">
    <div class="stat-grid">
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.memberCount || 0 }}</div>
        <div class="stat-label">{{ isAll ? '全中心总人数' : '部门成员' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.activeCount || 0 }}</div>
        <div class="stat-label">{{ isAll ? '全中心在岗' : '在岗人数' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.taskCount || 0 }}</div>
        <div class="stat-label">{{ isAll ? '全中心任务' : '参与任务' }}</div>
      </div>
      <div class="surface-card stat-card">
        <div class="stat-num">{{ data.materialCount || 0 }}</div>
        <div class="stat-label">{{ isAll ? '全中心素材' : '素材数量' }}</div>
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
      <div v-else v-for="(t, i) in data.todos" :key="i" class="todo-row todo-link" @click="goTodo(t)">
        <span class="tag-soft">{{ todoLabel(t.type) }}</span>
        <span class="todo-text">{{ t.text }}</span>
        <span class="muted">{{ t.time }}</span>
        <el-icon style="margin-left:auto; color: var(--text-sub);"><ArrowRight /></el-icon>
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
          <span class="status-dot" :class="getTaskDotClass(t.status)"></span>
          <span>{{ getTaskStatusLabel(t.status) }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { getTaskDotClass, getTaskStatusLabel, isAllDept } from '@/utils/dict'

const router = useRouter()
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()

// 当前管理视角部门（100 = 全中心）
const deptId = computed(() => userStore.viewDeptId)
const isAll = computed(() => isAllDept(deptId.value))

const data = ref({
  memberCount: 0,
  activeCount: 0,
  taskCount: 0,
  materialCount: 0,
  todos: [],
  recentTasks: []
})

// 待办类型字典
const todoLabel = (t) => {
  const map = { signup: '报名确认', material: '素材归档', evaluation: '考评提醒', checkin: '打卡核对', device: '设备审核', global: '全中心' }
  return map[t] || '待办'
}

function goTask(id) {
  router.push('/tasks/' + id)
}

// 待办类型 -> 对应管理界面（待办多为聚合提醒，跳转对应管理菜单页）
const TODO_ROUTES = {
  signup: '/admin/tasks',
  device: '/admin/devices',
  checkin: '/admin/checkins',
  evaluation: '/admin/evaluations',
  global: '/admin/overview'
}
function goTodo(t) {
  const path = TODO_ROUTES[t.type]
  if (path) router.push(path)
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await adminApi.overview(deptId.value)
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
