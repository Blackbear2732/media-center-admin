<template>
  <div class="page" v-loading="loading">
    <div class="surface-card" style="padding: 24px;">
      <div class="flex-between" style="margin-bottom: 24px;">
        <div>
          <h3 style="margin: 0 0 6px;">部门功能模块配置</h3>
          <p class="muted" style="margin: 0;">配置各部门专属的业务模块（基础模块所有部门默认开启）</p>
        </div>
        <button class="pill active" :disabled="saving" @click="saveAll">
          {{ saving ? '保存中…' : '保存配置' }}
        </button>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="dept" label="部门名称" width="180" />

        <el-table-column label="打卡管理（综合部专属）" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.hasCheckin" :disabled="row.dept !== '综合部'" @change="(val) => toggleModule(row, 'checkin', val)" />
          </template>
        </el-table-column>

        <el-table-column label="数据看板（综合部专属）" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.hasDashboard" :disabled="row.dept !== '综合部'" @change="(val) => toggleModule(row, 'dashboard', val)" />
          </template>
        </el-table-column>

        <el-table-column label="设备管理（摄制部专属）" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.hasDevice" :disabled="row.dept !== '摄制部'" @change="(val) => toggleModule(row, 'device', val)" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const depts = ['综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']

async function load() {
  loading.value = true
  try {
    const res = await Promise.all(depts.map(d => adminApi.getDeptModules(d)))
    tableData.value = depts.map((dept, index) => {
      const mods = res[index] || []
      return {
        dept,
        modules: mods,
        hasCheckin: mods.includes('checkin'),
        hasDashboard: mods.includes('dashboard'),
        hasDevice: mods.includes('device')
      }
    })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function toggleModule(row, moduleKey, isChecked) {
  if (isChecked) {
    if (!row.modules.includes(moduleKey)) row.modules.push(moduleKey)
  } else {
    row.modules = row.modules.filter(m => m !== moduleKey)
  }
}

async function saveAll() {
  saving.value = true
  try {
    for (const row of tableData.value) {
      await adminApi.saveDeptModules(row.dept, row.modules)
    }
    ElMessage.success('模块配置已更新，重新进入管理区即可生效')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>