<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>素材库</h2>
        <p class="muted">按任务分类浏览 · 点击任务查看该任务的素材</p>
      </div>
    </div>

    <!-- 任务导航：按任务找素材 -->
    <div class="search-card surface-card">
      <div class="muted" style="margin-bottom:10px; font-weight:600;">按任务查找素材</div>
      <el-select v-model="selectedTaskId" placeholder="请选择任务" filterable clearable style="width:360px"
                 @change="onTaskChange">
        <el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id" />
      </el-select>
      <el-button style="margin-left:12px" type="primary" @click="loadTaskMaterials">查看素材</el-button>
      <span v-if="selectedTaskName" class="muted" style="margin-left:12px">
        当前任务：{{ selectedTaskName }}（{{ list.length }} 个素材）
      </span>
    </div>

    <!-- 素材网格：显示所选任务的素材 或 全部素材 -->
    <div class="material-grid" v-loading="loading">
      <div v-for="m in list" :key="m.id" class="material-card surface-card" @click="router.push('/materials/' + m.id)">
        <div class="material-type">{{ getMaterialTypeLabel(m.type) }}</div>
        <h3>{{ m.title }}</h3>
        <p v-if="m.content" class="material-excerpt">{{ m.content.slice(0, 72) }}…</p>
        <div class="material-meta">
          <span>{{ getDeptLabel(m.deptId) }}</span>
          <span>{{ m.author }}</span>
          <span v-if="m.createdAt">{{ m.createdAt }}</span>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && !list.length"
              :description="selectedTaskId ? '该任务暂无素材' : '没有匹配的素材'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { taskApi, materialApi } from '@/api'
import { getDeptLabel, getMaterialTypeLabel } from '@/utils/dict'

const router = useRouter()
const tasks = ref([])
const selectedTaskId = ref('')
const selectedTaskName = ref('')
const list = ref([]), loading = ref(false)

// 选择任务后立即加载该任务素材
async function onTaskChange(id) {
  if (!id) { await loadAll(); return }
  await loadTaskMaterials()
}

async function loadTaskMaterials() {
  const id = selectedTaskId.value
  const task = tasks.value.find(t => String(t.id) === String(id))
  selectedTaskName.value = task ? task.title : ''
  if (!id) return
  loading.value = true
  try {
    list.value = (await taskApi.materials(id)) || []
  } finally { loading.value = false }
}

// 未选任务时展示全部素材
async function loadAll() {
  loading.value = true
  try {
    list.value = (await materialApi.search({})) || []
  } finally { loading.value = false }
}

onMounted(async () => {
  tasks.value = (await taskApi.list({ status: -1 })) || []
  await loadAll()
})
</script>