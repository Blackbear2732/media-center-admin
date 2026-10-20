<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:16px;">
      <div class="muted">共 {{ list.length }} 条考评记录</div>
      <button class="pill active" @click="openCreate">+ 发起月度考评</button>
    </div>

    <!-- 按月份分类展示 -->
    <el-collapse v-model="activeMonths">
      <el-collapse-item v-for="month in groupedMonths" :key="month" :name="month">
        <template #title>
          <div class="flex-between" style="width: 100%; padding-right: 20px;">
            <span style="font-weight: 600; font-size: 15px;">{{ month }} 月度考评</span>
            <span class="muted" style="font-size: 12px;">{{ groupedList[month].length }} 人已考评</span>
          </div>
        </template>

        <el-table :data="groupedList[month]" stripe>
          <el-table-column prop="dept" label="部门" width="100" />
          <el-table-column prop="member" label="考评对象" width="120" />
          <el-table-column prop="autoScore" label="自动得分" width="120">
            <template #default="{ row }"><span style="color: var(--brand); font-weight: 600;">{{ row.autoScore }}</span></template>
          </el-table-column>
          <el-table-column prop="manualScore" label="手动附加分" width="120" />
          <el-table-column prop="total" label="总分" width="100">
            <template #default="{ row }"><span style="color: var(--accent); font-weight: 700; font-size: 16px;">{{ row.total }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetail(row)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>

    <el-empty v-if="list.length === 0" description="暂无考评记录" />

    <!-- 发起考评弹窗 -->
    <el-dialog v-model="createVisible" title="发起月度考评" width="800px" :close-on-click-modal="false">
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

      <!-- 单人算分明细列表 -->
      <el-table :data="previewList" border size="small" v-loading="previewLoading" max-height="400">
        <el-table-column prop="name" label="姓名" width="100" fixed="left" />

        <el-table-column label="基础自动分 (打卡/任务/会议)" width="200">
          <template #default="{ row }">
            <el-tooltip content="系统根据本月打卡、会议、任务参与自动计算" placement="top">
              <span style="font-weight: 600; color: var(--brand);">{{ row.autoScore }} 分</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="任务附加分" width="120">
          <template #default="{ row }">
            <span style="color: var(--accent);">+{{ row.taskExtraScore }} 分</span>
          </template>
        </el-table-column>

        <el-table-column label="手动附加分 (可编辑)" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.manualScore" :min="0" :step="0.5" size="small" style="width: 100px;" />
          </template>
        </el-table-column>

        <el-table-column label="手动加分理由" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.reason" placeholder="如：全勤奖励" size="small" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="flex-between">
          <span class="muted">提示：会自动汇总每个人本月的任务附加分</span>
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
          <div class="surface-card" style="flex:1; padding: 16px; text-align: center;">
            <div class="muted">自动得分</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--brand);">{{ currentEval.autoScore }}</div>
          </div>
          <div class="surface-card" style="flex:1; padding: 16px; text-align: center;">
            <div class="muted">手动附加分</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--accent);">{{ currentEval.manualScore }}</div>
          </div>
          <div class="surface-card" style="flex:1; padding: 16px; text-align: center; background: var(--brand-soft);">
            <div class="muted">总分</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--brand);">{{ currentEval.total }}</div>
          </div>
        </div>

        <div class="sec-title" style="font-size: 14px;">打卡明细</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          <el-tag v-for="c in detailData.checkinList" :key="c.date" :type="c.status === '已打卡' ? 'success' : 'danger'" size="small">
            {{ c.date }} {{ c.status }}
          </el-tag>
        </div>

        <div class="sec-title" style="font-size: 14px;">任务参与及加分</div>
        <div v-for="t in detailData.taskList" :key="t.title" class="flex-between" style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
          <div>
            <span>{{ t.title }}</span>
            <span v-if="t.extraScore" class="muted" style="margin-left: 8px;">(任务附加分：+{{ t.extraScore }})</span>
          </div>
          <span class="muted">{{ t.role }}</span>
        </div>

        <div class="sec-title" style="font-size: 14px;">手动评分备注</div>
        <div class="muted">{{ currentEval.details.extraNote || '无' }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'

const loading = ref(false), saving = ref(false), detailLoading = ref(false), previewLoading = ref(false)
const list = ref([])
const activeMonths = ref([])

const createVisible = ref(false)
const candidates = ref([])
const form = reactive({
  month: '',
  selectedMembers: []
})

// 预览数据
const previewList = ref([])

// 明细数据
const detailVisible = ref(false)
const currentEval = ref(null)
const detailData = ref({ checkinList: [], taskList: [] })

const groupedList = computed(() => {
  const groups = {}
  list.value.forEach(item => {
    if (!groups[item.month]) groups[item.month] = []
    groups[item.month].push(item)
  })
  return groups
})

const groupedMonths = computed(() => Object.keys(groupedList.value).sort().reverse())

async function load() {
  loading.value = true
  try {
    const res = await adminApi.evaluations(userStore.isDirector ? '' : userStore.dept)
    list.value = res || []
    if (groupedMonths.value.length > 0) {
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

  // 默认全选
  form.selectedMembers = candidates.value.map(m => m.name)
  createVisible.value = true
  loadPreview()
}

// 加载预览数据
async function loadPreview() {
  if (form.selectedMembers.length === 0) {
    previewList.value = []
    return
  }
  previewLoading.value = true
  try {
    // 真实场景下，这里应该去请求后端：POST /api/admin/evaluations/preview
    // 后端根据月份和选中的姓名，把打卡、任务次数查出来。
    // 这里我们 Mock 一份数据：
    previewList.value = form.selectedMembers.map(name => {
      const memberInfo = candidates.value.find(m => m.name === name)
      // 模拟随机的基础分 (打卡+会议+基本任务)
      const autoScore = Math.floor(Math.random() * 8) + 6 // 6~13分
      // 模拟这个人本月的任务附加分（真实场景是去查 task_participant 表里的 extra_score 汇总）
      const taskExtraScore = Math.random() > 0.5 ? 2 : 0

      return {
        name,
        dept: memberInfo?.dept,
        autoScore,
        taskExtraScore, // 任务里加的分
        manualScore: 0, // 默认0，等待输入
        reason: ''
      }
    })
  } finally {
    previewLoading.value = false
  }
}

async function submitEvaluation() {
  if (!form.month) return ElMessage.warning('请选择月份')
  if (previewList.value.length === 0) return ElMessage.warning('请选择考评对象')

  saving.value = true
  try {
    const submitData = {
      month: form.month,
      members: previewList.value.map(row => {
        // 总分 = 基础自动分 + 任务附加分 + 手动附加分
        const finalAutoScore = row.autoScore + row.taskExtraScore

        return {
          name: row.name,
          dept: row.dept,
          autoScore: finalAutoScore,
          manualScore: row.manualScore,
          extraNote: row.reason
        }
      })
    }

    await adminApi.createEvaluation(submitData)
    ElMessage.success('考评已发起')
    createVisible.value = false
    load()
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