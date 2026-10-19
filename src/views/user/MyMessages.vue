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

<style scoped>
.list-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.list-head h2 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.list-head p { margin: 6px 0 0; }
.msg-list { overflow: hidden; }
.msg-row {
  display: flex; gap: 12px; padding: 16px 20px; cursor: pointer;
  border-bottom: 1px solid var(--border); transition: background .18s;
}
.msg-row:last-child { border-bottom: none; }
.msg-row:hover { background: #fafbfc; }
.msg-row.unread { background: #f6f9fc; }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; background: transparent; margin-top: 7px; flex-shrink: 0; }
.msg-row.unread .msg-dot { background: var(--accent); }
.msg-body { flex: 1; min-width: 0; }
.msg-top { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px; }
.msg-top b { font-weight: 600; font-size: 14px; }
.msg-text { color: var(--text-sub); font-size: 13px; line-height: 1.7; }
</style>