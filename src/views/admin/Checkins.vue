<template>
  <div>
    <div class="flex-between" style="margin-bottom:16px;">
      <div style="display:flex; gap:16px; align-items:center;">
        <div>
          <label class="muted" style="margin-right:8px;">日期</label>
          <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width:140px" @change="loadData" />
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">部门</label>
          <el-select v-model="deptId" style="width:140px" :disabled="!userStore.isDirector" @change="onDeptChange">
            <el-option v-if="userStore.isDirector" label="全部部门" :value="ALL_DEPT_ID" />
            <el-option v-for="d in deptOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <span v-if="!userStore.isDirector" class="muted" style="margin-left:6px;">仅本部门</span>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">状态</label>
          <el-select v-model="statusFilter" style="width:120px">
            <el-option label="全部状态" :value="-1" />
            <el-option v-for="s in CHECKIN_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>
      <div class="muted">共 {{ filteredList.length }} 人</div>
    </div>

    <div class="surface-card" style="padding: 0;">
      <el-table :data="pagedList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="deptId" label="部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ getDeptLabel(row.deptId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="140" />
        <el-table-column prop="member" label="姓名" width="120" />
        <el-table-column prop="status" label="打卡状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getCheckinStatusType(row.status)" size="small" effect="dark" round>
              {{ getCheckinStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160">
          <template #default="{ row }">
            <el-button
                v-if="Number(row.status) === CHECKIN_STATUS.NOT_DONE"
                type="primary"
                size="small"
                plain
                @click="mark(row, CHECKIN_STATUS.DONE)"
            >标记打卡</el-button>
            <el-button
                v-else
                type="danger"
                size="small"
                plain
                @click="mark(row, CHECKIN_STATUS.NOT_DONE)"
            >取消打卡</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  CHECKIN_STATUS,
  CHECKIN_STATUS_OPTIONS,
  DEPARTMENTS_OPTIONS,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getDeptLabel
} from '@/utils/dict'
import { usePagination } from '@/utils/usePagination'

const date = ref(new Date().toISOString().split('T')[0])
const deptId = ref(userStore.isDirector ? ALL_DEPT_ID : (userStore.deptId ?? ALL_DEPT_ID))
const statusFilter = ref(-1) // -1 表示全部
const list = ref([])
const loading = ref(false)

// 主任可切换全部/任意部门；部长只有本部门数据权限，锁定本部门
const deptOptions = computed(() => {
  if (userStore.isDirector) return DEPARTMENTS_OPTIONS
  return DEPARTMENTS_OPTIONS.filter(d => Number(d.value) === Number(userStore.deptId))
})

const filteredList = computed(() => {
  if (Number(statusFilter.value) === -1) return list.value
  return list.value.filter(item => Number(item.status) === Number(statusFilter.value))
})

// 全中心当日打卡名单可能上百条，分页渲染
const { page, size, pageSizes, total, paged: pagedList } = usePagination(filteredList)

function onDeptChange() {
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const res = await adminApi.checkins({ date: date.value, deptId: deptId.value })
    list.value = res || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function mark(row, status) {
  try {
    await adminApi.markCheckin(row.id, status, row)
    row.status = status
    ElMessage.success(`已标记为${getCheckinStatusLabel(status)}`)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>
