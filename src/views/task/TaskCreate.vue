<template>
  <div class="page">
    <el-card shadow="never" class="surface-card" style="max-width: 820px; margin: 0 auto;">
      <template #header>
        <div class="flex-between">
          <b style="font-size: 18px;">发布新任务</b>
          <span class="muted">主任/部长指定参与部门后，由各部门部长自行指派人员</span>
        </div>
      </template>

      <el-form :model="form" label-width="110px" style="padding: 20px 10px;">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.title" placeholder="请输入任务名称" size="large" />
        </el-form-item>

        <el-form-item label="任务时间" required>
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="开始时间"
                          value-format="YYYY-MM-DD HH:mm" style="width:48%" />
          <span style="margin:0 8px; color: var(--text-sub);">至</span>
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="结束时间"
                          value-format="YYYY-MM-DD HH:mm" style="width:48%" />
        </el-form-item>

        <el-form-item label="任务地点" required>
          <el-input v-model="form.location" placeholder="请输入任务地点" />
        </el-form-item>

        <el-form-item label="任务说明">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入任务内容与具体要求" />
        </el-form-item>

        <el-form-item label="任务标签">
          <el-input v-model="tagInput" placeholder="输入标签后回车添加（如：体育比赛、会议）" style="width:300px" @keyup.enter="addTag" />
          <div style="margin-top:8px">
            <el-tag v-for="t in form.tags" :key="t" closable style="margin-right:6px"
                    @close="form.tags = form.tags.filter(x => x !== t)">{{ t }}</el-tag>
          </div>
        </el-form-item>

        <el-divider content-position="left">人员与部门分配</el-divider>

        <el-form-item label="参与部门" required>
          <el-select v-model="form.deptIds" multiple placeholder="请选择负责本任务的主力部门" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <div class="muted" style="margin-top:4px">参与部门将收到任务通知，并由部长安排具体人员</div>
        </el-form-item>

        <el-form-item label="联动部门">
          <el-select v-model="form.relatedDeptIds" multiple placeholder="请选择需要协同配合的部门" style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value"
                       :disabled="form.deptIds.includes(d.value)" />
          </el-select>
          <div class="muted" style="margin-top:4px">联动部门会同步收到任务，但不做强制人员要求</div>
        </el-form-item>

        <el-form-item label="关联设备">
          <el-select v-model="form.equipmentIds" multiple placeholder="请选择任务所需设备" style="width:100%" :loading="deviceLoading">
            <el-option
                v-for="d in availableDevices"
                :key="d.id"
                :label="d.stock > 1 ? `${d.name}（库存 ${d.stock} 件）` : d.name"
                :value="d.id" />
          </el-select>
          <div class="muted" style="margin-top:4px">仅显示「可用」或「借出」状态的设备，选择后部长可去后台申请</div>
        </el-form-item>

        <el-form-item style="margin-top: 30px;">
          <button class="pill active" type="button" style="width: 160px; justify-content: center; padding: 12px 0;" :disabled="submitting" @click.prevent="submit">
            {{ submitting ? '发布中…' : '确认发布任务' }}
          </button>
          <el-button style="margin-left: 16px;" @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi } from '@/api'
import { userStore } from '@/store/user'
import { DEPARTMENTS_OPTIONS, DEVICE_STATUS } from '@/utils/dict'

const router = useRouter()
const submitting = ref(false)
const deviceLoading = ref(false)
const tagInput = ref('')

const rawDevices = ref([])

// 可选设备：仅「可用」「借出」且仍有库存的设备
const availableDevices = computed(() => {
  if (!Array.isArray(rawDevices.value)) return []
  return rawDevices.value.filter(d =>
    (d.status === DEVICE_STATUS.AVAILABLE || d.status === DEVICE_STATUS.LENT) &&
    Number(d.stock) > 0
  )
})

const form = reactive({
  title: '', startTime: '', endTime: '', location: '', description: '',
  tags: [], deptIds: [], relatedDeptIds: [], equipmentIds: []
})

// 部长发布任务时默认带上自己的部门
if (userStore.isMinister && userStore.deptId) {
  form.deptIds = [userStore.deptId]
}

function addTag() {
  const v = tagInput.value.trim()
  if (v && !form.tags.includes(v)) form.tags.push(v)
  tagInput.value = ''
}

async function submit() {
  if (!form.title) return ElMessage.warning('请填写任务名称')
  if (!form.startTime || !form.endTime) return ElMessage.warning('请选择任务时间')
  if (!form.location) return ElMessage.warning('请填写任务地点')
  if (!form.deptIds.length) return ElMessage.warning('请至少选择一个参与部门')

  // 库存校验：设备不足时不让提交（后端接入后仍需前置校验，前端只做第一道拦截）
  const shortage = form.equipmentIds
      .map(id => rawDevices.value.find(d => Number(d.id) === Number(id)))
      .filter(d => d && Number(d.stock) <= 0)
  if (shortage.length > 0) {
    return ElMessage.warning(`设备库存不足：${shortage.map(d => d.name).join('、')}，请调整后重试`)
  }

  submitting.value = true
  try {
    await taskApi.create({ ...form })
    ElMessage.success('任务发布成功，已通知相关部门')
    router.push(userStore.canManage ? '/admin/tasks' : '/tasks')
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  deviceLoading.value = true
  try {
    const devicesRes = await taskApi.devices()
    rawDevices.value = Array.isArray(devicesRes) ? devicesRes : []
  } catch (e) {
    console.error('获取设备失败', e)
    rawDevices.value = []
  } finally {
    deviceLoading.value = false
  }
})
</script>
