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

const route = useRoute()
const router = useRouter()

// 部门列表（空字符串代表全部部门）
const deptList = ['', '综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']

const role = ref(localStorage.getItem('role') || 'member')
const roleLabel = computed(() => ({ minister: '部长', director: '中心主任' }[role.value] || '部长'))
const dept = ref(localStorage.getItem('adminDept') || '')

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

const menus = computed(() => {
  const list = [...baseMenus]

  // 综合部专属：打卡管理 + 数据看板
  if (dept.value === '综合部' || dept.value === '') {
    list.push({ path: 'checkins', label: '打卡管理' })
    list.push({ path: 'dashboard', label: '数据看板' })
  }

  // 摄制部专属：设备管理
  if (dept.value === '摄制部' || dept.value === '') {
    list.push({ path: 'devices', label: '设备管理' })
  }

  return list
})

function changeDept(val) {
  localStorage.setItem('adminDept', val)
  // 如果正在看只有某部门才有的模块（如设备/打卡），切换部门后跳回概览
  if (route.path.includes('checkins') || route.path.includes('devices') || route.path.includes('dept-profile')) {
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
})
</script>