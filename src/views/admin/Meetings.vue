<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:16px;">
      <div class="muted">共 {{ list.length }} 次会议记录</div>
      <button class="pill active" @click="openCreate" style="padding: 10px 20px;">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发起会议
      </button>
    </div>

    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
        <el-table-column prop="title" label="会议主题" min-width="200" />
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column prop="host" label="主持人" width="100" />
        <el-table-column prop="deptId" label="所属部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="isAllDept(row.deptId) ? 'danger' : 'info'" effect="plain">
              {{ getDeptLabel(row.deptId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参会情况" width="170">
          <template #default="{ row }">
            <template v-if="row.records && row.records.length">
              <span class="muted" style="font-size: 13px;">{{ rollSummary(row.records) }}</span>
            </template>
            <el-tag v-else size="small" type="info" effect="plain">未点名</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRoll(row)">{{ row.records && row.records.length ? '点名/修改' : '点名' }}</el-button>
            <el-button link type="danger" @click="removeMeeting(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无会议记录" />
    </div>

    <!-- 发起会议弹窗 -->
    <el-dialog v-model="createVisible" title="发起会议" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="会议主题" required>
          <el-input v-model="form.title" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="会议时间" required>
          <el-date-picker v-model="form.time" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="会议地点" required>
          <el-input v-model="form.location" placeholder="请输入会议地点" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input :model-value="getDeptLabel(form.deptId)" disabled />
        </el-form-item>
        <el-form-item label="参会对象">
          <span style="color: var(--brand); font-weight: 500;">
            {{ isAllDept(form.deptId) ? '全体部长' : `${getDeptLabel(form.deptId)}全体成员` }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createMeeting">确认发起</el-button>
      </template>
    </el-dialog>

    <!-- 点名弹窗 -->
    <el-dialog
        v-model="rollVisible"
        :title="current?.title + ' · 点名'"
        width="600px"
        class="roll-dialog"
        :close-on-click-modal="false"
    >
      <div class="roll-list" v-if="current">
        <div v-for="m in currentMembers" :key="m.id" class="roll-row">
          <div class="roll-user-info">
            <span class="name">{{ m.name }}</span>
            <span class="title muted">({{ getRoleLabel(m.role) }})</span>
          </div>
          <div class="roll-actions">
            <el-radio-group v-model="rollState[m.id]" size="small">
              <el-radio-button v-for="s in MEETING_STATUS_OPTIONS" :key="s.value" :label="s.value">{{ s.label }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-empty v-if="currentMembers.length === 0" description="暂无参会成员" :image-size="60" />
      </div>

      <template #footer>
        <div style="text-align: right;">
          <el-button @click="rollVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingRoll" @click="saveRoll">保存点名结果</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  MEETING_STATUS,
  MEETING_STATUS_OPTIONS,
  ROLE,
  getDeptLabel,
  getRoleLabel,
  isAllDept
} from '@/utils/dict'

const loading = ref(false), saving = ref(false), savingRoll = ref(false)
const list = ref([]), allMembers = ref([])
const createVisible = ref(false), rollVisible = ref(false)
const current = ref(null)

// 当前视角部门（主任可为全中心 100）
const targetDeptId = computed(() => userStore.viewDeptId)

const form = reactive({ title: '', time: '', location: '', deptId: ALL_DEPT_ID })
const rollState = reactive({})

// 动态计算当前会议的参会名单
const currentMembers = computed(() => {
  if (!current.value) return []
  // 全中心会议只点名全体部长
  if (isAllDept(current.value.deptId)) {
    return allMembers.value.filter(m => Number(m.role) === ROLE.MINISTER)
  }
  // 部门会议点名该部门在岗成员
  return allMembers.value.filter(m => Number(m.deptId) === Number(current.value.deptId) && Number(m.status) === 1)
})

// 点名结果概要：如 "5 到场 · 1 迟到 · 1 缺席"
function rollSummary(records) {
  const count = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const r of records) {
    const k = Number(r.status)
    if (count[k] != null) count[k]++
  }
  const parts = []
  if (count[1]) parts.push(count[1] + ' 到场')
  if (count[2]) parts.push(count[2] + ' 迟到')
  if (count[3]) parts.push(count[3] + ' 请假')
  if (count[4]) parts.push(count[4] + ' 缺席')
  return parts.join(' · ') || '已点名'
}

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.meetings(targetDeptId.value)
    // 拉取全量成员，方便后续按会议部门过滤
    const res = await adminApi.members(ALL_DEPT_ID)
    allMembers.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('加载会议数据失败', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.title = ''
  form.time = ''
  form.location = ''
  // 主任在全中心视角发起的就是全体部长会议
  form.deptId = targetDeptId.value
  createVisible.value = true
}

async function createMeeting() {
  if (!form.title || !form.time || !form.location) {
    return ElMessage.warning('请填写完整的会议信息')
  }
  saving.value = true
  try {
    const newMeeting = {
      id: Date.now(),
      title: form.title,
      time: form.time,
      location: form.location,
      host: userStore.name,
      deptId: form.deptId,
      records: []
    }
    const res = await adminApi.createMeeting(newMeeting)
    // 用后端返回的真实 id 替换临时 id，避免点名/删除时会议不存在
    if (res && res.id) newMeeting.id = res.id
    // 当前视角能覆盖到该会议时才插入列表
    if (isAllDept(targetDeptId.value) || Number(targetDeptId.value) === Number(form.deptId)) {
      list.value.unshift(newMeeting)
    }
    ElMessage.success('会议已创建')
    createVisible.value = false
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}

async function removeMeeting(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除会议《${row.title}》吗？删除后不可恢复。`, '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 用户取消
  }
  try {
    await adminApi.deleteMeeting(row.id)
    list.value = list.value.filter(m => !(String(m.id) === String(row.id)))
    ElMessage.success('会议已删除')
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

function openRoll(row) {
  current.value = row
  // 用已保存的点名记录初始化状态；没有记录（未点名）才默认全部到场
  const saved = {}
  for (const r of row.records || []) {
    if (r.userId != null) saved[Number(r.userId)] = Number(r.status)
  }
  currentMembers.value.forEach(m => {
    rollState[m.id] = saved[Number(m.id)] ?? MEETING_STATUS.PRESENT
  })
  rollVisible.value = true
}

async function saveRoll() {
  savingRoll.value = true
  try {
    const records = currentMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      deptId: m.deptId,
      status: rollState[m.id]
    }))
    await adminApi.saveMeetingRecords(current.value.id, records)
    // 回写已保存状态，再次打开点名弹窗能显示最新结果
    current.value.records = currentMembers.value.map(m => ({
      userId: m.id,
      status: rollState[m.id]
    }))
    ElMessage.success('点名结果已保存')
    rollVisible.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingRoll.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.roll-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px dashed var(--border);
}
.roll-user-info { display: flex; align-items: center; gap: 8px; }
.roll-user-info .name { font-weight: 600; font-size: 15px; color: var(--text); }

@media (max-width: 768px) {
  :deep(.roll-dialog) { width: 90% !important; }
  .roll-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .roll-actions { width: 100%; }
  :deep(.roll-actions .el-radio-group) { display: flex; width: 100%; }
  :deep(.roll-actions .el-radio-button) { flex: 1; }
  :deep(.roll-actions .el-radio-button__inner) { width: 100%; padding: 8px 0; }
}
</style>
