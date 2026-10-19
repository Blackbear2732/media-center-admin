<template>
  <div v-loading="loading">
    <div class="surface-card" style="padding: 8px 0">
      <el-table :data="list" stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 8px 24px 16px">
              <div class="muted" style="margin-bottom:8px">本部门参与人</div>
              <el-tag v-for="p in deptParticipants(row)" :key="p.name" style="margin-right:6px">
                {{ p.name }}
              </el-tag>
              <span v-if="!deptParticipants(row).length" class="muted">暂无本部门参与人</span>

              <div class="muted" style="margin:12px 0 8px">待确认报名</div>
              <div v-for="s in row.signups || []" :key="s.name" class="flex-between"
                   style="padding:6px 0;border-bottom:1px dashed var(--border)">
                <span>{{ s.name }}（{{ s.dept }}）</span>
                <div>
                  <el-button size="small" type="success" @click="confirm(row, s)">确认</el-button>
                  <el-button size="small" @click="reject(row, s)">忽略</el-button>
                </div>
              </div>
              <span v-if="!row.signups?.length" class="muted">无</span>

              <div style="margin-top:14px">
                <el-select v-model="addName[row.id]" placeholder="添加本部门参与人" style="width:220px" size="small">
                  <el-option v-for="m in deptMembers" :key="m.id" :label="m.name" :value="m.name" />
                </el-select>
                <el-button size="small" type="primary" style="margin-left:8px" @click="addParticipant(row)">添加</el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="任务名称" min-width="220" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="参与部门" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="d in row.departments" :key="d" size="small" style="margin-right:4px">{{ d }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push('/tasks/' + row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const router = useRouter()
const dept = localStorage.getItem('adminDept') || '新闻部'
const list = ref([]), loading = ref(false)
const deptMembers = ref([])
const addName = reactive({})

const deptParticipants = (row) => (row.participants || []).filter(p => p.dept === dept)

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.tasks(dept)
    deptMembers.value = await adminApi.members(dept)
  } finally { loading.value = false }
}
async function confirm(row, s) {
  await adminApi.confirmSignup(row.id, s.name)
  row.signups = row.signups.filter(x => x.name !== s.name)
  row.participants.push({ name: s.name, dept: s.dept || dept })
  ElMessage.success('已确认报名')
}
function reject(row, s) {
  row.signups = row.signups.filter(x => x.name !== s.name)
  ElMessage.info('已忽略该报名')
}
async function addParticipant(row) {
  const name = addName[row.id]
  if (!name) return ElMessage.warning('请选择成员')
  await adminApi.addParticipant(row.id, { name, dept })
  row.participants.push({ name, dept })
  addName[row.id] = ''
  ElMessage.success('已添加')
}
onMounted(load)
</script>