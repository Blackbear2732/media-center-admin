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
      <div v-for="m in list" :key="m.id" class="msg-row" :class="{ unread: !m.read }" @click="readOne(m)">
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
import { ElMessage } from 'element-plus'
import { messageApi } from '@/api'

const list = ref([]), loading = ref(false)
const unread = computed(() => list.value.filter(m => !m.read).length)

async function load() {
  loading.value = true
  try { list.value = await messageApi.list() } finally { loading.value = false }
}
async function readOne(m) {
  if (m.read) return
  await messageApi.markRead(m.id)
  m.read = true
}
async function markAll() {
  await messageApi.markAllRead()
  list.value.forEach(m => (m.read = true))
  ElMessage.success('已全部标记为已读')
}
onMounted(load)
</script>