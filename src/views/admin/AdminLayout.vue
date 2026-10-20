<template>
  <div class="admin-shell">
    <div class="admin-head">
      <div>
        <h2>部门管理区</h2>
        <p class="muted">{{ roleLabel }} · {{ dept ? `当前部门：${dept}` : '全中心视角' }}</p>
      </div>
      <div class="admin-actions">
        <el-select v-if="userStore.isDirector" v-model="dept" style="width:150px" @change="changeDept">
          <el-option v-for="d in deptList" :key="d" :label="d === '' ? '全部部门' : d" :value="d" />
        </el-select>
        <span v-else class="tag-soft">{{ dept }}</span>
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
      <!-- 👇 加上 :key="dept" -->
      <div class="admin-body">
        <router-view :key="dept" />
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {adminApi} from '@/api'
import {userStore} from '@/store/user'

const route = useRoute()
const router = useRouter()

const deptList = ['', '综合部', '网宣部', '影音部', '摄制部', '新闻部', '设计部']
const roleLabel = computed(() => userStore.isDirector ? '中心主任' : '部长')
const dept = computed({
  get: () => userStore.adminDept,
  set: (val) => userStore.setAdminDept(val)
})

const menus = ref([])

async function loadMenus() {
  const res = await adminApi.getMenus(dept.value, userStore.role)
  menus.value = res || []
}

function changeDept(val) {
  userStore.setAdminDept(val)
  loadMenus()
  router.push('/admin/overview')
}

onMounted(() => {
  if (userStore.isMinister) {
    userStore.setAdminDept(userStore.dept)
  }
  loadMenus()
})
</script>