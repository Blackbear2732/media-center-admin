<template>
  <div class="page" v-loading="loading">
    <el-page-header content="素材详情" @back="router.back()" style="margin-bottom:16px" />
    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never" class="mb">
          <template #header>
            <div class="flex-between">
              <b>{{ data.title }}</b>
              <el-tag size="small" :type="getMaterialTypeTagType(data.type)">{{ getMaterialTypeLabel(data.type) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="所属部门">{{ getDeptLabel(data.deptId) }}</el-descriptions-item>
            <el-descriptions-item label="上传人">{{ data.author }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ data.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="主要领导">{{ data.leaderName || '—' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="data.content" style="margin-top:16px">
            <div class="sec-title">正文内容</div>
            <div class="article-content">{{ data.content }}</div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header><b>历史版本</b></template>
          <el-table :data="versions" size="small" stripe>
            <el-table-column prop="version" label="版本" width="90" />
            <el-table-column prop="updatedAt" label="更新时间" width="180" />
            <el-table-column prop="size" label="大小" width="100" />
            <el-table-column prop="author" label="操作人" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" @click="downloadVersion(row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card shadow="never" class="mb">
          <template #header><b>网盘下载</b></template>
          <div style="margin-bottom:10px;word-break:break-all">
            <el-link type="primary" :href="data.netdiskUrl" target="_blank">{{ data.netdiskUrl }}</el-link>
          </div>
          <div class="flex-between" style="margin-bottom:14px">
            <span>提取码：<b>{{ data.netdiskCode }}</b></span>
            <el-button size="small" @click="copyCode">复制提取码</el-button>
          </div>
          <el-button type="primary" style="width:100%" :loading="extracting" @click="extract">
            提取文件（记录提取行为）
          </el-button>
          <div class="muted" style="margin-top:8px">点击提取后将记录本次提取操作，用于统计素材使用情况</div>
        </el-card>

        <el-card shadow="never">
          <template #header><b>提取记录</b></template>
          <div v-if="!extractLogs.length" class="muted">暂无记录</div>
          <div v-for="(l, i) in extractLogs" :key="i" class="flex-between"
               style="padding:6px 0;border-bottom:1px solid #f0f2f5">
            <span>{{ l.user }}</span><span class="muted">{{ l.time }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { materialApi } from '@/api'
import { userStore } from '@/store/user'
import { getDeptLabel, getMaterialTypeLabel, getMaterialTypeTagType } from '@/utils/dict'

const route = useRoute()
const router = useRouter()
const loading = ref(false), extracting = ref(false)
const data = ref({}), versions = ref([]), extractLogs = ref([])

async function load() {
  loading.value = true
  try {
    data.value = await materialApi.detail(route.params.id)        // GET /api/materials/{id}
    versions.value = await materialApi.versions(route.params.id)  // GET /api/materials/{id}/versions
  } finally { loading.value = false }
}
async function extract() {
  extracting.value = true
  try {
    await materialApi.recordExtract(route.params.id)  // POST /api/materials/{id}/extract
    ElMessage.success('提取记录已上报')
    extractLogs.value.unshift({ user: userStore.name, time: new Date().toLocaleString() })
  } finally { extracting.value = false }
}
function copyCode() {
  navigator.clipboard?.writeText(data.value.netdiskCode || '')
      .then(() => ElMessage.success('提取码已复制'))
      .catch(() => ElMessage.warning('复制失败，请手动复制'))
}
function downloadVersion(row) {
  // TODO: GET /api/materials/{id}/versions/{version}/download
  ElMessage.info(`下载版本 ${row.version}（接口待对接）`)
}
onMounted(load)
</script>