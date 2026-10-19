<template>
  <div v-loading="loading">
    <!-- 顶部标签页 -->
    <div class="admin-tabs" style="margin-bottom:16px">
      <span v-for="t in tabs" :key="t" class="pill" :class="{ active: active === t }" @click="active = t">{{ t }}</span>
    </div>

    <!-- ================= 1. 设备档案 ================= -->
    <template v-if="active === '设备档案'">
      <!-- 状态统计卡片 -->
      <div class="stat-grid" style="margin-bottom: 20px;">
        <div class="surface-card stat-card" @click="filterStatus = ''" :class="{ 'active-filter': filterStatus === '' }">
          <div class="stat-num">{{ devices.length }}</div>
          <div class="stat-label">设备总数</div>
        </div>
        <div class="surface-card stat-card" @click="filterStatus = '可用'" :class="{ 'active-filter': filterStatus === '可用' }">
          <div class="stat-num" style="color: #4a9d6e;">{{ statusCount['可用'] || 0 }}</div>
          <div class="stat-label">可用设备</div>
        </div>
        <div class="surface-card stat-card" @click="filterStatus = '借出'" :class="{ 'active-filter': filterStatus === '借出' }">
          <div class="stat-num" style="color: #e8833a;">{{ statusCount['借出'] || 0 }}</div>
          <div class="stat-label">借出中</div>
        </div>
        <div class="surface-card stat-card" @click="filterStatus = '维修'" :class="{ 'active-filter': filterStatus === '维修' }">
          <div class="stat-num" style="color: #f56c6c;">{{ statusCount['维修'] || 0 }}</div>
          <div class="stat-label">维修中</div>
        </div>
      </div>

      <div class="flex-between" style="margin-bottom:12px">
        <div class="muted">
          当前显示：{{ filterStatus ? `仅看「${filterStatus}」` : '全部设备' }}（共 {{ filteredDevices.length }} 台）
        </div>
        <button class="pill active" @click="openEdit()">+ 新增设备</button>
      </div>

      <div class="surface-card" style="padding:8px 0">
        <el-table :data="filteredDevices" stripe>
          <el-table-column prop="code" label="编号" width="100" />
          <el-table-column prop="name" label="名称" min-width="180" />
          <el-table-column prop="model" label="型号" width="120" />
          <el-table-column prop="buyDate" label="购买日期" width="120" />
          <el-table-column prop="status" label="当前状态" width="120">
            <template #default="{ row }">
              <el-tag
                  :type="{ '可用': 'success', '借出': 'warning', '维修': 'danger', '报废': 'info' }[row.status]"
                  size="small"
                  effect="dark"
                  round
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- ================= 2. 申请审核 ================= -->
    <template v-else-if="active === '申请审核'">
      <div class="surface-card" style="padding:8px 0">
        <el-table :data="applications" stripe>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="dept" label="部门" width="100" />
          <el-table-column prop="device" label="设备" min-width="160" />
          <el-table-column prop="startTime" label="开始" width="140" />
          <el-table-column prop="endTime" label="结束" width="140" />
          <el-table-column prop="purpose" label="用途" min-width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="审核状态" width="100">
            <template #default="{ row }">
              <el-tag :type="{ '待审核': 'info', '已通过': 'success', '已拒绝': 'danger' }[row.status]" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" :disabled="row.status !== '待审核'" @click="review(row, '已通过')">通过</el-button>
              <el-button link type="danger" :disabled="row.status !== '待审核'" @click="review(row, '已拒绝')">拒绝</el-button>
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
          <el-table-column prop="applicant" label="借用人" width="100" />
          <el-table-column prop="dept" label="部门" width="100" />
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="startTime" label="开始" width="140" />
          <el-table-column prop="endTime" label="结束" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '使用中' ? 'warning' : 'success'" size="small">
                {{ row.status }}
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
            <el-option v-for="s in ['可用','借出','维修','报废']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
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
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const tabs = ['设备档案', '申请审核', '使用记录']
const active = ref('设备档案')
const loading = ref(false), saving = ref(false)
const devices = ref([]), applications = ref([]), usage = ref([])
const editVisible = ref(false)

// 状态筛选控制
const filterStatus = ref('')

// 统计各状态的设备数量
const statusCount = computed(() => {
  const counts = {}
  devices.value.forEach(d => {
    counts[d.status] = (counts[d.status] || 0) + 1
  })
  return counts
})

// 根据点击的卡片过滤列表
const filteredDevices = computed(() => {
  if (!filterStatus.value) return devices.value
  return devices.value.filter(d => d.status === filterStatus.value)
})

const form = reactive({ id: null, code: '', name: '', model: '', buyDate: '', status: '可用', remark: '' })

async function load() {
  loading.value = true
  try {
    devices.value = await adminApi.devices()
    applications.value = await adminApi.deviceApplications()
    usage.value = applications.value.filter(a => a.status === '使用中' || a.status === '已通过')
  } finally { loading.value = false }
}

function openEdit(row) {
  Object.assign(form, row ? { ...row } : { id: null, code: '', name: '', model: '', buyDate: '', status: '可用', remark: '' })
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

async function review(row, status) {
  await adminApi.reviewDevice(row.id, { status, opinion: status === '已通过' ? '同意' : '时间冲突，请协调' })
  row.status = status
  ElMessage.success('审核完成')
}

onMounted(load)
</script>