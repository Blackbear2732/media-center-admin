<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>素材库</h2>
        <p class="muted">全局搜索 · 共 {{ list.length }} 条结果</p>
      </div>
    </div>

    <div class="search-card surface-card">
      <el-form :model="query" :inline="true" class="search-form">
        <el-form-item><el-input v-model="query.title" placeholder="按标题搜索" clearable /></el-form-item>
        <el-form-item><el-input v-model="query.content" placeholder="按正文搜索" clearable /></el-form-item>
        <el-form-item>
          <el-select v-model="query.taskId" placeholder="全部任务" clearable filterable style="width:180px">
            <el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.deptId" placeholder="全部部门" clearable style="width:150px">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.leaderName" placeholder="主要领导" clearable style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width:250px" />
        </el-form-item>
        <el-form-item>
          <button class="pill active" type="button" @click="search">搜索</button>
          <button class="pill" type="button" style="margin-left:8px" @click="reset">重置</button>
        </el-form-item>
      </el-form>
    </div>

    <div class="material-grid" v-loading="loading">
      <div v-for="m in list" :key="m.id" class="material-card surface-card" @click="router.push('/materials/' + m.id)">
        <div class="material-type">{{ getMaterialTypeLabel(m.type) }}</div>
        <h3>{{ m.title }}</h3>
        <p v-if="m.content" class="material-excerpt">{{ m.content.slice(0, 72) }}…</p>
        <div class="material-meta">
          <span>{{ getDeptLabel(m.deptId) }}</span>
          <span>{{ m.author }}</span>
          <span>{{ m.createdAt }}</span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && !list.length" description="没有匹配的素材" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { materialApi, taskApi } from '@/api'
import { DEPARTMENTS_OPTIONS, getDeptLabel, getMaterialTypeLabel } from '@/utils/dict'

const router = useRouter()
const query = reactive({ title: '', content: '', deptId: '', leaderName: '', taskId: '' })
const dateRange = ref([])
const tasks = ref([])
const list = ref([]), loading = ref(false)

async function search() {
  loading.value = true
  try {
    list.value = await materialApi.search({
      ...query, startTime: dateRange.value?.[0], endTime: dateRange.value?.[1]
    })
  } finally { loading.value = false }
}

function reset() {
  Object.assign(query, { title: '', content: '', deptId: '', leaderName: '', taskId: '' })
  dateRange.value = []
  search()
}

onMounted(async () => {
  tasks.value = (await taskApi.list({ status: -1 })) || []
  search()
})
</script>