<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <b>任务列表</b>
          <el-button type="primary" size="small" @click="router.push('/tasks/create')">发布任务</el-button>
        </div>
      </template>
      <el-tabs v-model="active" @tab-change="load">
        <el-tab-pane v-for="s in tabs" :key="s" :label="s" :name="s" />
      </el-tabs>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="任务名称" min-width="230">
          <template #default="{ row }">
            <el-link type="primary" @click="router.push('/tasks/' + row.id)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column prop="location" label="地点" width="150" />
        <el-table-column label="参与部门" width="180">
          <template #default="{ row }">
            <el-tag v-for="d in row.departments" :key="d" size="small" style="margin-right:4px">{{ d }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { taskApi, statusTagType } from '@/api'

const router = useRouter()
const tabs = ['全部', '筹备', '进行', '完成']
const active = ref('全部')
const list = ref([]), loading = ref(false)

async function load() {
  loading.value = true
  try { list.value = await taskApi.list({ status: active.value }) }  // GET /api/tasks?status=xxx
  finally { loading.value = false }
}
onMounted(load)
</script>