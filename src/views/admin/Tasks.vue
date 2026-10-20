<template>
  <div v-loading="loading">
    <div class="surface-card" style="padding: 8px 0">
      <el-table :data="list" stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 16px 24px 20px; background: #fafbfc; border-radius: 8px;">

              <!-- 1. 本部门参与人 (支持多选、批量删除) -->
              <div class="muted" style="margin-bottom:8px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                <span>本部门参与人</span>
                <el-button
                    v-if="selectedParticipants[row.id]?.length > 0"
                    type="danger"
                    size="small"
                    plain
                    @click="removeParticipants(row)"
                >
                  移除选中 ({{ selectedParticipants[row.id].length }})
                </el-button>
              </div>

              <el-checkbox-group v-model="selectedParticipants[row.id]" style="margin-bottom: 16px; min-height: 32px;">
                <el-checkbox
                    v-for="p in deptParticipants(row)"
                    :key="p.name"
                    :label="p.name"
                    border
                    size="small"
                    style="margin-right: 8px; margin-bottom: 8px;"
                >
                  {{ p.name }}
                </el-checkbox>
              </el-checkbox-group>
              <span v-if="!deptParticipants(row).length" class="muted" style="display:block; margin-bottom: 16px;">暂无本部门参与人</span>

              <!-- 2. 待确认报名 -->
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">待确认报名</div>
              <div v-if="pendingSignups(row).length > 0" style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; margin-bottom: 16px;">
                <div v-for="s in pendingSignups(row)" :key="s.name" class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border)">
                  <span>{{ s.name }}（{{ getDeptLabel(s.deptId) }}）</span>
                  <div>
                    <el-button size="small" type="success" plain @click="confirm(row, s)">确认</el-button>
                    <el-button size="small" type="danger" plain @click="reject(row, s)">忽略</el-button>
                  </div>
                </div>
              </div>
              <span v-else class="muted" style="display:block; margin-bottom: 16px;">暂无待确认报名</span>

              <!-- 3. 添加人员 -->
              <div style="margin-top: 8px;">
                <div class="muted" style="margin-bottom:8px; font-weight: 600;">添加本部门成员</div>
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <el-select
                      v-model="selectedNames[row.id]"
                      multiple
                      collapse-tags
                      collapse-tags-tooltip
                      placeholder="可多选人员，输入搜索"
                      style="width: 320px"
                      size="small"
                      filterable
                  >
                    <el-option
                        v-for="m in getAvailableMembers(row)"
                        :key="m.id"
                        :label="m.name"
                        :value="m.name"
                    />
                  </el-select>
                  <el-button size="small" type="primary" :loading="adding[row.id]" @click="addParticipants(row)">批量添加</el-button>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="任务名称" min-width="220" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getTaskTagType(row.status)">{{ getTaskStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="参与部门" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="id in (row.deptIds || [])" :key="id" size="small" style="margin-right:4px">{{ getDeptLabel(id) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push('/tasks/' + row.id)">查看</el-button>
            <el-button link type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑任务弹窗 -->
    <el-dialog v-model="editVisible" title="编辑任务信息" width="700px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="任务名称" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="任务状态" required>
          <el-select v-model="editForm.status" style="width:200px">
            <el-option v-for="s in TASK_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务时间" required>
          <el-date-picker v-model="editForm.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:46%" />
          <span style="margin:0 8px;">至</span>
          <el-date-picker v-model="editForm.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:46%" />
        </el-form-item>
        <el-form-item label="任务地点" required>
          <el-input v-model="editForm.location" />
        </el-form-item>
        <el-form-item label="任务说明">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="任务标签">
          <el-input v-model="tagInput" placeholder="输入后回车添加" style="width:200px" @keyup.enter="addTag" />
          <div style="margin-top:8px; width:100%;">
            <el-tag v-for="t in editForm.tags" :key="t" closable style="margin-right:6px" @close="editForm.tags = editForm.tags.filter(x => x !== t)">{{ t }}</el-tag>
          </div>
        </el-form-item>

        <el-form-item label="参与部门">
          <el-select v-model="editForm.deptIds" multiple placeholder="请选择主力部门" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="联动部门">
          <el-select v-model="editForm.relatedDeptIds" multiple placeholder="请选择协同部门" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" :disabled="editForm.deptIds.includes(d.value)" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联设备">
          <el-select v-model="editForm.equipmentIds" multiple placeholder="请选择所需设备" style="width:100%">
            <el-option v-for="d in availableDevices" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingEdit" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi, taskApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  DEPARTMENTS_OPTIONS,
  TASK_STATUS_OPTIONS,
  getDeptLabel,
  getTaskStatusLabel,
  getTaskTagType,
  isAllDept
} from '@/utils/dict'

const router = useRouter()

// 管理视角部门（主任可切到全中心 100）
const deptId = userStore.viewDeptId

const list = ref([]), loading = ref(false)
const deptMembers = ref([])

// 记录每个任务下拉框里选中的待添加人员
const selectedNames = reactive({})
const selectedParticipants = reactive({})
const adding = reactive({})

// --- 编辑弹窗状态 ---
const editVisible = ref(false)
const savingEdit = ref(false)
const tagInput = ref('')
const availableDevices = ref([])

const editForm = reactive({
  id: null, title: '', status: 0, startTime: '', endTime: '',
  location: '', description: '', tags: [], deptIds: [], relatedDeptIds: [], equipmentIds: []
})

// 全中心视角看全部参与人，否则只看本部门参与人
const deptParticipants = (row) => {
  const all = (row.participants || []).filter(p => isAllDept(deptId) || Number(p.deptId) === Number(deptId))
  return Array.from(new Map(all.map(item => [item.name, item])).values())
}

// 待确认报名（报名 status 0 = 待确认）
const pendingSignups = (row) => (row.signups || []).filter(s =>
  Number(s.status) === 0 && (isAllDept(deptId) || Number(s.deptId) === Number(deptId))
)

function getAvailableMembers(row) {
  const currentNames = (row.participants || []).map(p => p.name)
  return deptMembers.value.filter(m => !currentNames.includes(m.name))
}

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.tasks(deptId)
    deptMembers.value = await adminApi.members(isAllDept(deptId) ? ALL_DEPT_ID : deptId)

    list.value.forEach(t => {
      selectedNames[t.id] = []
      selectedParticipants[t.id] = []
      adding[t.id] = false
    })
  } finally {
    loading.value = false
  }
}

// --- 编辑与删除 ---
async function openEdit(row) {
  if (!availableDevices.value.length) availableDevices.value = await taskApi.devices()

  Object.assign(editForm, {
    id: row.id,
    title: row.title,
    status: Number(row.status),
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location,
    description: row.description || '',
    tags: row.tags || [],
    deptIds: row.deptIds || [],
    relatedDeptIds: row.relatedDeptIds || [],
    equipmentIds: row.equipmentIds || []
  })
  editVisible.value = true
}

function addTag() {
  const v = tagInput.value.trim()
  if (v && !editForm.tags.includes(v)) editForm.tags.push(v)
  tagInput.value = ''
}

async function saveEdit() {
  if (!editForm.title || !editForm.startTime || !editForm.endTime) {
    return ElMessage.warning('请填写必填项')
  }
  savingEdit.value = true
  try {
    await adminApi.updateTask(editForm.id, { ...editForm })
    ElMessage.success('修改成功')
    editVisible.value = false
    load()
  } catch (e) {
    ElMessage.error('修改失败')
  } finally {
    savingEdit.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除任务「${row.title}」吗？删除后不可恢复。`, '危险操作', {
      type: 'warning',
      confirmButtonText: '确认删除',
      confirmButtonClass: 'el-button--danger'
    })
    await adminApi.deleteTask(row.id)
    ElMessage.success('任务已删除')
    load()
  } catch (e) {}
}

async function confirm(row, s) {
  await adminApi.confirmSignup(row.id, s.name)
  row.signups = row.signups.filter(x => x.name !== s.name)
  if (!row.participants.some(p => p.name === s.name)) {
    row.participants.push({ name: s.name, deptId: s.deptId })
  }
  ElMessage.success('已确认报名')
}

function reject(row, s) {
  row.signups = row.signups.filter(x => x.name !== s.name)
  ElMessage.info('已忽略该报名')
}

async function addParticipants(row) {
  const names = selectedNames[row.id] || []
  if (names.length === 0) return ElMessage.warning('请选择要添加的成员')

  adding[row.id] = true
  let successCount = 0
  try {
    for (const name of names) {
      if (!row.participants.some(p => p.name === name)) {
        const member = deptMembers.value.find(m => m.name === name)
        const memberDeptId = member ? Number(member.deptId) : Number(deptId)
        await adminApi.addParticipant(row.id, { name, deptId: memberDeptId })
        row.participants.push({ name, deptId: memberDeptId })
        successCount++
      }
    }
    selectedNames[row.id] = []
    if (successCount > 0) ElMessage.success(`成功添加 ${successCount} 人`)
    else ElMessage.warning('所选人员已在任务中')
  } finally {
    adding[row.id] = false
  }
}

async function removeParticipants(row) {
  const names = selectedParticipants[row.id] || []
  if (names.length === 0) return
  try {
    for (const name of names) {
      await adminApi.removeParticipant(row.id, name)
    }
    row.participants = row.participants.filter(p => !names.includes(p.name))
    selectedParticipants[row.id] = []
    ElMessage.success(`已移除 ${names.length} 人`)
  } catch (e) {
    ElMessage.error('移除失败')
  }
}

onMounted(load)
</script>
