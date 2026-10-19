<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:14px">
      <div class="muted">共 {{ list.length }} 条公告</div>
      <button class="pill active" @click="openEdit()">+ 发布公告</button>
    </div>

    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
        <el-table-column prop="title" label="标题" min-width="240" />
        <el-table-column prop="author" label="发布人" width="100" />
        <el-table-column prop="scope" label="范围" width="100" />
        <el-table-column prop="createdAt" label="发布时间" width="160" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="editVisible" :title="form.id ? '编辑公告' : '发布公告'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="范围">
          <el-select v-model="form.scope" style="width:100%">
            <el-option label="全体" value="全体" />
            <el-option label="本部门" value="本部门" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([]), loading = ref(false), saving = ref(false)
const editVisible = ref(false)
const form = reactive({ id: null, title: '', scope: '全体', content: '' })

async function load() {
  loading.value = true
  try { list.value = await adminApi.announcements() } finally { loading.value = false }
}
function openEdit(row) {
  Object.assign(form, row ? { ...row } : { id: null, title: '', scope: '全体', content: '' })
  editVisible.value = true
}
async function save() {
  if (!form.title || !form.content) return ElMessage.warning('标题和内容为必填')
  saving.value = true
  try {
    await adminApi.saveAnnouncement({ ...form })
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  } finally { saving.value = false }
}
async function remove(row) {
  await ElMessageBox.confirm(`确认删除「${row.title}」吗？`, '提示', { type: 'warning' })
  await adminApi.deleteAnnouncement(row.id)
  ElMessage.success('已删除')
  load()
}
onMounted(load)
</script>