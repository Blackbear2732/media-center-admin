<template>
  <div v-loading="loading" style="max-width:860px;margin:0 auto">
    <div class="surface-card" style="padding:24px">
      <div class="flex-between" style="margin-bottom:20px">
        <b style="font-size:18px">{{ deptLabel }} · 部门风采</b>
        <div style="display:flex;align-items:center;gap:14px">
          <span class="back-home" @click="router.push('/')">返回首页 →</span>
          <el-select v-model="deptId" style="width:160px" @change="load">
            <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
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
              fit="contain"
              class="showcase-img"
              lazy
          >
            <template #error>
              <div class="img-error"><el-icon><Picture /></el-icon><span>图片加载失败</span></div>
            </template>
          </el-image>
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
import { Picture } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import { DEPT_OPTIONS, getDeptLabel } from '@/utils/dict'

const route = useRoute()
const router = useRouter()
import { useDelayedLoading } from '@/utils/loading'
const loading = useDelayedLoading()
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
.back-home {
  color: var(--brand, #2a6fb5);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.back-home:hover {
  text-decoration: underline;
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
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  cursor: zoom-in;
  background: #f6f7f9;
}
.img-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  color: #999;
  font-size: 12px;
}
/* 移动端照片墙双列紧凑展示 */
@media (max-width: 768px) {
  .showcase-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>
