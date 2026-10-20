<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:16px;">
      <div class="muted">共 {{ list.length }} 条考评记录</div>
      <button class="pill active" @click="openCreate">+ 发起月度考评</button>
    </div>

    <!-- 按月份分类折叠展示 -->
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
          <el-table-column prop="autoScore" label="系统自动分" width="120">
            <template #default="{ row }">
              <span style="color: var(--brand); font-weight: 600;">{{ row.autoScore }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="manualScore" label="手动附加分" width="120" />
          <el-table-column prop="total" label="总分" width="100">
            <template #default="{ row }">
              <span style="color: var(--accent); font-weight: 700; font-size: 16px;">{{ row.total }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default><el-tag type="success" size="small">已完成</el-tag></template>
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
    <el-dialog v-model="createVisible" title="发起月度考评" width="760px">
      <el-form label-width="100px">
        <el-form-item label="考评月份">
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" placeholder="选择月份" />
        </el-form-item>

        <el-form-item label="考评对象">
          <div style="width: 100%; background: #fafbfc; padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
            <div class="muted" style="margin-bottom: 8px;">默认选中：{{ userStore.isDirector ? '全体部长' : '本部门全体部员' }}</div>
            <el-checkbox-group v-model="form.selectedMembers">
              <el-checkbox v-for="m in candidates" :key="m.name" :label="m.name" border size="small" style="margin-bottom: 8px;">
                {{ m.name }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>
      </el-form>

      <div class="flex-between" style="margin:10px 0;">
        <b>考评项及算分规则</b>
        <span class="muted" style="font-size:12px;">系统已根据打卡、任务记录自动计算基础分</span>
      </div>

      <el-table :data="template" size="small" border>
        <el-table-column prop="name" label="考评项" width="160" />
        <el-table-column prop="desc" label="算分规则" min-width="200" />
        <el-table-column label="计分类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'auto' ? 'info' : 'warning'" size="small">
              {{ row.type === 'auto' ? '自动' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 这里为了演示，直接给所有人填一个统一的手动分。真实情况应该是列表里一人一行去填 -->
      <div style="margin-top: 16px; background: #fdf1e6; padding: 16px; border-radius: 8px;">
        <div style="font-weight: 600; margin-bottom: 8px;">给本次选中的所有人员附加手动分</div>
        <el-input-number v-model="form.commonManualScore" :min="0" :step="0.5" />
        <el-input v-model="form.commonNote" placeholder="手动加分明细（如：全勤奖励）" style="width: 300px; margin-left: 12px;" />
      </div>

      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEvaluation">确认发起考评</el-button>
      </template>
    </el-dialog>

    <!-- 考评明细弹窗 -->
    <el-dialog v-model="detailVisible" :title="`${currentEval?.member} · ${currentEval?.month} 考评明细`" width="600px">
      <div v-if="currentEval" v-loading="detailLoading">
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div class="surface-card" style="flex:1; padding: 16px; text-align: center;">
            <div class="muted">系统自动分</div>
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

        <div class="sec-title" style="font-size: 14px;">打卡明细（系统自动算分）</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          <el-tag v-for="c in detailData.checkinList" :key="c.date" :type="c.status === '已打卡' ? 'success' : 'danger'" size="small">
            {{ c.date }} {{ c.status }}
          </el-tag>
        </div>

        <div class="sec-title" style="font-size: 14px;">任务参与（系统自动算分）</div>
        <div v-for="t in detailData.taskList" :key="t.title" class="flex-between" style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
          <span>{{ t.title }}</span>
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

const loading = ref(false), saving = ref(false), detailLoading = ref(false)
const list = ref([])
const activeMonths = ref([]) // 默认展开的月份

// 发起考评相关
const createVisible = ref(false)
const template = ref([])
const candidates = ref([]) // 可选人员
const form = reactive({
  month: '',
  selectedMembers: [],
  commonManualScore: 0,
  commonNote: ''
})

// 明细相关
const detailVisible = ref(false)
const currentEval = ref(null)
const detailData = ref({ checkinList: [], taskList: [] })

// 按月份分组计算
const groupedList = computed(() => {
  const groups = {}
  list.value.forEach(item => {
    if (!groups[item.month]) groups[item.month] = []
    groups[item.month].push(item)
  })
  return groups
})

// 获取排序后的月份数组
const groupedMonths = computed(() => {
  return Object.keys(groupedList.value).sort().reverse()
})

async function load() {
  loading.value = true
  try {
    // 主任看全部，部长看本部门
    const res = await adminApi.evaluations(userStore.isDirector ? '' : userStore.dept)
    list.value = res || []
    // 默认展开最新的一个月
    if (groupedMonths.value.length > 0) {
      activeMonths.value = [groupedMonths.value[0]]
    }
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  form.month = new Date().toISOString().slice(0, 7) // 默认当前月

  // 获取模板
  template.value = await adminApi.evaluationTemplate()

  // 获取候选人员
  if (userStore.isDirector) {
    // 主任默认选全体部长
    const allMembers = await adminApi.members('')
    candidates.value = allMembers.filter(m => m.title.includes('部长'))
    form.selectedMembers = candidates.value.map(m => m.name) // 默认全选
  } else {
    // 部长默认选本部门部员
    const deptMembers = await adminApi.members(userStore.dept)
    candidates.value = deptMembers.filter(m => !m.title.includes('部长'))
    form.selectedMembers = candidates.value.map(m => m.name) // 默认全选
  }

  form.commonManualScore = 0
  form.commonNote = ''
  createVisible.value = true
}

async function submitEvaluation() {
  if (!form.month) return ElMessage.warning('请选择月份')
  if (form.selectedMembers.length === 0) return ElMessage.warning('请至少选择一个考评对象')

  saving.value = true
  try {
    // 构造提交给后端的数据
    const submitData = {
      month: form.month,
      members: form.selectedMembers.map(name => {
        const memberInfo = candidates.value.find(m => m.name === name)
        // 自动分由后端查表得出，这里 mock 一个随机基础分 (打卡 5~15分 + 任务 2~5分)
        const autoScore = Math.floor(Math.random() * 10) + 7
        return {
          name,
          dept: memberInfo.dept,
          autoScore: autoScore,
          manualScore: form.commonManualScore,
          extraNote: form.commonNote
        }
      })
    }

    await adminApi.createEvaluation(submitData)
    ElMessage.success('考评已发起')
    createVisible.value = false
    load() // 刷新列表
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