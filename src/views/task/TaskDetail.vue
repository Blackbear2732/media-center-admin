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
              <b>素材</b>
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

      <!-- 右侧：参与人员面板 -->
      <el-col :span="9">
        <el-card shadow="never" class="surface-card">
          <template #header>
            <div class="flex-between">
              <b>参与人（{{ (task.participants || []).length }}）</b>
              <!-- 管理身份标识 -->
              <span v-if="userStore.canManage" class="tag-soft" style="font-size: 11px;">可管理</span>
            </div>
          </template>

          <!-- 所有角色都能看到的：已确认参与人列表 -->
          <div v-for="p in (task.participants || [])" :key="p.name" class="flex-between" style="padding:8px 0;border-bottom:1px solid #f0f2f5">
            <span><el-avatar :size="26" style="margin-right:8px">{{ p.name.slice(0,1) }}</el-avatar>{{ p.name }}</span>
            <div>
              <el-tag size="small" type="info" style="margin-right: 8px;">{{ p.dept }}</el-tag>
              <!-- 只有管理者能移除人员 -->
              <el-button
                  v-if="userStore.canManage && canManageDept(p.dept)"
                  link type="danger"
                  size="small"
                  @click="handleRemove(p)"
              >移除</el-button>
            </div>
          </div>
          <el-empty v-if="!task.participants || task.participants.length === 0" description="暂无参与人" :image-size="50" />

          <!-- ================= 管理者视角 (部长/主任) ================= -->
          <template v-if="userStore.canManage">
            <!-- 待确认报名 -->
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

            <!-- 添加人员 -->
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--border);">
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">添加人员</div>
              <el-select v-model="selectedMember" placeholder="请选择成员" size="small" style="width: 100%; margin-bottom: 10px;">
                <el-option v-for="m in availableMembers" :key="m.id" :label="`${m.name} (${m.dept})`" :value="m.name" />
              </el-select>
              <el-button type="primary" size="small" style="width: 100%;" @click="handleAddParticipant">添加到任务</el-button>
            </div>
          </template>

          <!-- ================= 部员视角 ================= -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { taskApi, adminApi } from '@/api'
import { getTaskTagType } from '@/utils/dict'
import { userStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const loading = ref(false), matLoading = ref(false)
const task = ref({})
const materials = ref([]), opened = ref([])
let timer = null

const selectedMember = ref('')
const deptMembers = ref([])

// 判断是否可管理特定部门
const canManageDept = (dept) => {
  if (userStore.isDirector) return true
  if (userStore.isMinister && dept === userStore.dept) return true
  return false
}

// 过滤待确认报名列表（部长只看本部门，主任看全部）
const pendingSignups = computed(() => {
  let signups = task.value.signups || []
  if (userStore.isMinister) {
    signups = signups.filter(s => s.dept === userStore.dept)
  }
  return signups
})

// 判断当前登录部员的状态（已参与 / 待审核 / 未报名）
const myParticipantStatus = computed(() => {
  const myName = userStore.name
  // 是否已在参与人列表
  const isJoined = (task.value.participants || []).some(p => p.name === myName)
  if (isJoined) return 'joined'

  // 是否在待审核列表
  const isPending = (task.value.signups || []).some(s => s.name === myName)
  if (isPending) return 'pending'

  return 'none'
})

// 计算可添加的成员（排除已参与和已报名的）
const availableMembers = computed(() => {
  const currentNames = (task.value.participants || []).map(p => p.name)
  const targetDept = userStore.isDirector ? (userStore.adminDept || '新闻部') : userStore.dept
  return (deptMembers.value || []).filter(m =>
      m.dept === targetDept && !currentNames.includes(m.name)
  )
})

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
    // 将当前用户推入待审核列表
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

async function loadTask() {
  loading.value = true
  try {
    const res = await taskApi.detail(route.params.id)
    if (res) {
      task.value = res
      if (!task.value.participants) task.value.participants = []
      if (!task.value.signups) task.value.signups = []
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
  timer = setInterval(loadMaterials, 15000)
})

onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
.mb { margin-bottom: 16px; }
.article-content { white-space: pre-wrap; line-height: 1.9; color: var(--text); font-size: 14px; }
.surface-card { background: #fff; border-radius: 14px; border: 1px solid #e6ebf1; }
</style>