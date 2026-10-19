<template>
  <div v-loading="loading">
    <div class="data-upload-grid">
      <!-- 网宣数据上传 -->
      <div class="surface-card upload-card">
        <div class="upload-head">
          <div class="upload-title">
            <span class="dot" style="background:#3d7aab"></span>
            网宣数据上传
          </div>
          <div class="muted">微信公众号推文统计（.xlsx / .csv）</div>
        </div>
        <div class="upload-body">
          <el-upload
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="(file) => handleFile(file, 'wx')"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持字段：时间、总推文数量、原创推文数量、推文标题、推文类型、浏览量、点赞量、推文链接</div>
            </template>
          </el-upload>
          <div v-if="fileWx" class="file-preview">
            <div class="file-info">
              <el-icon><Document /></el-icon>
              <span>{{ fileWx.name }}</span>
            </div>
            <el-button type="primary" size="small" :loading="uploadingWx" @click="doUpload('wx')">确认解析入库</el-button>
          </div>
        </div>
      </div>

      <!-- 影音数据上传 -->
      <div class="surface-card upload-card">
        <div class="upload-head">
          <div class="upload-title">
            <span class="dot" style="background:#e8833a"></span>
            影音数据上传
          </div>
          <div class="muted">微信视频号动态统计（.xlsx / .csv）</div>
        </div>
        <div class="upload-body">
          <el-upload
              drag
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="(file) => handleFile(file, 'yy')"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持字段：序号、视频描述、视频ID、发布时间、完播率、播放量、推荐、喜欢、评论量、分享量等</div>
            </template>
          </el-upload>
          <div v-if="fileYy" class="file-preview">
            <div class="file-info">
              <el-icon><Document /></el-icon>
              <span>{{ fileYy.name }}</span>
            </div>
            <el-button type="primary" size="small" :loading="uploadingYy" @click="doUpload('yy')">确认解析入库</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近上传记录 -->
    <div class="section-head" style="margin-top: 32px;">
      <div><h3>上传记录</h3><div class="sub">最近的数据导入情况</div></div>
    </div>
    <div class="surface-card" style="padding: 0;">
      <el-table :data="uploadHistory" stripe style="width: 100%">
        <el-table-column prop="time" label="上传时间" width="180" />
        <el-table-column prop="type" label="数据类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'wx' ? 'primary' : 'warning'" size="small">
              {{ row.type === 'wx' ? '网宣数据' : '影音数据' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="rows" label="解析条数" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default>
            <el-tag type="success" size="small">成功</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="uploadHistory.length === 0" description="暂无上传记录" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'
import { UploadFilled, Document } from '@element-plus/icons-vue'

const loading = ref(false)
const fileWx = ref(null)
const fileYy = ref(null)
const uploadingWx = ref(false)
const uploadingYy = ref(false)
const uploadHistory = ref([])

function handleFile(file, type) {
  if (type === 'wx') fileWx.value = file.raw
  if (type === 'yy') fileYy.value = file.raw
}

async function doUpload(type) {
  const file = type === 'wx' ? fileWx.value : fileYy.value
  if (!file) return

  if (type === 'wx') uploadingWx.value = true
  if (type === 'yy') uploadingYy.value = true

  try {
    const res = await adminApi.uploadCsv(type, file)
    ElMessage.success(`解析成功，共导入 ${res.rows} 条数据`)

    uploadHistory.value.unshift({
      time: new Date().toLocaleString(),
      type,
      fileName: file.name,
      rows: res.rows,
      status: '成功'
    })

    if (type === 'wx') fileWx.value = null
    if (type === 'yy') fileYy.value = null
  } catch (e) {
    ElMessage.error('解析失败，请检查文件格式')
  } finally {
    if (type === 'wx') uploadingWx.value = false
    if (type === 'yy') uploadingYy.value = false
  }
}

onMounted(() => {
  uploadHistory.value = [
    { time: '2026-05-20 10:30:00', type: 'wx', fileName: '2026年推文统计.xlsx', rows: 142, status: '成功' },
    { time: '2026-05-20 10:25:00', type: 'yy', fileName: '视频号动态数据明细.xlsx', rows: 179, status: '成功' }
  ]
})
</script>