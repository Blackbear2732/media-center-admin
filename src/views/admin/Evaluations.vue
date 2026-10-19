<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:14px">
      <div class="muted">共 {{ list.length }} 条考评记录</div>
      <button class="pill active" @click="openCreate">+ 发起考评</button>
    </div>

    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
        <el-table-column prop="period" label="周期" width="110" />
        <el-table-column prop="member" label="对象" width="120" />
        <el-table-column prop="autoScore" label="自动分" width="90" />
        <el-table-column prop="manualScore" label="手动分" width="90" />
        <el-table-column prop="total" label="总分" width="90" />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="createdAt" label="发起时间" min-width="160" />
      </el-table>
    </div>

    <el-dialog v-model="createVisible" title="发起考评" width="680px">
      <el-form label-width="100px">
        <el-form-item label="考评周期">
          <el-date-picker v-model="form.period" type="month" value-format="YYYY-MM" placeholder="选择月份" />
        </el-form-item>
        <el-form-item label="考评对象">
          <el-select v-model="form.members" multiple placeholder="选择本部门成员" style="width:100%">
            <el-option v-for="m in members" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="flex-between" style="margin:6px 0 10px">
        <b>考评项（可动态增删改分值）</b>
        <el-button size="small" @click="addItem">+ 新增考评项</el-button>
      </div>
      <el-table :data="items" size="small" border>
        <el-table-column label="考评项名称" min-width="160">
          <template #default="{ row }"><el-input v-model="row.name" size="small" /></template>
        </el-table-column>
        <el-table-column label="每次分值" width="120">
          <template #default="{ row }"><el-input-number v-model="row.score" :min="0" :step="0.5" size="small" style="width:100%" /></template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-select v-model="row.type" size="small">
              <el-option label="自动" value="auto" />
              <el-option label="手动" value="manual" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" @click="items.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:14px">
        <div class="muted" style="margin-bottom:6px">自动分参考（打卡 / 任务 / 会议，由系统汇总）</div>
        <el-input v-model="form.autoNote" placeholder="如：打卡 18 次，任务 6 次，会议到场 4 次" />
      </div>

      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">提交考评</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const dept = localStorage.getItem('adminDept') || '新闻部'
const list = ref([]), members = ref([]), loading = ref(false), saving = ref(false)
const createVisible = ref(false)
const items = ref([])
const form = reactive({ period: '', members: [], autoNote: '' })

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.evaluations(dept)
    members.value = (await adminApi.members(dept)).filter(m => m.status === '在岗')
  } finally { loading.value = false }
}
async function openCreate() {
  items.value = (await adminApi.evaluationTemplate(dept)).map(x => ({ ...x }))
  Object.assign(form, { period: '', members: [], autoNote: '' })
  createVisible.value = true
}
function addItem() {
  items.value.push({ name: '', score: 1, type: 'manual' })
}
async function submit() {
  if (!form.period) return ElMessage.warning('请选择考评周期')
  if (!form.members.length) return ElMessage.warning('请选择考评对象')
  if (items.value.some(i => !i.name)) return ElMessage.warning('考评项名称不能为空')
  saving.value = true
  try {
    await adminApi.createEvaluation({ dept, period: form.period, members: form.members, items: items.value, autoNote: form.autoNote })
    ElMessage.success('考评已发起')
    createVisible.value = false
    load()
  } finally { saving.value = false }
}
onMounted(load)
</script>