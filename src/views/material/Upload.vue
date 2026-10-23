<template>
  <div class="page" v-loading="loading">
    <div class="surface-card" style="padding: 24px; max-width: 860px; margin: 0 auto;">
      <template v-if="!loading">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 22px;">素材统一上传</h2>
          <span class="tag-soft">当前部门：{{ deptId ? getDeptLabel(deptId) : '未分配' }}</span>
        </div>
        <el-alert type="info" :closable="false" class="mb"
                  title="表单字段根据当前登录人的所属部门动态生成，不同部门上传内容不同。" />

        <el-form :model="form" label-width="120px">
          <el-form-item label="关联任务" required>
            <el-select v-model="form.taskId" placeholder="请选择关联任务" clearable style="width:100%">
              <el-option v-for="t in tasks" :key="t.id" :label="t.title" :value="t.id" />
            </el-select>
          </el-form-item>

          <!-- 主任可任选部门上传，表单字段随部门变化 -->
          <el-form-item v-if="isDirector" label="上传到部门" required>
            <el-select v-model="deptId" style="width:100%" @change="loadFields">
              <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
            <div class="muted" style="margin-top:4px">主任可任意选择部门上传，表单字段会随所选部门变化</div>
          </el-form-item>

          <!-- 动态字段 -->
          <el-form-item v-for="f in fields" :key="f.key" :label="f.label" :required="f.required">
            <el-input v-if="f.type === 'input'" v-model="form[f.key]" :placeholder="'请输入' + f.label" @change="parseShareText(f)" />
            <el-input v-else-if="f.type === 'textarea'" v-model="form[f.key]" type="textarea" :rows="8"
                      :placeholder="'请输入' + f.label" />
            <el-upload
                v-else-if="f.type === 'file'"
                drag
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :accept="MATERIAL_FILE_ACCEPT.join(',')"
                :on-change="(file) => handleMaterialFile(file, f)"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持图片、文档、压缩包、视频，单个文件不超过 {{ MATERIAL_FILE_MAX_MB }}MB</div>
              </template>
            </el-upload>
            <div v-if="f.type === 'file' && form[f.key]" class="muted" style="margin-top:4px">
              已选择：{{ form[f.key].name }}
            </div>
          </el-form-item>

          <el-form-item label="共享部门">
            <el-select v-model="form.sharedDeptIds" multiple placeholder="选择可见部门（可多选）" style="width:100%">
              <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
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
import { userApi, materialApi, taskApi } from '@/api'
import { DEPARTMENTS_OPTIONS, getDeptLabel, isAllDept } from '@/utils/dict'
import { validateUploadFile } from '@/utils/validate'

const deptId = ref(null)
const isDirector = ref(false)
const fields = ref([])
const tasks = ref([])
const loading = ref(false)
const submitting = ref(false)
const form = reactive({ taskId: null, sharedDeptIds: [], remark: '' })

// 素材类上传：图片 / 文档 / 压缩包 / 视频，单个文件上限 200MB
const MATERIAL_FILE_ACCEPT = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.zip', '.rar', '.7z',
  '.mp4', '.mov', '.avi', '.mkv'
]
const MATERIAL_FILE_MAX_MB = 200

// 主任没有具体部门的业务上传，默认给综合部（101）的通用表单
const DEFAULT_UPLOAD_DEPT_ID = 101

function hasField(key) {
  return fields.value.some(f => f.key === key)
}

// 从网盘分享文本中提取首个 http(s) 链接
function extractUrl(text) {
  const m = (text || '').match(/https?:\/\/[^\s\u4e00-\u9fff"']+/)
  return m ? m[0] : ''
}

// 从「提取码：xxxx」或链接 ?pwd=xxxx 提取提取码
function extractCode(text, url) {
  const fromText = (text || '').match(/提取码[:：]\s*([A-Za-z0-9]+)/)
  if (fromText) return fromText[1]
  const fromUrl = (url || '').match(/[?&]pwd=(?:.[^&])*/i)
  return ''
}

// 粘贴整段百度网盘分享文本到「网盘链接」框时，自动拆出链接与提取码
function parseShareText(f) {
  if (!f || f.key !== 'netdiskUrl' || !hasField('netdiskCode')) return
  const raw = form.netdiskUrl || ''
  const url = extractUrl(raw)
  if (!url) return
  const pwd = (url.match(/[?&]pwd=([A-Za-z0-9]+)/i) || [])[1]
  const code = extractCode(raw, url) || pwd || ''
  form.netdiskUrl = url
  if (code && hasField('netdiskCode')) form.netdiskCode = code
}

function handleMaterialFile(file, field) {
  const raw = file?.raw
  const { ok, message } = validateUploadFile(raw, {
    accept: MATERIAL_FILE_ACCEPT,
    maxSizeMB: MATERIAL_FILE_MAX_MB
  })
  if (!ok) return ElMessage.error(message)
  form[field.key] = raw
}

function reset() {
  Object.keys(form).forEach(k => {
    if (k === 'taskId') form[k] = null
    else if (k === 'sharedDeptIds') form[k] = []
    else form[k] = ''
  })
}

async function submit() {
  if (!form.taskId) return ElMessage.warning('请选择关联任务')
  const missing = fields.value.find(f => f.required && !form[f.key])
  if (missing) return ElMessage.warning(`请填写「${missing.label}」`)

  submitting.value = true
  try {
    await materialApi.upload({ ...form, deptId: deptId.value })
    ElMessage.success('上传成功')
    reset()
  } finally {
    submitting.value = false
  }
}

async function loadFields() {
  const fieldData = await materialApi.uploadFields(deptId.value)
  fields.value = Array.isArray(fieldData) ? fieldData : []
  fields.value.forEach(f => { if (!(f.key in form)) form[f.key] = '' })
}

async function init() {
  loading.value = true
  try {
    const u = await userApi.profile()
    isDirector.value = isAllDept(u?.deptId)
    deptId.value = isDirector.value ? DEFAULT_UPLOAD_DEPT_ID : Number(u?.deptId || DEFAULT_UPLOAD_DEPT_ID)

    await loadFields()

    const taskData = await taskApi.list({})
    tasks.value = Array.isArray(taskData) ? taskData : []
  } catch (e) {
    console.error('上传页初始化失败:', e)
    ElMessage.error('页面加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
}
onMounted(init)
</script>
