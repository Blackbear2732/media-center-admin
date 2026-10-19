<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:14px">
      <div class="muted">共 {{ list.length }} 次会议</div>
      <button class="pill active" @click="createVisible = true">+ 发起会议</button>
    </div>

    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
        <el-table-column prop="title" label="会议主题" min-width="220" />
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="location" label="地点" width="160" />
        <el-table-column prop="host" label="主持人" width="100" />
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRoll(row)">点名</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createVisible" title="发起会议" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="会议主题" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="时间" required>
          <el-date-picker v-model="form.time" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="地点"><el-input v-model="form.location" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="create">创建</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="rollVisible" :title="current?.title + ' · 点名'" size="560px">
      <div v-if="current">
        <div v-for="m in members" :key="m.id" class="flex-between roll-row">
          <span>{{ m.name }}（{{ m.title }}）</span>
          <el-radio-group v-model="rollState[m.id]" size="small">
            <el-radio-button label="到场" />
            <el-radio-button label="迟到" />
            <el-radio-button label="请假" />
            <el-radio-button label="缺席" />
          </el-radio-group>
        </div>
        <div style="margin-top:18px;text-align:right">
          <el-button @click="rollVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveRoll">保存点名</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const dept = localStorage.getItem('adminDept') || '新闻部'
const list = ref([]), members = ref([]), loading = ref(false), saving = ref(false)
const createVisible = ref(false), rollVisible = ref(false)
const current = ref(null)
const form = reactive({ title: '', time: '', location: '' })
const rollState = reactive({})

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.meetings(dept)
    members.value = (await adminApi.members(dept)).filter(m => m.status === '在岗')
  } finally { loading.value = false }
}
async function create() {
  if (!form.title || !form.time) return ElMessage.warning('请填写会议主题和时间')
  await adminApi.createMeeting({ ...form, dept, host: '部长' })
  ElMessage.success('会议已创建')
  createVisible.value = false
  Object.assign(form, { title: '', time: '', location: '' })
  load()
}
function openRoll(row) {
  current.value = row
  members.value.forEach(m => { rollState[m.id] = '到场' })
  rollVisible.value = true
}
async function saveRoll() {
  saving.value = true
  try {
    const records = members.value.map(m => ({ memberId: m.id, name: m.name, status: rollState[m.id] }))
    await adminApi.saveMeetingRecords(current.value.id, records)
    ElMessage.success('点名已保存')
    rollVisible.value = false
  } finally { saving.value = false }
}
onMounted(load)
</script>