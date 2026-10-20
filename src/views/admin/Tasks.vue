<template>
  <div v-loading="loading">
    <div class="surface-card" style="padding: 8px 0">
      <el-table :data="list" stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding: 16px 24px 20px; background: #fafbfc; border-radius: 8px;">

              <!-- 1. 本部门参与人 (支持多选、批量删除) -->
              <div class="muted" style="margin-bottom:8px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                <span>本部门参与人</span>
                <!-- 批量移除按钮 -->
                <el-button
                    v-if="selectedParticipants[row.id]?.length > 0"
                    type="danger"
                    size="small"
                    plain
                    @click="removeParticipants(row)"
                >
                  移除选中 ({{ selectedParticipants[row.id].length }})
                </el-button>
              </div>

              <el-checkbox-group v-model="selectedParticipants[row.id]" style="margin-bottom: 16px; min-height: 32px;">
                <el-checkbox
                    v-for="p in deptParticipants(row)"
                    :key="p.name"
                    :label="p.name"
                    border
                    size="small"
                    style="margin-right: 8px; margin-bottom: 8px;"
                >
                  {{ p.name }}
                </el-checkbox>
              </el-checkbox-group>
              <span v-if="!deptParticipants(row).length" class="muted" style="display:block; margin-bottom: 16px;">暂无本部门参与人</span>

              <!-- 2. 待确认报名 -->
              <div class="muted" style="margin-bottom:8px; font-weight: 600;">待确认报名</div>
              <div v-if="row.signups && row.signups.length > 0" style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; margin-bottom: 16px;">
                <div v-for="s in row.signups" :key="s.name" class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border)">
                  <span>{{ s.name }}（{{ s.dept }}）</span>
                  <div>
                    <el-button size="small" type="success" plain @click="confirm(row, s)">确认</el-button>
                    <el-button size="small" type="danger" plain @click="reject(row, s)">忽略</el-button>
                  </div>
                </div>
              </div>
              <span v-else class="muted" style="display:block; margin-bottom: 16px;">暂无待确认报名</span>

              <!-- 3. 添加人员 -->
              <div style="margin-top: 8px;">
                <div class="muted" style="margin-bottom:8px; font-weight: 600;">添加本部门成员</div>
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <el-select
                      v-model="selectedNames[row.id]"
                      multiple
                      collapse-tags
                      collapse-tags-tooltip
                      placeholder="可多选人员，输入搜索"
                      style="width: 320px"
                      size="small"
                      filterable
                  >
                    <el-option
                        v-for="m in getAvailableMembers(row)"
                        :key="m.id"
                        :label="m.name"
                        :value="m.name"
                    />
                  </el-select>
                  <el-button size="small" type="primary" :loading="adding[row.id]" @click="addParticipants(row)">批量添加</el-button>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="任务名称" min-width="220" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="参与部门" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="d in row.departments" :key="d" size="small" style="margin-right:4px">{{ d }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push('/tasks/' + row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const router = useRouter()
const dept = localStorage.getItem('adminDept') || '新闻部'
const list = ref([]), loading = ref(false)
const deptMembers = ref([])

// 记录每个任务下拉框里选中的待添加人员
const selectedNames = reactive({})
// 记录每个任务里勾选的要移除的参与人
const selectedParticipants = reactive({})
// 记录每个任务是否处于添加中（防止连点）
const adding = reactive({})

// 获取当前任务下本部门已参与的人（兼容历史脏数据去重）
const deptParticipants = (row) => {
  const parts = (row.participants || []).filter(p => p.dept === dept)
  // 去重，防止有重复的 name 导致 vue 渲染报错
  return Array.from(new Map(parts.map(item => [item.name, item])).values())
}

// 计算可选人员：过滤掉已经在这个任务里的人员
function getAvailableMembers(row) {
  const currentNames = (row.participants || []).map(p => p.name)
  return deptMembers.value.filter(m => !currentNames.includes(m.name))
}

async function load() {
  loading.value = true
  try {
    list.value = await adminApi.tasks(dept)
    deptMembers.value = await adminApi.members(dept)

    // 初始化响应式对象
    list.value.forEach(t => {
      selectedNames[t.id] = []
      selectedParticipants[t.id] = []
      adding[t.id] = false
    })
  } finally {
    loading.value = false
  }
}

async function confirm(row, s) {
  await adminApi.confirmSignup(row.id, s.name)
  row.signups = row.signups.filter(x => x.name !== s.name)
  // 确认时也去重
  if (!row.participants.some(p => p.name === s.name)) {
    row.participants.push({ name: s.name, dept: s.dept || dept })
  }
  ElMessage.success('已确认报名')
}

function reject(row, s) {
  row.signups = row.signups.filter(x => x.name !== s.name)
  ElMessage.info('已忽略该报名')
}

// 批量添加（加防抖和去重）
async function addParticipants(row) {
  const names = selectedNames[row.id] || []
  if (names.length === 0) return ElMessage.warning('请选择要添加的成员')

  adding[row.id] = true
  let successCount = 0
  try {
    for (const name of names) {
      // 严格二次校验，防止重复添加
      if (!row.participants.some(p => p.name === name)) {
        await adminApi.addParticipant(row.id, { name, dept })
        row.participants.push({ name, dept })
        successCount++
      }
    }
    selectedNames[row.id] = []
    if (successCount > 0) {
      ElMessage.success(`成功添加 ${successCount} 人`)
    } else {
      ElMessage.warning('所选人员已在任务中')
    }
  } finally {
    adding[row.id] = false
  }
}

// 批量删除选中人员
async function removeParticipants(row) {
  const names = selectedParticipants[row.id] || []
  if (names.length === 0) return

  try {
    for (const name of names) {
      await adminApi.removeParticipant(row.id, name)
    }
    // 从本地数组移除
    row.participants = row.participants.filter(p => !names.includes(p.name))
    selectedParticipants[row.id] = []
    ElMessage.success(`已移除 ${names.length} 人`)
  } catch (e) {
    ElMessage.error('移除失败')
  }
}

onMounted(load)
</script>