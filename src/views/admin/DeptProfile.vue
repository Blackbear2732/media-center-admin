<template>
  <div v-loading="loading" style="max-width:760px">
    <div class="surface-card" style="padding:22px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="部门简介">
          <el-input v-model="form.intro" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.contact" /></el-form-item>
        <el-form-item label="Logo 链接"><el-input v-model="form.logo" placeholder="图片 URL" /></el-form-item>
        <el-form-item label="封面链接"><el-input v-model="form.cover" placeholder="图片 URL" /></el-form-item>
        <el-form-item label="精选照片">
          <el-input v-model="photoInput" placeholder="输入图片 URL 后回车添加" @keyup.enter="addPhoto" />
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">
            <div v-for="(p, i) in form.photos" :key="i" class="photo-chip">
              <span>{{ p }}</span>
              <el-icon style="cursor:pointer" @click="form.photos.splice(i, 1)"><Close /></el-icon>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="成员名单">
          <div>
            <span v-for="m in form.members || []" :key="m.name" class="tag-soft" style="margin-right:6px">{{ m.name }}</span>
          </div>
        </el-form-item>
        <el-form-item>
          <button class="pill active" type="button" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存修改' }}
          </button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const dept = localStorage.getItem('adminDept') || '新闻部'
const loading = ref(false), saving = ref(false)
const photoInput = ref('')
const form = reactive({ intro: '', contact: '', logo: '', cover: '', photos: [], members: [] })

function addPhoto() {
  const v = photoInput.value.trim()
  if (v && !form.photos.includes(v)) form.photos.push(v)
  photoInput.value = ''
}
async function save() {
  saving.value = true
  try {
    await adminApi.saveDeptProfile(dept, { ...form })
    ElMessage.success('部门介绍已更新')
  } finally { saving.value = false }
}
onMounted(async () => {
  loading.value = true
  try { Object.assign(form, await adminApi.deptProfile(dept)) } finally { loading.value = false }
})
</script>