<template>
  <div class="admin-shell">
    <div class="admin-head">
      <div>
        <h2>部门管理区</h2>
        <p class="muted">{{ roleLabel }} · {{ deptLabel }}</p>
      </div>
      <div class="admin-actions">
        <!-- 主任可以切换部门视角（100-全中心） -->
        <!-- 只绑定 :model-value，部门写入统一在 changeDept 中完成，避免 setAdminDept 被调用两次 -->
        <el-select v-if="userStore.isDirector" :model-value="deptId" style="width:150px" @change="changeDept">
          <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <span v-else class="tag-soft">{{ deptLabel }}</span>
        <button class="pill" @click="router.push('/')">返回前台</button>
      </div>
    </div>

    <div class="admin-tabs">
      <router-link
          v-for="m in menus"
          :key="m.path"
          :to="'/admin/' + m.path"
          class="pill"
          :class="{ active: route.path === '/admin/' + m.path }"
      >
        {{ m.label }}
      </router-link>
    </div>

    <div class="admin-body">
      <!-- 加了 :key="deptId"，切换部门时强制刷新子页面 -->
      <router-view :key="deptId" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '@/api'
import { userStore } from '@/store/user'
import { ALL_DEPT_ID, DEPT_OPTIONS, getDeptLabel, isAllDept } from '@/utils/dict'

const route = useRoute()
const router = useRouter()
const roleLabel = computed(() => userStore.isDirector ? '中心主任' : '部长')

// 当前管理视角部门：数字 deptId（100 = 全中心），只读，写入统一走 changeDept
const deptId = computed(() => userStore.viewDeptId)

const deptLabel = computed(() => {
  const id = deptId.value
  return isAllDept(id) ? '全中心视角' : `当前部门：${getDeptLabel(id)}`
})

// 菜单由后端（Mock）统一提供，避免前端再硬编码一套部门专属菜单
const menus = ref([])

// 接口异常时的兜底菜单，保证管理区仍可使用
const FALLBACK_MENUS = [
  { path: 'overview', label: '概览' },
  { path: 'members', label: '成员管理' },
  { path: 'tasks', label: '任务参与' },
  { path: 'meetings', label: '会议管理' },
  { path: 'evaluations', label: '考评管理' },
  { path: 'eval-templates', label: '考评模板' },
  { path: 'materials', label: '本部门素材' },
  { path: 'announcements', label: '公告管理' },
  { path: 'dept-profile', label: '部门介绍' }
]

async function loadMenus() {
  let list = [...FALLBACK_MENUS]
  let fromApi = false
  try {
    const res = await adminApi.getMenus(deptId.value, userStore.role)
    if (Array.isArray(res) && res.length > 0) {
      list = [...res]
      fromApi = true
    }
  } catch (e) {
    console.error('加载管理区菜单失败，使用兜底菜单', e)
  }

  // 模块配置是主任专属入口，与部门无关，由前端补充
  if (userStore.isDirector && !list.some(m => m.path === 'module-config')) {
    list.push({ path: 'module-config', label: '模块配置' })
  }
  if (userStore.isDirector && !list.some(m => m.path === 'mail-batches')) {
    list.push({ path: 'mail-batches', label: '邮件管理' })
  }
  if (userStore.isDirector && !list.some(m => m.path === 'election')) {
    list.push({ path: 'election', label: '换届管理' })
  }
  // 打卡管理归综合部：接口异常兜底时也只有主任/综合部显示
  const canCheckin = userStore.isDirector || Number(userStore.deptId) === 101
  if (canCheckin && !list.some(m => m.path === 'checkins')) {
    list.push({ path: 'checkins', label: '打卡管理' })
  }
  // 设备管理归摄制部：接口异常兜底时也只有主任/摄制部显示
  const canDevices = userStore.isDirector || Number(userStore.deptId) === 104
  if (canDevices && !list.some(m => m.path === 'devices')) {
    list.push({ path: 'devices', label: '设备管理' })
  }
  menus.value = list

  // 当前停留在菜单已不可见的页面（例如从综合部切到新闻部后的「打卡管理」）时回到概览
  // 仅在服务端菜单可用时判断，避免接口异常时把用户从正常页面踢走
  if (!fromApi) return
  const currentPath = route.path.split('/').pop()
  if (currentPath && currentPath !== 'overview' && !list.some(m => m.path === currentPath)) {
    router.replace('/admin/overview')
  }
}

function changeDept(val) {
  userStore.setAdminDept(val)
  // 切换部门后重新拉取该部门的菜单；若当前页面已不可见，loadMenus 会跳回概览
  loadMenus()
}

watch(() => userStore.role, loadMenus)

onMounted(() => {
  if (userStore.isMinister) {
    userStore.setAdminDept(userStore.deptId)
  } else if (userStore.isDirector && !userStore.adminDept) {
    userStore.setAdminDept(ALL_DEPT_ID)
  }
  loadMenus()
})
</script>

<style scoped>
.admin-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.admin-head h2 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.admin-head p { margin: 6px 0 0; }
.admin-actions { display: flex; align-items: center; gap: 10px; }
.admin-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.admin-tabs .pill { text-decoration: none; }
.admin-body { min-height: 300px; }
.admin-tabs {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 8px;
}
/* 隐藏滚动条 */
.admin-tabs::-webkit-scrollbar { display: none; }
</style>
