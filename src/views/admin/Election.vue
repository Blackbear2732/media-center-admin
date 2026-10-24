<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:16px; flex-wrap:wrap; gap:10px;">
      <span class="muted">每一届记录完整组织架构与成员任职，换届时批量任命并自动同步岗位 / 登录角色</span>
      <button class="pill active" style="padding:10px 20px;" @click="openStart">
        <el-icon style="margin-right:4px;"><Refresh /></el-icon> 发起换届
      </button>
    </div>

    <!-- 届次列表 -->
    <div class="surface-card" style="padding:8px 0; margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 16px 4px;">
        <span style="font-weight:600;">届次记录</span>
        <span class="muted" style="font-size:13px;">点击「查看架构」浏览历史组织架构</span>
      </div>
      <el-table :data="terms" stripe>
        <el-table-column prop="term_name" label="届次" min-width="120" />
        <el-table-column label="开始日期" width="120">
          <template #default="{ row }">{{ fmtDate(row.start_date) }}</template>
        </el-table-column>
        <el-table-column label="结束日期" width="120">
          <template #default="{ row }">{{ fmtDate(row.end_date) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="Number(row.status) === 1 ? 'success' : 'info'" effect="plain">
              {{ Number(row.status) === 1 ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewTerm(row)">查看架构</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && terms.length === 0" description="暂无届次记录" />
    </div>

    <!-- 组织架构（当前查看届） -->
    <div class="surface-card" style="padding:8px 0;">
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 16px 4px; flex-wrap:wrap; gap:8px;">
        <span style="font-weight:600;">
          组织架构
          <span class="muted" style="font-weight:400; font-size:13px; margin-left:8px;">
            {{ activeTermLabel }} · {{ appointments.length }} 人
          </span>
        </span>
        <el-select v-model="selectedTermId" size="small" style="width:200px;" @change="loadAppointments" :disabled="appointLoading">
          <el-option v-for="t in terms" :key="t.id" :label="termLabel(t)" :value="Number(t.id)" />
        </el-select>
      </div>
      <el-table v-loading="appointLoading" :data="appointments" stripe>
        <el-table-column prop="user_name" label="姓名" width="110" />
        <el-table-column prop="dept_name" label="部门" min-width="140" />
        <el-table-column prop="post" label="岗位" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="postTagType(row.post)" effect="plain">{{ row.post }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="retire_type" label="任职类型" width="100">
          <template #default="{ row }">
            <span :class="['muted', retireTypeClass(row.retire_type)]" style="font-size:13px;">{{ row.retire_type }}</span>
          </template>
        </el-table-column>
        <el-table-column label="任职期间" width="180">
          <template #default="{ row }">
            <span style="font-size:13px;">
              {{ fmtDate(row.start_date) }} ~ {{ fmtDate(row.end_date) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openHistory(row)">履历</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!appointLoading && appointments.length === 0" description="该届暂无任职记录" />
    </div>

    <!-- 发起换届弹窗 -->
    <el-dialog
        v-model="startVisible"
        title="发起换届"
        width="880px"
        :close-on-click-modal="false"
        class="start-dialog"
    >
      <!-- 第一步：届次信息 -->
      <template v-if="step === 1">
        <el-form :model="form" label-width="90px">
          <el-form-item label="届次名称" required>
            <el-input v-model="form.termName" placeholder="如：2027届" style="width:280px;" />
          </el-form-item>
          <el-form-item label="开始日期" required>
            <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:280px;" />
          </el-form-item>
          <div class="muted" style="font-size:13px; line-height:1.7; margin-top:4px;">
            创建新届后，上一届将自动标记为已结束；随后进入批量任命，将本届组织架构写入新届并同步成员的岗位与登录角色。
          </div>
        </el-form>
      </template>

      <!-- 第二步：批量任命 -->
      <template v-else>
        <div class="muted" style="font-size:13px; margin-bottom:10px;">
          已创建「{{ form.termName }}」。默认沿用全部在岗成员当前岗位（留任），请按本届变动调整「新岗位 / 任职类型」，退休或升职的成员旧届任职将自动收尾。
        </div>
        <el-table :data="rows" stripe max-height="420">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="deptName" label="部门" width="120" />
          <el-table-column label="原岗位" width="90">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="postTagType(row.curPost)">{{ row.curPost }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="新岗位" width="120">
            <template #default="{ row }">
              <el-select v-model="row.post" size="small" style="width:100px;">
                <el-option v-for="p in POST_OPTIONS" :key="p" :label="p" :value="p" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="任职类型" width="120">
            <template #default="{ row }">
              <el-select v-model="row.retireType" size="small" style="width:100px;">
                <el-option v-for="r in RETIRE_OPTIONS" :key="r" :label="r" :value="r" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.remark" size="small" placeholder="选填" />
            </template>
          </el-table-column>
        </el-table>
        <div class="flex-between" style="margin-top:12px;">
          <span class="muted" style="font-size:13px;">共 {{ rows.length }} 名在岗成员</span>
          <div>
            <el-button @click="step = 1">上一步</el-button>
          </div>
        </div>
      </template>

      <template #footer>
        <template v-if="step === 1">
          <el-button @click="startVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="createTerm">创建新届，继续任命</el-button>
        </template>
        <template v-else>
          <el-button type="primary" :loading="saving" @click="apply">提交任命，完成换届</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 成员履历弹窗 -->
    <el-dialog v-model="historyVisible" :title="historyTitle + ' · 任职履历'" width="600px">
      <el-timeline v-if="history.length">
        <el-timeline-item
            v-for="h in history"
            :key="h.id"
            :timestamp="`${fmtDate(h.start_date)} ~ ${fmtDate(h.end_date)}`"
            placement="top"
        >
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:600;">{{ h.post }}</span>
            <span class="muted" style="font-size:13px;">{{ h.dept_name }}</span>
            <el-tag v-if="Number(h.retire_type)" size="small" effect="plain" type="info">{{ h.retire_type }}</el-tag>
          </div>
          <div v-if="h.remark" class="muted" style="font-size:13px; margin-top:4px;">{{ h.remark }}</div>
          <div class="muted" style="font-size:12px;">{{ h.term_name }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无任职记录" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { getDeptLabel } from '@/utils/dict'

const loading = ref(false), appointLoading = ref(false), saving = ref(false)
const terms = ref([]), selectedTermId = ref(null), appointments = ref([])

// 发起换届
const startVisible = ref(false), step = ref(1)
const form = reactive({ termName: '', startDate: '' })
const newTermId = ref(null)
const rows = ref([])

// 履历
const historyVisible = ref(false), history = ref([]), historyTitle = ref('')

const POST_OPTIONS = ['主任', '部长', '部员']
const RETIRE_OPTIONS = ['留任', '升职', '退休', '新增']
const POST_BY_ROLE = { 0: '部员', 1: '部长', 2: '主任' }

const activeTermLabel = computed(() => {
  const t = terms.value.find(x => Number(x.id) === Number(selectedTermId.value))
  return t ? `${t.term_name}${Number(t.status) === 1 ? '（进行中）' : '（已结束）'}` : ''
})

const termLabel = (t) => `${t.term_name} · ${Number(t.status) === 1 ? '进行中' : '已结束'}`

const fmtDate = (v) => {
  if (!v) return '—'
  if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10)
  const s = String(v).replace('T', ' ').slice(0, 10)
  return s === '' ? '—' : s
}

const postTagType = (post) => post === '主任' ? 'danger' : (post === '部长' ? 'warning' : 'info')
const retireTypeClass = (t) => t === '退休' ? 'text-line' : ''

async function load() {
  loading.value = true
  try {
    terms.value = (await adminApi.electionTerms()) || []
    const active = terms.value.find(t => Number(t.status) === 1)
    selectedTermId.value = active ? Number(active.id) : (terms.value[0] ? Number(terms.value[0].id) : null)
    if (selectedTermId.value != null) await loadAppointments()
  } catch (e) {
    console.error('加载换届数据失败', e)
  } finally {
    loading.value = false
  }
}

async function loadAppointments() {
  if (selectedTermId.value == null) {
    appointments.value = []
    return
  }
  appointLoading.value = true
  try {
    appointments.value = await adminApi.electionAppointments(selectedTermId.value, null) || []
  } catch (e) {
    ElMessage.error('加载组织架构失败')
  } finally {
    appointLoading.value = false
  }
}

function viewTerm(row) {
  selectedTermId.value = Number(row.id)
  loadAppointments()
}

function openStart() {
  step.value = 1
  form.termName = ''
  form.startDate = ''
  newTermId.value = null
  rows.value = []
  startVisible.value = true
}

async function createTerm() {
  if (!form.termName.trim()) return ElMessage.warning('请输入届次名称')
  if (!form.startDate) return ElMessage.warning('请选择开始日期')
  saving.value = true
  try {
    const res = await adminApi.startElection({
      termName: form.termName.trim(),
      startDate: form.startDate
    })
    newTermId.value = Number(res.termId)
    // 加载当前在岗成员作为任命候选，默认沿用原岗位（留任）
    const mres = await adminApi.members({ deptId: 100, pageNum: 1, pageSize: 9999 })
    const list = mres?.rows || []
    rows.value = list
        .filter(m => Number(m.status) === 1)
        .map(m => {
          const curPost = POST_BY_ROLE[Number(m.role)] || '部员'
          return {
            userId: m.id,
            name: m.name,
            deptId: m.deptId,
            deptName: getDeptLabel(m.deptId),
            curPost,
            post: curPost,
            retireType: '留任',
            remark: ''
          }
        })
    if (rows.value.length === 0) {
      ElMessage.warning('没有在岗成员可任命，届次已创建')
      startVisible.value = false
      return await load()
    }
    step.value = 2
  } catch (e) {
    ElMessage.error('创建届次失败')
  } finally {
    saving.value = false
  }
}

async function apply() {
  const items = rows.value.map(r => ({
    userId: r.userId,
    deptId: r.deptId,
    post: r.post,
    retireType: r.retireType,
    remark: r.remark
  }))
  if (items.length === 0) return ElMessage.warning('没有可任命的成员')
  try {
    await ElMessageBox.confirm(
      `将按本次任命写入「${form.termName}」的 ${items.length} 条任职，并同步调整成员的岗位与登录角色，确定提交吗？`,
      '提交任命确认',
      { type: 'warning', confirmButtonText: '确认提交', cancelButtonText: '再检查一下' }
    )
  } catch (e) {
    return
  }
  saving.value = true
  try {
    const res = await adminApi.applyElection({ termId: newTermId.value, items })
    ElMessage.success(`换届完成：写入 ${res.applied} 条任职，同步 ${res.synced} 人岗位/角色`)
    startVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error('任命提交失败')
  } finally {
    saving.value = false
  }
}

async function openHistory(row) {
  historyTitle.value = row.user_name
  history.value = []
  historyVisible.value = true
  try {
    history.value = (await adminApi.electionHistory(row.user_id)) || []
  } catch (e) {
    ElMessage.error('加载履历失败')
  }
}

onMounted(load)
</script>

<style scoped>
.text-line { text-decoration: line-through; }

@media (max-width: 768px) {
  :deep(.start-dialog) { width: 92% !important; }
}
</style>
