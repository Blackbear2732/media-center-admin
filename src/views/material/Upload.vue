<template>
  <div class="page" v-loading="loading">
    <div class="surface-card" style="padding: 24px; max-width: 860px; margin: 0 auto;">
      <template v-if="!loading">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 22px;">素材统一上传</h2>
          <span class="tag-soft">当前部门：{{ department || '未分配' }}</span>
        </div>
        <el-alert type="info" :closable="false" class="mb"
                  title="表单字段根据当前登录人的所属部门动态生成，不同部门上传内容不同。" />

        <el-form :model="form" label-width="120px">
          <el-form-item label="关联任务" required>
            <el-select v-model="form.taskId" placeholder="请选择关联任务" clearable style="width:100%">
              <el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id" />
            </el-select>
          </el-form-item>

          <!-- 动态字段 -->
          <el-form-item v-for="f in fields" :key="f.key" :label="f.label" :required="f.required">
            <el-input v-if="f.type === 'input'" v-model="form[f.key]" :placeholder="'请输入' + f.label" />
            <el-input v-else-if="f.type === 'textarea'" v-model="form[f.key]" type="textarea" :rows="8"
                      :placeholder="'请输入' + f.label" />
            <el-upload v-else-if="f.type === 'file'" drag action="#" :auto-upload="false">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            </el-upload>
          </el-form-item>

          <el-form-item label="共享部门">
            <el-select v-model="form.sharedDepts" multiple placeholder="选择可见部门（可多选）" style="width:100%">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name" />
            </el-select>
            <div class="muted" style="margin-top:4px">任务参与人默认可见；此处勾选后，被共享部门也可查看</div>
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
          </el-form-item>

          <el-form-item>
            <button class="pill active" type="button" :disabled="submitting" @click.prevent="submit">
              {{ submitting ? '提交中…' : '提交上传' }}
            </button>
            <button class="pill" type="button" style="margin-left: 12px;" @click="reset">重置</button>
          </el-form-item>
        </el-form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi, materialApi, taskApi, homeApi } from '@/api'

const department = ref('')
const fields = ref([])
const tasks = ref([])
const departments = ref([])
const loading = ref(false)
const submitting = ref(false)
const form = reactive({ taskId: null, sharedDepts: [], remark: '' })

function reset() {
  Object.keys(form).forEach(k => {
    if (k === 'taskId') form[k] = null
    else if (k === 'sharedDepts') form[k] = []
    else form[k] = ''
  })
}

async function submit() {
  if (!form.taskId) return ElMessage.warning('请选择关联任务')
  const missing = fields.value.find(f => f.required && !form[f.key])
  if (missing) return ElMessage.warning(`请填写「${missing.label}」`)

  submitting.value = true
  try {
    await materialApi.upload({ ...form, department: department.value })
    ElMessage.success('上传成功')
    reset()
  } finally {
    submitting.value = false
  }
}

async function init() {
  loading.value = true
  try {
    const u = await userApi.profile()
    // 修复：之前写的是 u.department，正确字段是 u.dept
    department.value = u?.dept || u?.department || '综合部'

    // 修复：确保回退到综合部
    const fieldData = await materialApi.uploadFields(department.value)
    fields.value = Array.isArray(fieldData) ? fieldData : []
    fields.value.forEach(f => { if (!(f.key in form)) form[f.key] = '' })

    const taskData = await taskApi.list({})
    tasks.value = Array.isArray(taskData) ? taskData : []

    const deptData = await homeApi.departments()
    departments.value = Array.isArray(deptData) ? deptData : []
  } catch (e) {
    console.error('上传页初始化失败:', e)
    ElMessage.error('页面加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
}
onMounted(init)
</script>