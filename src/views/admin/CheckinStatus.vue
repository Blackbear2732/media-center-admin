<template>
  <div>
    <div class="page-head">
      <div>
        <h2>{{ deptTitle }} · 打卡情况</h2>
        <p class="sub muted">{{ date }}</p>
      </div>
    </div>

    <div class="flex-between status-toolbar">
      <div class="status-filters">
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
            @keyup.enter="loadData"
            @clear="loadData"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" plain style="margin-left:8px;" @click="loadData">查询</el-button>
        </div>
        <div>
          <label class="muted" style="margin-right:8px;">部门</label>
          <!-- 主任用管理区头部的部门切换；综合部部长在本页内切换；其他部长固定本部门 -->
          <el-select v-if="canSwitchDept" v-model="switchDept" style="width:140px">
            <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
          <el-tag v-else size="small" type="info" effect="plain">{{ deptTitle }}</el-tag>
        </div>
      </div>
      <div class="muted">
        共 <span class="total-count">{{ list.length }}</span> 人
      </div>
    </div>

    <!-- 零打卡记录：只给一行说明，不渲染任何名单块；成员本身为空时走独立空态 -->
    <div class="status-area" v-loading="loading">
      <div v-if="noData" class="empty-panel muted">当日暂无成员或打卡数据</div>
      <div v-else-if="noRecord" class="status-tip">当日暂无打卡记录</div>
      <div v-else class="status-blocks">
        <section class="status-block undone">
          <div class="block-head">
            <span class="block-title">未打卡（{{ undoneList.length }} 人）</span>
          </div>
          <div v-if="undoneGroups.length" class="dept-groups">
            <div v-for="g in undoneGroups" :key="g.deptId" class="dept-group">
              <div class="dept-group-title">{{ g.label }}（{{ g.count }} 人）</div>
              <div class="name-line">{{ g.namesText }}</div>
            </div>
          </div>
          <div v-else class="block-empty muted">暂无未打卡人员</div>
        </section>

        <section class="status-block done">
          <div class="block-head">
            <span class="block-title">{{ doneTitle }}（{{ doneList.length }} 人）</span>
          </div>
          <div v-if="doneGroups.length" class="dept-groups">
            <div v-for="g in doneGroups" :key="g.deptId" class="dept-group">
              <div class="dept-group-title">{{ g.label }}（{{ g.count }} 人）</div>
              <div class="name-line">{{ g.namesText }}</div>
            </div>
          </div>
          <div v-else class="block-empty muted">暂无已打卡人员</div>
        </section>
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
import { ALL_DEPT_ID, CHECKIN_STATUS, DEPT_OPTIONS, getDeptLabel, isAllDept } from '@/utils/dict'

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
const list = ref([])
const loading = useDelayedLoading()

// 本页不翻页：后端为内存分页、pageSize 无上限也无截断，
// 一次取当天的全部成员（pageSize=1000 远大于单部门/全中心人数），保证两块人数为全量口径
const PAGE_SIZE = 1000

// 字典口径：CHECKIN_STATUS.DONE = 1（已打卡）；0 或未设置（NULL）归入未打卡
const doneList = computed(() =>
  list.value.filter(row => Number(row.status) === CHECKIN_STATUS.DONE))
const undoneList = computed(() =>
  list.value.filter(row => Number(row.status) !== CHECKIN_STATUS.DONE))

// 按部门分组：接口 rows 已带 deptId，前端直接分组，不额外请求也不编造部门。
// 组内姓名仍用全角空格分隔、整段可复制；排序按 dept_id 升序（综合部 101 自然在前）。
// 组内人数按行数统计，与块标题总人数保持口径一致。
function groupByDept(rows) {
  const groups = new Map()
  rows.forEach(row => {
    const id = Number(row.deptId)
    if (!groups.has(id)) {
      groups.set(id, { deptId: id, label: getDeptLabel(row.deptId), count: 0, names: [] })
    }
    const group = groups.get(id)
    group.count += 1
    if (row.member) group.names.push(row.member)
  })
  return [...groups.values()]
    .sort((a, b) => a.deptId - b.deptId)
    .map(g => ({ ...g, namesText: g.names.join('　') }))
}
const undoneGroups = computed(() => groupByDept(undoneList.value))
const doneGroups = computed(() => groupByDept(doneList.value))

// 零打卡记录与全满只影响呈现，不改变分组口径：
// 已打卡 0（且成员非空）→ 只显示一行说明、不渲染名单块；已打卡 >0 且未打卡 0 → 「全部已打卡」；
// 成员列表为空（含搜索无结果）→ 「当日暂无成员或打卡数据」
const noData = computed(() => list.value.length === 0)
const noRecord = computed(() => !noData.value && doneList.value.length === 0)
const allDone = computed(() => undoneList.value.length === 0 && doneList.value.length > 0)
const doneTitle = computed(() => (allDone.value ? '全部已打卡' : '已打卡'))

// 日期/部门变化重新查询
watch([date, deptId], loadData)

async function loadData() {
  loading.value = true
  try {
    const kw = keyword.value.trim()
    const res = await adminApi.checkins({
      date: date.value,
      deptId: deptId.value,
      // 空关键字不作为筛选条件传给后端
      ...(kw ? { keyword: kw } : {}),
      pageNum: 1,
      pageSize: PAGE_SIZE
    })
    list.value = res?.rows || []
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
.status-toolbar {
  margin-bottom: 16px;
  gap: 12px;
}
.status-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}
.total-count {
  color: var(--brand);
  font-weight: 600;
}

.status-blocks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.status-block {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  min-width: 0;
}
.status-block.undone {
  border-color: #f0d3a8;
  background: #fffaf3;
}
.status-block.done {
  border-color: #dbe7e0;
  background: #fafcfb;
}

/* 全部未打卡时的中性说明：只陈述当日没有记录，不评价个人 */
.status-tip {
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f4f6f8;
  color: var(--text-sub);
  font-size: 13px;
}
.empty-panel {
  padding: 40px 16px;
  text-align: center;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.block-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.block-title { font-size: 15px; font-weight: 600; }
.status-block.undone .block-title { color: #a4600f; }
.status-block.done .block-title { color: #6b7d73; font-weight: 500; }

/* 块内按部门分组：组标题 + 组内纯文字名单，整段可直接复制 */
.dept-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dept-group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 2px;
}
.status-block.undone .dept-group-title { color: #a4600f; }
.status-block.done .dept-group-title { color: #6b7d73; }

/* 纯文字名单：姓名之间用全角空格分隔，整块一行排开、自动折行，不用胶囊/表格 */
.name-line {
  font-size: 14px;
  line-height: 2;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
}
.status-block.undone .name-line { color: #8a5209; font-weight: 500; }
.status-block.done .name-line { color: #58705f; }

.block-empty {
  padding: 20px 0;
  text-align: center;
}

/* 窄屏：筛选纵向堆叠，两块上下堆叠（未打卡在上） */
@media (max-width: 767px) {
  .status-toolbar { flex-wrap: wrap; align-items: flex-start; gap: 10px; }
  .status-filters { flex-wrap: wrap; width: 100%; gap: 10px 16px; }
  .status-filters > div { flex: 1 1 100%; }
  .status-blocks { grid-template-columns: 1fr; }
  .name-line { max-height: 320px; }
}
</style>
