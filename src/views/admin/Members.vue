<template>
  <div>
    <!-- 顶部多级筛选区 -->
    <div class="filter-bar surface-card">
      <div class="filter-group">
        <div class="filter-item">
          <span class="filter-label">姓名</span>
          <el-input
            v-model="nameFilter"
            size="small"
            clearable
            placeholder="姓名 / 学号"
            style="width: 160px"
            @keyup.enter="onNameSearch"
            @clear="onNameSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="filter-item">
          <span class="filter-label">部门</span>
          <el-select v-model="deptFilter" size="small" :disabled="!userStore.isDirector" style="width: 140px">
            <el-option label="全部部门" :value="ALL_DEPT_ID" />
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">角色</span>
          <el-select v-model="roleFilter" size="small" clearable placeholder="全部角色" style="width: 120px">
            <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">政治面貌</span>
          <el-select v-model="politicalFilter" size="small" clearable placeholder="全部面貌" style="width: 140px">
            <el-option v-for="p in POLITICAL_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
        </div>
      </div>

      <div class="flex-between" style="flex: 1; margin-left: 24px;">
        <div class="muted">
          符合条件共 <span style="color: var(--brand); font-weight: 600;">{{ total }}</span> 人
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="pill" @click="resetFilter">重置筛选</button>
          <button class="pill active" @click="openEdit()">+ 新增成员</button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="surface-card" style="padding: 6px 0" v-loading="loading">
      <el-table :data="rawList" stripe>
        <el-table-column v-if="userStore.isDirector" prop="deptId" label="所属部门" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getDeptLabel(row.deptId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoleTagType(row.role)" effect="plain">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="中心职务" width="110" />
        <el-table-column prop="politicalStatus" label="政治面貌" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.politicalStatus === '中共党员' ? 'danger' : ((row.politicalStatus === '共青团员' || row.politicalStatus === '中共预备党员') ? 'warning' : 'info')" effect="plain">
              {{ row.politicalStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getMemberStatusType(row.status)" size="small">{{ getMemberStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="canManageRow(row)" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="canManageRow(row)" link :type="Number(row.status) === MEMBER_STATUS.ACTIVE ? 'danger' : 'success'" @click="toggle(row)">
              {{ Number(row.status) === MEMBER_STATUS.ACTIVE ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑成员' : '新增成员'" width="520px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="所属部门" v-if="userStore.isDirector">
          <el-select v-model="form.deptId" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学号" required><el-input v-model="form.studentNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="年级"><el-input v-model="form.grade" /></el-form-item>
        <el-form-item label="中心职务"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="政治面貌">
          <el-select v-model="form.politicalStatus" style="width:100%">
            <el-option v-for="p in POLITICAL_OPTIONS" :key="p" :label="p" :value="p" />
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
          <el-descriptions-item label="部门">{{ getDeptLabel(current.deptId) }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ getRoleLabel(current.role) }}</el-descriptions-item>
          <el-descriptions-item label="职务">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="政治面貌">{{ current.politicalStatus }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ current.phone }}</el-descriptions-item>
        </el-descriptions>

        <!-- 任务参与 -->
        <div class="sec-title" style="font-size:14px; margin-top: 24px;">任务参与 ({{ detail.tasks?.length || 0 }})</div>
        <div v-if="detail.tasks && detail.tasks.length > 0">
          <div v-for="t in detail.tasks" :key="t.id" class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border)">
            <div>
              <div style="font-weight: 500; font-size: 14px;">{{ t.title }}</div>
              <div class="muted" style="font-size: 12px; margin-top: 4px;">{{ t.startTime }} · {{ t.location }}</div>
            </div>
            <el-tag size="small" :type="getTaskTagType(t.status)">{{ getTaskStatusLabel(t.status) }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无参与任务" :image-size="50" />

        <!-- 会议记录 -->
        <div class="sec-title" style="font-size:14px; margin-top: 20px;">会议记录</div>
        <div v-if="detail.meetings && detail.meetings.length > 0">
          <div v-for="m in detail.meetings" :key="m.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
            <span style="font-size: 13px;">{{ m.title }}</span>
            <el-tag size="small" :type="getMeetingJoinStatusType(m.status)" effect="plain">{{ getMeetingJoinStatusLabel(m.status) }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无会议记录" :image-size="50" />

        <!-- 考评记录 -->
        <div class="sec-title" style="font-size:14px; margin-top: 20px;">考评记录</div>
        <div v-if="detail.evaluations && detail.evaluations.length > 0">
          <div v-for="e in detail.evaluations" :key="e.id" class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border)">
            <span>{{ e.month }} 月度考评</span>
            <span style="font-weight: 600; color: var(--brand);">
              总分 {{ e.total }} ({{ getEvalLevelLabel(e.level) }})
            </span>
          </div>
        </div>
        <el-empty v-else description="暂无考评记录" :image-size="50" />

        <!-- 打卡情况：近 12 个月汇总，点击月份展开逐日明细 -->
        <div class="ck-head-row">
          <div class="sec-title" style="font-size:14px; margin-top: 20px;">打卡情况</div>
          <span class="muted ck-range">近 12 个月</span>
        </div>

        <!-- 多部门成员按部门分别统计：切换后月度汇总与逐日明细都带 deptId 重新请求 -->
        <div v-if="checkin.depts.length > 1" class="ck-dept-switch">
          <button
            type="button"
            class="ck-dept-btn"
            :class="{ active: checkin.deptId === '' }"
            @click="switchCheckinDept('')"
          >全部部门</button>
          <button
            v-for="d in checkin.depts"
            :key="d.deptId"
            type="button"
            class="ck-dept-btn"
            :class="{ active: Number(checkin.deptId) === Number(d.deptId) }"
            @click="switchCheckinDept(d.deptId)"
          >{{ d.deptName }}</button>
        </div>

        <div class="ck-panel" v-loading="checkin.loading">
          <div v-if="checkin.loading && checkin.months.length === 0" class="ck-state muted">打卡数据加载中…</div>
          <div v-else-if="checkin.error" class="ck-state ck-error">{{ checkin.error }}</div>
          <template v-else-if="checkin.months.length > 0">
            <div class="ck-legend">
              <span class="ck-legend-item"><i class="ck-dot done"></i>已打卡</span>
              <span class="ck-legend-item"><i class="ck-dot absent"></i>未打卡</span>
              <span class="ck-legend-item"><i class="ck-dot unmarked"></i>未标记</span>
              <span class="muted ck-legend-tip">点击月份查看逐日明细</span>
            </div>

            <div class="ck-head">
              <span></span>
              <span>月份</span>
              <span>已打卡/应打卡</span>
              <span>出勤率</span>
              <span>未标记</span>
            </div>

            <div v-for="row in checkin.months" :key="monthKey(row)" class="ck-month">
              <div
                class="ck-month-row"
                :class="{ open: checkin.openKey === monthKey(row) }"
                role="button"
                tabindex="0"
                @click="toggleMonth(row)"
                @keydown.enter.prevent="toggleMonth(row)"
              >
                <span class="ck-caret" :class="{ open: checkin.openKey === monthKey(row) }">▸</span>
                <span class="ck-month-name">
                  {{ row.month }}
                  <span v-if="checkin.depts.length > 1" class="ck-month-dept">{{ row.deptName }}</span>
                </span>
                <span class="ck-month-days">{{ row.checkedDays }} / {{ row.recordDays }} 天</span>
                <span class="ck-rate" :class="rateClass(row.rate)">{{ row.rate }}%</span>
                <span class="ck-unmarked" :class="{ zero: Number(row.unmarkedDays) === 0 }">
                  {{ row.unmarkedDays }} 天
                </span>
              </div>

              <div v-if="checkin.openKey === monthKey(row)" class="ck-day-panel">
                <div v-if="checkin.dayLoading" class="ck-state muted">逐日明细加载中…</div>
                <div v-else-if="checkin.dayError" class="ck-state ck-error">{{ checkin.dayError }}</div>
                <div v-else-if="checkin.days.length === 0" class="ck-state muted">该月暂无打卡记录</div>
                <div v-else class="ck-day-list">
                  <div v-for="d in checkin.days" :key="d.id ?? d.date" class="ck-day-row">
                    <span class="ck-day-date">{{ d.date }}</span>
                    <span class="ck-day-status" :class="dayStatusClass(d.status)">{{ dayStatusLabel(d.status) }}</span>
                    <span class="ck-day-mark muted" :title="markText(d)">{{ markText(d) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="ck-state muted">该成员近 12 个月暂无打卡记录</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { getFriendlyErrorMessage } from '@/api/request'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  CHECKIN_STATUS,
  DEPARTMENTS_OPTIONS,
  MEMBER_STATUS,
  ROLE_OPTIONS,
  getDeptLabel,
  getEvalLevelLabel,
  getMeetingJoinStatusLabel,
  getMeetingJoinStatusType,
  getMemberStatusLabel,
  getMemberStatusType,
  getRoleLabel,
  getRoleTagType,
  getTaskStatusLabel,
  getTaskTagType,
  isAllDept
} from '@/utils/dict'

// 政治面貌是人员属性（varchar 存储），不是后端枚举，这里集中一份选项
const POLITICAL_OPTIONS = ['中共党员', '中共预备党员', '共青团员', '群众']

const nameFilter = ref('')
const deptFilter = ref(userStore.isDirector ? ALL_DEPT_ID : userStore.deptId)
const roleFilter = ref('')
const politicalFilter = ref('')

const rawList = ref([])
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading(), saving = ref(false)
const editVisible = ref(false), detailVisible = ref(false), detailLoading = ref(false)
const current = ref(null)
const detail = ref({ tasks: [], checkins: [] })

/* ================= 成员详情 · 打卡情况 =================
 * 月度汇总按「月份 + 部门」返回，多部门成员不合并：
 * - deptId 为空 → 全部所属部门，用于提取部门切换选项并分组展示；
 * - 选中具体部门 → 月度汇总与逐日明细都带同一个 deptId 重新请求。
 */
const CHECKIN_MONTH_SPAN = 12
const checkin = reactive({
  loading: false,
  error: '',
  months: [],
  depts: [],
  deptId: '',
  openKey: '',
  dayLoading: false,
  dayError: '',
  days: []
})
// 请求序号：快速切换成员/部门/月份时丢弃过期响应，避免旧数据覆盖新状态
let monthsSeq = 0
let daysSeq = 0

const monthKey = (row) => `${row.month}|${row.deptId ?? ''}`

function resetCheckin() {
  monthsSeq++
  daysSeq++
  Object.assign(checkin, {
    loading: false,
    error: '',
    months: [],
    depts: [],
    deptId: '',
    openKey: '',
    dayLoading: false,
    dayError: '',
    days: []
  })
}

async function loadCheckinMonths() {
  const userId = current.value?.id
  if (!userId) return
  const seq = ++monthsSeq
  checkin.loading = true
  checkin.error = ''
  checkin.openKey = ''
  checkin.dayLoading = false
  checkin.dayError = ''
  checkin.days = []
  try {
    const params = { months: CHECKIN_MONTH_SPAN }
    if (checkin.deptId !== '') params.deptId = checkin.deptId
    const rows = await adminApi.memberCheckinMonths(userId, params)
    if (seq !== monthsSeq) return
    checkin.months = Array.isArray(rows) ? rows : []
    // 部门选项 = 列表中的该成员所属部门 + 月度数据里出现的部门，切换部门时保留已有选项
    if (checkin.deptId === '') {
      const map = new Map(checkin.depts.map(d => [Number(d.deptId), d]))
      checkin.months.forEach(row => {
        if (row.deptId === null || row.deptId === undefined) return
        const id = Number(row.deptId)
        if (!map.has(id)) {
          map.set(id, { deptId: id, deptName: row.deptName || getDeptLabel(row.deptId) })
        }
      })
      checkin.depts = [...map.values()]
    }
  } catch (e) {
    if (seq !== monthsSeq) return
    // 无权限/请求失败：后端中文提示由拦截器转换后带在 message 上，这里落到区块内展示
    checkin.error = getFriendlyErrorMessage(e, '打卡数据加载失败，请稍后重试')
    checkin.months = []
  } finally {
    if (seq === monthsSeq) checkin.loading = false
  }
}

function switchCheckinDept(deptId) {
  const next = deptId === '' ? '' : Number(deptId)
  if (checkin.deptId === next) return
  checkin.deptId = next
  loadCheckinMonths()
}

// 成员列表会把多部门成员展开为多行，先按 id 收集该成员所属部门，保证无打卡记录的部门也能切换
function seedCheckinDepts(row) {
  const map = new Map()
  const add = (deptId, deptName) => {
    if (deptId === null || deptId === undefined || deptId === '') return
    const id = Number(deptId)
    if (!map.has(id)) map.set(id, { deptId: id, deptName: deptName || getDeptLabel(id) })
  }
  rawList.value.forEach(item => {
    if (Number(item.id) === Number(row.id)) add(item.deptId, item.deptName)
  })
  add(row.deptId, row.deptName)
  return [...map.values()]
}

async function toggleMonth(row) {
  const key = monthKey(row)
  if (checkin.openKey === key) {
    checkin.openKey = ''
    checkin.dayLoading = false
    checkin.dayError = ''
    checkin.days = []
    return
  }
  checkin.openKey = key
  checkin.dayLoading = true
  checkin.dayError = ''
  checkin.days = []
  const seq = ++daysSeq
  try {
    const params = { month: row.month }
    // 明细与当前月份行同部门：全部部门视角下也不能把两个部门的同月记录合并
    if (row.deptId !== null && row.deptId !== undefined) params.deptId = row.deptId
    const rows = await adminApi.memberCheckins(current.value.id, params)
    if (seq !== daysSeq) return
    checkin.days = Array.isArray(rows) ? rows : []
  } catch (e) {
    if (seq !== daysSeq) return
    checkin.dayError = getFriendlyErrorMessage(e, '打卡明细加载失败，请稍后重试')
  } finally {
    if (seq === daysSeq) checkin.dayLoading = false
  }
}

const isUnmarked = (status) => status === null || status === undefined || status === ''
const dayStatusLabel = (status) => {
  if (isUnmarked(status)) return '未标记'
  return Number(status) === CHECKIN_STATUS.DONE ? '已打卡' : '未打卡'
}
const dayStatusClass = (status) => {
  if (isUnmarked(status)) return 'unmarked'
  return Number(status) === CHECKIN_STATUS.DONE ? 'done' : 'absent'
}
const markText = (day) => {
  // 后端补充 markByName 后优先展示姓名，早期数据缺少该字段时回退到 markBy
  const name = day?.markByName || day?.markBy
  const by = name ? `标记人 ${name}` : ''
  return [by, day?.markTime].filter(Boolean).join(' · ') || '—'
}
const rateClass = (rate) => {
  const value = Number(rate) || 0
  if (value >= 90) return 'good'
  if (value >= 60) return 'mid'
  return 'bad'
}

const form = reactive({
  id: null, deptId: 101, role: 0, studentNo: '', name: '', grade: '',
  title: '部员', politicalStatus: '共青团员', phone: ''
})

// 与后端一致：主任可分配部长/部员，部长只能分配部员；系统内置超级管理员不受限
const roleRank = (role) => (Number(role) === 2 ? 3 : Number(role) === 1 ? 2 : 1)
const roleOptions = computed(() => {
  if (Number(userStore.userInfo?.id) === 1) return ROLE_OPTIONS
  if (userStore.isDirector) return ROLE_OPTIONS.filter(r => Number(r.value) !== 2)
  return ROLE_OPTIONS.filter(r => Number(r.value) === 0)
})

function canManageRow(row) {
  if (Number(userStore.userInfo?.id) === 1) return true
  return roleRank(userStore.role) > roleRank(row.role)
}

// 后端分页：页码/每页条数/总数
const page = ref(1)
const size = ref(10)
const pageSizes = [10, 20, 50, 100]
const total = ref(0)

// 筛选条件变化回到第一页重新查询
watch([nameFilter, deptFilter, roleFilter, politicalFilter], () => {
  page.value = 1
  load()
})
// 翻页/改每页条数重新查询
watch([page, size], () => load())

function onNameSearch() {
  page.value = 1
  load()
}

async function load() {
  loading.value = true
  try {
    const res = await adminApi.members({
      deptId: deptFilter.value,
      role: roleFilter.value === '' ? null : roleFilter.value,
      politicalStatus: politicalFilter.value || null,
      nameLike: nameFilter.value || null,
      pageNum: page.value,
      pageSize: size.value
    })
    rawList.value = res?.rows || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  nameFilter.value = ''
  if (userStore.isDirector) deptFilter.value = ALL_DEPT_ID
  roleFilter.value = ''
  politicalFilter.value = ''
}

function resetForm() {
  Object.assign(form, {
    id: null,
    // 全中心视角下新增成员默认落到第一个业务部门（综合部）
    deptId: isAllDept(deptFilter.value) ? DEPARTMENTS_OPTIONS[0].value : deptFilter.value,
    role: 0,
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
  const next = Number(row.status) === MEMBER_STATUS.ACTIVE ? MEMBER_STATUS.DISABLED : MEMBER_STATUS.ACTIVE
  const action = next === MEMBER_STATUS.DISABLED ? '停用' : '启用'
  await ElMessageBox.confirm(`确认${action}「${row.name}」吗？`, '提示', { type: 'warning' })
  await adminApi.toggleMember(row.id, next)
  row.status = next
  ElMessage.success('已更新')
}

async function openDetail(row) {
  current.value = row
  detailVisible.value = true
  detailLoading.value = true
  resetCheckin()
  checkin.depts = seedCheckinDepts(row)
  // 打卡数据独立加载：不阻塞任务/会议/考评详情，也便于单独展示无权限与失败提示
  loadCheckinMonths()
  try { detail.value = await adminApi.memberDetail(row.id) } finally { detailLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
/* ===== 成员详情 · 打卡情况 ===== */
.ck-head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.ck-range {
  font-size: 12px;
}

/* 多部门切换：切换后月度汇总与逐日明细都会带 deptId 重新请求 */
.ck-dept-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 10px;
}
.ck-dept-btn {
  padding: 3px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-sub);
  background: #f5f6f8;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: color .2s, border-color .2s, background .2s;
}
.ck-dept-btn:hover {
  color: var(--brand);
  border-color: var(--brand);
}
.ck-dept-btn.active {
  color: #fff;
  background: var(--brand);
  border-color: var(--brand);
}

.ck-panel {
  margin-top: 8px;
  min-height: 56px;
}
/* 空数据 / 无权限 / 请求失败统一走这块提示，不留空白 */
.ck-state {
  padding: 16px 12px;
  text-align: center;
  font-size: 13px;
  line-height: 1.7;
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.ck-state.ck-error {
  color: #b4453b;
  background: #fdf5f4;
  border-color: #f0c9c3;
  border-style: solid;
  text-align: left;
}

.ck-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-sub);
}
.ck-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ck-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.ck-dot.done { background: #2f9e63; }
.ck-dot.absent { background: #d9534f; }
.ck-dot.unmarked { background: #a8adb5; }
.ck-legend-tip {
  margin-left: auto;
  font-size: 12px;
}

.ck-head,
.ck-month-row {
  display: grid;
  grid-template-columns: 14px minmax(76px, 1.1fr) minmax(96px, 1fr) 56px 58px;
  align-items: center;
  column-gap: 8px;
}
.ck-head {
  padding: 0 8px 4px 10px;
  font-size: 12px;
  color: var(--text-sub);
  border-bottom: 1px solid var(--border);
}
.ck-month {
  border-bottom: 1px dashed var(--border);
}
.ck-month:last-child {
  border-bottom: none;
}
.ck-month-row {
  padding: 9px 8px 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
}
.ck-month-row:hover,
.ck-month-row.open {
  background: #f7f8fa;
}
.ck-caret {
  font-size: 11px;
  color: #9aa0a6;
  transition: transform .15s;
}
.ck-caret.open {
  transform: rotate(90deg);
}
.ck-month-name {
  font-size: 13px;
  font-weight: 600;
}
.ck-month-dept {
  display: block;
  margin-top: 1px;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-sub);
}
.ck-month-days {
  font-size: 13px;
}
.ck-rate {
  font-size: 13px;
  font-weight: 600;
}
.ck-rate.good { color: #2f9e63; }
.ck-rate.mid { color: #c98a13; }
.ck-rate.bad { color: #d9534f; }
.ck-unmarked {
  font-size: 12px;
  color: #c98a13;
}
.ck-unmarked.zero {
  color: var(--text-sub);
}

/* 逐日明细 */
.ck-day-panel {
  padding: 4px 8px 10px 32px;
  background: #fafbfc;
  border-radius: 0 0 8px 8px;
}
.ck-day-list {
  max-height: 260px;
  overflow-y: auto;
}
.ck-day-row {
  display: grid;
  grid-template-columns: 82px 58px minmax(0, 1fr);
  align-items: center;
  column-gap: 8px;
  padding: 6px 4px;
  font-size: 12px;
  border-bottom: 1px dashed #e8eaed;
}
.ck-day-row:last-child {
  border-bottom: none;
}
.ck-day-date {
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.ck-day-status {
  padding: 1px 0;
  font-size: 11px;
  text-align: center;
  border-radius: 4px;
}
.ck-day-status.done {
  color: #2f7d4f;
  background: #eaf6ef;
}
.ck-day-status.absent {
  color: #b4453b;
  background: #fdeeec;
}
.ck-day-status.unmarked {
  color: #6f757d;
  background: #eef0f2;
}
.ck-day-mark {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .ck-head,
  .ck-month-row {
    grid-template-columns: 12px minmax(66px, 1fr) 84px 46px 50px;
    column-gap: 6px;
  }
  .ck-day-panel {
    padding-left: 18px;
  }
}
</style>
