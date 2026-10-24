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
          <el-select v-model="deptId" style="width:140px" :disabled="!canManageAllDepts" @change="onDeptChange">
            <el-option v-if="canManageAllDepts" label="全部部门" :value="ALL_DEPT_ID" />
            <el-option v-for="d in deptOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <span v-if="canManageAllDepts && !userStore.isDirector" class="muted" style="margin-left:6px;">综合部可处理全部部门</span>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">状态</label>
          <el-select v-model="statusFilter" style="width:120px">
            <el-option label="全部状态" :value="-1" />
            <el-option v-for="s in CHECKIN_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <el-button v-if="canGrant" size="small" @click="openManagerDialog">权限管理</el-button>
      </div>
    </div>

    <div class="surface-card" style="padding: 0;">
      <div style="padding: 12px 16px 0;">
        <span class="muted">共 {{ total }} 人</span>
      </div>
      <el-table :data="list" v-loading="loading" stripe style="width: 100%">
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
            <el-tag v-if="row.status !== null && row.status !== undefined && row.status !== ''"
                    :type="getCheckinStatusType(row.status)" size="small" effect="dark" round>
              {{ getCheckinStatusLabel(row.status) }}
            </el-tag>
            <span v-else class="muted"></span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="190">
          <template #default="{ row }">
            <template v-if="row.status === null || row.status === undefined || row.status === ''">
              <el-button type="danger" size="small" plain @click="mark(row, CHECKIN_STATUS.NOT_DONE)">
                标记未打卡
              </el-button>
              <el-button type="primary" size="small" plain @click="mark(row, CHECKIN_STATUS.DONE)">
                标记已打卡
              </el-button>
            </template>
            <template v-else>
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
              <el-button size="small" plain @click="mark(row, null)">清除状态</el-button>
            </template>
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

    <el-dialog v-model="managerVisible" title="打卡管理权限" width="560px">
      <div class="muted" style="margin-bottom:12px;">
        综合部部长可将打卡管理权限授予部员，被授权部员可进入本页标记全中心（含综合部）的打卡记录。
      </div>
      <div class="muted" style="margin-bottom:8px;">已授权管理员</div>
      <div v-if="managers.length === 0" class="muted" style="margin-bottom:12px;">暂无</div>
      <div v-for="m in managers" :key="m.userId" class="manager-row">
        <span>{{ m.name }}（{{ m.studentNo }}）· {{ m.deptLabel }} · 由{{ m.grantedByName }}授权 {{ m.grantedAt }}</span>
        <el-button type="danger" size="small" plain @click="revoke(m)">取消权限</el-button>
      </div>
      <el-divider />
      <div class="muted" style="margin-bottom:8px;">可授权部员</div>
      <el-input
        v-model="candidateKeyword"
        placeholder="搜索部员姓名 / 学号"
        clearable
        style="margin-bottom:10px;"
        @input="loadCandidates"
      />
      <div v-for="c in candidates" :key="c.userId" class="manager-row">
        <span>{{ c.name }}（{{ c.studentNo }}）· {{ c.deptLabel }}</span>
        <el-button type="primary" size="small" plain @click="grant(c)">授权</el-button>
      </div>
      <el-empty v-if="candidates.length === 0" description="暂无可授权部员" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const date = ref(new Date().toISOString().split('T')[0])
// 打卡管理归综合部：主任和综合部部长可处理全部部门，被授权部员同权限
const canManageAllDepts = computed(() =>
  userStore.isDirector || Number(userStore.deptId) === 101 || userStore.isCheckinManager
)
// 授权操作仅主任/综合部部长（被授权部员不可再授权他人）
const canGrant = computed(() =>
  userStore.isDirector || Number(userStore.deptId) === 101
)
// 打卡管理默认展示综合部（101），管理全中心者可切换到全部部门
const deptId = ref(canManageAllDepts.value ? 101 : (userStore.deptId ?? ALL_DEPT_ID))
const statusFilter = ref(-1) // -1 表示全部
const list = ref([])
const loading = ref(false)

// 后端分页：页码/每页条数/总数
const page = ref(1)
const size = ref(10)
const pageSizes = [10, 20, 50, 100]
const total = ref(0)

const deptOptions = computed(() => {
  if (canManageAllDepts.value) return DEPARTMENTS_OPTIONS
  return DEPARTMENTS_OPTIONS.filter(d => Number(d.value) === Number(userStore.deptId))
})

function onDeptChange() {
  page.value = 1
  loadData()
}

// 打卡状态筛选（-1 全部）变化时回到第一页重新查询
watch(statusFilter, () => {
  page.value = 1
  loadData()
})
// 翻页/改每页条数重新查询
watch([page, size], () => loadData())

async function loadData() {
  loading.value = true
  try {
    const res = await adminApi.checkins({
      date: date.value,
      deptId: deptId.value,
      status: Number(statusFilter.value) === -1 ? null : statusFilter.value,
      pageNum: page.value,
      pageSize: size.value
    })
    list.value = res?.rows || []
    total.value = res?.total || 0
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
    ElMessage.success(status == null ? '已清除打卡状态' : `已标记为${getCheckinStatusLabel(status)}`)
  } catch (e) {
    console.error(e)
  }
}

// ===== 打卡管理授权（仅主任/综合部部长可见） =====
const managerVisible = ref(false)
const managers = ref([])
const candidates = ref([])
const candidateKeyword = ref('')

async function loadManagers() {
  try {
    managers.value = await adminApi.checkinManagers() || []
  } catch (e) {
    console.error(e)
  }
}

async function loadCandidates() {
  try {
    candidates.value = await adminApi.checkinManagerCandidates(candidateKeyword.value) || []
  } catch (e) {
    console.error(e)
  }
}

function openManagerDialog() {
  managerVisible.value = true
  candidateKeyword.value = ''
  loadManagers()
  loadCandidates()
}

async function grant(c) {
  try {
    await adminApi.grantCheckinManager(c.userId)
    ElMessage.success(`已授权 ${c.name} 管理打卡`)
    loadManagers()
    loadCandidates()
  } catch (e) {
    console.error(e)
  }
}

async function revoke(m) {
  try {
    await adminApi.revokeCheckinManager(m.userId)
    ElMessage.success(`已取消 ${m.name} 的打卡管理权限`)
    loadManagers()
    loadCandidates()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  if (!canManageAllDepts.value) {
    ElMessage.warning('打卡管理仅综合部可用')
    router.replace('/admin/overview')
    return
  }
  loadData()
})
</script>

<style scoped>
.manager-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid var(--border, #eee);
  font-size: 13px;
}
</style>
