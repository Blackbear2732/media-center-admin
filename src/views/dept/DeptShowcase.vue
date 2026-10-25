<template>
  <div v-loading="loading" style="max-width:860px;margin:0 auto">
    <div class="surface-card" style="padding:24px">
      <div class="flex-between" style="margin-bottom:20px">
        <b style="font-size:18px">{{ deptLabel }} · 部门风采</b>
        <el-select v-model="deptId" style="width:160px" @change="load">
          <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </div>

      <div v-if="form.intro" class="showcase-intro">
        <p>{{ form.intro }}</p>
      </div>
      <el-empty v-else description="该部门暂未填写简介" :image-size="70" />

      <div v-if="form.photos && form.photos.length" style="margin-top:20px">
        <div class="showcase-title">精选照片</div>
        <div class="showcase-grid">
          <el-image
              v-for="(p, i) in form.photos"
              :key="i"
              :src="p"
              :preview-src-list="form.photos"
              :initial-index="i"
              fit="cover"
              class="showcase-img"
              lazy
          />
        </div>
      </div>

      <div v-if="form.members && form.members.length" style="margin-top:24px">
        <div class="showcase-title">团队成员</div>
        <div>
          <span v-for="m in form.members" :key="m.name" class="tag-soft" style="margin-right:8px;margin-bottom:8px">
            {{ m.name }}<template v-if="m.title"> · {{ m.title }}</template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '@/api'
import { DEPT_OPTIONS, getDeptLabel } from '@/utils/dict'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const deptId = ref(Number(route.params.deptId) || 101)
const form = reactive({ intro: '', photos: [], members: [] })
const deptLabel = computed(() => getDeptLabel(deptId.value))

async function load() {
  loading.value = true
  try {
    const data = await adminApi.deptProfile(deptId.value)
    Object.assign(form, {
      intro: data?.intro || '',
      photos: data?.photos || [],
      members: data?.members || []
    })
  } finally { loading.value = false }
}

watch(deptId, () => {
  router.replace({ path: `/dept/${deptId.value}` })
  load()
})

onMounted(load)
</script>

<style scoped>
.showcase-title {
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eee);
}
.showcase-intro {
  line-height: 1.9;
  color: var(--text-color, #333);
  white-space: pre-wrap;
}
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.showcase-img {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  cursor: zoom-in;
}
</style>
