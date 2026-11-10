<template>
  <div>
    <div class="page-head">
      <div>
        <h2>打卡管理</h2>
        <p class="sub muted">按日期与部门维护成员打卡状态</p>
      </div>
    </div>
    <div class="flex-between checkin-toolbar" style="margin-bottom:16px;">
      <div class="checkin-filters" style="display:flex; gap:16px; align-items:center;">
        <div>
          <label class="muted" style="margin-right:8px;">日期</label>
          <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width:140px" />
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">姓名</label>
          <el-input
            v-model="keyword"
            clearable
            placeholder="姓名 / 学号"
            style="width:180px"
            @keyup.enter="reloadFromFirstPage"
            @clear="reloadFromFirstPage"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" plain style="margin-left:8px;" @click="reloadFromFirstPage">查询</el-button>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">部门</label>
          <el-select v-model="deptId" style="width:140px" :disabled="!canManageAllDepts" @change="reloadFromFirstPage">
            <el-option v-if="canManageAllDepts" label="全部部门" :value="ALL_DEPT_ID" />
            <el-option v-for="d in deptOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <span v-if="canManageAllDepts && !userStore.isDirector" class="muted" style="margin-left:6px;">综合部可处理全部部门</span>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">状态</label>
          <el-select v-model="statusFilter" style="width:120px">
            <el-option label="全部状态" :value="-1" />
            <el-option label="未标记" :value="-2" />
            <el-option v-for="s in CHECKIN_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>
      <div class="checkin-actions" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <el-button v-if="canImport" size="small" type="primary" plain @click="openImportDialog">导入名单</el-button>
        <el-button v-if="canImport" size="small" type="success" plain :disabled="isAllDeptView" @click="markAllUnmarked">
          未标记人员一键标已打卡
        </el-button>
        <el-button v-if="canGrant" size="small" @click="openManagerDialog">权限管理</el-button>
        <span v-if="canImport && isAllDeptView" class="muted batch-hint-inline">
          「全部部门」视图不支持批量标记，请选择具体部门
        </span>
      </div>
    </div>

    <div class="surface-card" style="padding: 0;">
      <div class="checkin-table-head" style="padding: 12px 16px 0;">
        <span class="muted">共 {{ total }} 人</span>
        <span v-if="selectedRows.length" class="muted">已选 {{ selectedRows.length }} 人</span>
      </div>
      <div v-if="selectedRows.length" class="batch-bar">
        <span class="batch-bar-text">已选 {{ selectedRows.length }} 人</span>
        <el-button size="small" type="primary" :disabled="isAllDeptView" @click="batchMark(CHECKIN_STATUS.DONE)">
          批量标为已打卡
        </el-button>
        <el-button size="small" type="danger" plain :disabled="isAllDeptView" @click="batchMark(CHECKIN_STATUS.NOT_DONE)">
          批量标为未打卡
        </el-button>
        <el-button size="small" link @click="clearSelection">取消选择</el-button>
        <span v-if="isAllDeptView" class="batch-bar-reason">
          「全部部门」视图不支持批量标记，请先选择具体部门
        </span>
      </div>
      <el-table
        ref="tableRef"
        :data="list"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="deptId" label="部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ getDeptLabel(row.deptId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentNo" label="学号" width="140" />
        <el-table-column prop="member" label="姓名" width="120" />
        <el-table-column prop="status" label="打卡状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status !== null && row.status !== undefined && row.status !== ''"
                    :type="getCheckinStatusType(row.status)" size="small" effect="dark" round>
              {{ getCheckinStatusLabel(row.status) }}
            </el-tag>
            <el-tag v-else size="small" type="info" effect="plain" round>未标记</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="190">
          <template #default="{ row }">
            <template v-if="row.status === null || row.status === undefined || row.status === ''">
              <el-button type="danger" size="small" plain @click="mark(row, CHECKIN_STATUS.NOT_DONE)">
                标记未打卡
              </el-button>
              <el-button type="primary" size="small" plain @click="mark(row, CHECKIN_STATUS.DONE)">
                标记已打卡
              </el-button>
            </template>
            <template v-else>
              <el-button
                  v-if="Number(row.status) === CHECKIN_STATUS.NOT_DONE"
                  type="primary"
                  size="small"
                  plain
                  @click="mark(row, CHECKIN_STATUS.DONE)"
              >标记打卡</el-button>
              <el-button
                  v-else
                  type="danger"
                  size="small"
                  plain
                  @click="mark(row, CHECKIN_STATUS.NOT_DONE)"
              >取消打卡</el-button>
              <el-button size="small" plain @click="mark(row, null)">清除状态</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <el-dialog v-model="managerVisible" title="打卡管理权限" width="560px">
      <div class="muted" style="margin-bottom:12px;">
        综合部部长可将打卡管理权限授予部员，被授权部员可进入本页标记全中心（含综合部）的打卡记录。
      </div>
      <div class="muted" style="margin-bottom:8px;">已授权管理员</div>
      <div v-if="managers.length === 0" class="muted" style="margin-bottom:12px;">暂无</div>
      <div v-for="m in managers" :key="m.userId" class="manager-row">
        <span>{{ m.name }}（{{ m.studentNo }}）· {{ m.deptLabel }} · 由{{ m.grantedByName }}授权 {{ m.grantedAt }}</span>
        <el-button type="danger" size="small" plain @click="revoke(m)">取消权限</el-button>
      </div>
      <el-divider />
      <div class="muted" style="margin-bottom:8px;">可授权部员</div>
      <el-input
        v-model="candidateKeyword"
        placeholder="搜索部员姓名 / 学号"
        clearable
        style="margin-bottom:10px;"
        @input="loadCandidates"
      />
      <div v-for="c in candidates" :key="c.userId" class="manager-row">
        <span>{{ c.name }}（{{ c.studentNo }}）· {{ c.deptLabel }}</span>
        <el-button type="primary" size="small" plain @click="grant(c)">授权</el-button>
      </div>
      <el-empty v-if="candidates.length === 0" description="暂无可授权部员" :image-size="60" />
    </el-dialog>

    <el-dialog
      v-model="importVisible"
      title="导入打卡名单"
      width="min(760px, 94vw)"
      :close-on-click-modal="false"
    >
      <!-- 第一步：粘贴名单 -->
      <div v-if="importStep === 'input'">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            按真实名单粘贴：一行一个部门，如「新闻部：张三 李四 未打卡」；姓名间可用空格、逗号、顿号等分隔，8–20 位纯数字按学号匹配。预览不写库。
          </template>
        </el-alert>
        <div class="import-field">
          <label class="muted">打卡日期</label>
          <el-date-picker
            v-model="importDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width:160px"
            :disabled-date="importDateDisabled"
          />
          <span v-if="!canBackfill" class="muted">仅主任与综合部部长可补录历史日期</span>
        </div>
        <div class="import-field column">
          <label class="muted">名单内容</label>
          <el-input
            v-model="importText"
            type="textarea"
            :rows="10"
            resize="vertical"
            placeholder="新闻部：苗雨露 马清栗 未打卡&#10;影音部：王思彤 王佳怡 未打卡"
          />
        </div>
        <div class="muted import-scope">匹配范围：{{ importScopeLabel }}（跟随当前页面部门范围）</div>
      </div>

      <!-- 第二步：预览 -->
      <div v-else-if="importStep === 'preview' && preview">
        <div class="import-summary">
          <el-tag type="info" effect="plain">解析 {{ preview.summary.total }} 条</el-tag>
          <el-tag v-if="preview.summary.dedup" type="warning" effect="plain">去重 {{ preview.summary.dedup }} 条</el-tag>
          <el-tag type="success" effect="plain">匹配 {{ preview.summary.matched }}</el-tag>
          <el-tag v-if="preview.summary.duplicate" type="warning" effect="plain">重名 {{ preview.summary.duplicate }}</el-tag>
          <el-tag v-if="preview.summary.unmatched" type="danger" effect="plain">未匹配 {{ preview.summary.unmatched }}</el-tag>
        </div>

        <el-alert v-if="preview.needsStatusChoice" type="warning" :closable="false" show-icon class="import-block">
          <template #title>名单里没有状态词，请选择这份名单是：</template>
          <el-radio-group v-model="importStatusChoice" @change="rePreview">
            <el-radio :value="1">已打卡名单</el-radio>
            <el-radio :value="0">未打卡名单</el-radio>
          </el-radio-group>
        </el-alert>

        <el-alert v-if="preview.deduped.length" type="warning" :closable="false" class="import-block">
          <template #title>已去重 {{ preview.summary.dedup }} 条</template>
          <div v-for="d in preview.deduped" :key="`${d.deptName}-${d.token}`" class="import-line">
            {{ d.deptName || '未标注部门' }}：{{ d.token }} 出现 {{ d.count }} 次
          </div>
        </el-alert>

        <div v-if="preview.duplicates.length" class="import-block">
          <div class="import-block-title">重名待选择（默认不选中，未选择的不会写入）</div>
          <div v-for="(dup, di) in preview.duplicates" :key="`${dup.token}-${di}`" class="duplicate-row">
            <div class="duplicate-head">
              {{ dup.deptName || '未标注部门' }}：{{ dup.token }}（{{ getCheckinStatusLabel(dup.targetStatus) }}）
            </div>
            <el-radio-group v-model="picks[dupKey(dup)]">
              <el-radio v-for="c in dup.candidates" :key="c.userId" :value="c.userId">
                {{ c.name }}（{{ c.studentNo }}）· {{ c.deptName }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>

        <div v-if="preview.unmatched.length" class="import-block">
          <div class="import-block-title">未匹配（{{ preview.unmatched.length }}）</div>
          <div v-for="(u, ui) in preview.unmatched" :key="`${u.token}-${ui}`" class="unmatched-row">
            <span class="unmatched-token">{{ u.token }}</span>
            <span class="muted">{{ u.deptName || '未标注部门' }}</span>
            <el-tag size="small" type="danger" effect="plain">{{ u.reasonText }}</el-tag>
          </div>
          <el-checkbox v-model="allowSkipUnmatched">跳过未匹配项，继续提交</el-checkbox>
        </div>

        <div v-if="preview.matched.length" class="import-block">
          <div class="import-block-title">将写入（{{ preview.matched.length }}）</div>
          <div class="matched-table">
            <div v-for="(m, mi) in preview.matched" :key="`${m.userId}-${mi}`" class="matched-row">
              <span>{{ m.name }}</span>
              <span class="muted">{{ m.studentNo }}</span>
              <el-tag size="small" type="info" effect="plain">{{ m.deptName }}</el-tag>
              <span class="muted">{{ statusChangeText(m) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三步：提交结果 -->
      <div v-else-if="importStep === 'result' && importResult">
        <el-result icon="success" title="导入完成" sub-title="如需回滚，可撤销本次导入；仅最近一个未撤销批次可撤销">
          <template #extra>
            <div class="import-result">
              <div>新增 <b>{{ importResult.created }}</b> 条</div>
              <div>更新 <b>{{ importResult.updated }}</b> 条</div>
              <div>跳过 <b>{{ importResult.skipped }}</b> 条</div>
              <div>未匹配 <b>{{ importResult.unmatched }}</b> 条</div>
              <div>重名未选 <b>{{ importResult.unselected }}</b> 条</div>
              <div v-if="importResult.dedup">去重 <b>{{ importResult.dedup }}</b> 条</div>
            </div>
          </template>
        </el-result>

        <!-- 导入后跟进：仅手动触发，不自动批量写库 -->
        <div v-if="importHasUnmarked" class="import-followup">
          <div class="import-block-title">名单外未标记人员</div>
          <div class="muted import-followup-desc">
            本次导入为「未打卡」的成员不受影响；可把该部门其余未标记人员（无记录或状态为空）补标为已打卡。
            需要手动确认后才会写库，不会自动执行。
          </div>
          <el-button type="success" plain :disabled="isAllDeptView" @click="markUnmarkedAfterImport">
            名单外未标记人员一键标已打卡
          </el-button>
          <div v-if="isAllDeptView" class="muted" style="margin-top:6px;">
            「全部部门」视图不支持批量标记，请先选择具体部门。
          </div>
        </div>
      </div>

      <template #footer>
        <div v-if="importStep === 'input'">
          <el-button @click="importVisible = false">取消</el-button>
          <el-button type="primary" :loading="previewLoading" :disabled="!importText.trim()" @click="doPreview">
            解析预览
          </el-button>
        </div>
        <div v-else-if="importStep === 'preview'">
          <el-button @click="importStep = 'input'">返回修改</el-button>
          <el-button type="primary" :loading="commitLoading" :disabled="commitDisabled" @click="doCommit">
            提交导入
          </el-button>
        </div>
        <div v-else>
          <el-button type="danger" plain :loading="revokeLoading" @click="doRevoke">撤销本次导入</el-button>
          <el-button type="primary" @click="closeImport">完成</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  CHECKIN_STATUS,
  CHECKIN_STATUS_OPTIONS,
  DEPARTMENTS_OPTIONS,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getDeptLabel
} from '@/utils/dict'

const router = useRouter()
const date = ref(new Date().toISOString().split('T')[0])
// 姓名/学号模糊搜索关键字：回车、点「查询」或清空时生效
const keyword = ref('')
// 打卡管理归综合部：主任和综合部部长可处理全部部门，被授权部员同权限
const canManageAllDepts = computed(() =>
  userStore.isDirector || Number(userStore.deptId) === 101 || userStore.isCheckinManager
)
// 授权操作仅主任/综合部部长（被授权部员不可再授权他人）
const canGrant = computed(() =>
  userStore.isDirector || Number(userStore.deptId) === 101
)
// 名单导入入口：与打卡管理同权限（主任 / 综合部部长 / 被授权打卡管理员）
const canImport = computed(() => canManageAllDepts.value)
// 补录历史日期仅主任与综合部部长（综合部普通部员即便被授权也不行）
const canBackfill = computed(() =>
  userStore.isDirector || (Number(userStore.deptId) === 101 && userStore.isMinister)
)
// 打卡管理默认展示综合部（101），管理全中心者可切换到全部部门
const deptId = ref(canManageAllDepts.value ? 101 : (userStore.deptId ?? ALL_DEPT_ID))
const statusFilter = ref(-1) // -1 表示全部，-2 表示未标记
const list = ref([])
// 「全部部门」视图后端拒绝批量标记，需在界面上禁用并说明原因
const isAllDeptView = computed(() => Number(deptId.value) === Number(ALL_DEPT_ID))
const tableRef = ref(null)
const selectedRows = ref([])
function onSelectionChange(rows) {
  selectedRows.value = rows || []
}
function clearSelection() {
  tableRef.value?.clearSelection()
  selectedRows.value = []
}
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()

// 后端分页：页码/每页条数/总数
const page = ref(1)
const size = ref(10)
const pageSizes = [10, 20, 50, 100]
const total = ref(0)

const deptOptions = computed(() => {
  if (canManageAllDepts.value) return DEPARTMENTS_OPTIONS
  return DEPARTMENTS_OPTIONS.filter(d => Number(d.value) === Number(userStore.deptId))
})

// 筛选条件（日期/姓名/部门/状态）变化：回到第一页。
// 页码由下方 watch 统一触发加载，这里仅在页码已是第一页时直接查询，
// 避免同一次筛选既改页码又手动查询、发出两次请求
function reloadFromFirstPage() {
  if (page.value !== 1) page.value = 1
  else loadData()
}

// 打卡状态筛选（-1 全部）变化时回到第一页重新查询
watch(statusFilter, reloadFromFirstPage)
// 日期变化同样回到第一页：列表与标记使用的日期必须一致
watch(date, reloadFromFirstPage)
// 翻页/改每页条数重新查询
watch([page, size], () => loadData())

async function loadData() {
  loading.value = true
  try {
    const kw = keyword.value.trim()
    const res = await adminApi.checkins({
      date: date.value,
      deptId: deptId.value,
      status: Number(statusFilter.value) === -1 ? null : statusFilter.value,
      // 空关键字不作为筛选条件传给后端
      ...(kw ? { keyword: kw } : {}),
      pageNum: page.value,
      pageSize: size.value
    })
    list.value = res?.rows || []
    total.value = res?.total || 0
    // 数据刷新后原选中行已失效，清空避免对旧数据批量操作
    clearSelection()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function mark(row, status) {
  try {
    // 有记录 id 走旧的记录级接口；id 为 null（当天没有记录）走成员级接口，用 userId + 当前查询日期定位
    if (row.id !== null && row.id !== undefined) {
      await adminApi.markCheckin(row.id, status, row)
    } else {
      await adminApi.markCheckinByMember(row.userId, date.value, { status })
    }
    row.status = status
    ElMessage.success(status == null ? '已清除打卡状态' : `已标记为${getCheckinStatusLabel(status)}`)
  } catch (e) {
    console.error(e)
  }
}

// ===== 批量标记（PUT /admin/checkins/batch） =====
function showBatchResult(res, title) {
  const detail = [
    `新增 ${res?.created || 0} 条`,
    `更新 ${res?.updated || 0} 条`,
    `跳过 ${res?.skipped || 0} 条（已是目标状态）`,
    `合计 ${res?.total || 0} 人`
  ].join('；')
  ElMessageBox.alert(detail, `${title}完成`, {
    type: 'success',
    confirmButtonText: '知道了'
  }).catch(() => {})
}

// 勾选成员批量标记：仅传 userIds，目标状态由按钮决定
async function batchMark(status) {
  if (!canImport.value) return
  if (isAllDeptView.value) {
    ElMessage.warning('「全部部门」视图不支持批量标记，请先选择具体部门')
    return
  }
  const userIds = selectedRows.value
    .map(row => Number(row.userId))
    .filter(id => !Number.isNaN(id))
  if (!userIds.length) {
    ElMessage.warning('请先勾选需要标记的成员')
    return
  }
  if (userIds.length > 200) {
    ElMessage.warning('单次最多批量标记 200 人')
    return
  }
  const statusLabel = getCheckinStatusLabel(status)
  try {
    await ElMessageBox.confirm(
      `将把选中的 ${userIds.length} 名成员在 ${date.value}（${getDeptLabel(deptId.value)}）标为「${statusLabel}」。已是该状态的成员会自动跳过，是否继续？`,
      '批量标记',
      { type: 'warning', confirmButtonText: '确认标记', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  try {
    const res = await adminApi.checkinBatchMark({
      date: date.value,
      deptId: Number(deptId.value),
      status: Number(status),
      userIds
    })
    showBatchResult(res, '批量标记')
    loadData()
  } catch (e) {
    ElMessage.error(e?.message || '批量标记失败')
  }
}

// 未标记人员一键标已打卡：先用 status=-2 查人数，确认后再写库
async function markAllUnmarked() {
  await runMarkAllUnmarked({ markDate: date.value, markDeptId: deptId.value })
}

async function runMarkAllUnmarked({ markDate, markDeptId }) {
  if (!canImport.value) return
  if (Number(markDeptId) === Number(ALL_DEPT_ID)) {
    ElMessage.warning('「全部部门」视图不支持批量标记，请先选择具体部门')
    return
  }
  let count = 0
  try {
    const res = await adminApi.checkins({
      date: markDate,
      deptId: markDeptId,
      status: -2,
      pageNum: 1,
      pageSize: 1
    })
    count = Number(res?.total || 0)
  } catch (e) {
    ElMessage.error('查询未标记人数失败，请稍后重试')
    return
  }
  if (!count) {
    ElMessage.info(`${markDate} · ${getDeptLabel(markDeptId)} 没有未标记人员`)
    return
  }
  try {
    await ElMessageBox.confirm(
      `${markDate} · ${getDeptLabel(markDeptId)} 当前有 ${count} 名未标记人员（无记录或状态为空）。一键标为已打卡不会影响已标记为「未打卡」的成员，是否继续？`,
      '未标记人员一键标已打卡',
      { type: 'warning', confirmButtonText: `标记 ${count} 人`, cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  try {
    const res = await adminApi.checkinBatchMark({
      date: markDate,
      deptId: Number(markDeptId),
      status: 1,
      allUnmarked: true
    })
    showBatchResult(res, '一键标已打卡')
    if (date.value === markDate && Number(deptId.value) === Number(markDeptId)) loadData()
  } catch (e) {
    ElMessage.error(e?.message || '一键标记失败')
  }
}

// ===== 打卡管理授权（仅主任/综合部部长可见） =====
const managerVisible = ref(false)
const managers = ref([])
const candidates = ref([])
const candidateKeyword = ref('')

async function loadManagers() {
  try {
    managers.value = await adminApi.checkinManagers() || []
  } catch (e) {
    console.error(e)
  }
}

async function loadCandidates() {
  try {
    candidates.value = await adminApi.checkinManagerCandidates(candidateKeyword.value) || []
  } catch (e) {
    console.error(e)
  }
}

function openManagerDialog() {
  managerVisible.value = true
  candidateKeyword.value = ''
  loadManagers()
  loadCandidates()
}

async function grant(c) {
  try {
    await adminApi.grantCheckinManager(c.userId)
    ElMessage.success(`已授权 ${c.name} 管理打卡`)
    loadManagers()
    loadCandidates()
  } catch (e) {
    console.error(e)
  }
}

async function revoke(m) {
  try {
    await adminApi.revokeCheckinManager(m.userId)
    ElMessage.success(`已取消 ${m.name} 的打卡管理权限`)
    loadManagers()
    loadCandidates()
  } catch (e) {
    console.error(e)
  }
}

// ===== 打卡名单导入（粘贴名单 → 预览 → 提交 → 撤销） =====
const importVisible = ref(false)
const importStep = ref('input') // input | preview | result
const importDate = ref(date.value)
const importText = ref('')
const importStatusChoice = ref(null) // 名单无状态词时由用户选择：1 已打卡 / 0 未打卡
const preview = ref(null)
const picks = ref({}) // 重名候选：key -> userId（默认不选中）
const allowSkipUnmatched = ref(false)
const previewLoading = ref(false)
const commitLoading = ref(false)
const revokeLoading = ref(false)
const importResult = ref(null)
// 本次导入是否包含「未打卡」：只有此时才提供名单外补标入口
const importHasUnmarked = computed(() => {
  if (importStep.value !== 'result' || !importResult.value) return false
  if (Number(importStatusChoice.value) === 0) return true
  return (preview.value?.matched || []).some(m => Number(m.targetStatus) === 0)
})

const localDateText = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// 无补录权限时只允许选当天
const importDateDisabled = (d) => !canBackfill.value && localDateText(d) !== localDateText(new Date())
const importScopeLabel = computed(() => getDeptLabel(deptId.value))

const dupKey = (dup) => `${dup.deptName || ''}|${dup.token}|${dup.targetStatus}`
const pickedCount = computed(() => Object.values(picks.value).filter(v => v !== null && v !== undefined).length)
const commitDisabled = computed(() => {
  if (!preview.value || preview.value.needsStatusChoice) return true
  if (preview.value.unmatched.length > 0 && !allowSkipUnmatched.value) return true
  return preview.value.matched.length === 0 && pickedCount.value === 0
})

function statusChangeText(m) {
  const target = getCheckinStatusLabel(m.targetStatus)
  return m.currentStatus === null || m.currentStatus === undefined
    ? `无记录 → ${target}`
    : `${getCheckinStatusLabel(m.currentStatus)} → ${target}`
}

function openImportDialog() {
  importVisible.value = true
  importStep.value = 'input'
  importDate.value = date.value || localDateText(new Date())
  importText.value = ''
  importStatusChoice.value = null
  preview.value = null
  picks.value = {}
  allowSkipUnmatched.value = false
  importResult.value = null
}

async function doPreview() {
  const text = importText.value.trim()
  if (!text) {
    ElMessage.warning('请先粘贴名单')
    return
  }
  previewLoading.value = true
  try {
    const res = await adminApi.checkinImportPreview({
      date: importDate.value,
      // 匹配池跟随当前页面的部门范围
      deptId: deptId.value,
      text,
      defaultStatus: importStatusChoice.value,
      source: 1
    })
    if (!res) return
    if (!res.summary || !res.summary.total) {
      ElMessage.warning('没有识别到姓名或学号，请检查名单格式')
      return
    }
    preview.value = res
    importStep.value = 'preview'
  } catch (e) {
    ElMessage.error(e?.message || '解析失败')
  } finally {
    previewLoading.value = false
  }
}

// 用户选择「已打卡 / 未打卡名单」后重新解析
function rePreview() {
  if (importStatusChoice.value === null) return
  doPreview()
}

function buildPicks() {
  const dups = preview.value?.duplicates || []
  return dups
    .map(dup => {
      const userId = picks.value[dupKey(dup)]
      return userId === null || userId === undefined
        ? null
        : { token: dup.token, deptName: dup.deptName, targetStatus: dup.targetStatus, userId }
    })
    .filter(Boolean)
}

async function doCommit() {
  commitLoading.value = true
  try {
    const res = await adminApi.checkinImportCommit({
      date: importDate.value,
      deptId: deptId.value,
      text: importText.value.trim(),
      defaultStatus: importStatusChoice.value,
      source: 1,
      allowSkipUnmatched: allowSkipUnmatched.value,
      picks: buildPicks()
    })
    if (!res) return
    importResult.value = res
    importStep.value = 'result'
    ElMessage.success(`导入完成：新增 ${res.created} 条，更新 ${res.updated} 条，跳过 ${res.skipped} 条`)
    // 日期一致时刷新列表，让导入结果立即可见
    if (date.value === res.date) loadData()
  } catch (e) {
    ElMessage.error(e?.message || '导入失败')
  } finally {
    commitLoading.value = false
  }
}

async function doRevoke() {
  if (!importResult.value?.importId) return
  try {
    await ElMessageBox.confirm(
      '撤销会按导入前的状态回滚这批记录；如果导入后有人被手工修改过，将整批拒绝撤销。确定撤销？',
      '撤销本次导入',
      { type: 'warning', confirmButtonText: '撤销', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  revokeLoading.value = true
  try {
    const res = await adminApi.checkinImportRevoke(importResult.value.importId)
    if (!res) return
    ElMessage.success(`已撤销：删除 ${res.deleted} 条，还原 ${res.restored} 条`)
    importVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e?.message || '撤销失败')
  } finally {
    revokeLoading.value = false
  }
}

function closeImport() {
  importVisible.value = false
  loadData()
}

// 导入完成后手动触发：把该部门名单外的未标记人员补标为已打卡
async function markUnmarkedAfterImport() {
  await runMarkAllUnmarked({ markDate: importDate.value, markDeptId: deptId.value })
}

onMounted(() => {
  // 非综合部部长没有本页权限，统一跳到只读的「打卡情况」页
  if (!canManageAllDepts.value) {
    ElMessage.warning('打卡管理仅综合部可用')
    router.replace('/admin/checkin-status')
    return
  }
  loadData()
})
</script>

<style scoped>
.manager-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  border-bottom: 1px solid var(--border, #eee);
  font-size: 13px;
}

/* ===== 名单导入弹窗 ===== */
.import-field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0;
  flex-wrap: wrap;
  font-size: 13px;
}

.import-field.column {
  flex-direction: column;
  align-items: stretch;
}

.import-scope {
  font-size: 12px;
}

.import-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.import-block {
  margin-bottom: 14px;
}

.import-block-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.import-line {
  font-size: 13px;
  line-height: 1.7;
}

.duplicate-row {
  padding: 8px 0;
  border-bottom: 1px dashed var(--border, #eee);
}

.duplicate-head {
  font-size: 13px;
  margin-bottom: 6px;
}

.unmatched-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  background: #fff6f6;
  font-size: 13px;
  flex-wrap: wrap;
}

.unmatched-token {
  font-weight: 600;
  color: #c45656;
}

.matched-table {
  max-height: 220px;
  overflow: auto;
}

.matched-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 4px;
  border-bottom: 1px solid var(--border, #f0f0f0);
  font-size: 13px;
  flex-wrap: wrap;
}

.import-result {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 14px;
}

/* ===== 批量标记 ===== */
.checkin-table-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 16px 0;
  padding: 10px 12px;
  border: 1px solid var(--border, #e4e7ed);
  border-radius: 6px;
  background: #f8fafc;
}

.batch-bar-text {
  font-size: 13px;
  font-weight: 600;
}

.batch-bar-reason,
.batch-hint-inline {
  font-size: 12px;
}

.import-followup {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px dashed var(--border, #e4e7ed);
}

.import-followup-desc {
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 10px;
  display: block;
}

/* 窄屏：筛选条件纵向堆叠，避免工具栏横向溢出 */
@media (max-width: 768px) {
  .checkin-toolbar { flex-wrap: wrap; align-items: flex-start; gap: 10px; }
  .checkin-filters { flex-wrap: wrap; width: 100%; gap: 10px 16px !important; }
  .checkin-filters > div { flex: 1 1 100%; }
  .checkin-actions { width: 100%; justify-content: flex-start; }
  .batch-bar { margin: 10px 12px 0; gap: 8px; }
  .batch-bar-text { flex: 1 1 100%; }
  .batch-bar-reason, .batch-hint-inline { flex: 1 1 100%; line-height: 1.6; }
  .manager-row { flex-wrap: wrap; gap: 6px; }
  .import-field { flex-wrap: wrap; }
  .matched-row, .unmatched-row { gap: 6px; }
}
</style>
