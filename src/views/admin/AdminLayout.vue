<template>
  <div class="admin-shell">
    <div class="admin-head">
      <div>
        <h2>部门管理区</h2>
        <p class="muted">{{ roleLabel }} · {{ deptLabel }}</p>
      </div>
      <div class="admin-actions">
        <!-- 主任可以切换部门视角（100-全中心） -->
        <el-select v-if="userStore.isDirector" v-model="deptId" style="width:150px" @change="changeDept">
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
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userStore } from '@/store/user'
import { ALL_DEPT_ID, DEPT_OPTIONS, getDeptLabel, isAllDept } from '@/utils/dict'

const route = useRoute()
const router = useRouter()

const roleLabel = computed(() => userStore.isDirector ? '中心主任' : '部长')

// 当前管理视角部门：数字 deptId（100 = 全中心）
const deptId = computed({
  get: () => userStore.viewDeptId,
  set: (val) => userStore.setAdminDept(val)
})

const deptLabel = computed(() => {
  const id = deptId.value
  return isAllDept(id) ? '全中心视角' : `当前部门：${getDeptLabel(id)}`
})

const baseMenus = [
  { path: 'overview', label: '概览' },
  { path: 'members', label: '成员管理' },
  { path: 'tasks', label: '任务参与' },
  { path: 'meetings', label: '会议管理' },
  { path: 'evaluations', label: '考评管理' },
  { path: 'materials', label: '本部门素材' },
  { path: 'announcements', label: '公告管理' },
  { path: 'dept-profile', label: '部门介绍' }
]

// 动态组合菜单
const menus = computed(() => {
  const list = [...baseMenus]
  const id = Number(deptId.value)

  // 综合部（101）或全中心（100）视角，加上打卡和数据看板
  if (id === 101 || isAllDept(id)) {
    list.push({ path: 'checkins', label: '打卡管理' })
    list.push({ path: 'dashboard', label: '数据看板' })
  }

  // 摄制部（104）或全中心视角，加上设备管理
  if (id === 104 || isAllDept(id)) {
    list.push({ path: 'devices', label: '设备管理' })
  }

  // 主任专属的模块配置
  if (userStore.isDirector) {
    list.push({ path: 'module-config', label: '模块配置' })
  }

  return list
})

function changeDept(val) {
  userStore.setAdminDept(val)
  // 切换部门后，如果当前停留在专属页面，跳回概览，防止报错
  const currentPath = route.path.split('/').pop()
  const hasPermission = menus.value.some(m => m.path === currentPath)
  if (!hasPermission && currentPath !== 'overview') {
    router.push('/admin/overview')
  }
}

onMounted(() => {
  if (userStore.isMinister) {
    userStore.setAdminDept(userStore.deptId)
  } else if (userStore.isDirector && !userStore.adminDept) {
    userStore.setAdminDept(ALL_DEPT_ID)
  }
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
</style>
