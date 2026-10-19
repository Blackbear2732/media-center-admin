<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16" class="mb">
      <el-col :span="6" v-for="s in statCards" :key="s.label">
        <el-card shadow="never"><div class="stat-box">
          <div class="num" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="label">{{ s.label }}</div>
        </div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb">
      <template #header><b>出勤率统计</b></template>
      <el-progress :percentage="data.rate" :stroke-width="16" :color="data.rate >= 90 ? '#67c23a' : '#e6a23c'" />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <b>打卡记录</b>
          <el-button type="warning" size="small" @click="appealVisible = true">提交申诉</el-button>
        </div>
      </template>
      <el-table :data="data.records" stripe>
        <el-table-column prop="date" label="日期" width="130" />
        <el-table-column prop="task" label="关联任务/事项" min-width="200" />
        <el-table-column prop="time" label="打卡时间" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.status === '正常'" @click="openAppeal(row)">申诉</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="appealVisible" title="打卡申诉" width="480px">
      <el-form :model="appealForm" label-width="90px">
        <el-form-item label="申诉日期">
          <el-date-picker v-model="appealForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="申诉原因">
          <el-input v-model="appealForm.reason" type="textarea" :rows="4" placeholder="请说明申诉理由" />
        </el-form-item>
        <el-form-item label="证明材料">
          <el-input v-model="appealForm.proof" placeholder="证明材料链接（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAppeal">提交申诉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi, statusTagType } from '@/api'

const data = ref({ rate: 0, total: 0, normal: 0, late: 0, absent: 0, records: [] })
const loading = ref(false), appealVisible = ref(false), submitting = ref(false)
const appealForm = reactive({ date: '', reason: '', proof: '' })

const statCards = computed(() => [
  { label: '出勤率', value: data.value.rate + '%', color: '#409eff' },
  { label: '应出勤次数', value: data.value.total, color: '#409eff' },
  { label: '正常', value: data.value.normal, color: '#67c23a' },
  { label: '缺勤', value: data.value.absent, color: '#f56c6c' }
])

async function load() {
  loading.value = true
  try { data.value = await userApi.attendance() }  // GET /api/user/attendance
  finally { loading.value = false }
}
function openAppeal(row) {
  Object.assign(appealForm, { date: row.date, reason: '', proof: '' })
  appealVisible.value = true
}
async function submitAppeal() {
  if (!appealForm.reason) return ElMessage.warning('请填写申诉原因')
  submitting.value = true
  try {
    await userApi.appeal({ ...appealForm })  // POST /api/user/attendance/appeal
    ElMessage.success('申诉已提交，请等待审核')
    appealVisible.value = false
    load()
  } finally { submitting.value = false }
}
onMounted(load)
</script>