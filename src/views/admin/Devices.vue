<template>
  <div v-loading="loading">
    <!-- 顶部标签页 -->
    <div class="admin-tabs" style="margin-bottom:16px">
      <span v-for="t in tabs" :key="t.key" class="pill" :class="{ active: active === t.key }" @click="active = t.key">{{ t.label }}</span>
    </div>

    <!-- ================= 1. 设备档案 ================= -->
    <template v-if="active === 'archive'">
      <!-- 状态统计卡片 -->
      <div class="stat-grid" style="margin-bottom: 20px;">
        <div class="surface-card stat-card" @click="filterStatus = null" :class="{ 'active-filter': filterStatus === null }">
          <div class="stat-num">{{ devices.length }}</div>
          <div class="stat-label">设备种类</div>
        </div>
        <div
            v-for="s in STAT_CARDS"
            :key="s.status"
            class="surface-card stat-card"
            @click="filterStatus = s.status"
            :class="{ 'active-filter': filterStatus === s.status }"
        >
          <div class="stat-num" :style="{ color: s.color }">{{ statusCount[s.status] || 0 }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>

      <div class="flex-between" style="margin-bottom:12px">
        <div class="muted">
          当前显示：{{ filterStatus === null ? '全部设备' : `仅看「${getDeviceStatusLabel(filterStatus)}」` }}（共 {{ filteredDevices.length }} 条）
        </div>
        <button class="pill active" @click="openEdit()">+ 新增设备</button>
      </div>

      <div class="surface-card" style="padding:8px 0">
        <el-table :data="filteredDevices" stripe>
          <el-table-column prop="code" label="编号" width="100" />
          <el-table-column prop="name" label="设备名称" min-width="180" />
          <el-table-column prop="stock" label="库存数量" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.stock > 0 ? 'success' : 'danger'" size="small" effect="plain">
                {{ row.stock }} 件
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="model" label="型号" width="140" />
          <el-table-column prop="buyDate" label="购买日期" width="120" />
          <el-table-column prop="status" label="当前状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getDeviceStatusType(row.status)" size="small" effect="dark" round>
                {{ getDeviceStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注 / 配件清单" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ================= 2. 申请审核 ================= -->
    <template v-else-if="active === 'review'">
      <div class="surface-card" style="padding:8px 0">
        <el-table :data="applications" stripe>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="deptId" label="部门" width="100">
            <template #default="{ row }">{{ getDeptLabel(row.deptId) }}</template>
          </el-table-column>
          <el-table-column prop="device" label="设备" min-width="160" />
          <el-table-column prop="applyNum" label="数量" width="80" align="center">
            <template #default="{ row }">{{ row.applyNum || 1 }}</template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始" width="140" />
          <el-table-column prop="endTime" label="结束" width="140" />
          <el-table-column prop="purpose" label="用途" min-width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="审核状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getApplyStatusType(row.status)" size="small">
                {{ getApplyStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <!-- 申请审核 -->
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button link type="success" :disabled="Number(row.status) !== APPLY_STATUS.PENDING" @click="review(row, APPLY_STATUS.APPROVED)">通过</el-button>
              <el-button link type="danger" :disabled="Number(row.status) !== APPLY_STATUS.PENDING" @click="review(row, APPLY_STATUS.REJECTED)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ================= 3. 使用记录 ================= -->
    <template v-else>
      <div class="surface-card" style="padding:8px 0">
        <el-table :data="usage" stripe>
          <el-table-column prop="device" label="设备" min-width="180" />
          <el-table-column prop="applyNum" label="数量" width="80" align="center">
            <template #default="{ row }">{{ row.applyNum || 1 }}</template>
          </el-table-column>
          <el-table-column prop="applicant" label="借用人" width="100" />
          <el-table-column prop="deptId" label="部门" width="100">
            <template #default="{ row }">{{ getDeptLabel(row.deptId) }}</template>
          </el-table-column>
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="startTime" label="开始" width="140" />
          <el-table-column prop="endTime" label="结束" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getApplyStatusType(row.status)" size="small">
                {{ getApplyStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="muted" style="margin-top:10px">仅摄制部部长可查看借用人电话；其他部门仅能看到设备「被借走」状态。</div>
    </template>

    <!-- 编辑/新增弹窗 -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑设备' : '新增设备'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="设备编号" required><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="设备名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="型号"><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="购买日期">
          <el-date-picker v-model="form.buyDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option v-for="s in DEVICE_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number v-model="form.stock" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注配件"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  APPLY_STATUS,
  DEVICE_STATUS,
  DEVICE_STATUS_OPTIONS,
  getApplyStatusLabel,
  getApplyStatusType,
  getDeptLabel,
  getDeviceStatusLabel,
  getDeviceStatusType
} from '@/utils/dict'

const tabs = [
  { key: 'archive', label: '设备档案' },
  { key: 'review', label: '申请审核' },
  { key: 'usage', label: '使用记录' }
]
const router = useRouter()
const canManageDevices = computed(() =>
  userStore.isDirector || Number(userStore.deptId) === 104
)
const active = ref('archive')
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading(), saving = ref(false)
const devices = ref([]), applications = ref([]), usage = ref([])
const editVisible = ref(false)

// null 表示全部
const filterStatus = ref(null)

// 统计卡片：可用 / 借出 / 维修
const STAT_CARDS = [
  { status: DEVICE_STATUS.AVAILABLE, color: '#4a9d6e' },
  { status: DEVICE_STATUS.LENT, color: '#e8833a' },
  { status: DEVICE_STATUS.REPAIR, color: '#f56c6c' }
].map(item => ({ ...item, label: getDeviceStatusLabel(item.status) }))

const statusCount = computed(() => {
  const counts = {}
  devices.value.forEach(d => {
    counts[d.status] = (counts[d.status] || 0) + 1
  })
  return counts
})

const filteredDevices = computed(() => {
  if (filterStatus.value === null) return devices.value
  return devices.value.filter(d => Number(d.status) === Number(filterStatus.value))
})

const emptyForm = () => ({ id: null, code: '', name: '', model: '', buyDate: '', status: DEVICE_STATUS.AVAILABLE, stock: 1, remark: '' })
const form = reactive(emptyForm())

async function load() {
  loading.value = true
  try {
    devices.value = await adminApi.devices()
    applications.value = await adminApi.deviceApplications()
    usage.value = applications.value.filter(a =>
      Number(a.status) === APPLY_STATUS.USING || Number(a.status) === APPLY_STATUS.APPROVED
    )
  } finally { loading.value = false }
}

function openEdit(row) {
  Object.assign(form, row ? { ...row } : emptyForm())
  editVisible.value = true
}

async function save() {
  if (!form.code || !form.name) return ElMessage.warning('编号和名称为必填')
  saving.value = true
  try {
    await adminApi.saveDevice({ ...form })
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  } finally { saving.value = false }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除设备「${row.name}」吗？删除后档案将不再显示。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch { return }
  try {
    await adminApi.deleteDevice(row.id)
    ElMessage.success('删除成功')
    load()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败，请检查设备是否在借用中')
  }
}

async function review(row, status) {
  const opinion = status === APPLY_STATUS.APPROVED ? '同意' : '时间冲突，请协调'
  await adminApi.reviewDevice(row.id, { status, opinion })
  row.status = status
  ElMessage.success('审核完成')
}

onMounted(() => {
  if (!canManageDevices.value) {
    ElMessage.warning('设备管理仅摄制部可用')
    router.replace('/admin/overview')
    return
  }
  load()
})
</script>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { padding: 20px; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-card.active-filter { border-color: var(--brand); background-color: var(--brand-soft); }
.stat-num { font-size: 28px; font-weight: 700; color: var(--brand); }
.stat-label { color: var(--text-sub); font-size: 13px; margin-top: 4px; }
@media (max-width: 900px) { .stat-grid { grid-template-columns: 1fr 1fr; } }
</style>
