<template>
  <div>
    <!-- 顶部多级筛选区 -->
    <div class="filter-bar surface-card">
      <div class="filter-group">
        <div class="filter-item">
          <span class="filter-label">部门</span>
          <el-select v-model="deptFilter" size="small" :disabled="!userStore.isDirector" style="width: 140px">
            <el-option label="全部部门" :value="ALL_DEPT_ID" />
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">角色</span>
          <el-select v-model="roleFilter" size="small" clearable placeholder="全部角色" style="width: 120px">
            <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">政治面貌</span>
          <el-select v-model="politicalFilter" size="small" clearable placeholder="全部面貌" style="width: 140px">
            <el-option v-for="p in POLITICAL_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
        </div>
      </div>

      <div class="flex-between" style="flex: 1; margin-left: 24px;">
        <div class="muted">
          符合条件共 <span style="color: var(--brand); font-weight: 600;">{{ displayList.length }}</span> 人
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="pill" @click="resetFilter">重置筛选</button>
          <button class="pill active" @click="openEdit()">+ 新增成员</button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="surface-card" style="padding: 6px 0" v-loading="loading">
      <el-table :data="displayList" stripe>
        <el-table-column v-if="userStore.isDirector" prop="deptId" label="所属部门" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getDeptLabel(row.deptId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoleTagType(row.role)" effect="plain">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="中心职务" width="110" />
        <el-table-column prop="politicalStatus" label="政治面貌" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.politicalStatus === '中共党员' ? 'danger' : (row.politicalStatus === '共青团员' ? 'warning' : 'info')" effect="plain">
              {{ row.politicalStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getMemberStatusType(row.status)" size="small">{{ getMemberStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link :type="row.status === '在岗' ? 'danger' : 'success'" @click="toggle(row)">
              {{ row.status === '在岗' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑成员' : '新增成员'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="所属部门" v-if="userStore.isDirector">
          <el-select v-model="form.deptId" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" required><el-input v-model="form.studentNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.grade" /></el-form-item>
        <el-form-item label="中心职务"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="政治面貌">
          <el-select v-model="form.politicalStatus" style="width:100%">
            <el-option v-for="p in POLITICAL_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="current?.name + ' · 成员详情'" size="520px">
      <div v-if="current" v-loading="detailLoading">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="学号">{{ current.studentNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ getDeptLabel(current.deptId) }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ getRoleLabel(current.role) }}</el-descriptions-item>
          <el-descriptions-item label="职务">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{ current.politicalStatus }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ current.phone }}</el-descriptions-item>
        </el-descriptions>

        <!-- 任务参与 -->
        <div class="sec-title" style="font-size:14px; margin-top: 24px;">任务参与 ({{ detail.tasks?.length || 0 }})</div>
        <div v-if="detail.tasks && detail.tasks.length > 0">
          <div v-for="t in detail.tasks" :key="t.id" class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border)">
            <div>
              <div style="font-weight: 500; font-size: 14px;">{{ t.title }}</div>
              <div class="muted" style="font-size: 12px; margin-top: 4px;">{{ t.startTime }} · {{ t.location }}</div>
            </div>
            <el-tag size="small" :type="getTaskTagType(t.status)">{{ getTaskStatusLabel(t.status) }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无参与任务" :image-size="50" />

        <!-- 会议记录 -->
        <div class="sec-title" style="font-size:14px; margin-top: 20px;">会议记录</div>
        <div v-if="detail.meetings && detail.meetings.length > 0">
          <div v-for="m in detail.meetings" :key="m.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
            <span style="font-size: 13px;">{{ m.title }}</span>
            <el-tag size="small" :type="getMeetingJoinStatusType(m.status)" effect="plain">{{ getMeetingJoinStatusLabel(m.status) }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无会议记录" :image-size="50" />

        <!-- 考评记录 -->
        <div class="sec-title" style="font-size:14px; margin-top: 20px;">考评记录</div>
        <div v-if="detail.evaluations && detail.evaluations.length > 0">
          <div v-for="e in detail.evaluations" :key="e.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
            <span>{{ e.month }} 月度考评</span>
            <span style="font-weight: 600; color: var(--brand);">
              总分 {{ e.total }} ({{ getEvalLevelLabel(e.level) }})
            </span>
          </div>
        </div>
        <el-empty v-else description="暂无考评记录" :image-size="50" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  DEPARTMENTS_OPTIONS,
  MEMBER_STATUS,
  ROLE_OPTIONS,
  getDeptLabel,
  getEvalLevelLabel,
  getMeetingJoinStatusLabel,
  getMeetingJoinStatusType,
  getMemberStatusLabel,
  getMemberStatusType,
  getRoleLabel,
  getRoleTagType,
  getTaskStatusLabel,
  getTaskTagType,
  isAllDept
} from '@/utils/dict'

// 政治面貌是人员属性（varchar 存储），不是后端枚举，这里集中一份选项
const POLITICAL_OPTIONS = ['中共党员', '共青团员', '群众']

const deptFilter = ref(userStore.isDirector ? ALL_DEPT_ID : userStore.deptId)
const roleFilter = ref('')
const politicalFilter = ref('')

const rawList = ref([])
const loading = ref(false), saving = ref(false)
const editVisible = ref(false), detailVisible = ref(false), detailLoading = ref(false)
const current = ref(null)
const detail = ref({ tasks: [], checkins: [] })

const form = reactive({
  id: null, deptId: 101, role: 0, studentNo: '', name: '', grade: '',
  title: '部员', politicalStatus: '共青团员', phone: ''
})

const displayList = computed(() => {
  return rawList.value.filter(m => {
    if (!isAllDept(deptFilter.value) && Number(m.deptId) !== Number(deptFilter.value)) return false
    if (roleFilter.value !== '' && Number(m.role) !== Number(roleFilter.value)) return false
    if (politicalFilter.value && m.politicalStatus !== politicalFilter.value) return false
    return true
  })
})

async function load() {
  loading.value = true
  try {
    // 主任一次性取全量成员，切换部门筛选时走前端过滤
    const res = await adminApi.members(userStore.isDirector ? ALL_DEPT_ID : userStore.deptId)
    rawList.value = res || []
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  if (userStore.isDirector) deptFilter.value = ALL_DEPT_ID
  roleFilter.value = ''
  politicalFilter.value = ''
}

function resetForm() {
  Object.assign(form, {
    id: null,
    // 全中心视角下新增成员默认落到第一个业务部门（综合部）
    deptId: isAllDept(deptFilter.value) ? DEPARTMENTS_OPTIONS[0].value : deptFilter.value,
    role: 0,
    studentNo: '', name: '', grade: '', title: '部员',
    politicalStatus: '共青团员', phone: ''
  })
}

function openEdit(row) {
  resetForm()
  if (row) Object.assign(form, row)
  editVisible.value = true
}

async function save() {
  if (!form.studentNo || !form.name) return ElMessage.warning('学号和姓名为必填')
  saving.value = true
  try {
    await adminApi.saveMember({ ...form })
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  } finally { saving.value = false }
}

async function toggle(row) {
  const next = Number(row.status) === MEMBER_STATUS.ACTIVE ? MEMBER_STATUS.DISABLED : MEMBER_STATUS.ACTIVE
  const action = next === MEMBER_STATUS.DISABLED ? '停用' : '启用'
  await ElMessageBox.confirm(`确认${action}「${row.name}」吗？`, '提示', { type: 'warning' })
  await adminApi.toggleMember(row.id, next)
  row.status = next
  ElMessage.success('已更新')
}

async function openDetail(row) {
  current.value = row
  detailVisible.value = true
  detailLoading.value = true
  try { detail.value = await adminApi.memberDetail(row.id) } finally { detailLoading.value = false }
}

onMounted(load)
</script>
