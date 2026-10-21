<template>
  <div class="page">
    <el-card shadow="never">
      <template #header><b>我的参会记录</b></template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="会议主题" min-width="220" />
        <el-table-column prop="time" label="会议时间" width="170" />
        <el-table-column prop="location" label="地点" width="170" />
        <el-table-column prop="host" label="主持人" width="110" />
        <el-table-column prop="status" label="参会状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getMeetingJoinStatusType(row.status)" size="small">{{ getMeetingJoinStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api'
import { getMeetingJoinStatusLabel, getMeetingJoinStatusType } from '@/utils/dict'

const list = ref([]), loading = ref(false)
onMounted(async () => {
  loading.value = true
  try { list.value = await userApi.myMeetings() }  // GET /api/user/meetings
  finally { loading.value = false }
})
</script>
