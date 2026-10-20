<template>
  <div v-loading="loading" style="max-width:760px">
    <el-alert
        v-if="isCenterView"
        type="info"
        :closable="false"
        class="mb"
        title="当前为全中心视角，请先在右上角切换到具体部门后再编辑部门介绍。"
    />

    <div class="surface-card" style="padding:22px">
      <div class="flex-between" style="margin-bottom:16px">
        <b>{{ deptLabel }} · 部门介绍</b>
      </div>

      <el-form :model="form" label-width="90px" :disabled="isCenterView">
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
          <button class="pill active" type="button" :disabled="saving || isCenterView" @click="save">
            {{ saving ? '保存中…' : '保存修改' }}
          </button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { getDeptLabel, isAllDept } from '@/utils/dict'

// 部门介绍只能针对具体部门维护，全中心视角不可编辑
const isCenterView = computed(() => isAllDept(userStore.viewDeptId))
const deptId = computed(() => (isCenterView.value ? null : userStore.viewDeptId))
const deptLabel = computed(() => (deptId.value ? getDeptLabel(deptId.value) : '全中心'))

const loading = ref(false), saving = ref(false)
const photoInput = ref('')
const form = reactive({ intro: '', contact: '', logo: '', cover: '', photos: [], members: [] })

function addPhoto() {
  const v = photoInput.value.trim()
  if (v && !form.photos.includes(v)) form.photos.push(v)
  photoInput.value = ''
}

async function save() {
  if (!deptId.value) return ElMessage.warning('请先选择具体部门')
  saving.value = true
  try {
    await adminApi.saveDeptProfile(deptId.value, { ...form })
    ElMessage.success('部门介绍已更新')
  } finally { saving.value = false }
}

onMounted(async () => {
  if (!deptId.value) return
  loading.value = true
  try { Object.assign(form, await adminApi.deptProfile(deptId.value)) } finally { loading.value = false }
})
</script>
