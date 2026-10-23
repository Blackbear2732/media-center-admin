<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>消息中心</h2>
        <p class="muted">{{ unread }} 条未读</p>
      </div>
      <button class="pill" :disabled="!unread" @click="markAll">全部标记已读</button>
    </div>

    <div class="msg-list surface-card" v-loading="loading">
      <div v-for="m in list" :key="m.id" class="msg-row" :class="{ unread: isUnread(m) }" @click="openMsg(m)">
        <span class="msg-dot"></span>
        <div class="msg-body">
          <div class="msg-top">
            <b>{{ m.title }}</b>
            <span class="muted">{{ m.time }}</span>
          </div>
          <div class="msg-text">{{ m.content }}</div>
        </div>
      </div>
      <el-empty v-if="!loading && !list.length" description="暂无消息" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { messageApi } from '@/api'

const router = useRouter()
const list = ref([]), loading = ref(false)

// is_read：0 未读 / 1 已读
const isUnread = (m) => Number(m.isRead) === 0
const unread = computed(() => list.value.filter(m => isUnread(m)).length)

// 后端消息 refType + refId -> 前端具体明细页
const REF_ROUTES = {
  task: (id) => `/tasks/${id}`,
  material: (id) => `/materials/${id}`
}
const refPath = (m) => {
  const id = m && m.refId
  if (id == null || id === '' || Number(id) === 0) return null
  const build = REF_ROUTES[m.refType]
  return build ? build(id) : null
}

async function load() {
  loading.value = true
  try { list.value = await messageApi.list() } finally { loading.value = false }
}

// 整条消息可点击：先标记已读，再按 refType/refId 跳转对应明细页
async function openMsg(m) {
  if (isUnread(m)) {
    await messageApi.markRead(m.id) // PUT /api/messages/{id}/read
    m.isRead = 1
    // 通知顶部导航栏更新未读数
    window.dispatchEvent(new Event('update-unread-count'))
  }
  const path = refPath(m)
  if (path) router.push(path)
}

async function markAll() {
  await messageApi.markAllRead() // PUT /api/messages/read-all
  list.value.forEach(m => (m.isRead = 1))
  ElMessage.success('已全部标记为已读')
  // 通知顶部导航栏更新未读数
  window.dispatchEvent(new Event('update-unread-count'))
}
onMounted(load)
</script>
