<template>
  <div v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <h2>考评模板设置</h2>
        <p class="muted">为各部门设置考评模板的各项分值 · 打卡 / 会议到场 / 会议迟到 / 任务参与</p>
      </div>
    </div>

    <!-- 部门选择 -->
    <div class="toolbar">
      <span class="muted">目标部门：</span>
      <el-select
          v-model="deptId"
          :disabled="disableDeptSelect"
          style="width: 200px;"
          placeholder="选择部门"
          @change="load"
      >
        <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
      </el-select>
      <el-tag v-if="templateId && !hasCustom" type="warning" size="small" effect="plain" style="margin-left: 12px;">
        当前部门暂无独立模板，正在沿用综合部默认模板，保存后将自动创建
      </el-tag>
      <span v-if="templateId && hasCustom" class="tag-soft" style="margin-left: 12px;">独立模板 {{ templateName }}</span>
    </div>

    <!-- 分值列表 -->
    <div class="panel">
      <div class="panel-title">考评项分值与说明</div>
      <el-table :data="items" stripe style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#606266', fontWeight: '600' }">
        <el-table-column label="考评项" width="240">
          <template #default="{ row }">
            <div style="font-weight: 500;">{{ getItemLabel(row.sourceKey) }}</div>
            <div class="muted" style="font-size: 12px;">{{ row.sourceKey }}</div>
          </template>
        </el-table-column>
        <el-table-column label="分值" width="220" align="center">
          <template #default="{ row }">
            <el-input-number
                v-model="row.score"
                :min="0"
                :max="100"
                :step="0.5"
                :precision="1"
                size="small"
                style="width: 130px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="260">
          <template #default="{ row }">
            <span class="muted">{{ getItemDesc(row.sourceKey) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button @click="load">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          <el-icon style="margin-right: 4px;"><Check /></el-icon> 保存模板分值
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { DEPARTMENTS_OPTIONS, getDeptLabel, isAllDept } from '@/utils/dict'

const loading = ref(false)
const saving = ref(false)
const deptId = ref(null)
const templateId = ref(null)
const hasCustom = ref(false)
const templateName = ref('')
const items = ref([])

// 部长只能设置本部门模板
const disableDeptSelect = computed(() => !userStore.isDirector)

// 考评项中文名称（对应 sourceKey）——模板仅维护基础分项
const ITEM_LABEL = {
  checkin: '打卡',
  meeting_present: '会议到场',
  meeting_late: '会议迟到',
  task_join: '任务参与'
}

// 考评项说明
const ITEM_DESC = {
  checkin: '每次有效打卡的单次分值',
  meeting_present: '每次按时到场参会的加分',
  meeting_late: '每次迟到参会的加分（可低于到场分）',
  task_join: '每项任务参与的加分'
}

// 兜底默认项，当部门模板没有明细时展示，便于空模板新建（仅基础分项）
const DEFAULT_ITEMS = [
  { sourceKey: 'checkin', itemName: '打卡', score: 0.5 },
  { sourceKey: 'meeting_present', itemName: '会议到场', score: 1 },
  { sourceKey: 'meeting_late', itemName: '会议迟到', score: 0.5 },
  { sourceKey: 'task_join', itemName: '任务参与', score: 1 }
]

function getItemLabel(key) {
  return ITEM_LABEL[key] || key || '—'
}

function getItemDesc(key) {
  return ITEM_DESC[key] || ''
}

async function load() {
  loading.value = true
  try {
    const res = await adminApi.evalTemplateOf(deptId.value)
    templateId.value = res?.templateId ?? null
    hasCustom.value = !!res?.hasCustom
    templateName.value = res?.templateName || ''
    const rows = (res?.items || []).map(it => ({
      sourceKey: it.sourceKey,
      itemName: it.itemName || getItemLabel(it.sourceKey),
      score: Number(it.score ?? 0),
      enabled: it.enabled
    }))
    // 若模板为空，用默认项补齐，保证至少能设置
    items.value = rows.length ? rows : DEFAULT_ITEMS.map(it => ({ ...it }))
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const targetDeptId = Number(deptId.value)
  if (!targetDeptId) return ElMessage.warning('请选择目标部门')

  // 确认后再保存
  await ElMessageBox.confirm(
      `即将为「${getDeptLabel(targetDeptId)}」保存考评模板（${items.value.length} 个考评项）的分值，确认保存？`,
      '确认保存',
      { confirmButtonText: '确认保存', cancelButtonText: '取消', type: 'warning' }
  )

  saving.value = true
  try {
    const payload = items.value.map(it => ({
      sourceKey: it.sourceKey,
      itemName: it.itemName,
      score: it.score
    }))
    await adminApi.saveEvalTemplate(targetDeptId, payload)
    ElMessage.success('考评模板已保存')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // 部长固定在自身部门；主任默认全中心视角，落回综合部（101）
  let init = userStore.viewDeptId
  if (isAllDept(init)) init = 101
  if (!userStore.isDirector) init = userStore.deptId
  deptId.value = init
  await load()
})
</script>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.5px; }
.page-header p { margin: 0; }
.toolbar { display: flex; align-items: center; margin-bottom: 20px; font-size: 14px; }
.panel { background: #fff; border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-sm); padding: 20px; }
.panel-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
</style>