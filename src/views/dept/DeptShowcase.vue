<template>
  <div v-loading="loading" style="max-width:860px;margin:0 auto">
    <div class="surface-card" style="padding:24px">
      <div class="flex-between showcase-head">
        <div>
          <b class="showcase-head-title">{{ pageTitle }}</b>
          <div v-if="isCenter && loaded" class="showcase-head-sub">
            共 {{ deptEntries.length }} 个部门 · {{ form.members.length }} 位在册成员
          </div>
        </div>
        <div class="showcase-actions">
          <span v-if="!isCenter" class="back-link" @click="goCenter">← 全中心</span>
          <span class="back-home" @click="router.push('/')">返回首页 →</span>
          <el-select class="dept-select" :model-value="deptId" @change="onDeptChange">
            <el-option v-for="d in DEPT_OPTIONS" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
      </div>

      <!-- 接口失败与「确实未填写」分开呈现，避免把请求失败误报成空简介 -->
      <template v-if="loadError">
        <el-alert
            type="error"
            :closable="false"
            show-icon
            title="简介加载失败"
            :description="loadError"
        />
        <div class="showcase-retry">
          <el-button size="small" @click="load">重新加载</el-button>
        </div>
      </template>

      <template v-else>
        <div v-if="form.intro" class="showcase-intro">
          <p>{{ form.intro }}</p>
        </div>
        <!-- 只有请求成功且确实无简介时才显示空状态，加载中不闪现空文案 -->
        <el-empty v-else-if="loaded" :description="emptyText" :image-size="70" />

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

        <!-- 全中心：各部门入口，可直接点进任意部门 -->
        <div v-if="isCenter" style="margin-top:24px">
          <div class="showcase-title">各部门风采</div>
          <div class="showcase-grid dept-entry-grid">
            <div
                v-for="d in deptEntries"
                :key="d.id"
                class="dept-entry"
                @click="goDept(d.id)"
            >
              <div class="dept-entry-name">{{ d.name }}</div>
              <div v-if="d.intro" class="dept-entry-intro">{{ d.intro }}</div>
              <div class="dept-entry-link">查看部门风采 →</div>
            </div>
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
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { adminApi, homeApi } from '@/api'
import { DEPT_OPTIONS, DEPT_MAP, getDeptLabel, ALL_DEPT_ID, isAllDept } from '@/utils/dict'
import { useDelayedLoading } from '@/utils/loading'
import { getFriendlyErrorMessage } from '@/api/request'

const route = useRoute()
const router = useRouter()
const loading = useDelayedLoading()

// 路由带 deptId 即具体部门；/dept 无参数（或 100）即全中心
const deptId = computed(() => {
  const raw = route.params.deptId
  if (raw === undefined || raw === '' || raw === null) return ALL_DEPT_ID
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : ALL_DEPT_ID
})
const isCenter = computed(() => isAllDept(deptId.value))
const deptLabel = computed(() => getDeptLabel(deptId.value))
const pageTitle = computed(() => `${deptLabel.value} · 部门风采`)
const emptyText = computed(() => (isCenter.value ? '全中心暂未填写简介' : '该部门暂未填写简介'))

const form = reactive({ intro: '', photos: [], members: [] })
const loadError = ref('')
const loaded = ref(false)

// 部门入口：优先用 /api/departments 的简介；接口异常时退回前端字典里的部门名，不伪造简介
const deptOptions = DEPT_OPTIONS.filter(d => d.value !== ALL_DEPT_ID)
const deptEntries = ref(deptOptions.map(d => ({ id: d.value, name: d.label, intro: '' })))

let requestSeq = 0

async function loadDeptEntries() {
  try {
    const list = await homeApi.departments()
    if (!Array.isArray(list) || !list.length) return
    deptEntries.value = deptOptions.map(d => {
      const hit = list.find(item => Number(item.id) === d.value)
      return {
        id: d.value,
        name: hit?.name || DEPT_MAP[d.value] || d.label,
        intro: hit?.intro || ''
      }
    })
  } catch (e) {
    // 部门入口是附加信息，失败不影响全中心简介展示
  }
}

function resetForm() {
  form.intro = ''
  form.photos = []
  form.members = []
}

function errorText(e) {
  if (!e?.response) return '网络异常或服务不可用，请稍后重试'
  return getFriendlyErrorMessage(e, '请稍后重试')
}

async function load() {
  const seq = ++requestSeq
  const targetDeptId = deptId.value
  loadError.value = ''
  resetForm()
  loaded.value = false
  loading.value = true
  // 被导航取消时保持 loading，等路由更新后的下一次 load 接管，避免闪现空状态
  let cancelled = false
  if (isCenter.value) loadDeptEntries()

  try {
    // cache:false：切换部门后立即回源，避免 4s 内的 GET 缓存把上一部门数据带回来
    const data = await adminApi.deptProfile(targetDeptId, { cache: false })
    if (seq !== requestSeq) return
    // GET 被全局取消时拦截器会 resolve(null)：属于导航中断，不是空简介也不是接口失败
    if (!data) {
      cancelled = true
      return
    }
    Object.assign(form, {
      intro: data.intro || '',
      photos: data.photos || [],
      members: data.members || []
    })
    loaded.value = true
    document.title = `${pageTitle.value} - 山西农业大学青年融媒体中心`
  } catch (e) {
    if (seq !== requestSeq) return
    resetForm()
    loaded.value = false
    loadError.value = errorText(e)
  } finally {
    if (seq === requestSeq && !cancelled) loading.value = false
  }
}

function onDeptChange(value) {
  const target = Number(value)
  if (!Number.isFinite(target) || target === deptId.value) return
  router.push(target === ALL_DEPT_ID ? '/dept' : `/dept/${target}`)
}

function goDept(id) {
  router.push(`/dept/${id}`)
}

function goCenter() {
  router.push('/dept')
}

// 只监听路由参数：选择部门先触发导航，beforeEach 取消旧请求后再由这里发起新请求，
// 避免「先发请求、再被导航取消」导致返回 null 被当成空简介（旧实现的根因）。
watch(() => route.params.deptId, () => {
  document.title = `${pageTitle.value} - 山西农业大学青年融媒体中心`
  load()
}, { immediate: true })
</script>

<style scoped>
.showcase-head {
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}
.showcase-head-title {
  font-size: 18px;
}
.showcase-head-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub, #909399);
}
.showcase-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.dept-select {
  width: 160px;
}
.back-link,
.back-home {
  color: var(--brand, #2a6fb5);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.back-link {
  color: var(--text-sub, #666);
}
.back-link:hover,
.back-home:hover {
  text-decoration: underline;
}
.showcase-retry {
  margin-top: 16px;
  text-align: center;
}
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
.dept-entry {
  padding: 14px;
  border: 1px solid var(--border-color, #eee);
  border-radius: 10px;
  background: #fafbfd;
  cursor: pointer;
  transition: border-color .18s, box-shadow .18s, transform .18s;
  min-width: 0;
}
.dept-entry:hover {
  border-color: var(--brand, #2a6fb5);
  box-shadow: 0 6px 16px rgba(42, 111, 181, .1);
  transform: translateY(-1px);
}
.dept-entry-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text, #333);
}
.dept-entry-intro {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-sub, #909399);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dept-entry-link {
  margin-top: 10px;
  font-size: 12px;
  color: var(--brand, #2a6fb5);
}
/* 移动端照片墙双列紧凑展示 */
@media (max-width: 768px) {
  .showcase-head {
    align-items: flex-start;
  }
  .showcase-actions {
    width: 100%;
    gap: 10px;
  }
  .dept-select {
    width: 132px;
  }
  .showcase-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .dept-entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dept-entry {
    padding: 12px;
  }
}
</style>
