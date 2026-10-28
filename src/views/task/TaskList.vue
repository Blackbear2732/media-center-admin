<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>任务中心</h2>
        <p class="muted" style="margin: 8px 0 0;">
          {{ userStore.isMember ? `本部门任务 · 共 ${list.length} 个` : `全部任务 · 共 ${list.length} 个` }}
        </p>
      </div>
      <button v-if="userStore.canManage" class="pill active" @click="router.push('/tasks/create')" style="padding: 10px 20px;">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发布任务
      </button>
    </div>

    <div class="filter-pills" style="margin-top: 24px; margin-bottom: 32px;">
      <span v-for="s in TASK_STATUS_FILTER_OPTIONS" :key="s.value" class="pill" :class="{ active: activeStatus === s.value }" @click="changeTab(s.value)" style="padding: 8px 20px;">
        {{ s.label }}
      </span>
    </div>

    <div class="task-grid" v-loading="loading">
      <div v-for="t in list" :key="t.id" class="task-card surface-card" @click="router.push('/tasks/' + t.id)">
        <div class="task-card-head">
          <span class="status-dot" :class="getTaskDotClass(t.status)"></span>
          <span>{{ getTaskStatusLabel(t.status) }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
        <div class="task-card-meta" style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
          <span>📍</span> <span>{{ t.location }}</span>
        </div>
        <div class="task-card-tags">
          <span v-for="id in (t.deptIds || [])" :key="id" class="tag-soft">{{ getDeptLabel(id) }}</span>
        </div>
        <div class="task-card-foot">
          <div class="avatars" style="margin-right: 12px;">
            <span v-for="p in (t.participants || []).slice(0, 3)" :key="p.name" class="mini-avatar">{{ p.name.slice(0, 1) }}</span>
          </div>
          <span class="muted">{{ (t.participants || []).length }} 人参与</span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && !list.length" description="暂无相关任务" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { taskApi } from '@/api'
import { userStore } from '@/store/user'
import { getDeptLabel, getTaskDotClass, getTaskStatusLabel, TASK_STATUS_FILTER_OPTIONS } from '@/utils/dict'

const router = useRouter()
const activeStatus = ref(-1) // -1 表示全部
const list = ref([])
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()

async function load() {
  loading.value = true
  try {
    const params = { status: activeStatus.value }
    // 主任看全中心，部长/部员只看本部门
    if (!userStore.isDirector) params.deptId = userStore.deptId
    list.value = await taskApi.list(params)
  } finally {
    loading.value = false
  }
}

function changeTab(status) {
  activeStatus.value = status
  load()
}

onMounted(load)
</script>
