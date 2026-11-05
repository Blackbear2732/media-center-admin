<template>
  <div v-loading="loading">
    <div class="page-head">
      <div>
        <h2>会议管理</h2>
        <p class="sub muted">共 {{ list.length }} 次会议记录</p>
      </div>
      <div class="page-head-actions">
        <button v-if="userStore.canManage" class="pill active" @click="openCreate" style="padding: 10px 20px;">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发起会议
        </button>
      </div>
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
        <el-table-column label="参会情况" width="200">
          <template #default="{ row }">
            <template v-if="row.records && row.records.length">
              <span class="muted" style="font-size: 13px;">已点名 {{ counts(row).marked }}/{{ counts(row).total }}</span>
              <span v-if="rollSummary(row.records)" class="muted" style="font-size: 12px; margin-left: 6px;">
                {{ rollSummary(row.records) }}
              </span>
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
    <el-dialog v-model="createVisible" title="发起会议" width="560px" class="create-dialog">
      <el-form :model="form" label-width="96px">
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
        <el-form-item label="参会人">
          <div class="member-picker" v-loading="candidatesLoading">
            <div class="member-toolbar">
              <el-checkbox
                  :model-value="allSelected"
                  :indeterminate="partSelected"
                  :disabled="!candidates.length"
                  @change="toggleAll"
              >全选</el-checkbox>
              <span class="muted">已选 {{ form.memberIds.length }} 人 / 共 {{ candidates.length }} 人</span>
            </div>
            <el-input v-model="memberKeyword" size="small" clearable placeholder="搜索姓名或学号" />
            <div class="member-list">
              <el-checkbox-group v-model="form.memberIds" v-if="filteredCandidates.length">
                <el-checkbox v-for="m in filteredCandidates" :key="m.id" :label="m.id" class="member-item">
                  {{ m.name }}
                  <span class="muted member-sub">{{ m.studentNo }} · {{ getRoleLabel(m.role) }}</span>
                </el-checkbox>
              </el-checkbox-group>
              <el-empty v-else :image-size="50" :description="memberKeyword ? '没有匹配的成员' : '暂无可选成员'" />
            </div>
            <p class="member-tip muted">不选择或全选 = 默认全部（应到名单由服务端生成），也可以只勾选部分参会人。</p>
          </div>
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
      <div class="roll-head" v-if="current">
        <span>应到 {{ rollTotal }} 人</span>
        <span class="roll-progress">已点名 {{ rollMarked }}/{{ rollTotal }}</span>
      </div>
      <div class="roll-list" v-if="current">
        <div v-for="m in currentMembers" :key="m.id" class="roll-row">
          <div class="roll-user-info">
            <span class="name">{{ m.name }}</span>
            <el-tag v-if="Number(rollState[m.id]) === 0" size="small" type="info" effect="plain">待参加</el-tag>
            <span class="title muted">{{ m.deptId ? getDeptLabel(m.deptId) : '' }}</span>
          </div>
          <div class="roll-actions">
            <el-radio-group v-model="rollState[m.id]" size="small">
              <el-radio-button v-for="s in MEETING_STATUS_OPTIONS" :key="s.value" :label="s.value">{{ s.label }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-empty v-if="currentMembers.length === 0" description="暂无应到成员" :image-size="60" />
      </div>

      <template #footer>
        <div class="roll-footer">
          <span class="muted">未标记的成员保留「待参加」</span>
          <div>
            <el-button @click="rollVisible = false">取消</el-button>
            <el-button type="primary" :loading="savingRoll" @click="saveRoll">保存点名结果</el-button>
          </div>
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
  MEETING_STATUS_OPTIONS,
  ROLE,
  getDeptLabel,
  getRoleLabel,
  isAllDept
} from '@/utils/dict'

import { useDelayedLoading } from '@/utils/loading'
import { getFriendlyErrorMessage } from '@/api/request'
const loading = useDelayedLoading(), saving = ref(false), savingRoll = ref(false)
const list = ref([])
const createVisible = ref(false), rollVisible = ref(false)
const current = ref(null)

// 当前视角部门（主任可为全中心 100）
const targetDeptId = computed(() => userStore.viewDeptId)

const form = reactive({ title: '', time: '', location: '', deptId: ALL_DEPT_ID, memberIds: [] })
const rollState = reactive({})

/* ===== 发起会议：候选参会人 =====
 * 部门会议 -> 本部门在岗成员；全中心会议 -> 全体在岗部长（不再拉全中心所有人）
 * 候选名单仅用于勾选，真正的应到名单由服务端生成/落库
 */
const candidates = ref([])
const candidatesLoading = ref(false)
const memberKeyword = ref('')

const filteredCandidates = computed(() => {
  const kw = memberKeyword.value.trim().toLowerCase()
  if (!kw) return candidates.value
  return candidates.value.filter(m =>
    String(m.name || '').toLowerCase().includes(kw) || String(m.studentNo || '').includes(kw))
})
const allSelected = computed(() => candidates.value.length > 0 && form.memberIds.length === candidates.value.length)
const partSelected = computed(() => form.memberIds.length > 0 && form.memberIds.length < candidates.value.length)

function toggleAll(val) {
  form.memberIds = val ? candidates.value.map(m => m.id) : []
}

/* ===== 点名：应到名单直接取服务端 records（含 status=0 待参加） ===== */
const currentMembers = computed(() => {
  const records = current.value?.records || []
  return records.map(r => ({
    // memberId 是权威匹配键，旧的 userId 兜底
    id: Number(r.memberId ?? r.userId),
    name: String(r.name ?? '').trim() || '未知成员',
    deptId: r.deptId ?? current.value?.deptId ?? null,
    status: Number(r.status ?? 0)
  }))
})
const rollTotal = computed(() => currentMembers.value.length)
const rollMarked = computed(() => currentMembers.value.filter(m => Number(rollState[m.id]) !== 0).length)

// 已点名/应到人数：优先用后端 markedCount/totalCount，旧数据从 records 兜底计算
function counts(row) {
  const records = row.records || []
  const total = Number(row.totalCount ?? records.length)
  const marked = Number(row.markedCount ?? records.filter(r => Number(r.status) !== 0).length)
  return { marked, total }
}

// 点名结果概要：如 "5 到场 · 1 迟到 · 1 缺席"（未点名的 0 不计入）
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
  return parts.join(' · ')
}

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.meetings(targetDeptId.value)
  } catch (e) {
    console.error('加载会议数据失败', e)
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  form.title = ''
  form.time = ''
  form.location = ''
  form.memberIds = []
  memberKeyword.value = ''
  // 主任在全中心视角发起的就是全体部长会议
  form.deptId = targetDeptId.value
  createVisible.value = true
  await loadCandidates()
}

async function loadCandidates() {
  candidatesLoading.value = true
  try {
    // 全中心会议需要跨部门取全体部长，因此不按部门过滤；部门会议只取本部门
    const params = isAllDept(form.deptId)
        ? { pageNum: 1, pageSize: 9999 }
        : { deptId: form.deptId, pageNum: 1, pageSize: 9999 }
    const res = await adminApi.members(params)
    // 真实接口返回 { total, rows }，Mock 直接返回数组，这里两种都兼容
    const rows = Array.isArray(res) ? res : (res?.rows || [])
    candidates.value = isAllDept(form.deptId)
        ? rows.filter(m => Number(m.role) === ROLE.MINISTER && Number(m.status) === 1)
        : rows.filter(m => Number(m.deptId) === Number(form.deptId) && Number(m.status) === 1)
  } catch (e) {
    console.error('加载参会成员失败', e)
    candidates.value = []
    ElMessage.error('加载参会成员失败')
  } finally {
    // 默认全选（与服务端默认应到名单一致）
    form.memberIds = candidates.value.map(m => m.id)
    candidatesLoading.value = false
  }
}

async function createMeeting() {
  if (!form.title || !form.time || !form.location) {
    return ElMessage.warning('请填写完整的会议信息')
  }
  const total = candidates.value.length
  const selected = form.memberIds.length
  // 全选 / 不选都交给服务端按默认规则生成应到名单；部分选择才传具体 ID
  const memberIds = (selected === 0 || selected === total) ? null : [...form.memberIds]
  saving.value = true
  try {
    await adminApi.createMeeting({
      title: form.title,
      time: form.time,
      location: form.location,
      deptId: form.deptId,
      memberIds,
      records: [],
      host: userStore.name
    })
    ElMessage.success(memberIds === null ? '会议已创建，应到名单按默认规则生成' : `会议已创建，应到 ${selected} 人`)
    createVisible.value = false
    // 重新拉列表，以后端返回的应到名单和统计为准
    await load()
  } catch (e) {
    ElMessage.error(getFriendlyErrorMessage(e, '创建失败'))
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
    await load()
    ElMessage.success('会议已删除')
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

function openRoll(row) {
  current.value = row
  // 清掉上一次的点名状态，用服务端 records 初始化（0 表示待参加）
  for (const key of Object.keys(rollState)) delete rollState[key]
  for (const m of currentMembers.value) rollState[m.id] = m.status
  rollVisible.value = true
}

async function saveRoll() {
  // 只提交 1~4；未标记（0）的成员保持待参加，不下发
  const records = currentMembers.value
    .filter(m => Number(rollState[m.id]) >= 1)
    .map(m => ({ memberId: m.id, name: m.name, deptId: m.deptId, status: Number(rollState[m.id]) }))
  if (!records.length) {
    return ElMessage.warning('请先标记至少一位成员的参会状态')
  }
  savingRoll.value = true
  try {
    await adminApi.saveMeetingRecords(current.value.id, records)
    ElMessage.success('点名结果已保存')
    rollVisible.value = false
    // 重新拉列表，显示后端统计的已点名人数
    await load()
  } catch (e) {
    ElMessage.error(getFriendlyErrorMessage(e, '保存失败'))
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
.roll-user-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.roll-user-info .name { font-weight: 600; font-size: 15px; color: var(--text); }
.roll-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
.roll-progress { font-weight: 600; color: var(--brand); }
.roll-list { max-height: 58vh; overflow-y: auto; }
.roll-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

.member-picker { width: 100%; }
.member-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.member-list { max-height: 220px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; margin-top: 8px; }
.member-item { width: 100%; margin-right: 0; padding: 4px 0; }
.member-sub { margin-left: 6px; font-size: 12px; font-weight: 400; }
.member-tip { margin: 8px 0 0; font-size: 12px; line-height: 1.5; }

/* 弹窗不超出视口：宽度跟随屏幕，内容超高时弹窗内部滚动 */
:deep(.create-dialog) { width: min(560px, calc(100vw - 24px)) !important; }
:deep(.create-dialog .el-dialog__body) { max-height: 62vh; overflow-y: auto; }
@media (max-width: 768px) {
  :deep(.roll-dialog) { width: 90% !important; }
  :deep(.create-dialog) { width: calc(100vw - 24px) !important; margin-top: 5vh !important; }
  :deep(.create-dialog .el-dialog__body) { max-height: 60vh; overflow-y: auto; }
  .member-list { max-height: 30vh; }
  .roll-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .roll-actions { width: 100%; }
  :deep(.roll-actions .el-radio-group) { display: flex; width: 100%; }
  :deep(.roll-actions .el-radio-button) { flex: 1; }
  :deep(.roll-actions .el-radio-button__inner) { width: 100%; padding: 8px 0; }
}
</style>
