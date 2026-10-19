<template>
  <div v-loading="loading">
    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
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
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="author" label="上传人" width="100" />
        <el-table-column prop="createdAt" label="上传时间" width="160" />
        <el-table-column label="共享部门" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="d in row.sharedDepts || []" :key="d" size="small" style="margin-right:4px">{{ d }}</el-tag>
            <span v-if="!row.sharedDepts?.length" class="muted">未共享</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'

const dept = localStorage.getItem('adminDept') || '新闻部'
const list = ref([]), loading = ref(false)
onMounted(async () => {
  loading.value = true
  try { list.value = await adminApi.materials(dept) } finally { loading.value = false }
})
</script>