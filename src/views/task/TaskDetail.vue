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
              <el-tag :type="getTaskTagType(task.status)">{{ getTaskStatusLabel(task.status) }}</el-tag>
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
              <el-button size="small" :loading="matLoading" @click="loadMaterials">
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
            <span style="font-weight: 500; font-size: 14px;">{{ deviceName(id) }}</span>
            <el-button
                v-if="canManageDevices"
                link type="danger"
                size="small"
                @click="removeDevice(id)"
            >移除</el-button>
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
              <b>参与人（{{ (task.participants || []).length }}）</b>
              <span v-if="userStore.canManage" class="tag-soft" style="font-size: 11px;">可管理</span>
            </div>
          </template>

          <div v-for="p in (task.participants || [])" :key="p.name" class="flex-between" style="padding:8px 0;border-bottom:1px solid #f0f2f5">
            <span>
              <el-avatar :size="26" style="margin-right:8px">{{ p.name.slice(0,1) }}</el-avatar>
              {{ p.name }}
              <el-tag v-if="p.extraScore" type="warning" size="small" effect="plain" style="margin-left: 8px;">
                附加分 +{{ p.extraScore }}
              </el-tag>
            </span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-tag size="small" type="info">{{ getDeptLabel(p.deptId) }}</el-tag>

              <template v-if="canManageDept(p.deptId)">
                <el-button v-if="p.attendStatus != 1" link type="warning" size="small" @click="handleAttend(p)">确认到场</el-button>
                <el-tag v-else size="small" type="success">已到场</el-tag>
                <el-button link type="primary" size="small" @click="openScoreDialog(p)">打分</el-button>
                <el-button link type="danger" size="small" @click="handleRemove(p)">移除</el-button>
              </template>
            </div>
          </div>
          <el-empty v-if="!task.participants || task.participants.length === 0" description="暂无参与人" :image-size="50" />

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
              <el-select v-model="selectedMember" placeholder="请选择成员" size="small" style="width: 100%; margin-bottom: 10px;" filterable>
                <el-option v-for="m in availableMembers" :key="m.id" :label="`${m.name} (${getDeptLabel(m.deptId)})`" :value="m.name" />
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
      <el-form label-width="80px">
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
import { taskApi, adminApi, deviceApi } from '@/api'
import {
  ALL_DEPT_ID,
  DEVICE_MANAGE_DEPT_ID,
  MATERIAL_TYPE,
  getDeptLabel,
  getMaterialTypeLabel,
  getMaterialTypeTagType,
  getTaskStatusLabel,
  getTaskTagType
} from '@/utils/dict'
import { userStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const loading = ref(false), matLoading = ref(false)
const task = ref({})
const materials = ref([]), opened = ref([])
let timer = null
let polling = false

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
const selectedMember = ref('')
const deptMembers = ref([])

// --- 打分逻辑 ---
const scoreVisible = ref(false)
const savingScore = ref(false)
const scoreForm = reactive({ memberName: '', score: 0, reason: '' })

const canManageDept = (deptId) => {
  if (userStore.isDirector) return true
  if (userStore.isMinister && Number(deptId) === Number(userStore.deptId)) return true
  return false
}

// 待确认报名（部长只看本部门，主任看全部）
const pendingSignups = computed(() => {
  let signups = (task.value.signups || []).filter(s => Number(s.status) === 0)
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
  if ((task.value.signups || []).some(s => isSameMember(s) && Number(s.status) === 0)) return 'pending'
  return 'none'
})

const availableMembers = computed(() => {
  const currentNames = (task.value.participants || []).map(p => p.name)
  if (userStore.isDirector) {
    return (deptMembers.value || []).filter(m => !currentNames.includes(m.name))
  }
  return (deptMembers.value || []).filter(m =>
      Number(m.deptId) === Number(userStore.deptId) && !currentNames.includes(m.name)
  )
})

// ---------------- 业务操作 ----------------

async function loadMembers() {
  if (!userStore.canManage) return
  try {
    const targetDeptId = userStore.isDirector ? ALL_DEPT_ID : userStore.deptId
    const res = await adminApi.members(targetDeptId)
    deptMembers.value = Array.isArray(res) ? res : []
  } catch (e) {
    deptMembers.value = []
  }
}

async function handleSignup() {
  try {
    const payload = { name: userStore.name, deptId: userStore.deptId }
    await taskApi.signup(task.value.id, payload)
    if (!task.value.signups) task.value.signups = []
    task.value.signups.push({ ...payload, status: 0 })
    ElMessage.success('报名成功，请等待部长确认')
  } catch (e) {
    ElMessage.error('报名失败')
  }
}

async function handleAddParticipant() {
  if (!selectedMember.value) return ElMessage.warning('请选择要添加的成员')
  const member = deptMembers.value.find(m => m.name === selectedMember.value)
  if (!member) return

  await adminApi.addParticipant(task.value.id, { name: member.name, deptId: member.deptId })
  task.value.participants.push({ name: member.name, deptId: member.deptId })
  selectedMember.value = ''
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
  const exists = task.value.participants.some(p =>
      p.name === s.name && Number(p.deptId) === Number(s.deptId))
  if (!exists) task.value.participants.push({ name: s.name, deptId: s.deptId })
  ElMessage.success('已确认报名')
}

// 确认到场（签到）：调后端置 attendStatus=1，作为考评 task_join 基础分依据
async function handleAttend(p) {
  try {
    await adminApi.attendSignup(task.value.id, p.name)
    p.attendStatus = 1
    ElMessage.success('已确认「' + p.name + '」到场')
  } catch (e) {
    ElMessage.error('确认到场失败，请稍后重试')
  }
}

// 拒绝报名需要落库，否则刷新后报名记录会再次出现
async function handleReject(s) {
  try {
    await adminApi.rejectSignup(task.value.id, s.name)
    const signup = (task.value.signups || []).find(x => x.name === s.name)
    if (signup) signup.status = 2 // 2-已拒绝
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
    const res = await taskApi.materials(route.params.id)
    materials.value = Array.isArray(res) ? res : []
  } finally {
    matLoading.value = false
  }
}

// 轮询刷新素材：上一次请求未结束就跳过本轮，避免慢请求叠加造成并发
async function pollMaterials() {
  if (polling) return
  polling = true
  try {
    await loadMaterials()
  } finally {
    polling = false
  }
}

onMounted(() => {
  loadTask()
  loadMaterials()
  loadMembers()
  loadGlobalDevices()
  timer = setInterval(pollMaterials, 15000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
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