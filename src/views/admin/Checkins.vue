<template>
  <div v-loading="loading">
    <div class="admin-tabs" style="margin-bottom:16px">
      <span v-for="t in tabs" :key="t" class="pill" :class="{ active: active === t }" @click="active = t">{{ t }}</span>
    </div>

    <!-- 打卡记录 -->
    <template v-if="active === '打卡记录'">
      <div class="surface-card" style="padding:16px;margin-bottom:14px">
        <el-form inline>
          <el-form-item label="日期">
            <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width:160px" @change="loadRecords" />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="deptFilter" clearable placeholder="全部部门" style="width:150px" @change="loadRecords">
              <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.name" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <button class="pill active" type="button" @click="loadRecords">查询</button>
          </el-form-item>
        </el-form>
      </div>

      <div class="surface-card" style="padding:8px 0">
        <el-table :data="records" stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="dept" label="部门" width="120" />
          <el-table-column prop="member" label="成员" width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === '已转发' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="mark(row, '已转发')">标记已转发</el-button>
              <el-button link type="danger" @click="mark(row, '未转发')">标记未转发</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- 申诉审批 -->
    <template v-else-if="active === '申诉审批'">
      <div class="surface-card" style="padding:8px 0">
        <el-table :data="appeals" stripe>
          <el-table-column prop="member" label="成员" width="100" />
          <el-table-column prop="dept" label="部门" width="110" />
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="reason" label="申诉原因" min-width="200" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="success" :disabled="row.status !== '待审批'" @click="review(row, '已通过')">通过</el-button>
              <el-button link type="danger" :disabled="row.status !== '待审批'" @click="review(row, '已拒绝')">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- 统计 -->
    <template v-else>
      <div class="surface-card" style="padding:8px 0">
        <el-table :data="stats" stripe>
          <el-table-column prop="dept" label="部门" width="130" />
          <el-table-column prop="rate" label="出勤率" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.rate" :stroke-width="10" :color="row.rate >= 90 ? '#4a9d6e' : '#e8833a'" />
            </template>
          </el-table-column>
          <el-table-column prop="total" label="应出勤" width="100" />
          <el-table-column prop="normal" label="正常" width="100" />
          <el-table-column prop="absent" label="缺勤" width="100" />
        </el-table>
      </div>
      <div style="margin-top:14px;text-align:right">
        <button class="pill active" @click="exportExcel">导出 Excel</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { departments } from '@/api/mock'

const tabs = ['打卡记录', '申诉审批', '统计']
const active = ref('打卡记录')
const loading = ref(false)
const records = ref([]), appeals = ref([]), stats = ref([])
const date = ref('2024-11-05'), deptFilter = ref('')
const depts = departments

async function loadRecords() {
  loading.value = true
  try {
    records.value = await adminApi.checkins({ date: date.value, dept: deptFilter.value })
  } finally { loading.value = false }
}
async function loadAppeals() {
  appeals.value = await adminApi.checkinAppeals()
}
async function loadStats() {
  stats.value = await adminApi.checkinStats()
}
async function mark(row, status) {
  await adminApi.markCheckin(row.id, status)
  row.status = status
  ElMessage.success('已标记')
}
async function review(row, status) {
  await adminApi.reviewAppeal(row.id, status)
  row.status = status
  ElMessage.success(`已${status === '已通过' ? '通过' : '拒绝'}申诉`)
}
function exportExcel() {
  // TODO: GET /api/admin/checkins/export
  ElMessage.info('导出接口待对接')
}
onMounted(() => {
  loadRecords(); loadAppeals(); loadStats()
})
</script>