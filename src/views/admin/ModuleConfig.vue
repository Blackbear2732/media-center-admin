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
        <el-table-column prop="deptId" label="部门名称" width="180">
          <template #default="{ row }">{{ getDeptLabel(row.deptId) }}</template>
        </el-table-column>

        <el-table-column :label="`${MODULE_LABEL.checkin}（${getDeptLabel(CHECKIN_DEPT_ID)}专属）`" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.hasCheckin"
                :disabled="row.deptId !== CHECKIN_DEPT_ID"
                @change="(val) => toggleModule(row, 'checkin', val)"
            />
          </template>
        </el-table-column>

        <el-table-column :label="`${MODULE_LABEL.dashboard}（${getDeptLabel(CHECKIN_DEPT_ID)}专属）`" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.hasDashboard"
                :disabled="row.deptId !== CHECKIN_DEPT_ID"
                @change="(val) => toggleModule(row, 'dashboard', val)"
            />
          </template>
        </el-table-column>

        <el-table-column :label="`${MODULE_LABEL.device}（${getDeptLabel(DEVICE_DEPT_ID)}专属）`" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.hasDevice"
                :disabled="row.deptId !== DEVICE_DEPT_ID"
                @change="(val) => toggleModule(row, 'device', val)"
            />
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
import { DEPARTMENTS_OPTIONS, MODULE_LABEL, getDeptLabel } from '@/utils/dict'

// 打卡/看板归属综合部，设备管理归属摄制部
const CHECKIN_DEPT_ID = 101
const DEVICE_DEPT_ID = 104

import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()
const saving = ref(false)
const tableData = ref([])

async function load() {
  loading.value = true
  try {
    const depts = DEPARTMENTS_OPTIONS
    const res = await Promise.all(depts.map(d => adminApi.getDeptModules(d.value)))
    tableData.value = depts.map((d, index) => {
      const mods = res[index] || []
      return {
        deptId: d.value,
        modules: [...mods],
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
      await adminApi.saveDeptModules(row.deptId, row.modules)
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
