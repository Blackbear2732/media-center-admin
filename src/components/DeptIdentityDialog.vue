<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="440px"
    class="dept-identity-dialog"
    :show-close="closable"
    :close-on-click-modal="false"
    :close-on-press-escape="closable"
    @update:model-value="onVisibleChange"
  >
    <p class="dept-tip">{{ tip }}</p>
    <el-radio-group v-model="selected" class="dept-list">
      <el-radio
        v-for="dept in depts"
        :key="dept.deptId"
        :value="Number(dept.deptId)"
        border
        class="dept-item"
      >
        <span class="dept-label">{{ dept.deptLabel }}</span>
        <el-tag v-if="dept.primary" size="small" type="success" effect="plain">主部门</el-tag>
      </el-radio>
    </el-radio-group>
    <p v-if="error" class="dept-error">{{ error }}</p>
    <template #footer>
      <el-button v-if="closable" @click="close">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        {{ submitting ? '处理中…' : confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { authApi } from '@/api'
import { getFriendlyErrorMessage } from '@/api/request'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 后端返回的可切换部门：[{ deptId, deptLabel, primary }]
  depts: { type: Array, default: () => [] },
  activeDeptId: { type: [Number, String], default: null },
  title: { type: String, default: '选择身份' },
  tip: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  // 登录后首次选择必须完成，不允许直接关闭；已登录切换身份时允许取消
  closable: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'success'])

const selected = ref(null)
const submitting = ref(false)
const error = ref('')

const normalizeId = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

// 默认选中主部门；没有主部门标记时回退当前生效部门，再回退第一项
const pickDefault = () => {
  const primary = props.depts.find(dept => dept.primary)
  return normalizeId(primary?.deptId)
    ?? normalizeId(props.activeDeptId)
    ?? normalizeId(props.depts[0]?.deptId)
}

watch(() => props.modelValue, visible => {
  if (!visible) return
  selected.value = pickDefault()
  error.value = ''
})

function onVisibleChange(visible) {
  if (!visible && !props.closable) return
  emit('update:modelValue', visible)
}

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const deptId = normalizeId(selected.value)
  if (deptId === null) {
    error.value = '请选择一个部门身份'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const res = await authApi.switchDept(deptId)
    if (!res || normalizeId(res.activeDeptId ?? res.deptId) === null) {
      error.value = '身份切换失败，请稍后重试'
      return
    }
    emit('success', res, deptId)
  } catch (e) {
    // 接口失败时留在弹窗内，保留当前选择并允许重试
    error.value = getFriendlyErrorMessage(e, '身份切换失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.dept-tip { margin: 0 0 14px; color: var(--text-sub); font-size: 13px; line-height: 1.7; }
.dept-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.dept-item { width: 100%; margin-right: 0; height: 44px; }
.dept-item :deep(.el-radio__label) { display: flex; align-items: center; gap: 8px; }
.dept-label { font-size: 14px; }
.dept-error { margin: 10px 0 0; color: #f56c6c; font-size: 12px; line-height: 1.6; }
</style>
