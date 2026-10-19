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
import { adminApi } from '@/api'

const route = useRoute()
const router = useRouter()

const deptList = ['', '综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']
const role = ref(localStorage.getItem('role') || 'member')
const roleLabel = computed(() => ({ minister: '部长', director: '中心主任' }[role.value] || '部长'))
const dept = ref(localStorage.getItem('adminDept') || '')

// 👇 这里不再是写死的数组，而是动态获取的菜单
const menus = ref([])

// 加载菜单
async function loadMenus() {
  // 如果是主任且未指定部门，或者部长有自己的部门，向后端请求对应的菜单
  const res = await adminApi.getMenus(dept.value, role.value)
  menus.value = res || []
}

function changeDept(val) {
  localStorage.setItem('adminDept', val)
  dept.value = val
  loadMenus() // 切换部门时重新拉取菜单

  // 检查当前路由是否在新菜单中，如果被移除了，就跳回概览
  const currentPath = route.path.split('/').pop()
  const hasPermission = menus.value.some(m => m.path === currentPath)
  if (!hasPermission && currentPath !== 'overview') {
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
  loadMenus() // 初始化加载
})
</script>