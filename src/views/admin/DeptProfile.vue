<template>
  <div v-loading="loading" style="max-width:760px">
    <el-alert
        v-if="isCenterView && canEditCenter"
        type="warning"
        :closable="false"
        class="mb"
        title="当前为全中心视角，此处编辑的是整个融媒体中心的简介。"
    />
    <el-alert
        v-else-if="isCenterView"
        type="info"
        :closable="false"
        class="mb"
        title="全中心简介仅主任可编辑。"
    />

    <div class="surface-card" style="padding:22px">
      <div class="flex-between" style="margin-bottom:16px">
        <b>{{ deptLabel }} · {{ isCenterView ? '中心介绍' : '部门介绍' }}</b>
      </div>

      <el-form :model="form" label-width="90px" :disabled="isCenterView && !canEditCenter" @submit.prevent>
        <el-form-item label="部门简介">
          <el-input v-model="form.intro" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="精选照片">
          <el-input v-model="photoInput" placeholder="输入图片 URL 后回车添加" @keyup.enter="addPhoto" />
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
            <div v-for="(p, i) in form.photos" :key="i" class="photo-row">
              <img :src="p" class="photo-thumb" alt="" @error="onThumbError($event)" />
              <span class="photo-url" :title="p">{{ p }}</span>
              <el-icon class="photo-op" :class="{ 'op-disabled': i === 0 }" title="上移" @click="movePhoto(i, -1)"><ArrowUp /></el-icon>
              <el-icon class="photo-op" :class="{ 'op-disabled': i === form.photos.length - 1 }" title="下移" @click="movePhoto(i, 1)"><ArrowDown /></el-icon>
              <el-icon class="photo-op" title="删除" @click="form.photos.splice(i, 1)"><Close /></el-icon>
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
const form = reactive({ intro: '', photos: [], members: [] })

function addPhoto() {
  const v = photoInput.value.trim()
  if (v && !form.photos.includes(v)) form.photos.push(v)
  photoInput.value = ''
}

function movePhoto(i, dir) {
  const j = i + dir
  if (j < 0 || j >= form.photos.length) return
  const arr = form.photos
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
}

function onThumbError(e) {
  e.target.style.visibility = 'hidden'
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

<style scoped>
.photo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.photo-thumb {
  width: 56px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  background: #eee;
}
.photo-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #666;
}
.photo-op {
  cursor: pointer;
  font-size: 14px;
  color: #888;
  flex-shrink: 0;
}
.photo-op:hover {
  color: var(--brand, #2a6fb5);
}
.op-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>