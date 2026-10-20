<template>
  <div v-loading="loading">
    <!-- 顶部工具栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2>考评管理</h2>
        <p class="muted">共 {{ list.length }} 条考评记录 · 已按总分从高到低排序</p>
      </div>
      <button class="pill active" @click="openCreate" style="padding: 10px 20px;">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发起月度考评
      </button>
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
            <el-table :data="groupedList[month]" stripe style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: '600' }">
              <el-table-column type="index" label="排名" width="70" align="center">
                <template #default="{ $index }">
                  <span class="rank-num" :class="{ 'top-3': $index < 3 }">{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="dept" label="所属部门" width="120">
                <template #default="{ row }"><span class="dept-label">{{ row.dept }}</span></template>
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
                  <el-tag :type="getLevelType(row.level)" size="small" effect="dark" round>
                    {{ row.level || '未评级' }}
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
              <el-option label="优秀" value="优秀" />
              <el-option label="良好" value="良好" />
              <el-option label="合格" value="合格" />
              <el-option label="不合格" value="不合格" />
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
            <div class="muted">综合总分 ({{ currentEval.level }})</div>
            <div class="num" style="color: #fff;">{{ currentEval.total }}</div>
          </div>
        </div>

        <div class="sec-title" style="font-size: 14px;">打卡明细</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          <el-tag v-for="c in detailData.checkinList" :key="c.date" :type="c.status === '已打卡' ? 'success' : 'danger'" size="small" effect="plain">
            {{ c.date }} {{ c.status }}
          </el-tag>
        </div>

        <div class="sec-title" style="font-size: 14px;">任务参与及加分</div>
        <div v-for="t in detailData.taskList" :key="t.title" class="flex-between" style="padding: 10px 0; border-bottom: 1px dashed var(--border);">
          <div>
            <span style="font-weight: 500;">{{ t.title }}</span>
            <el-tag v-if="t.extraScore" type="warning" size="small" style="margin-left: 8px;">任务分 +{{ t.extraScore }}</el-tag>
          </div>
          <span class="muted">{{ t.role }}</span>
        </div>

        <div class="sec-title" style="font-size: 14px;">手动评分备注</div>
        <div class="muted" style="background: #f8fafc; padding: 12px; border-radius: 8px;">{{ currentEval.details.extraNote || '无' }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, User } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'

const loading = ref(false), saving = ref(false), detailLoading = ref(false), previewLoading = ref(false)
const list = ref([])
const activeMonths = ref([])
const createVisible = ref(false)
const candidates = ref([])
const form = reactive({ month: '', selectedMembers: [] })
const previewList = ref([])
const detailVisible = ref(false)
const currentEval = ref(null)
const detailData = ref({ checkinList: [], taskList: [] })

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

const getLevelType = (level) => {
  const map = { '优秀': 'danger', '良好': 'warning', '合格': 'primary', '不合格': 'info' }
  return map[level] || 'info'
}

async function load() {
  loading.value = true
  try {
    const res = await adminApi.evaluations(userStore.isDirector ? '' : userStore.dept)
    list.value = res || []
    if (groupedMonths.value.length > 0 && activeMonths.value.length === 0) {
      activeMonths.value = [groupedMonths.value[0]]
    }
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  form.month = new Date().toISOString().slice(0, 7)
  if (userStore.isDirector) {
    const allMembers = await adminApi.members('')
    candidates.value = allMembers.filter(m => m.title.includes('部长'))
  } else {
    const deptMembers = await adminApi.members(userStore.dept)
    candidates.value = deptMembers.filter(m => !m.title.includes('部长'))
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
    // 👇 替换为真实的接口调用，不再用 Math.random()
    previewList.value = await adminApi.previewEvaluation(form.month, form.selectedMembers)
  } catch (e) {
    console.error('获取考评预览失败', e)
  } finally {
    previewLoading.value = false
  }
}

// 👇 每次修改输入框，立刻同步计算 currentTotal
function handleScoreChange(row) {
  row.currentTotal = row.autoScore + row.taskExtraScore + row.manualScore
}

async function submitEvaluation() {
  if (!form.month) return ElMessage.warning('请选择月份')
  if (previewList.value.length === 0) return ElMessage.warning('请选择考评对象')

  try {
    await ElMessageBox.confirm(
        `<div style="line-height: 1.8;">
        <p>即将对 <b>${form.month}</b> 的 <b>${previewList.value.length}</b> 名成员正式发起考评。</p>
        <p style="color: #f56c6c; font-size: 13px; margin-top: 8px;">⚠️ 提交后结果将直接入库并通知成员，不可再修改。</p>
      </div>`,
        '最终确认',
        {
          confirmButtonText: '确认无误，正式发起',
          cancelButtonText: '返回检查',
          type: 'warning',
          dangerouslyUseHTMLString: true,
        }
    )

    saving.value = true
    const submitData = {
      month: form.month,
      members: previewList.value.map(row => ({
        name: row.name,
        dept: row.dept,
        autoScore: row.autoScore + row.taskExtraScore,
        manualScore: row.manualScore,
        level: row.level,
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
    detailData.value = await adminApi.memberEvalDetail(row.member, row.month)
  } finally {
    detailLoading.value = false
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