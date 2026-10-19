<template>
  <div class="page" v-loading="loading">
    <el-page-header content="任务详情" @back="router.back()" style="margin-bottom:16px" />
    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never" class="mb surface-card">
          <template #header>
            <div class="flex-between">
              <b>{{ task?.title || '加载中...' }}</b>
              <el-tag :type="statusTagType(task?.status)" v-if="task?.status">{{ task.status }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border v-if="task?.id">
            <el-descriptions-item label="开始时间">{{ task.startTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ task.endTime || '—' }}</el-descriptions-item>
            <el-descriptions-item label="地点">{{ task.location || '—' }}</el-descriptions-item>
            <el-descriptions-item label="标签">
              <el-tag v-for="t in (task.tags || [])" :key="t" size="small" style="margin-right:4px">{{ t }}</el-tag>
              <span v-if="!task.tags?.length" class="muted">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="参与部门">
              <el-tag v-for="d in (task.departments || [])" :key="d" size="small" type="success" style="margin-right:4px">{{ d }}</el-tag>
              <span v-if="!task.departments?.length" class="muted">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="联动部门">
              <el-tag v-for="d in (task.relatedDepts || [])" :key="d" size="small" type="warning" style="margin-right:4px">{{ d }}</el-tag>
              <span v-if="!task.relatedDepts?.length" class="muted">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="任务说明" :span="2">{{ task.desc || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="surface-card">
          <template #header>
            <div class="flex-between">
              <b>素材区域（上传即展示）</b>
              <el-button size="small" :loading="matLoading" @click="loadMaterials">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </template>
          <el-empty v-if="!materials.length" description="该任务暂无上传素材" :image-size="70" />
          <div v-for="m in materials" :key="m.id" style="border-bottom:1px solid #f0f2f5;padding:12px 0">
            <div class="flex-between">
              <div>
                <el-tag size="small" style="margin-right:8px">{{ m.type }}</el-tag>
                <b>{{ m.title }}</b>
                <span class="muted" style="margin-left:8px">{{ m.department }} · {{ m.author }} · {{ m.createdAt }}</span>
              </div>
              <el-link type="primary" @click="router.push('/materials/' + m.id)">查看素材详情</el-link>
            </div>
            <div v-if="m.leaderName" class="muted" style="margin-top:4px">主要领导：{{ m.leaderName }}</div>
            <div v-if="m.type === '新闻稿'" style="margin-top:10px">
              <el-collapse v-model="opened">
                <el-collapse-item :name="String(m.id)">
                  <template #title><span class="muted">点击展开新闻稿全文</span></template>
                  <div class="article-content">{{ m.content }}</div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div v-if="m.netdiskUrl" style="margin-top:8px">
              <el-icon><Link /></el-icon>
              <el-link type="primary" :href="m.netdiskUrl" target="_blank" style="margin-left:4px">{{ m.netdiskUrl }}</el-link>
              <span class="muted" style="margin-left:12px">提取码：{{ m.netdiskCode }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card shadow="never" class="surface-card">
          <template #header><b>参与人（{{ (task?.participants || []).length }}）</b></template>
          <div v-for="p in (task?.participants || [])" :key="p.name" class="flex-between" style="padding:8px 0;border-bottom:1px solid #f0f2f5">
            <span><el-avatar :size="26" style="margin-right:8px">{{ p.name.slice(0,1) }}</el-avatar>{{ p.name }}</span>
            <el-tag size="small" type="info">{{ p.dept }}</el-tag>
          </div>
          <el-empty v-if="!task?.participants?.length" description="暂无参与人" :image-size="50" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { taskApi, statusTagType } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false), matLoading = ref(false)
const task = ref({}) // 确保初始化为空对象而不是 null
const materials = ref([]), opened = ref([])
let timer = null

async function loadTask() {
  loading.value = true
  try {
    const res = await taskApi.detail(route.params.id)
    task.value = res || {}
  } catch (e) {
    console.error('任务详情加载失败', e)
    task.value = {}
  } finally {
    loading.value = false
  }
}

async function loadMaterials() {
  matLoading.value = true
  try {
    const res = await taskApi.materials(route.params.id)
    materials.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('素材加载失败', e)
    materials.value = []
  } finally {
    matLoading.value = false
  }
}

onMounted(() => {
  loadTask()
  loadMaterials()
  timer = setInterval(loadMaterials, 15000)
})
onUnmounted(() => timer && clearInterval(timer))
</script>

<style scoped>
.mb { margin-bottom: 16px; }
.article-content { white-space: pre-wrap; line-height: 1.9; color: var(--text); font-size: 14px; }
.surface-card { background: #fff; border-radius: 14px; border: 1px solid #e6ebf1; }
</style>