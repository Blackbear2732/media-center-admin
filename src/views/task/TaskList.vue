<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>任务中心</h2>
        <p class="muted" style="margin: 8px 0 0;">
          {{ isMember ? `本部门任务 · 共 ${list.length} 个` : `全部任务 · 共 ${list.length} 个` }}
        </p>
      </div>
      <!-- 只有部长和主任能看到发布按钮 -->
      <button v-if="canManage" class="pill active" @click="router.push('/tasks/create')" style="padding: 10px 20px;">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发布任务
      </button>
    </div>

    <div class="filter-pills" style="margin-top: 24px; margin-bottom: 32px;">
      <span v-for="s in tabs" :key="s" class="pill" :class="{ active: active === s }" @click="changeTab(s)" style="padding: 8px 20px;">
        {{ s }}
      </span>
    </div>

    <div class="task-grid" v-loading="loading">
      <div v-for="t in list" :key="t.id" class="task-card surface-card" @click="router.push('/tasks/' + t.id)">
        <div class="task-card-head">
          <span class="status-dot" :class="dotClass(t.status)"></span>
          <span>{{ t.status }}</span>
          <span style="margin-left:auto">{{ t.startTime }}</span>
        </div>
        <h3>{{ t.title }}</h3>
        <div class="task-card-meta" style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
          <span>📍</span> <span>{{ t.location }}</span>
        </div>
        <div class="task-card-tags">
          <span v-for="d in t.departments" :key="d" class="tag-soft">{{ d }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { taskApi } from '@/api'

const router = useRouter()
const tabs = ['全部', '筹备', '进行中', '已结束']
const active = ref('全部')
const list = ref([])
const loading = ref(false)

// 角色判断
const role = localStorage.getItem('role') || 'member'
const canManage = computed(() => role === 'minister' || role === 'director')
const isMember = computed(() => role === 'member')

// 获取当前用户的部门（用于过滤）
const user = JSON.parse(localStorage.getItem('user') || '{}')
const currentDept = user.dept || ''

const dotClass = (s) => ({
  '筹备': 'dot-prepare',
  '进行中': 'dot-doing',
  '已结束': 'dot-done'
}[s] || 'dot-prepare')

async function load() {
  loading.value = true
  try {
    const params = { status: active.value }

    // 如果是部员，必须传部门参数，只查自己部门的任务
    if (isMember.value) {
      params.dept = currentDept
    }

    list.value = await taskApi.list(params)
  } finally {
    loading.value = false
  }
}

function changeTab(s) {
  active.value = s
  load()
}

onMounted(load)
</script>