<template>
  <div class="page" v-loading="loading">
    <div class="section-head" style="margin-bottom: 14px;">
      <div>
        <h3>公告栏</h3>
        <div class="sub">中心通知与部门公告</div>
      </div>
    </div>

    <div v-if="list.length === 0" class="muted" style="padding: 40px 0; text-align: center;">暂无公告</div>

    <div class="notice-list">
      <div v-for="(n, idx) in list" :key="n.id" class="notice-card surface-card" @click="toggle(idx)">
        <div class="notice-head">
          <div class="notice-title">
            <el-tag size="small" :type="Number(n.scope) === 1 ? 'primary' : 'success'" style="margin-right: 8px;">
              {{ getNoticeScopeLabel(n.scope) }}
            </el-tag>
            <b>{{ n.title }}</b>
          </div>
          <el-icon class="notice-arrow" :class="{ open: openIndex === idx }">
            <ArrowDown />
          </el-icon>
        </div>
        <div class="notice-meta muted">
          <span>{{ n.author }}</span>
          <span style="margin: 0 6px;">·</span>
          <span>{{ n.publishTime || n.createdAt }}</span>
        </div>
        <div v-if="openIndex === idx" class="notice-content">{{ n.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { getNoticeScopeLabel } from '@/utils/dict'
import { ArrowDown } from '@element-plus/icons-vue'

const list = ref([])
const loading = ref(false)
const openIndex = ref(-1)

function toggle(idx) {
  openIndex.value = openIndex.value === idx ? -1 : idx
}

// 范围过滤：全体(1)所有人可见；本部门(2)部长/主任可见全部部门公告，部员仅本部门
function visible(notice) {
  if (Number(notice.scope) !== 2) return true
  if (userStore.isDirector || userStore.isMinister) return true
  const mine = userStore.deptId || userStore.viewDeptId
  return mine === Number(notice.deptId)
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await adminApi.announcements()
    const all = Array.isArray(res) ? res : []
    list.value = all.filter(visible)
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-card { padding: 14px 16px; cursor: pointer; transition: border-color .18s; }
.notice-card:hover { border-color: var(--brand); }
.notice-head { display: flex; align-items: center; justify-content: space-between; }
.notice-title { display: flex; align-items: center; font-size: 14px; }
.notice-arrow { transition: transform .18s; color: var(--text-sub); }
.notice-arrow.open { transform: rotate(180deg); }
.notice-meta { margin-top: 6px; font-size: 12px; }
.notice-content { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: var(--text); }
</style>
