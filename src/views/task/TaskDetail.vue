<template>
  <div class="page" v-loading="loading">
    <el-page-header content="任务详情" @back="router.back()" style="margin-bottom:16px" />

    <el-row :gutter="16" v-if="task && task.id">
      <el-col :span="15">
        <!-- 左侧：任务基础信息 -->
        <el-card shadow="never" class="mb surface-card">
          <template #header>
            <div class="flex-between">
              <b>{{ task.title }}</b>
              <div style="display:flex;align-items:center;gap:8px;">
                <template v-if="canManageStatus">
                  <el-select :model-value="Number(task.status)" size="small" style="width:110px;" @change="changeTaskStatus">
                    <el-option v-for="s in TASK_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
                  </el-select>
                  <span class="muted" style="font-size:12px;">状态管理</span>
                </template>
                <el-tag v-else :type="getTaskTagType(task.status)">{{ getTaskStatusLabel(task.status) }}</el-tag>
              </div>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="开始时间">{{ task.startTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ task.endTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="地点">{{ task.location || '—' }}</el-descriptions-item>
            <el-descriptions-item label="标签">
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <el-tag v-for="t in (task.tags || [])" :key="t" size="small">{{ t }}</el-tag>
                <span v-if="!task.tags?.length" class="muted">无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="参与部门">
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <el-tag v-for="id in (task.deptIds || [])" :key="id" size="small" type="success">{{ getDeptLabel(id) }}</el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="联动部门">
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <el-tag v-for="id in (task.relatedDeptIds || [])" :key="id" size="small" type="warning">{{ getDeptLabel(id) }}</el-tag>
                <span v-if="!task.relatedDeptIds?.length" class="muted">无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="任务说明" :span="2">{{ task.description || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 左侧：素材区域 -->
        <el-card shadow="never" class="surface-card">
          <template #header>
            <div class="flex-between">
              <b>素材区域（上传即展示）</b>
              <el-button size="small" :loading="matLoading" @click="refreshMaterials">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </template>

          <el-empty v-if="!materials || materials.length === 0" description="该任务暂无上传素材" :image-size="70" />

          <div v-else v-for="m in materials" :key="m.id" style="border-bottom:1px solid #f0f2f5;padding:12px 0">
            <div class="flex-between">
              <div>
                <el-tag size="small" :type="getMaterialTypeTagType(m.type)" style="margin-right:8px">{{ getMaterialTypeLabel(m.type) }}</el-tag>
                <b>{{ m.title }}</b>
                <span class="muted" style="margin-left:8px">{{ getDeptLabel(m.deptId) }} · {{ m.author }} · {{ m.createdAt }}</span>
              </div>
              <el-link type="primary" @click="router.push('/materials/' + m.id)">查看素材详情</el-link>
            </div>
            <div v-if="m.leaderName" class="muted" style="margin-top:4px">主要领导：{{ m.leaderName }}</div>

            <div v-if="m.type === MATERIAL_TYPE.NEWS" style="margin-top:10px">
              <el-collapse v-model="opened">
                <el-collapse-item :name="String(m.id)">
                  <template #title><span class="muted">点击展开新闻稿全文</span></template>
                  <div class="article-content">{{ m.content }}</div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div v-if="m.netdiskUrl" style="margin-top:8px">
              <el-icon><Link /></el-icon>
              <el-link type="primary" :href="m.netdiskUrl" target="_blank" style="margin-left:4px">{{ m.netdiskUrl }}</el-link>
              <span class="muted" style="margin-left:12px">提取码：{{ m.netdiskCode }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧面板区 -->
      <el-col :span="9">

        <!-- 👇 新增：任务关联设备管理面板 -->
        <el-card shadow="never" class="surface-card" style="margin-bottom: 16px;">
          <template #header>
            <div class="flex-between">
              <b>任务所需设备</b>
              <span v-if="canManageDevices" class="tag-soft" style="font-size: 11px; background: #fdf1e6; color: var(--accent);">{{ getDeptLabel(DEVICE_MANAGE_DEPT_ID) }}可管理</span>
            </div>
          </template>

          <div v-if="!task.equipmentIds || task.equipmentIds.length === 0" class="muted" style="padding: 10px 0;">
            暂无关联设备
          </div>

          <div v-else v-for="id in task.equipmentIds" :key="id" class="flex-between" style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 500; font-size: 14px;">{{ deviceName(id) }}</span>
              <el-tag v-if="deviceStatus(id) === 1" size="small" type="warning">外借中</el-tag>
              <el-tag v-else-if="deviceStatus(id) === 0" size="small" type="success">在库</el-tag>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-button
                  v-if="canManageDevices && deviceStatus(id) === 0"
                  link type="primary"
                  size="small"
                  @click="takeEquipment(id)"
              >取走</el-button>
              <el-button
                  v-if="canManageDevices && deviceStatus(id) === 1"
                  link type="primary"
                  size="small"
                  @click="returnEquipment(id)"
              >归还</el-button>
              <el-button
                  v-if="canManageDevices"
                  link type="danger"
                  size="small"
                  @click="removeDevice(id)"
              >移除</el-button>
            </div>
          </div>

          <!-- 添加设备控件 -->
          <div v-if="canManageDevices" style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
            <div class="muted" style="margin-bottom: 8px; font-weight: 600;">添加设备清单</div>
            <div style="display: flex; gap: 8px;">
              <el-select v-model="selectedNewDevice" placeholder="请选择全库设备" size="small" style="flex: 1;" filterable>
                <el-option
                    v-for="d in availableDevicesForAdd"
                    :key="d.id"
                    :label="d.name"
                    :value="d.id"
                />
              </el-select>
              <el-button type="primary" size="small" @click="addDevice">添加</el-button>
            </div>
          </div>
        </el-card>

        <!-- 参与人员管理面板 -->
        <el-card shadow="never" class="surface-card">
          <template #header>
            <div class="flex-between">
              <b>参与人（{{ participantCount }}）</b>
              <span v-if="userStore.canManage" class="tag-soft" style="font-size: 11px;">可管理</span>
            </div>
          </template>

          <!-- 按部门分组展示：同一人只在其所属分组里出现一次 -->
          <template v-for="group in participantGroups" :key="group.deptId">
            <div class="muted" style="margin: 12px 0 4px; font-weight: 600;">{{ group.deptLabel }}（{{ group.list.length }}）</div>
            <div v-for="p in group.list" :key="p.userId || p.name" class="flex-between" style="padding:8px 0;border-bottom:1px solid #f0f2f5">
              <span>
                <el-avatar :size="26" style="margin-right:8px">{{ p.name.slice(0,1) }}</el-avatar>
                {{ p.name }}
                <el-tag v-if="p.extraScore" type="warning" size="small" effect="plain" style="margin-left: 8px;">
                  附加分 +{{ p.extraScore }}
                </el-tag>
              </span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <template v-if="canManageDept(p.deptId)">
                  <el-button v-if="p.attendStatus != 1" link type="warning" size="small" @click="handleAttend(p)">确认到场</el-button>
                  <template v-else>
                    <el-tag size="small" type="success">已到场</el-tag>
                    <el-button link type="danger" size="small" @click="handleUndoAttend(p)">撤销到场</el-button>
                  </template>
                  <el-button link type="primary" size="small" @click="openScoreDialog(p)">打分</el-button>
                  <el-button link type="danger" size="small" @click="handleRemove(p)">移除</el-button>
                </template>
              </div>
            </div>
          </template>
          <el-empty v-if="participantCount === 0" description="暂无参与人" :image-size="50" />

          <!-- 管理者视角 -->
          <template v-if="userStore.canManage">
            <div v-if="pendingSignups.length > 0" style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border);">
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">待确认报名</div>
              <div v-for="s in pendingSignups" :key="s.name" class="flex-between" style="padding:8px 0;">
                <span>{{ s.name }}（{{ getDeptLabel(s.deptId) }}）</span>
                <div>
                  <el-button size="small" type="success" plain @click="handleConfirm(s)">确认</el-button>
                  <el-button size="small" type="danger" plain @click="handleReject(s)">拒绝</el-button>
                </div>
              </div>
            </div>

            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border);">
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">添加人员</div>
              <el-select v-model="selectedMemberId" placeholder="请选择成员" size="small" style="width: 100%; margin-bottom: 10px;" filterable>
                <el-option
                    v-for="m in availableMembers"
                    :key="m.userId"
                    :label="`${m.name} (${memberDeptLabels(m)})`"
                    :value="m.userId"
                />
              </el-select>
              <el-button type="primary" size="small" style="width: 100%;" @click="handleAddParticipant">添加到任务</el-button>
            </div>
          </template>

          <!-- 部员视角 -->
          <template v-else>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--border); text-align: center;">
              <div v-if="myParticipantStatus === 'joined'" class="muted">
                <el-tag type="success" size="large" effect="dark" round>您已参与该任务</el-tag>
              </div>
              <div v-else-if="myParticipantStatus === 'pending'" class="muted">
                <el-tag type="warning" size="large" effect="dark" round>报名审核中，请等待部长确认</el-tag>
              </div>
              <div v-else>
                <el-button type="primary" size="large" style="width: 100%; border-radius: 8px;" @click="handleSignup">
                  报名参加此任务
                </el-button>
                <div class="muted" style="margin-top: 10px; font-size: 12px;">报名后需部长或主任确认</div>
              </div>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-else-if="!loading" description="未找到该任务" />

    <!-- 任务附加分打分弹窗 -->
    <el-dialog v-model="scoreVisible" title="任务表现附加分" width="400px">
      <el-form label-width="96px">
        <el-form-item label="参与人">
          <span style="font-weight: 600; color: var(--brand);">{{ scoreForm.memberName }}</span>
        </el-form-item>
        <el-form-item label="附加分">
          <el-input-number v-model="scoreForm.score" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="加分理由">
          <el-input v-model="scoreForm.reason" type="textarea" :rows="2" placeholder="如：临时救场表现突出" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingScore" @click="saveScore">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Link } from '@element-plus/icons-vue'
import { taskApi, adminApi, deviceApi } from '@/api'
import {
  ALL_DEPT_ID,
  DEVICE_MANAGE_DEPT_ID,
  MATERIAL_TYPE,
  TASK_STATUS_OPTIONS,
  getDeptLabel,
  getMaterialTypeLabel,
  getMaterialTypeTagType,
  getTaskStatusLabel,
  getTaskTagType
} from '@/utils/dict'
import { userStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading(), matLoading = ref(false)
const task = ref({})
const materials = ref([]), opened = ref([])

// 素材轮询：15s 一次；连续失败达到上限就停止，避免慢接口被无限重放
const POLL_INTERVAL = 15000
const MAX_POLL_FAILURES = 3
let timer = null
let polling = false
let pollFailures = 0
let pollEnabled = true

// --- 设备清单管理 ---
const globalDevices = ref([])
const selectedNewDevice = ref(null)

// 权限判断：主任 或 摄制部成员（部门 ID 见 dict.DEVICE_MANAGE_DEPT_ID）
const canManageDevices = computed(() => {
  return userStore.isDirector || Number(userStore.deptId) === DEVICE_MANAGE_DEPT_ID
})

// equipmentId → 设备名称
const deviceName = (id) => {
  const dev = globalDevices.value.find(d => Number(d.id) === Number(id))
  return dev ? dev.name : `设备 #${id}`
}

// equipmentId → 设备状态（0在库 1外借 2维修 3报废）
const deviceStatus = (id) => {
  const dev = globalDevices.value.find(d => Number(d.id) === Number(id))
  return dev ? Number(dev.status) : 0
}

// 摄制部从设备库取走设备
async function takeEquipment(deviceId) {
  try {
    await ElMessageBox.confirm(
      `确认取走设备「${deviceName(deviceId)}」吗？取走后该设备标记为「外借中」。`, '取走设备',
      { type: 'warning', confirmButtonText: '取走', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 用户取消
  }
  try {
    await deviceApi.takeEquipment(deviceId, route.params.id)
    await loadGlobalDevices()
    ElMessage.success('已取走设备')
  } catch (e) {
    ElMessage.error('取走失败，请稍后重试')
  }
}

// 摄制部归还设备
async function returnEquipment(deviceId) {
  try {
    await ElMessageBox.confirm(
      `确认归还设备「${deviceName(deviceId)}」吗？归还后该设备恢复「在库」。`, '归还设备',
      { type: 'warning', confirmButtonText: '归还', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 用户取消
  }
  try {
    await deviceApi.returnEquipment(deviceId, route.params.id)
    await loadGlobalDevices()
    ElMessage.success('设备已归还')
  } catch (e) {
    ElMessage.error('归还失败，请稍后重试')
  }
}

// 计算可选设备（排除任务里已经有的）
const availableDevicesForAdd = computed(() => {
  const currentIds = (task.value.equipmentIds || []).map(Number)
  return globalDevices.value.filter(d => !currentIds.includes(Number(d.id)))
})

async function loadGlobalDevices() {
  try {
    const res = await deviceApi.list()
    globalDevices.value = Array.isArray(res) ? res : []
  } catch (e) {}
}

async function addDevice() {
  if (!selectedNewDevice.value) return ElMessage.warning('请选择要添加的设备')

  const newIds = [...(task.value.equipmentIds || []).map(Number), Number(selectedNewDevice.value)]
  await adminApi.updateTaskDevices(task.value.id, newIds)

  // 更新视图
  task.value.equipmentIds = newIds
  selectedNewDevice.value = null
  ElMessage.success('设备已添加到任务')
}

async function removeDevice(deviceId) {
  await ElMessageBox.confirm(`确认从任务中移除「${deviceName(deviceId)}」吗？`, '提示', { type: 'warning' })

  const newIds = (task.value.equipmentIds || []).map(Number).filter(id => id !== Number(deviceId))
  await adminApi.updateTaskDevices(task.value.id, newIds)

  task.value.equipmentIds = newIds
  ElMessage.success('已移除')
}

// --- 人员管理 ---
const selectedMemberId = ref(null)
const deptMembers = ref([])

// 候选/参与人统一按 userId 去重（历史数据可能没有 userId，退回按姓名）
const memberKey = (m) => m.userId != null ? 'u' + m.userId : 'n' + m.name

// 逗号分隔的部门串 → 「网宣部/设计部」
function memberDeptLabels(m) {
  const ids = String(m.deptIds || m.deptId || '').split(',').map(Number).filter(Boolean)
  if (!ids.length) return getDeptLabel(m.deptId)
  return ids.map(getDeptLabel).join('/')
}

function memberInDept(m, deptId) {
  return String(m.deptIds || m.deptId || '').split(',').map(Number).includes(Number(deptId))
}

// --- 打分逻辑 ---
const scoreVisible = ref(false)
const savingScore = ref(false)
const scoreForm = reactive({ memberName: '', score: 0, reason: '' })

const canManageDept = (deptId) => {
  if (userStore.isDirector) return true
  if (userStore.isMinister && Number(deptId) === Number(userStore.deptId)) return true
  return false
}

// 任务状态管理权限：主任可管理全部任务，部长仅可管理本部门参与/联动的任务
const canManageStatus = computed(() => {
  if (!userStore.canManage) return false
  if (userStore.isDirector) return true
  const myDept = Number(userStore.deptId)
  return (task.value.deptIds || []).some(id => Number(id) === myDept)
      || (task.value.relatedDeptIds || []).some(id => Number(id) === myDept)
})

async function changeTaskStatus(val) {
  try {
    await adminApi.updateTask(task.value.id, { status: val })
    task.value.status = val
    ElMessage.success('任务状态已更新为「' + getTaskStatusLabel(val) + '」')
  } catch (e) {
    ElMessage.error('任务状态更新失败')
  }
}

// 待确认报名（后端字段 applyStatus 0=待确认；兼容旧 status 字段）
const pendingSignups = computed(() => {
  let signups = (task.value.signups || []).filter(s => Number(s.applyStatus ?? s.status) === 0)
  if (userStore.isMinister) {
    signups = signups.filter(s => Number(s.deptId) === Number(userStore.deptId))
  }
  return signups
})

const myParticipantStatus = computed(() => {
  // 姓名可能重复，必须同时比对部门，避免同名成员被误判为已参与
  const isSameMember = (p) =>
      p.name === userStore.name && Number(p.deptId) === Number(userStore.deptId)

  if ((task.value.participants || []).some(isSameMember)) return 'joined'
  // 只有「待确认」的报名才算审核中，已拒绝的记录不应让按钮一直停在 pending
  if ((task.value.signups || []).some(s => isSameMember(s) && Number(s.applyStatus ?? s.status) === 0)) return 'pending'
  return 'none'
})

const availableMembers = computed(() => {
  const joined = new Set((task.value.participants || []).map(memberKey))
  return (deptMembers.value || []).filter(m => {
    if (joined.has(memberKey(m))) return false
    if (userStore.isDirector) return true
    return memberInDept(m, userStore.deptId)
  })
})

// 参与人按部门分组展示：同一人只出现一次（多部门兼职按主部门归组）
const participantGroups = computed(() => {
  const seen = new Set()
  const index = new Map()
  const groups = []
  for (const p of (task.value.participants || [])) {
    const key = memberKey(p)
    if (seen.has(key)) continue
    seen.add(key)
    const deptId = Number(p.deptId)
    let group = index.get(deptId)
    if (!group) {
      group = { deptId, deptLabel: getDeptLabel(p.deptId), list: [] }
      index.set(deptId, group)
      groups.push(group)
    }
    group.list.push(p)
  }
  return groups
})

const participantCount = computed(() =>
    participantGroups.value.reduce((total, group) => total + group.list.length, 0))

// ---------------- 业务操作 ----------------

async function loadMembers() {
  if (!userStore.canManage) return
  try {
    const targetDeptId = userStore.isDirector ? ALL_DEPT_ID : userStore.deptId
    // 选人候选必须用按用户去重的接口，否则多部门成员在下拉框里重复出现
    // retry:false —— 全量成员查询本身就慢，失败后再 600ms 重放一次等于把超时翻倍
    const res = await adminApi.memberOptions({ deptId: targetDeptId }, { retry: false })
    deptMembers.value = Array.isArray(res) ? res : (res?.rows || [])
  } catch (e) {
    deptMembers.value = []
  }
}

async function handleSignup() {
  try {
    const payload = { name: userStore.name, deptId: userStore.deptId }
    await taskApi.signup(task.value.id, payload)
    if (!task.value.signups) task.value.signups = []
    task.value.signups.push({ ...payload, applyStatus: 0 })
    ElMessage.success('报名成功，请等待部长确认')
  } catch (e) {
    ElMessage.error('报名失败')
  }
}

async function handleAddParticipant() {
  if (selectedMemberId.value == null) return ElMessage.warning('请选择要添加的成员')
  const member = deptMembers.value.find(m => String(m.userId) === String(selectedMemberId.value))
  if (!member) return

  const exists = (task.value.participants || []).some(p => memberKey(p) === memberKey(member))
  if (exists) {
    selectedMemberId.value = null
    return ElMessage.warning('该成员已在任务中')
  }

  await adminApi.addParticipant(task.value.id, { name: member.name, deptId: member.deptId })
  task.value.participants.push({ userId: member.userId, name: member.name, deptId: member.deptId })
  selectedMemberId.value = null
  ElMessage.success('添加成功')
}

async function handleRemove(p) {
  await ElMessageBox.confirm(`确认将「${p.name}」移出该任务吗？`, '提示', { type: 'warning' })
  await adminApi.removeParticipant(task.value.id, p.name)
  task.value.participants = task.value.participants.filter(x => x.name !== p.name)
  ElMessage.success('已移除')
}

async function handleConfirm(s) {
  await adminApi.confirmSignup(task.value.id, s.name)
  task.value.signups = task.value.signups.filter(x => x.name !== s.name)
  const exists = task.value.participants.some(p => memberKey(p) === memberKey(s))
  if (!exists) task.value.participants.push({ userId: s.userId, name: s.name, deptId: s.deptId })
  ElMessage.success('已确认报名')
}

// 确认到场（签到）：调后端置 attendStatus=1，作为考评 task_join 基础分依据
async function handleAttend(p) {
  try {
    await ElMessageBox.confirm(
      `确认「${p.name}」已到场么？确认后将计入该成员当月考评的任务基础分。`, '确认到场',
      { type: 'warning', confirmButtonText: '确认到场', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 用户取消
  }
  try {
    await adminApi.attendSignup(task.value.id, p.name)
    p.attendStatus = 1
    ElMessage.success('已确认「' + p.name + '」到场')
  } catch (e) {
    ElMessage.error('确认到场失败，请稍后重试')
  }
}

// 撤销到场：误触时可撤回
async function handleUndoAttend(p) {
  try {
    await ElMessageBox.confirm(
      `确定撤销「${p.name}」的到场记录吗？撤销后该任务不纳入考评加分。`, '撤销到场',
      { type: 'warning', confirmButtonText: '撤销', cancelButtonText: '取消' }
    )
  } catch (e) {
    return // 用户取消
  }
  try {
    await adminApi.undoAttend(task.value.id, p.name)
    p.attendStatus = 0
    ElMessage.success('已撤销「' + p.name + '」到场')
  } catch (e) {
    ElMessage.error('撤销失败，请稍后重试')
  }
}

// 拒绝报名需要落库，否则刷新后报名记录会再次出现
async function handleReject(s) {
  try {
    await adminApi.rejectSignup(task.value.id, s.name)
    const signup = (task.value.signups || []).find(x => x.name === s.name)
    if (signup) signup.applyStatus = 2 // 2-已拒绝
    ElMessage.info('已拒绝该报名')
  } catch (e) {
    ElMessage.error('拒绝报名失败，请稍后重试')
  }
}

function openScoreDialog(p) {
  scoreForm.memberName = p.name
  scoreForm.score = p.extraScore || 0
  scoreForm.reason = p.scoreReason || ''
  scoreVisible.value = true
}

async function saveScore() {
  if (scoreForm.score < 0) return ElMessage.warning('分数不能为负')
  savingScore.value = true
  try {
    await adminApi.updateTaskScore(task.value.id, scoreForm.memberName, scoreForm.score, scoreForm.reason)
    const p = task.value.participants.find(x => x.name === scoreForm.memberName)
    if (p) {
      p.extraScore = scoreForm.score
      p.scoreReason = scoreForm.reason
    }
    scoreVisible.value = false
    ElMessage.success('任务附加分已保存')
  } finally {
    savingScore.value = false
  }
}

// ---------------- 数据加载 ----------------
async function loadTask() {
  loading.value = true
  try {
    const res = await taskApi.detail(route.params.id)
    if (res) {
      task.value = res
      if (!task.value.participants) task.value.participants = []
      if (!task.value.signups) task.value.signups = []
      if (!task.value.equipmentIds) task.value.equipmentIds = []
    }
  } catch (e) {
    console.error('加载任务失败', e)
  } finally {
    loading.value = false
  }
}

async function loadMaterials() {
  matLoading.value = true
  try {
    // retry:false —— 轮询/刷新失败后不要走 axios 的 600ms 自动重放，否则慢接口会被成倍压
    // cache:false —— 轮询要的是实时数据，命中 4s 缓存会让轮询失去意义
    const res = await taskApi.materials(route.params.id, { retry: false, cache: false })
    materials.value = Array.isArray(res) ? res : []
    pollFailures = 0
  } catch (e) {
    pollFailures += 1
    if (pollFailures >= MAX_POLL_FAILURES) stopPolling()
  } finally {
    matLoading.value = false
  }
}

// 连续失败后彻底停表，不再每 15s 继续压接口；用户点「刷新」可恢复
function stopPolling() {
  if (!pollEnabled) return
  pollEnabled = false
  pollFailures = 0
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  ElMessage.warning('素材自动刷新已暂停，请点击「刷新」重试')
}

function startPolling() {
  if (timer) clearInterval(timer)
  pollEnabled = true
  pollFailures = 0
  timer = setInterval(pollMaterials, POLL_INTERVAL)
}

// 手动刷新：允许在自动轮询被暂停后恢复
function refreshMaterials() {
  if (!pollEnabled) startPolling()
  loadMaterials()
}

// 轮询刷新素材：请求未结束/页面不可见/已暂停时跳过本轮，避免慢请求叠加
async function pollMaterials() {
  if (polling || document.hidden || !pollEnabled) return
  polling = true
  try {
    await loadMaterials()
  } finally {
    polling = false
  }
}

// 标签页重新可见时补拉一次，避免后台期间一直显示旧数据
function onVisibilityChange() {
  if (!document.hidden) pollMaterials()
}

onMounted(() => {
  loadTask()
  loadMaterials()
  loadMembers()
  loadGlobalDevices()
  startPolling()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.mb {
  margin-bottom: 16px;
}

.article-content {
  white-space: pre-wrap;
  line-height: 1.9;
  color: var(--text);
  font-size: 14px;
}

.surface-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e6ebf1;
}
</style>