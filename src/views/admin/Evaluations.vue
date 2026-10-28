<template>
  <div v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2>考评管理</h2>
        <p class="muted">共 {{ list.length }} 条考评记录 · 已按总分从高到低排序</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="pill" @click="openExtra" style="padding: 10px 20px;">
          <el-icon style="margin-right: 4px;"><Aim /></el-icon> 额外加分
        </button>
        <button class="pill active" @click="openCreate" style="padding: 10px 20px;">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发起月度考评
        </button>
      </div>
    </div>

    <!-- 按月份分类展示 -->
    <div class="month-list">
      <el-collapse v-model="activeMonths" class="custom-collapse">
        <el-collapse-item v-for="month in groupedMonths" :key="month" :name="month">
          <template #title>
            <div class="month-title-bar">
              <div class="month-title">
                <span class="tag-soft" style="font-size: 14px; padding: 4px 12px;">{{ month }}</span>
                <span style="font-weight: 600; font-size: 16px; margin-left: 12px;">月度考评汇总</span>
              </div>
              <div class="month-meta">
                <span class="muted"><el-icon><User /></el-icon> {{ groupedList[month].length }} 人已评估</span>
              </div>
            </div>
          </template>

          <div class="table-wrapper">
            <el-table :data="monthRows(month)" stripe style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: '600' }">
              <el-table-column type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <span class="rank-num" :class="{ 'top-3': $index < 3 }">{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="deptId" label="所属部门" width="120">
                <template #default="{ row }"><span class="dept-label">{{ getDeptLabel(row.deptId) }}</span></template>
              </el-table-column>
              <el-table-column prop="member" label="考评对象" width="120">
                <template #default="{ row }"><div style="font-weight: 500;">{{ row.member }}</div></template>
              </el-table-column>

              <el-table-column prop="autoScore" label="自动得分" width="110" align="center">
                <template #default="{ row }"><span class="score-auto">{{ row.autoScore }}</span></template>
              </el-table-column>
              <el-table-column prop="manualScore" label="手动附加分" width="110" align="center">
                <template #default="{ row }"><span class="score-manual">+{{ row.manualScore }}</span></template>
              </el-table-column>
              <el-table-column prop="total" label="综合总分" width="120" align="center" sortable>
                <template #default="{ row }"><span class="score-total">{{ row.total }}</span></template>
              </el-table-column>

              <el-table-column prop="level" label="评定等级" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getEvalLevelType(row.level)" size="small" effect="dark" round>
                    {{ getEvalLevelLabel(row.level) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="操作" min-width="120" align="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDetail(row)">
                    <el-icon><Document /></el-icon> 查看明细
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 长期累积后单月记录也可能很多，按月分页渲染 -->
            <div v-if="groupedList[month].length > PAGE_SIZE" class="table-pagination">
              <el-pagination
                v-model:current-page="monthPage[month]"
                :page-size="PAGE_SIZE"
                :total="groupedList[month].length"
                layout="total, prev, pager, next"
                background
              />
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 发起考评弹窗 -->
    <el-dialog v-model="createVisible" title="发起月度考评" width="950px" :close-on-click-modal="false">
      <el-form label-width="100px" style="margin-bottom: 20px;">
        <el-form-item label="考评月份">
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" placeholder="选择月份" @change="loadPreview" />
        </el-form-item>
        <el-form-item label="考评对象">
          <div style="width: 100%; background: #fafbfc; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
            <el-checkbox-group v-model="form.selectedMembers" @change="loadPreview">
              <el-checkbox v-for="m in candidates" :key="m.name" :label="m.name" border size="small" style="margin-bottom: 8px;">
                {{ m.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>

      <div class="flex-between" style="margin-bottom: 8px;">
        <b>分数预览与评定</b>
        <span class="muted" style="font-size: 12px; color: var(--accent);">
          💡 提示：修改手动分后，点击「当前总分」表头即可自动按高分到低分重新排序
        </span>
      </div>

      <!-- 发起考评的预览表格 -->
      <el-table
          :data="previewList"
          border
          size="small"
          v-loading="previewLoading"
          max-height="400"
          :header-cell-style="{ background: '#f8fafc' }"
          :default-sort="{ prop: 'currentTotal', order: 'descending' }"
      >
        <el-table-column prop="name" label="姓名" width="90" fixed="left" />

        <el-table-column label="基础自动分" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip content="根据本月打卡、会议、任务参与自动计算" placement="top">
              <span style="font-weight: 600; color: var(--brand); cursor: pointer;">{{ row.autoScore }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="任务附加分" width="110" align="center">
          <template #default="{ row }"><span style="color: var(--accent);">+{{ row.taskExtraScore }}</span></template>
        </el-table-column>

        <el-table-column label="手动附加分" width="130" align="center">
          <template #default="{ row }">
            <el-input-number
                v-model="row.manualScore"
                :min="0"
                :step="0.5"
                size="small"
                style="width: 90px;"
                @change="handleScoreChange(row)"
            />
          </template>
        </el-table-column>

        <!-- 👇 真实绑定 currentTotal 属性，并且支持排序 -->
        <el-table-column
            prop="currentTotal"
            label="当前总分"
            width="110"
            align="center"
            sortable
        >
          <template #default="{ row }">
            <span style="font-weight: 700; color: var(--brand-deep); font-size: 15px;">{{ row.currentTotal }}</span>
          </template>
        </el-table-column>

        <el-table-column label="评定等级" width="120" align="center">
          <template #default="{ row }">
            <el-select v-model="row.level" size="small" placeholder="请选择">
              <el-option v-for="l in EVAL_LEVEL_OPTIONS" :key="l.value" :label="l.label" :value="l.value" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="加分理由" min-width="160">
          <template #default="{ row }"><el-input v-model="row.reason" placeholder="如：全勤奖励" size="small" /></template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="flex-between">
          <span class="muted">提示：提交后将直接入库并通知成员</span>
          <div>
            <el-button @click="createVisible = false">取消</el-button>
            <el-button type="primary" :loading="saving" @click="submitEvaluation">确认发起考评</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 考评明细弹窗 -->
    <el-dialog v-model="detailVisible" :title="`${currentEval?.member} · ${currentEval?.month} 考评明细`" width="600px">
      <div v-if="currentEval" v-loading="detailLoading">
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="stat-card">
            <div class="muted">自动得分</div>
            <div class="num" style="color: var(--brand);">{{ currentEval.autoScore }}</div>
          </div>
          <div class="stat-card">
            <div class="muted">手动附加分</div>
            <div class="num" style="color: var(--accent);">{{ currentEval.manualScore }}</div>
          </div>
          <div class="stat-card total-card">
            <div class="muted">综合总分 ({{ getEvalLevelLabel(currentEval.level) }})</div>
            <div class="num" style="color: #fff;">{{ currentEval.total }}</div>
          </div>
        </div>

        <div class="sec-title" style="font-size: 14px;">打卡明细</div>
        <div v-if="detailData.checkinList?.length" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          <el-tag v-for="c in detailData.checkinList" :key="c.date" :type="getCheckinStatusType(c.status)" size="small" effect="plain">
            {{ c.date }} {{ getCheckinStatusLabel(c.status) }}
          </el-tag>
        </div>
        <div v-else class="muted" style="margin-bottom: 16px; background: #f8fafc; padding: 10px 12px; border-radius: 8px;">
          本月暂无打卡流水；考评快照记录打卡 {{ detailData.details?.checkinDays || 0 }} 天（{{ detailData.details?.checkinScore || 0 }} 分）
        </div>

        <div class="sec-title" style="font-size: 14px;">任务参与及加分</div>
        <div v-for="t in detailData.taskList" :key="t.title" class="flex-between" style="padding: 10px 0; border-bottom: 1px dashed var(--border);">
          <div>
            <span style="font-weight: 500;">{{ t.title }}</span>
            <el-tag v-if="t.extraScore" type="warning" size="small" style="margin-left: 8px;">任务分 +{{ t.extraScore }}</el-tag>
          </div>
          <span class="muted">{{ t.role }}</span>
        </div>
        <el-empty v-if="!detailData.taskList?.length" description="本月暂无任务记录" :image-size="50" />

        <div class="sec-title" style="font-size: 14px;">手动评分备注</div>
        <div class="muted" style="background: #f8fafc; padding: 12px; border-radius: 8px;">{{ currentEval.details?.extraNote || '无' }}</div>
      </div>
    </el-dialog>

    <!-- 额外加分弹窗（可多次） -->
    <el-dialog v-model="extraVisible" title="多次额外加分" width="720px" :close-on-click-modal="false">
      <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px;">
        <el-form-item label="归属月份" style="margin-bottom: 0;">
          <el-date-picker v-model="extraForm.month" type="month" value-format="YYYY-MM" size="small" placeholder="选择月份" @change="loadExtraRecords" />
        </el-form-item>
        <el-form-item label="加分成员" style="margin-bottom: 0; min-width: 180px;">
          <el-select v-model="extraForm.userId" filterable size="small" placeholder="选择成员" style="width: 170px;" @change="loadExtraRecords">
            <el-option v-for="m in extraMembers" :key="m.userId ?? m.id" :label="m.name" :value="m.userId ?? m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="加分数值" style="margin-bottom: 0;">
          <el-input-number v-model="extraForm.score" :min="0" :step="0.5" :precision="1" size="small" style="width: 110px;" />
        </el-form-item>
        <el-form-item label="加分备注" style="margin-bottom: 0; flex: 1; min-width: 180px;">
          <el-input v-model="extraForm.remark" size="small" placeholder="如：全勤奖励 / 特别贡献" />
        </el-form-item>
        <el-button type="primary" size="small" :loading="extraSaving" @click="submitExtra">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon> 添加加分
        </el-button>
      </div>

      <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">历史加分记录</div>
      <el-table :data="extraRecords" stripe size="small" v-loading="extraLoading" :header-cell-style="{ background: '#f8fafc' }">
        <el-table-column prop="month" label="月份" width="80" align="center" />
        <el-table-column prop="name" label="成员" width="110" />
        <el-table-column prop="itemName" label="加分项" min-width="120" />
        <el-table-column prop="score" label="分值" width="90" align="center">
          <template #default="{ row }"><span style="color: var(--accent); font-weight: 600;">+{{ row.score }}</span></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="130" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="removeExtra(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!extraRecords.length && !extraLoading" description="该成员本月暂无额外加分记录" :image-size="60" style="padding: 20px 0;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, User, Aim } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import {
  ALL_DEPT_ID,
  EVAL_LEVEL_OPTIONS,
  ROLE,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getDeptLabel,
  getEvalLevelLabel,
  getEvalLevelType
} from '@/utils/dict'

import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading(), saving = ref(false), detailLoading = ref(false), previewLoading = ref(false)
const list = ref([])
const activeMonths = ref([])
const createVisible = ref(false)
const candidates = ref([])
const form = reactive({ month: '', selectedMembers: [] })
const previewList = ref([])
const detailVisible = ref(false)
const currentEval = ref(null)
const detailData = ref({ checkinList: [], taskList: [] })

// 额外加分状态
const extraVisible = ref(false)
const extraLoading = ref(false)
const extraSaving = ref(false)
const extraMembers = ref([])
const extraRecords = ref([])
const extraForm = reactive({ month: '', userId: null, score: 0.5, remark: '' })

const groupedList = computed(() => {
  const groups = {}
  list.value.forEach(item => {
    if (!groups[item.month]) groups[item.month] = []
    groups[item.month].push(item)
  })
  Object.keys(groups).forEach(month => {
    groups[month].sort((a, b) => b.total - a.total)
  })
  return groups
})

const groupedMonths = computed(() => Object.keys(groupedList.value).sort().reverse())

// 按月分页：考评是长期累积数据，单月人数也可能超过一屏
const PAGE_SIZE = 10
const monthPage = reactive({})

function monthRows(month) {
  const rows = groupedList.value[month] || []
  const page = Number(monthPage[month]) || 1
  return rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
}

async function load() {
  loading.value = true
  try {
    const res = await adminApi.evaluations(userStore.viewDeptId)
    list.value = res || []
    if (groupedMonths.value.length > 0 && activeMonths.value.length === 0) {
      activeMonths.value = [groupedMonths.value[0]]
    }
    groupedMonths.value.forEach(month => {
      if (!monthPage[month]) monthPage[month] = 1
    })
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  form.month = new Date().toISOString().slice(0, 7)
  if (userStore.isDirector) {
    // 主任评部长
    const res = await adminApi.members({ deptId: ALL_DEPT_ID, pageNum: 1, pageSize: 9999 })
    const allMembers = res?.rows || []
    candidates.value = allMembers.filter(m => Number(m.role) === ROLE.MINISTER)
  } else {
    // 部长评本部门部员
    const res2 = await adminApi.members({ deptId: userStore.deptId, pageNum: 1, pageSize: 9999 })
    const deptMembers = res2?.rows || []
    candidates.value = deptMembers.filter(m => Number(m.role) === ROLE.MEMBER)
  }
  form.selectedMembers = candidates.value.map(m => m.name)
  createVisible.value = true
  loadPreview()
}

async function loadPreview() {
  if (form.selectedMembers.length === 0) {
    previewList.value = []
    return
  }
  previewLoading.value = true
  try {
    const res = await adminApi.previewEvaluation(form.month, form.selectedMembers)
    // 初始化当前总分，便于排序与手动分联动
    previewList.value = (res || []).map(row => ({
      ...row,
      currentTotal: Number(row.autoScore || 0) + Number(row.taskExtraScore || 0) + Number(row.manualScore || 0)
    }))
  } catch (e) {
    console.error('获取考评预览失败', e)
  } finally {
    previewLoading.value = false
  }
}

// 👇 每次修改输入框，立刻同步计算 currentTotal
function handleScoreChange(row) {
  row.currentTotal = Number(row.autoScore || 0) + Number(row.taskExtraScore || 0) + Number(row.manualScore || 0)
}

async function submitEvaluation() {
  if (!form.month) return ElMessage.warning('请选择月份')
  if (form.selectedMembers.length === 0 || previewList.value.length === 0) {
    return ElMessage.warning('请选择考评对象')
  }
  if (previewLoading.value) return ElMessage.warning('评分预览生成中，请稍候')

  // 预览接口是异步的，快速点击「确认」时可能还没对齐所选成员，提交前做一次一致性校验
  const selected = [...form.selectedMembers].sort()
  const previewed = previewList.value.map(row => row.name).sort()
  const sameSet = selected.length === previewed.length &&
      selected.every((name, index) => name === previewed[index])
  if (!sameSet) {
    await loadPreview()
    return ElMessage.warning('评分预览已更新，请核对后再提交')
  }

  try {
    // 使用 VNode 渲染确认内容，避免 dangerouslyUseHTMLString 带来的 XSS 风险
    await ElMessageBox.confirm(
        h('div', { style: 'line-height: 1.8' }, [
          h('p', `即将对 ${form.month} 的 ${previewList.value.length} 名成员正式发起考评。`),
          h('p', { style: 'color: #f56c6c; font-size: 13px; margin-top: 8px' },
              '⚠️ 提交后结果将直接入库并通知成员，不可再修改。')
        ]),
        '最终确认',
        {
          confirmButtonText: '确认无误，正式发起',
          cancelButtonText: '返回检查',
          type: 'warning'
        }
    )

    saving.value = true
    const submitData = {
      month: form.month,
      deptId: userStore.viewDeptId,
      members: previewList.value.map(row => ({
        name: row.name,
        deptId: row.deptId,
        // autoScore 只含基础自动分，任务附加分单独传递；入库口径以服务端明细为准
        autoScore: row.autoScore,
        taskExtraScore: row.taskExtraScore,
        manualScore: row.manualScore,
        level: Number(row.level),
        extraNote: row.reason
      }))
    }

    await adminApi.createEvaluation(submitData)
    ElMessage.success('考评已发起')
    createVisible.value = false
    load()

  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('发起考评失败')
  } finally {
    saving.value = false
  }
}

async function viewDetail(row) {
  currentEval.value = row
  detailVisible.value = true
  detailLoading.value = true
  try {
    detailData.value = await adminApi.memberEvalDetail(row.member, row.month, row.deptId)
  } finally {
    detailLoading.value = false
  }
}

// 额外加分：打开弹窗并加载可加分成员
async function openExtra() {
  extraForm.month = new Date().toISOString().slice(0, 7)
  extraForm.userId = null
  extraForm.score = 0.5
  extraForm.remark = ''
  // 主任评部长等下属，部长评本部门；复用以成员接口为数据源
  const deptId = userStore.isDirector ? userStore.viewDeptId : userStore.deptId
  const res = await adminApi.members({ deptId, pageNum: 1, pageSize: 9999 })
  extraMembers.value = res?.rows || []
  extraRecords.value = []
  extraVisible.value = true
}

// 拉取当前成员的加分历史（按成员+月份过滤）
async function loadExtraRecords() {
  extraRecords.value = []
  if (!extraForm.userId) return
  extraLoading.value = true
  try {
    const res = await adminApi.evalEvents(extraForm.userId, extraForm.month)
    extraRecords.value = res || []
  } finally {
    extraLoading.value = false
  }
}

// 添加一条额外加分
async function submitExtra() {
  if (!extraForm.userId) return ElMessage.warning('请选择加分成员')
  if (extraForm.score === null || extraForm.score === undefined || extraForm.score === 0) {
    return ElMessage.warning('请输入加分数值')
  }
  extraSaving.value = true
  try {
    await adminApi.addEvalEvent({
      userId: extraForm.userId,
      deptId: userStore.isDirector ? userStore.viewDeptId : userStore.deptId,
      month: extraForm.month,
      score: extraForm.score,
      remark: extraForm.remark
    })
    ElMessage.success('已添加加分')
    await loadExtraRecords()
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    extraSaving.value = false
  }
}

// 删除一条额外加分
async function removeExtra(row) {
  await ElMessageBox.confirm(`确认删除 ${row.name} 的「${row.itemName}」+${row.score} 分记录？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  try {
    await adminApi.deleteEvalEvent(row.id)
    ElMessage.success('已删除')
    await loadExtraRecords()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
/* 省略之前相同的样式（你可以保留你原来的 CSS 部分） */
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.5px; }
.page-header p { margin: 0; }
.month-list { display: flex; flex-direction: column; gap: 16px; }
:deep(.custom-collapse) { border: none; background: transparent; }
:deep(.custom-collapse .el-collapse-item) { background: #fff; border-radius: 14px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 16px; }
:deep(.custom-collapse .el-collapse-item__header) { border-bottom: 1px solid transparent; padding: 0 24px; height: 64px; background: #fff; transition: all 0.2s; }
:deep(.custom-collapse .el-collapse-item__header:hover) { background: #fafbfc; }
:deep(.custom-collapse .el-collapse-item__wrap) { border-bottom: none; background: #fff; }
:deep(.custom-collapse .el-collapse-item__content) { padding: 0; }
.month-title-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.month-title { display: flex; align-items: center; gap: 12px; }
.month-meta { display: flex; align-items: center; gap: 16px; font-size: 13px; }
.table-wrapper { padding: 0; border-top: 1px solid var(--border); }
.rank-num { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9; color: #64748b; font-weight: 600; font-size: 12px; }
.rank-num.top-3 { background: #fdf3d8; color: #b8860b; box-shadow: 0 2px 6px rgba(184, 134, 11, 0.2); }
.dept-label { display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #64748b; border-radius: 6px; font-size: 12px; }
.score-auto { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 28px; background: var(--brand-soft); color: var(--brand); border-radius: 6px; font-weight: 600; }
.score-manual { color: var(--accent); font-weight: 500; }
.score-total { font-size: 18px; font-weight: 700; color: var(--brand-deep); }
.stat-card { flex: 1; background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
.stat-card .num { font-size: 28px; font-weight: 700; margin-top: 8px; }
.stat-card.total-card { background: linear-gradient(135deg, var(--brand), #4a86b8); border: none; }
.stat-card.total-card .muted { color: rgba(255,255,255,0.8); }
</style>