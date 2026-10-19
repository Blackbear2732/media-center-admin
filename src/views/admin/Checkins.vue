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
          <el-select v-model="dept" style="width:140px" @change="loadData">
            <el-option label="全部部门" value="全部" />
            <el-option v-for="d in depts" :key="d" :label="d" :value="d" />
          </el-select>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">状态</label>
          <el-select v-model="statusFilter" style="width:120px">
            <el-option label="全部状态" value="全部" />
            <el-option label="已打卡" value="已打卡" />
            <el-option label="未打卡" value="未打卡" />
          </el-select>
        </div>
      </div>
      <div class="muted">共 {{ filteredList.length }} 人</div>
    </div>

    <div class="surface-card" style="padding: 0;">
      <el-table :data="filteredList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="dept" label="部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.dept }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="140" />
        <el-table-column prop="member" label="姓名" width="120" />
        <el-table-column prop="status" label="打卡状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已打卡' ? 'success' : 'danger'" size="small" effect="dark" round>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160">
          <template #default="{ row }">
            <el-button
                v-if="row.status === '未打卡'"
                type="primary"
                size="small"
                plain
                @click="mark(row, '已打卡')"
            >标记打卡</el-button>
            <el-button
                v-else
                type="danger"
                size="small"
                plain
                @click="mark(row, '未打卡')"
            >取消打卡</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const date = ref(new Date().toISOString().split('T')[0])
const dept = ref('全部')
const statusFilter = ref('全部')
const list = ref([])
const loading = ref(false)
const depts = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']

const filteredList = computed(() => {
  if (statusFilter.value === '全部') return list.value
  return list.value.filter(item => item.status === statusFilter.value)
})

async function loadData() {
  loading.value = true
  try {
    const res = await adminApi.checkins({ date: date.value, dept: dept.value })
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
    ElMessage.success(`已标记为${status}`)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>