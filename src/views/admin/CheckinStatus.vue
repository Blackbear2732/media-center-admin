<template>
  <div>
    <div class="page-head">
      <div>
        <h2>{{ deptTitle }} · 打卡情况</h2>
        <p class="sub muted">本部门成员每日打卡记录，仅查看</p>
      </div>
    </div>

    <div class="flex-between status-toolbar" style="margin-bottom:16px;">
      <div class="status-filters" style="display:flex; gap:16px; align-items:center;">
        <div>
          <label class="muted" style="margin-right:8px;">日期</label>
          <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width:140px" />
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">姓名</label>
          <el-input
            v-model="keyword"
            clearable
            placeholder="姓名 / 学号"
            style="width:180px"
            @keyup.enter="reloadFromFirstPage"
            @clear="reloadFromFirstPage"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" plain style="margin-left:8px;" @click="reloadFromFirstPage">查询</el-button>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">部门</label>
          <!-- 主任用管理区头部的部门切换；综合部部长在本页内切换；其他部长固定本部门 -->
          <el-select v-if="canSwitchDept" v-model="switchDept" style="width:140px">
            <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <el-tag v-else size="small" type="info" effect="plain">{{ deptTitle }}</el-tag>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">状态</label>
          <el-select v-model="statusFilter" style="width:120px">
            <el-option label="全部状态" :value="-1" />
            <el-option v-for="s in CHECKIN_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>
      <div class="muted">
        共 <span style="color: var(--brand); font-weight: 600;">{{ total }}</span> 人
      </div>
    </div>

    <div class="surface-card" style="padding: 0;">
      <el-table :data="list" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="deptId" label="部门" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ getDeptLabel(row.deptId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="member" label="姓名" width="120" />
        <el-table-column prop="studentNo" label="学号" width="140" />
        <el-table-column prop="status" label="打卡状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status !== null && row.status !== undefined && row.status !== ''"
                    :type="getCheckinStatusType(row.status)" size="small" effect="dark" round>
              {{ getCheckinStatusLabel(row.status) }}
            </el-tag>
            <span v-else class="muted"></span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { useDelayedLoading } from '@/utils/loading'
import {
  ALL_DEPT_ID,
  CHECKIN_STATUS_OPTIONS,
  DEPT_OPTIONS,
  getCheckinStatusLabel,
  getCheckinStatusType,
  getDeptLabel,
  isAllDept
} from '@/utils/dict'

// 部门维度：主任用管理区头部切换部门；综合部部长可在本页内切换；普通部长固定本部门
const canSwitchDept = computed(() => !userStore.isDirector && Number(userStore.deptId) === 101)
const switchDept = ref(userStore.deptId ?? ALL_DEPT_ID)
const deptId = computed(() => userStore.isDirector
  ? userStore.viewDeptId
  : switchDept.value)
const deptTitle = computed(() => isAllDept(deptId.value) ? '全中心' : getDeptLabel(deptId.value))

const date = ref(new Date().toISOString().split('T')[0])
// 姓名/学号模糊搜索关键字：回车、点「查询」或清空时生效
const keyword = ref('')
const statusFilter = ref(-1) // -1 表示全部
const list = ref([])
const loading = useDelayedLoading()

// 后端分页：页码/每页条数/总数
const page = ref(1)
const size = ref(10)
const pageSizes = [10, 20, 50, 100]
const total = ref(0)

// 筛选条件（日期/姓名/状态）变化：回到第一页。
// 页码变化由下方 watch 统一触发加载，这里仅在页码已是第一页时直接查询，
// 避免同一次筛选既改页码又手动查询、发出两次请求
function reloadFromFirstPage() {
  if (page.value !== 1) page.value = 1
  else loadData()
}

watch(statusFilter, reloadFromFirstPage)
// 日期/部门变化同样回到第一页后重新查询
watch([date, deptId], reloadFromFirstPage)
// 翻页/改每页条数重新查询
watch([page, size], () => loadData())

async function loadData() {
  loading.value = true
  try {
    const kw = keyword.value.trim()
    const res = await adminApi.checkins({
      date: date.value,
      deptId: deptId.value,
      status: Number(statusFilter.value) === -1 ? null : statusFilter.value,
      // 空关键字不作为筛选条件传给后端
      ...(kw ? { keyword: kw } : {}),
      pageNum: page.value,
      pageSize: size.value
    })
    list.value = res?.rows || []
    total.value = res?.total || 0
  } catch (e) {
    // 提示文案由 request.js 拦截器统一走 getFriendlyErrorMessage，这里只留原文排查
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
/* 窄屏：筛选条件纵向堆叠，避免工具栏横向溢出 */
@media (max-width: 768px) {
  .status-toolbar { flex-wrap: wrap; align-items: flex-start; gap: 10px; }
  .status-filters { flex-wrap: wrap; width: 100%; gap: 10px 16px !important; }
  .status-filters > div { flex: 1 1 100%; }
}
</style>
