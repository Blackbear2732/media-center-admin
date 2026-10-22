<template>
  <div v-loading="loading">
    <div class="surface-card" style="padding:8px 0">
      <el-table :data="pagedList" stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 6px 24px 14px">
              <div class="muted" style="margin-bottom:8px">历史版本</div>
              <div v-for="v in row.versions || []" :key="v.version" class="flex-between"
                   style="padding:6px 0;border-bottom:1px dashed var(--border)">
                <span>{{ v.version }} · {{ v.updatedAt }}</span>
                <span class="muted">{{ v.size }} · {{ v.author }}</span>
              </div>
              <div class="muted" style="margin:12px 0 8px">提取记录</div>
              <div v-for="(e, i) in row.extracts || []" :key="i" class="flex-between"
                   style="padding:6px 0;border-bottom:1px dashed var(--border)">
                <span>{{ e.user }}</span><span class="muted">{{ e.time }}</span>
              </div>
              <span v-if="!row.extracts?.length" class="muted">暂无提取记录</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getMaterialTypeTagType(row.type)" effect="plain">{{ getMaterialTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="上传人" width="100" />
        <el-table-column prop="createdAt" label="上传时间" width="160" />
        <el-table-column label="共享部门" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="id in row.sharedDeptIds || []" :key="id" size="small" style="margin-right:4px">{{ getDeptLabel(id) }}</el-tag>
            <span v-if="!row.sharedDeptIds?.length" class="muted">未共享</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <template v-if="canEdit(row)">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="removeMaterial(row)">删除</el-button>
            </template>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>

    <el-dialog v-model="editVisible" title="编辑素材" width="560px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="editForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editForm.leaderName" />
        </el-form-item>
        <el-form-item label="网盘链接">
          <el-input v-model="editForm.netdiskUrl" />
        </el-form-item>
        <el-form-item label="提取码">
          <el-input v-model="editForm.netdiskCode" />
        </el-form-item>
        <el-form-item label="视频号链接">
          <el-input v-model="editForm.videoChannelUrl" />
        </el-form-item>
        <el-form-item label="主题标签">
          <el-input v-model="editForm.themeTag" />
        </el-form-item>
        <el-form-item label="共享部门">
          <el-select v-model="editForm.sharedDeptIds" multiple style="width:100%">
            <el-option v-for="d in DEPARTMENTS_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi, materialApi } from '@/api'
import { userStore } from '@/store/user'
import { DEPARTMENTS_OPTIONS, getDeptLabel, getMaterialTypeLabel, getMaterialTypeTagType } from '@/utils/dict'
import { usePagination } from '@/utils/usePagination'

const list = ref([]), loading = ref(false), saving = ref(false)
const editVisible = ref(false)
const editForm = reactive({
  id: null, title: '', content: '', leaderName: '', netdiskUrl: '', netdiskCode: '',
  videoChannelUrl: '', themeTag: '', sharedDeptIds: []
})
const { page, size, pageSizes, total, paged: pagedList } = usePagination(list)

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.materials(userStore.viewDeptId)
  } finally {
    loading.value = false
  }
}

function canEdit(row) {
  if (userStore.isDirector) return true
  if (Number(row.uploadBy) === Number(userStore.userInfo?.id)) return true
  return userStore.isMinister && Number(row.deptId) === Number(userStore.deptId)
}

function openEdit(row) {
  Object.assign(editForm, {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    leaderName: row.leaderName || '',
    netdiskUrl: row.netdiskUrl || row.panUrl || '',
    netdiskCode: row.netdiskCode || row.panCode || '',
    videoChannelUrl: row.videoChannelUrl || '',
    themeTag: row.themeTag || '',
    sharedDeptIds: [...(row.sharedDeptIds || [])]
  })
  editVisible.value = true
}

async function saveEdit() {
  if (!editForm.title.trim()) {
    return ElMessage.warning('请填写素材标题')
  }
  saving.value = true
  try {
    await materialApi.update(editForm.id, {
      title: editForm.title,
      content: editForm.content,
      leaderName: editForm.leaderName,
      netdiskUrl: editForm.netdiskUrl,
      netdiskCode: editForm.netdiskCode,
      videoChannelUrl: editForm.videoChannelUrl,
      themeTag: editForm.themeTag,
      sharedDeptIds: editForm.sharedDeptIds
    })
    ElMessage.success('素材已更新')
    editVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function removeMaterial(row) {
  await ElMessageBox.confirm(`确认删除素材「${row.title}」？`, '提示', { type: 'warning' })
  await materialApi.remove(row.id)
  ElMessage.success('素材已删除')
  await load()
}

onMounted(load)
</script>
