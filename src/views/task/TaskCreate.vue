<template>
  <div class="page">
    <el-card shadow="never">
      <template #header><b>发布任务</b></template>
      <el-form :model="form" label-width="110px" style="max-width:820px">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="时间" required>
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="开始时间"
                          value-format="YYYY-MM-DD HH:mm" style="width:48%" />
          <span style="margin:0 8px">至</span>
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="结束时间"
                          value-format="YYYY-MM-DD HH:mm" style="width:48%" />
        </el-form-item>
        <el-form-item label="地点" required>
          <el-input v-model="form.location" placeholder="请输入任务地点" />
        </el-form-item>
        <el-form-item label="任务说明">
          <el-input v-model="form.desc" type="textarea" :rows="4" placeholder="请输入任务内容与要求" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="tagInput" placeholder="输入标签后回车添加" style="width:300px" @keyup.enter="addTag" />
          <div style="margin-top:8px">
            <el-tag v-for="t in form.tags" :key="t" closable style="margin-right:6px"
                    @close="form.tags = form.tags.filter(x => x !== t)">{{ t }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="参与部门" required>
          <el-select v-model="form.departments" multiple placeholder="请选择参与部门" style="width:100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="联动部门">
          <el-select v-model="form.relatedDepts" multiple placeholder="请选择需要协同的部门" style="width:100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name"
                       :disabled="form.departments.includes(d.name)" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联设备">
          <el-select v-model="form.devices" multiple placeholder="请选择任务所需设备" style="width:100%">
            <el-option v-for="d in devices" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="参与人">
          <el-select v-model="form.participants" multiple filterable allow-create default-first-option
                     placeholder="输入姓名后回车添加" style="width:100%">
            <el-option v-for="p in ['张三','李四','王五','赵六']" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">发布任务</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { taskApi } from '@/api'

const router = useRouter()
const submitting = ref(false)
const tagInput = ref('')
const departments = ref([]), devices = ref([])
const form = reactive({
  title: '', startTime: '', endTime: '', location: '', desc: '',
  tags: [], departments: [], relatedDepts: [], devices: [], participants: []
})

function addTag() {
  const v = tagInput.value.trim()
  if (v && !form.tags.includes(v)) form.tags.push(v)
  tagInput.value = ''
}
async function submit() {
  if (!form.title) return ElMessage.warning('请填写任务名称')
  if (!form.startTime || !form.endTime) return ElMessage.warning('请选择任务时间')
  if (!form.location) return ElMessage.warning('请填写任务地点')
  if (!form.departments.length) return ElMessage.warning('请选择参与部门')
  submitting.value = true
  try {
    await taskApi.create({ ...form, participants: form.participants.map(n => ({ name: n })) })  // POST /api/tasks
    ElMessage.success('任务发布成功')
    router.push('/tasks')
  } finally { submitting.value = false }
}
onMounted(async () => {
  departments.value = await taskApi.departments()
  devices.value = await taskApi.devices()
})
</script>