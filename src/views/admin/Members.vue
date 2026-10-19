<template>
  <div>
    <div class="flex-between" style="margin-bottom:14px">
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="muted">共 {{ list.length }} 人（含停用）</span>
        <!-- 主任专属：部门筛选器 -->
        <el-select
            v-if="role === 'director'"
            v-model="deptFilter"
            size="small"
            style="width: 140px"
            @change="load"
        >
          <el-option label="全部部门" value="" />
          <el-option v-for="d in deptList" :key="d" :label="d" :value="d" />
        </el-select>
      </div>
      <button class="pill active" @click="openEdit()">+ 新增成员</button>
    </div>

    <div class="surface-card" style="padding: 6px 0" v-loading="loading">
      <el-table :data="list" stripe>
        <!-- 仅主任可见：所属部门列 -->
        <el-table-column v-if="role === 'director'" prop="dept" label="所属部门" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.dept }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="nickname" label="昵称" width="100" />
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="title" label="中心职务" width="110" />
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
        <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
        <el-form-item label="学院"><el-input v-model="form.college" /></el-form-item>
        <el-form-item label="班级"><el-input v-model="form.className" /></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.grade" /></el-form-item>
        <el-form-item label="入学年份"><el-input v-model.number="form.enrollYear" /></el-form-item>
        <el-form-item label="中心职务"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
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
          <el-descriptions-item label="年级">{{ current.grade }}</el-descriptions-item>
          <el-descriptions-item label="职务">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ current.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ current.email }}</el-descriptions-item>
        </el-descriptions>

        <div class="sec-title" style="font-size:14px">任务参与</div>
        <div v-for="t in detail.tasks" :key="t.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ t.title }}</span><span class="muted">{{ t.status }}</span>
        </div>

        <div class="sec-title" style="font-size:14px">打卡记录</div>
        <div v-for="c in detail.checkins" :key="c.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ c.date }} · {{ c.task }}</span><span class="muted">{{ c.status }}</span>
        </div>

        <div class="sec-title" style="font-size:14px">会议记录</div>
        <div v-for="m in detail.meetings" :key="m.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ m.title }}</span><span class="muted">{{ m.status }}</span>
        </div>

        <div class="sec-title" style="font-size:14px">考评记录</div>
        <div v-for="e in detail.evaluations" :key="e.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
          <span>{{ e.period }} · 总分 {{ e.total }}</span><span class="muted">{{ e.status }}</span>
        </div>
        <el-empty v-if="!detail.evaluations?.length" description="暂无考评" :image-size="50" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

// 获取角色与部门信息
const role = localStorage.getItem('role') || 'member'
const currentDept = localStorage.getItem('adminDept') || '新闻部'
const deptList = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']

// 如果是主任，默认查全部；如果是部长，只能查自己部门
const deptFilter = ref(role === 'director' ? '' : currentDept)

const list = ref([])
const loading = ref(false), saving = ref(false)
const editVisible = ref(false), detailVisible = ref(false), detailLoading = ref(false)
const current = ref(null)
const detail = ref({ tasks: [], checkins: [], meetings: [], evaluations: [] })
const form = reactive({
  id: null, dept: '', studentNo: '', name: '', nickname: '',
  college: '', className: '', grade: '', enrollYear: 2024,
  title: '部员', phone: '', email: ''
})

async function load() {
  loading.value = true
  try {
    // 主任传空字符串查全部，部长传自己的部门
    list.value = await adminApi.members(deptFilter.value)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    id: null, dept: deptFilter.value || deptList[0], studentNo: '', name: '',
    nickname: '', college: '', className: '', grade: '', enrollYear: 2024,
    title: '部员', phone: '', email: ''
  })
}

function openEdit(row) {
  resetForm()
  if (row) Object.assign(form, row)
  editVisible.value = true
}

async function save() {
  if (!form.studentNo || !form.name) return ElMessage.warning('学号和姓名为必填')
  if (!form.dept) return ElMessage.warning('请选择所属部门')
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