<template>
  <div class="page">
    <el-row :gutter="20">
      <!-- 左侧：设备状态与申请表单 -->
      <el-col :span="13">
        <div class="surface-card mb">
          <div style="padding: 16px 20px 0; display: flex; justify-content: space-between; align-items: center;">
            <b>设备库当前状态</b>
            <span class="muted">申请前请确认设备状态</span>
          </div>
          <div style="padding: 16px 20px 20px;">
            <div class="device-grid" v-loading="loadingDevices">
              <div v-for="d in deviceList" :key="d.id" class="device-card">
                <div class="device-header">
                  <span class="device-name">{{ d.name }}</span>
                  <el-tag
                      :type="getStatusType(d.status)"
                      size="small" effect="dark" round
                  >
                    {{ d.status }}
                  </el-tag>
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
              <el-select v-model="form.deviceId" placeholder="请选择设备" style="width:100%">
                <el-option
                    v-for="d in deviceList"
                    :key="d.id"
                    :label="d.name + (d.status !== '可用' ? `（当前${d.status}）` : '')"
                    :value="d.id"
                    :disabled="d.status !== '可用'"
                />
              </el-select>
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
            <el-table-column prop="startTime" label="开始时间" width="150" />
            <el-table-column prop="endTime" label="结束时间" width="150" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
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
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { deviceApi } from '@/api' // 只保留 deviceApi，去掉外部的 statusTagType

const deviceList = ref([])
const applications = ref([])
const loading = ref(false)
const loadingDevices = ref(false)
const submitting = ref(false)

const form = reactive({ deviceId: null, purpose: '', startTime: '', endTime: '' })

// 本地处理状态映射，绝不依赖外部文件，防止报错白屏
function getStatusType(status) {
  const map = {
    '可用': 'success',
    '借出': 'warning',
    '维修': 'danger',
    '报废': 'info',
    '已通过': 'success',
    '审批中': 'warning',
    '待审核': 'info',
    '已归还': 'success',
    '使用中': 'warning',
    '已拒绝': 'danger'
  }
  return map[status] || 'info'
}

async function loadDevices() {
  loadingDevices.value = true
  try {
    const res = await deviceApi.list()
    // 确保不因为返回 null 导致 v-for 崩溃
    deviceList.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('设备列表加载失败', e)
    deviceList.value = []
  } finally { loadingDevices.value = false }
}

async function loadApplications() {
  loading.value = true
  try {
    const res = await deviceApi.myApplications()
    applications.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('申请记录加载失败', e)
    applications.value = []
  } finally { loading.value = false }
}

function reset() {
  form.deviceId = null
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
  } catch (e) {
    console.error('申请提交失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDevices()
  loadApplications()
})
</script>