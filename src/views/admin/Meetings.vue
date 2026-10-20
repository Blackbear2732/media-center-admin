<template>
  <div v-loading="loading">
    <div class="flex-between" style="margin-bottom:16px;">
      <div class="muted">共 {{ list.length }} 次会议记录</div>
      <button class="pill active" @click="openCreate" style="padding: 10px 20px;">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon> 发起会议
      </button>
    </div>

    <div class="surface-card" style="padding:8px 0">
      <el-table :data="list" stripe>
        <el-table-column prop="title" label="会议主题" min-width="200" />
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column prop="host" label="主持人" width="100" />
        <el-table-column prop="dept" label="所属部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.dept === '全中心' ? 'danger' : 'info'" effect="plain">
              {{ row.dept }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRoll(row)">点名</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无会议记录" />
    </div>

    <!-- 发起会议弹窗 -->
    <el-dialog v-model="createVisible" title="发起会议" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="会议主题" required>
          <el-input v-model="form.title" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="会议时间" required>
          <el-date-picker v-model="form.time" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="会议地点" required>
          <el-input v-model="form.location" placeholder="请输入会议地点" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="form.dept" disabled />
        </el-form-item>
        <el-form-item label="参会对象">
          <span style="color: var(--brand); font-weight: 500;">
            {{ userStore.isDirector && !targetDept ? '全体部长' : '本部门全体成员' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createMeeting">确认发起</el-button>
      </template>
    </el-dialog>

    <!-- 点名弹窗 -->
    <el-dialog
        v-model="rollVisible"
        :title="current?.title + ' · 点名'"
        width="600px"
        class="roll-dialog"
        :close-on-click-modal="false"
    >
      <div class="roll-list" v-if="current">
        <div v-for="m in currentMembers" :key="m.id" class="roll-row">
          <div class="roll-user-info">
            <span class="name">{{ m.name }}</span>
            <span class="title muted">({{ m.title }})</span>
          </div>
          <div class="roll-actions">
            <el-radio-group v-model="rollState[m.id]" size="small">
              <el-radio-button label="到场" />
              <el-radio-button label="迟到" />
              <el-radio-button label="请假" />
              <el-radio-button label="缺席" />
            </el-radio-group>
          </div>
        </div>
        <el-empty v-if="currentMembers.length === 0" description="暂无参会成员" :image-size="60" />
      </div>

      <template #footer>
        <div style="text-align: right;">
          <el-button @click="rollVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingRoll" @click="saveRoll">保存点名结果</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'

const loading = ref(false), saving = ref(false), savingRoll = ref(false)
const list = ref([]), allMembers = ref([])
const createVisible = ref(false), rollVisible = ref(false)
const current = ref(null)

// 当前选择的部门（主任为空代表全中心）
const targetDept = computed(() => userStore.isDirector ? (userStore.adminDept || '') : userStore.dept)

const form = reactive({ title: '', time: '', location: '', dept: '' })
const rollState = reactive({})

// 动态计算当前会议的参会名单
const currentMembers = computed(() => {
  if (!current.value) return []
  // 如果是全中心会议，只点名全体部长
  if (current.value.dept === '全中心') {
    return allMembers.value.filter(m => m.title.includes('部长'))
  }
  // 如果是部门会议，点名该部门的所有在岗部员
  return allMembers.value.filter(m => m.dept === current.value.dept && m.status === '在岗')
})

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.meetings(targetDept.value)
    // 这里拉取全量成员，方便后续过滤
    const res = await adminApi.members('')
    allMembers.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('加载会议数据失败', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.title = ''
  form.time = ''
  form.location = ''

  // 如果主任在全中心视角，发起的就是全体部长会议
  if (userStore.isDirector && !targetDept.value) {
    form.dept = '全中心'
  } else {
    form.dept = targetDept.value
  }

  createVisible.value = true
}

async function createMeeting() {
  if (!form.title || !form.time || !form.location) {
    return ElMessage.warning('请填写完整的会议信息')
  }
  saving.value = true
  try {
    const newMeeting = {
      id: Date.now(),
      title: form.title,
      time: form.time,
      location: form.location,
      host: userStore.name,
      dept: form.dept,
      records: []
    }
    await adminApi.createMeeting(newMeeting)
    // 如果当前是在全中心视角，新建的会议要能显示出来
    if (targetDept.value === '' || targetDept.value === form.dept) {
      list.value.unshift(newMeeting)
    }
    ElMessage.success('会议已创建')
    createVisible.value = false
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}

function openRoll(row) {
  current.value = row
  // 初始化点名状态
  currentMembers.value.forEach(m => {
    rollState[m.id] = '到场'
  })
  rollVisible.value = true
}

async function saveRoll() {
  savingRoll.value = true
  try {
    const records = currentMembers.value.map(m => ({
      memberId: m.id,
      name: m.name,
      status: rollState[m.id]
    }))
    await adminApi.saveMeetingRecords(current.value.id, records)
    ElMessage.success('点名结果已保存')
    rollVisible.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingRoll.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.roll-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px dashed var(--border);
}
.roll-user-info { display: flex; align-items: center; gap: 8px; }
.roll-user-info .name { font-weight: 600; font-size: 15px; color: var(--text); }

@media (max-width: 768px) {
  :deep(.roll-dialog) { width: 90% !important; }
  .roll-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .roll-actions { width: 100%; }
  :deep(.roll-actions .el-radio-group) { display: flex; width: 100%; }
  :deep(.roll-actions .el-radio-button) { flex: 1; }
  :deep(.roll-actions .el-radio-button__inner) { width: 100%; padding: 8px 0; }
}
</style>