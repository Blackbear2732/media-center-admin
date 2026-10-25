<template>
  <div v-loading="loading" style="max-width:760px">
    <el-alert
        v-if="isCenterView && canEditCenter"
        type="warning"
        :closable="false"
        class="mb"
        title="当前为全中心视角，此处编辑的是整个融媒体中心的介绍（含 Logo / 封面 / 精选照片）。"
    />
    <el-alert
        v-else-if="isCenterView"
        type="info"
        :closable="false"
        class="mb"
        title="全中心介绍仅主任可编辑。"
    />

    <div class="surface-card" style="padding:22px">
      <div class="flex-between" style="margin-bottom:16px">
        <b>{{ deptLabel }} · {{ isCenterView ? '中心介绍' : '部门介绍' }}</b>
      </div>

      <el-form :model="form" label-width="90px" :disabled="isCenterView && !canEditCenter">
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
          <button class="pill active" type="button" :disabled="saving || (isCenterView && !canEditCenter)" @click="save">
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
import { getDeptLabel, isAllDept, ALL_DEPT_ID } from '@/utils/dict'

// 部门介绍/全中心介绍同样可维护：非全中心视角编辑具体部门，全中心视角编辑整中心（dept 100）
// 全中心介绍仅主任（role=2）可编辑
const isCenterView = computed(() => isAllDept(userStore.viewDeptId))
const canEditCenter = computed(() => isCenterView.value && userStore.isDirector)
const deptId = computed(() => (isCenterView.value ? ALL_DEPT_ID : userStore.viewDeptId))
const deptLabel = computed(() => (isCenterView.value ? '全中心' : getDeptLabel(deptId.value)))

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
    if (isCenterView.value) {
      if (!userStore.isDirector) {
        ElMessage.warning('全中心介绍仅主任可编辑')
        return
      }
      await adminApi.saveCenterInfo({ ...form })
      ElMessage.success('中心介绍已更新')
    } else {
      await adminApi.saveDeptProfile(deptId.value, { ...form })
      ElMessage.success('部门介绍已更新')
    }
  } finally { saving.value = false }
}

onMounted(async () => {
  if (!deptId.value) return
  loading.value = true
  try { Object.assign(form, await adminApi.deptProfile(deptId.value)) } finally { loading.value = false }
})
</script>