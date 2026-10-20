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
              <el-tag :type="getTaskTagType(task.status)" v-if="task.status">{{ task.status }}</el-tag>
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
                <el-tag v-for="d in (task.departments || [])" :key="d" size="small" type="success">{{ d }}</el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="联动部门">
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <el-tag v-for="d in (task.relatedDepts || [])" :key="d" size="small" type="warning">{{ d }}</el-tag>
                <span v-if="!task.relatedDepts?.length" class="muted">无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="任务说明" :span="2">{{ task.desc || '—' }}</el-descriptions-item>
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
                <el-tag size="small" style="margin-right:8px">{{ m.type }}</el-tag>
                <b>{{ m.title }}</b>
                <span class="muted" style="margin-left:8px">{{ m.department }} · {{ m.author }} · {{ m.createdAt }}</span>
              </div>
              <el-link type="primary" @click="router.push('/materials/' + m.id)">查看素材详情</el-link>
            </div>
            <div v-if="m.leaderName" class="muted" style="margin-top:4px">主要领导：{{ m.leaderName }}</div>

            <div v-if="m.type === '新闻稿'" style="margin-top:10px">
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
              <span v-if="canManageDevices" class="tag-soft" style="font-size: 11px; background: #fdf1e6; color: var(--accent);">摄制部可管理</span>
            </div>
          </template>

          <div v-if="!task.devices || task.devices.length === 0" class="muted" style="padding: 10px 0;">
            暂无关联设备
          </div>

          <div v-else v-for="d in task.devices" :key="d" class="flex-between" style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
            <span style="font-weight: 500; font-size: 14px;">{{ d }}</span>
            <el-button
                v-if="canManageDevices"
                link type="danger"
                size="small"
                @click="removeDevice(d)"
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
                    :value="d.name"
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
              <el-tag size="small" type="info">{{ p.dept }}</el-tag>

              <template v-if="canManageDept(p.dept)">
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
                <span>{{ s.name }}（{{ s.dept }}）</span>
                <div>
                  <el-button size="small" type="success" plain @click="handleConfirm(s)">确认</el-button>
                  <el-button size="small" type="danger" plain @click="handleReject(s)">拒绝</el-button>
                </div>
              </div>
            </div>

            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border);">
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">添加人员</div>
              <el-select v-model="selectedMember" placeholder="请选择成员" size="small" style="width: 100%; margin-bottom: 10px;" filterable>
                <el-option v-for="m in availableMembers" :key="m.id" :label="`${m.name} (${m.dept})`" :value="m.name" />
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
import { getTaskTagType } from '@/utils/dict'
import { userStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const loading = ref(false), matLoading = ref(false)
const task = ref({})
const materials = ref([]), opened = ref([])
let timer = null

// --- 设备清单管理 ---
const globalDevices = ref([])
const selectedNewDevice = ref('')

// 权限判断：主任 或 摄制部（不管部长还是部员）
const canManageDevices = computed(() => {
  return userStore.isDirector || userStore.dept === '摄制部'
})

// 计算可选设备（排除任务里已经有的）
const availableDevicesForAdd = computed(() => {
  const currentDevices = task.value.devices || []
  return globalDevices.value.filter(d => !currentDevices.includes(d.name))
})

async function loadGlobalDevices() {
  try {
    const res = await deviceApi.list()
    globalDevices.value = Array.isArray(res) ? res : []
  } catch (e) {}
}

async function addDevice() {
  if (!selectedNewDevice.value) return ElMessage.warning('请选择要添加的设备')

  const newDevices = [...(task.value.devices || []), selectedNewDevice.value]
  await adminApi.updateTaskDevices(task.value.id, newDevices)

  // 更新视图
  task.value.devices = newDevices
  selectedNewDevice.value = ''
  ElMessage.success('设备已添加到任务')
}

async function removeDevice(deviceName) {
  await ElMessageBox.confirm(`确认从任务中移除「${deviceName}」吗？`, '提示', { type: 'warning' })

  const newDevices = (task.value.devices || []).filter(d => d !== deviceName)
  await adminApi.updateTaskDevices(task.value.id, newDevices)

  task.value.devices = newDevices
  ElMessage.success('已移除')
}

// --- 人员管理 ---
const selectedMember = ref('')
const deptMembers = ref([])

// --- 打分逻辑 ---
const scoreVisible = ref(false)
const savingScore = ref(false)
const scoreForm = reactive({ memberName: '', score: 0, reason: '' })

const canManageDept = (dept) => {
  if (userStore.isDirector) return true
  if (userStore.isMinister && dept === userStore.dept) return true
  return false
}

const pendingSignups = computed(() => {
  let signups = task.value.signups || []
  if (userStore.isMinister) {
    signups = signups.filter(s => s.dept === userStore.dept)
  }
  return signups
})

const myParticipantStatus = computed(() => {
  const myName = userStore.name
  const isJoined = (task.value.participants || []).some(p => p.name === myName)
  if (isJoined) return 'joined'
  const isPending = (task.value.signups || []).some(s => s.name === myName)
  if (isPending) return 'pending'
  return 'none'
})

const availableMembers = computed(() => {
  const currentNames = (task.value.participants || []).map(p => p.name)
  if (userStore.isDirector) {
    return (deptMembers.value || []).filter(m => !currentNames.includes(m.name))
  }
  return (deptMembers.value || []).filter(m =>
      m.dept === userStore.dept && !currentNames.includes(m.name)
  )
})

// ---------------- 业务操作 ----------------

async function loadMembers() {
  if (!userStore.canManage) return
  try {
    const targetDept = userStore.isDirector ? '' : userStore.dept
    const res = await adminApi.members(targetDept)
    deptMembers.value = Array.isArray(res) ? res : []
  } catch (e) {
    deptMembers.value = []
  }
}

async function handleSignup() {
  try {
    await taskApi.signup(task.value.id, { name: userStore.name, dept: userStore.dept })
    if (!task.value.signups) task.value.signups = []
    task.value.signups.push({ name: userStore.name, dept: userStore.dept })
    ElMessage.success('报名成功，请等待部长确认')
  } catch (e) {
    ElMessage.error('报名失败')
  }
}

async function handleAddParticipant() {
  if (!selectedMember.value) return ElMessage.warning('请选择要添加的成员')
  const member = deptMembers.value.find(m => m.name === selectedMember.value)
  if (!member) return

  await adminApi.addParticipant(task.value.id, { name: member.name, dept: member.dept })
  task.value.participants.push({ name: member.name, dept: member.dept })
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
  task.value.participants.push({ name: s.name, dept: s.dept })
  ElMessage.success('已确认报名')
}

function handleReject(s) {
  task.value.signups = task.value.signups.filter(x => x.name !== s.name)
  ElMessage.info('已拒绝该报名')
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
      if (!task.value.devices) task.value.devices = []
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

onMounted(() => {
  loadTask()
  loadMaterials()
  loadMembers()
  loadGlobalDevices()
  timer = setInterval(loadMaterials, 15000)
})

onUnmounted(() => timer && clearInterval(timer))
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