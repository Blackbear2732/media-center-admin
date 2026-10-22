<template>
  <div class="page">
    <el-row :gutter="20">
      <!-- 左侧：设备状态与申请表单 -->
      <el-col :span="13">
        <div class="surface-card mb">
          <div style="padding: 16px 20px 0; display: flex; justify-content: space-between; align-items: center;">
            <b>设备库当前状态</b>
            <span class="muted">申请前请确认设备状态与库存</span>
          </div>
          <div style="padding: 16px 20px 20px;">
            <div class="device-grid" v-loading="loadingDevices">
              <div v-for="d in deviceList" :key="d.id" class="device-card">
                <div class="device-header">
                  <span class="device-name">{{ d.name }}</span>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span class="muted" style="font-size: 12px;">库存: {{ d.stock }}</span>
                    <el-tag
                        :type="getDeviceStatusType(d.status)"
                        size="small" effect="dark" round
                    >
                      {{ getDeviceStatusLabel(d.status) }}
                    </el-tag>
                  </div>
                </div>
                <div class="device-meta">型号：{{ d.model || '—' }}</div>
                <div class="device-meta">编号：{{ d.code || '—' }}</div>
                <div class="device-remark">{{ d.remark || '暂无备注' }}</div>
              </div>
              <el-empty v-if="!loadingDevices && deviceList.length === 0" description="暂无设备" :image-size="60" />
            </div>
          </div>
        </div>

        <el-card shadow="never" class="surface-card">
          <template #header><b>提交设备申请</b></template>
          <el-form :model="form" label-width="90px">
            <el-form-item label="申请设备" required>
              <el-select v-model="form.deviceId" placeholder="请选择设备" style="width:100%" @change="handleDeviceChange">
                <el-option
                    v-for="d in deviceList"
                    :key="d.id"
                    :label="d.name + (d.status !== DEVICE_STATUS.AVAILABLE ? `（当前${getDeviceStatusLabel(d.status)}）` : `（库存${d.stock}）`)"
                    :value="d.id"
                    :disabled="d.status !== DEVICE_STATUS.AVAILABLE || d.stock <= 0"
                />
              </el-select>
            </el-form-item>

            <!-- 新增：申请数量 -->
            <el-form-item label="申请数量" required v-if="form.deviceId">
              <el-input-number v-model="form.applyNum" :min="1" :max="maxStock" />
              <span class="muted" style="margin-left: 8px;">最大可借 {{ maxStock }} 件</span>
            </el-form-item>

            <el-form-item label="使用用途" required>
              <el-input v-model="form.purpose" type="textarea" :rows="3" placeholder="请说明设备使用用途" />
            </el-form-item>
            <el-form-item label="使用时间" required>
              <el-date-picker v-model="form.startTime" type="datetime" placeholder="开始时间"
                              value-format="YYYY-MM-DD HH:mm" style="width:100%;margin-bottom:8px" />
              <el-date-picker v-model="form.endTime" type="datetime" placeholder="结束时间"
                              value-format="YYYY-MM-DD HH:mm" style="width:100%" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
              <el-button @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="11">
        <el-card shadow="never" class="surface-card" style="height: 100%;">
          <template #header><b>我的申请记录</b></template>
          <el-table :data="applications" v-loading="loading" size="small" stripe>
            <el-table-column prop="device" label="设备" min-width="140" />
            <el-table-column prop="applyNum" label="数量" width="70" align="center">
              <template #default="{ row }">{{ row.applyNum || 1 }}</template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" width="150" />
            <el-table-column prop="endTime" label="结束时间" width="150" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getApplyStatusType(row.status)" size="small">{{ getApplyStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center">
              <template #default="{ row }">
                <el-button
                    v-if="Number(row.status) === APPLY_STATUS.APPROVED"
                    type="primary" size="small" plain
                    @click="pickup(row)"
                >确认取走</el-button>
                <el-button
                    v-else-if="Number(row.status) === APPLY_STATUS.USING"
                    type="success" size="small" plain
                    @click="returnDevice(row)"
                >确认归还</el-button>
                <span v-else class="muted">—</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading && !applications.length" description="暂无申请记录" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { deviceApi } from '@/api'
import {
  APPLY_STATUS,
  DEVICE_STATUS,
  getApplyStatusLabel,
  getApplyStatusType,
  getDeviceStatusLabel,
  getDeviceStatusType
} from '@/utils/dict'

const deviceList = ref([])
const applications = ref([])
const loading = ref(false)
const loadingDevices = ref(false)
const submitting = ref(false)

const form = reactive({ deviceId: null, applyNum: 1, purpose: '', startTime: '', endTime: '' })

// 动态获取当前选中设备的最大可借数量
const maxStock = computed(() => {
  if (!form.deviceId) return 1
  const dev = deviceList.value.find(d => d.id === form.deviceId)
  return dev ? dev.stock : 1
})

// 切换设备时重置数量为 1
function handleDeviceChange() {
  form.applyNum = 1
}

async function loadDevices() {
  loadingDevices.value = true
  try {
    const res = await deviceApi.list()
    deviceList.value = Array.isArray(res) ? res : []
  } finally { loadingDevices.value = false }
}

async function loadApplications() {
  loading.value = true
  try {
    const res = await deviceApi.myApplications()
    applications.value = Array.isArray(res) ? res : []
  } finally { loading.value = false }
}

async function pickup(row) {
  await deviceApi.pickup(row.id)
  ElMessage.success('已确认取走，设备进入使用中')
  await loadApplications()
  await loadDevices()
}

async function returnDevice(row) {
  await deviceApi.returnDevice(row.id)
  ElMessage.success('已确认归还')
  await loadApplications()
  await loadDevices()
}

function reset() {
  form.deviceId = null
  form.applyNum = 1
  form.purpose = ''
  form.startTime = ''
  form.endTime = ''
}

async function submit() {
  if (!form.deviceId) return ElMessage.warning('请选择设备')
  if (!form.purpose) return ElMessage.warning('请填写使用用途')
  if (!form.startTime || !form.endTime) return ElMessage.warning('请选择使用时间')

  submitting.value = true
  try {
    const selectedDevice = deviceList.value.find(d => d.id === form.deviceId)
    await deviceApi.apply({
      ...form,
      deviceName: selectedDevice?.name
    })
    ElMessage.success('申请已提交，等待审批')
    reset()
    loadApplications()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDevices()
  loadApplications()
})
</script>

<style scoped>
.mb { margin-bottom: 20px; }
.device-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.device-card { border: 1px solid var(--border); border-radius: 10px; padding: 12px; background: #fafbfc; }
.device-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.device-name { font-weight: 600; font-size: 14px; color: var(--text); }
.device-meta { font-size: 12px; color: var(--text-sub); line-height: 1.6; }
.device-remark { font-size: 11px; color: #909399; margin-top: 4px; padding-top: 4px; border-top: 1px dashed var(--border); }
</style>