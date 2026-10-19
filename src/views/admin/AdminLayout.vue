<template>
  <div class="admin-shell">
    <div class="admin-head">
      <div>
        <h2>部门管理区</h2>
        <p class="muted">{{ roleLabel }} · {{ dept ? `当前部门：${dept}` : '全中心视角' }}</p>
      </div>
      <div class="admin-actions">
        <!-- 主任可以切换部门或看全部 -->
        <el-select v-if="role === 'director'" v-model="dept" style="width:150px" @change="changeDept">
          <el-option v-for="d in deptList" :key="d" :label="d === '' ? '全部部门' : d" :value="d" />
        </el-select>
        <span v-else class="tag-soft">{{ dept }}</span>
        <button class="pill" @click="router.push('/')">返回前台</button>
      </div>
    </div>

    <div class="admin-tabs">
      <router-link v-for="m in menus" :key="m.path" :to="'/admin/' + m.path"
                   class="pill" :class="{ active: route.path === '/admin/' + m.path }">
        {{ m.label }}
      </router-link>
    </div>

    <div class="admin-body"><router-view /></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '@/api' // 引入接口

const route = useRoute()
const router = useRouter()

const deptList = ['', '综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']
const role = ref(localStorage.getItem('role') || 'member')
const roleLabel = computed(() => ({ minister: '部长', director: '中心主任' }[role.value] || '部长'))
const dept = ref(localStorage.getItem('adminDept') || '')

// 当前部门拥有的动态模块列表
const dynamicModules = ref([])

// 基础菜单（所有人都有的）
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

// 动态扩展菜单的映射字典
const extraMenuDict = {
  'checkin': { path: 'checkins', label: '打卡管理' },
  'dashboard': { path: 'dashboard', label: '数据看板' },
  'device': { path: 'devices', label: '设备管理' }
}

// 最终渲染的菜单
const menus = computed(() => {
  const list = [...baseMenus]
  // 遍历当前部门拥有的扩展模块，从字典中取出对应的菜单项添加进去
  dynamicModules.value.forEach(mod => {
    if (extraMenuDict[mod]) {
      list.push(extraMenuDict[mod])
    }
  })
  return list
})

// 加载当前部门的配置
async function loadModules() {
  if (!dept.value) {
    // 如果是主任且选择了“全部部门”（空字符串），默认展示所有可能有的模块
    dynamicModules.value = ['checkin', 'dashboard', 'device']
  } else {
    // 如果是特定部门，请求后端的配置
    dynamicModules.value = await adminApi.getDeptModules(dept.value)
  }
}

function changeDept(val) {
  localStorage.setItem('adminDept', val)
  dept.value = val
  loadModules() // 切换部门时重新加载模块配置

  // 如果当前正在看某个专属页面，但新部门没有这个权限，则跳回概览
  const currentPath = route.path.split('/').pop()
  const hasPermission = menus.value.some(m => m.path === currentPath)
  if (!hasPermission) {
    router.push('/admin/overview')
  }
}

onMounted(() => {
  if (role.value === 'minister') {
    const uStr = localStorage.getItem('user')
    if (uStr) {
      try {
        const u = JSON.parse(uStr)
        if (u.dept) {
          dept.value = u.dept
          localStorage.setItem('adminDept', u.dept)
        }
      } catch (e) {}
    }
  }
  loadModules()
})
</script>