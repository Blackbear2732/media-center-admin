<template>
  <div>
    <!-- 顶部多级筛选区 -->
    <div class="filter-bar surface-card">
      <div class="filter-group">
        <div class="filter-item">
          <span class="filter-label">部门</span>
          <el-select v-model="deptFilter" size="small" :disabled="role !== 'director'" style="width: 140px">
            <el-option label="全部部门" value="" />
            <el-option v-for="d in deptList" :key="d" :label="d" :value="d" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">职务</span>
          <el-select v-model="titleFilter" size="small" clearable placeholder="全部职务" style="width: 120px">
            <el-option label="部长" value="部长" />
            <el-option label="部员" value="部员" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">政治面貌</span>
          <el-select v-model="politicalFilter" size="small" clearable placeholder="全部面貌" style="width: 140px">
            <el-option label="中共党员" value="中共党员" />
            <el-option label="共青团员" value="共青团员" />
            <el-option label="群众" value="群众" />
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
        <el-table-column v-if="role === 'director'" prop="dept" label="所属部门" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.dept }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="title" label="中心职务" width="110">
          <template #default="{ row }">
            <span :style="{ color: row.title.includes('部长') ? 'var(--accent)' : 'inherit', fontWeight: row.title.includes('部长') ? 600 : 400 }">
              {{ row.title }}
            </span>
          </template>
        </el-table-column>
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
            <el-tag :type="row.status === '在岗' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
        <el-form-item label="所属部门" v-if="role === 'director'">
          <el-select v-model="form.dept" style="width:100%">
            <el-option v-for="d in deptList" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" required><el-input v-model="form.studentNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.grade" /></el-form-item>
        <el-form-item label="中心职务"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="政治面貌">
          <el-select v-model="form.politicalStatus" style="width:100%">
            <el-option label="中共党员" value="中共党员" />
            <el-option label="共青团员" value="共青团员" />
            <el-option label="群众" value="群众" />
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
          <el-descriptions-item label="部门">{{ current.dept }}</el-descriptions-item>
          <el-descriptions-item label="职务">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{ current.politicalStatus }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ current.phone }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-title" style="font-size:14px">任务参与</div>
        <div v-for="t in detail.tasks" :key="t.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ t.title }}</span><span class="muted">{{ t.status }}</span>
        </div>

        <div class="sec-title" style="font-size:14px">打卡记录</div>
        <div v-for="c in detail.checkins" :key="c.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ c.date }} · {{ c.task }}</span><span class="muted">{{ c.status }}</span>
        </div>
        <el-empty v-if="!detail.tasks?.length && !detail.checkins?.length" description="暂无数据" :image-size="50" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const role = localStorage.getItem('role') || 'member'
const currentDept = localStorage.getItem('adminDept') || '新闻部'
const deptList = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']

const deptFilter = ref(role === 'director' ? '' : currentDept)
const titleFilter = ref('')
const politicalFilter = ref('')

const rawList = ref([])
const loading = ref(false), saving = ref(false)
const editVisible = ref(false), detailVisible = ref(false), detailLoading = ref(false)
const current = ref(null)
const detail = ref({ tasks: [], checkins: [] })
const form = reactive({
  id: null, dept: '', studentNo: '', name: '', grade: '',
  title: '部员', politicalStatus: '共青团员', phone: ''
})

const displayList = computed(() => {
  return rawList.value.filter(m => {
    if (deptFilter.value && m.dept !== deptFilter.value) return false
    if (titleFilter.value === '部长' && !m.title.includes('部长')) return false
    if (titleFilter.value === '部员' && m.title.includes('部长')) return false
    if (politicalFilter.value && m.politicalStatus !== politicalFilter.value) return false
    return true
  })
})

async function load() {
  loading.value = true
  try {
    const res = await adminApi.members(role === 'director' ? '' : currentDept)
    rawList.value = res || []
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  if (role === 'director') deptFilter.value = ''
  titleFilter.value = ''
  politicalFilter.value = ''
}

function resetForm() {
  Object.assign(form, {
    id: null, dept: deptFilter.value || deptList[0],
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
  const next = row.status === '在岗' ? '停用' : '在岗'
  await ElMessageBox.confirm(`确认${next === '停用' ? '停用' : '启用'}「${row.name}」吗？`, '提示', { type: 'warning' })
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