<template>
  <div>
    <div class="flex-between" style="margin-bottom:16px;">
      <div>
        <b>邮件发送管理</b>
        <p class="muted" style="margin:6px 0 0;">
          超过 20 人的批量通知会先进入待发送队列，可删除收件人后再确认发送。
        </p>
      </div>
      <el-button size="small" @click="load">刷新</el-button>
    </div>

    <div class="surface-card" style="padding: 6px 0">
      <el-table :data="batches" v-loading="loading" stripe>
        <el-table-column prop="title" label="邮件标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="msgType" label="类型" width="90">
          <template #default="{ row }">{{ msgTypeLabel(row.msgType) }}</template>
        </el-table-column>
        <el-table-column prop="recipientCount" label="待发人数" width="100" align="center" />
        <el-table-column prop="senderName" label="发送人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="150" />
        <el-table-column label="操作" width="230" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">收件人</el-button>
            <el-button link type="success" @click="sendBatch(row)">确认发送</el-button>
            <el-button link type="danger" @click="cancelBatch(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !batches.length" description="暂无待发送的批量邮件" :image-size="60" />
    </div>

    <el-drawer v-model="detailVisible" :title="activeBatch?.title || '收件人列表'" size="520px">
      <div style="margin-bottom:12px" class="muted">
        共 {{ recipients.length }} 个待发送收件人，删除后不会发送给该收件人。
      </div>
      <el-table :data="recipients" v-loading="detailLoading" size="small" stripe>
        <el-table-column prop="name" label="姓名" width="110" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="deleteRecipient(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" :loading="sending" :disabled="!recipients.length" @click="sendActiveBatch">
          确认发送剩余 {{ recipients.length }} 封
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const MSG_TYPE_LABEL = { 1: '任务', 2: '素材', 3: '设备', 4: '考评', 5: '系统', 6: '公告' }

const batches = ref([])
const recipients = ref([])
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()
const detailLoading = ref(false)
const sending = ref(false)
const detailVisible = ref(false)
const activeBatch = ref(null)

const msgTypeLabel = (type) => MSG_TYPE_LABEL[Number(type)] || '系统'

async function load() {
  loading.value = true
  try {
    batches.value = (await adminApi.mailBatches()) || []
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  activeBatch.value = row
  detailVisible.value = true
  await loadRecipients(row.batchNo)
}

async function loadRecipients(batchNo) {
  detailLoading.value = true
  try {
    recipients.value = (await adminApi.mailBatchDetail(batchNo)) || []
  } finally {
    detailLoading.value = false
  }
}

async function deleteRecipient(row) {
  await ElMessageBox.confirm(`确认删除收件人「${row.name}」？删除后不会向该邮箱发送。`, '提示', { type: 'warning' })
  await adminApi.deleteMailRecipient(activeBatch.value.batchNo, row.id)
  ElMessage.success('收件人已删除')
  await loadRecipients(activeBatch.value.batchNo)
  await load()
}

async function sendActiveBatch() {
  if (!activeBatch.value) return
  await ElMessageBox.confirm(`确认发送剩余 ${recipients.value.length} 封邮件？`, '提示', { type: 'warning' })
  sending.value = true
  try {
    const res = await adminApi.sendMailBatch(activeBatch.value.batchNo)
    ElMessage.success(`发送完成：成功 ${res.success} 封，失败 ${res.failed} 封`)
    detailVisible.value = false
    await load()
  } finally {
    sending.value = false
  }
}

async function sendBatch(row) {
  activeBatch.value = row
  detailVisible.value = true
  await loadRecipients(row.batchNo)
  await sendActiveBatch()
}

async function cancelBatch(row) {
  await ElMessageBox.confirm(`确认取消「${row.title}」这批邮件？`, '提示', { type: 'warning' })
  await adminApi.cancelMailBatch(row.batchNo)
  ElMessage.success('已取消该批邮件')
  await load()
}

onMounted(load)
</script>
