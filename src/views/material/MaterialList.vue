<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>素材库</h2>
        <p class="muted">全局搜索 · 共 {{ list.length }} 条结果</p>
      </div>
    </div>

    <div class="search-card surface-card">
      <el-form :model="query" :inline="true" class="search-form">
        <el-form-item><el-input v-model="query.title" placeholder="按标题搜索" clearable /></el-form-item>
        <el-form-item><el-input v-model="query.content" placeholder="按正文搜索" clearable /></el-form-item>
        <el-form-item>
          <el-select v-model="query.department" placeholder="全部部门" clearable style="width:150px">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.name" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.leader" placeholder="主要领导" clearable style="width:140px">
            <el-option v-for="l in ['李书记', '王校长']" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width:250px" />
        </el-form-item>
        <el-form-item>
          <button class="pill active" type="button" @click="search">搜索</button>
          <button class="pill" type="button" style="margin-left:8px" @click="reset">重置</button>
        </el-form-item>
      </el-form>
    </div>

    <div class="material-grid" v-loading="loading">
      <div v-for="m in list" :key="m.id" class="material-card surface-card" @click="router.push('/materials/' + m.id)">
        <div class="material-type">{{ m.type }}</div>
        <h3>{{ m.title }}</h3>
        <p v-if="m.content" class="material-excerpt">{{ m.content.slice(0, 72) }}…</p>
        <div class="material-meta">
          <span>{{ m.department }}</span>
          <span>{{ m.author }}</span>
          <span>{{ m.createdAt }}</span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && !list.length" description="没有匹配的素材" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { materialApi, homeApi } from '@/api'

const router = useRouter()
const query = reactive({ title: '', content: '', department: '', leader: '' })
const dateRange = ref([])
const list = ref([]), loading = ref(false), departments = ref([])

async function search() {
  loading.value = true
  try {
    list.value = await materialApi.search({
      ...query, startTime: dateRange.value?.[0], endTime: dateRange.value?.[1]
    })
  } finally { loading.value = false }
}
function reset() {
  Object.assign(query, { title: '', content: '', department: '', leader: '' })
  dateRange.value = []
  search()
}
onMounted(async () => {
  departments.value = await homeApi.departments()
  search()
})
</script>