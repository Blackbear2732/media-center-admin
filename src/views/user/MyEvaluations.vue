<template>
  <div class="page">
    <div class="list-head">
      <div>
        <h2>我的考评</h2>
        <p class="muted">共 {{ list.length }} 个月的考评记录</p>
      </div>
    </div>

    <div v-loading="loading" class="eval-list">
      <el-empty v-if="!loading && list.length === 0" description="暂无考评记录" />

      <!-- 使用卡片网格展示，更简洁扁平 -->
      <div v-else v-for="item in list" :key="item.id" class="eval-card surface-card" @click="viewDetail(item)">
        <div class="card-header">
          <div class="month-badge">{{ item.month }}</div>
          <el-tag :type="getLevelType(item.level)" effect="dark" round>
            {{ item.level || '未评级' }}
          </el-tag>
        </div>

        <div class="card-body">
          <div class="score-block">
            <div class="score-item">
              <span class="label">自动得分</span>
              <span class="value" style="color: var(--brand);">{{ item.autoScore }}</span>
            </div>
            <div class="score-item">
              <span class="label">手动附加分</span>
              <span class="value" style="color: var(--accent);">+{{ item.manualScore }}</span>
            </div>
            <div class="score-item total">
              <span class="label">总分</span>
              <span class="value">{{ item.total }}</span>
            </div>
          </div>
        </div>

        <div class="card-footer flex-between">
          <span class="tag-soft">{{ item.dept }}</span>
          <span class="link-text">查看明细 <el-icon><ArrowRight /></el-icon></span>
        </div>
      </div>
    </div>

    <!-- 明细弹窗 -->
    <el-dialog v-model="detailVisible" title="考评明细" width="500px">
      <div v-if="currentEval" class="detail-content">
        <div class="detail-top">
          <div class="big-score">{{ currentEval.total }}<span>分</span></div>
          <div class="level-tag">
            <el-tag :type="getLevelType(currentEval.level)" effect="dark" size="large">
              {{ currentEval.level || '未评级' }}
            </el-tag>
          </div>
        </div>

        <div class="score-breakdown">
          <div class="breakdown-item">
            <span class="muted">系统自动算分</span>
            <b style="color: var(--brand);">{{ currentEval.autoScore }} 分</b>
          </div>
          <div class="breakdown-item">
            <span class="muted">部长手动附加</span>
            <b style="color: var(--accent);">+{{ currentEval.manualScore }} 分</b>
          </div>
        </div>

        <div class="sec-title" style="font-size: 14px; margin-top: 20px;">部长评语 / 备注</div>
        <div class="remark-box">
          {{ currentEval.details?.extraNote || '暂无备注' }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api'
import { ArrowRight } from '@element-plus/icons-vue'

const list = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentEval = ref(null)

const getLevelType = (level) => {
  const map = { '优秀': 'danger', '良好': 'success', '合格': 'primary', '不合格': 'info' }
  return map[level] || 'info'
}

function viewDetail(item) {
  currentEval.value = item
  detailVisible.value = true
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await userApi.myEvaluations()
    // 按月份倒序排列
    list.value = (res || []).sort((a, b) => b.month.localeCompare(a.month))
  } catch (e) {
    console.error('加载考评失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.list-head { margin-bottom: 24px; }
.list-head h2 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.list-head p { margin: 6px 0 0; }

.eval-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.eval-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.eval-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: #cfe0ee;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.month-badge {
  font-size: 16px;
  font-weight: 700;
  color: var(--brand-deep);
}

.score-block {
  display: flex;
  justify-content: space-between;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
}
.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.score-item .label { font-size: 12px; color: var(--text-sub); }
.score-item .value { font-size: 18px; font-weight: 600; }
.score-item.total .value { font-size: 22px; font-weight: 700; color: var(--accent); }

.card-footer {
  border-top: 1px dashed var(--border);
  padding-top: 14px;
}
.link-text {
  font-size: 13px;
  color: var(--brand);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 弹窗样式 */
.detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), #4a86b8);
  padding: 24px;
  border-radius: 12px;
  color: #fff;
  margin-bottom: 20px;
}
.big-score {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}
.big-score span {
  font-size: 14px;
  font-weight: normal;
  margin-left: 4px;
}
.level-tag :deep(.el-tag) {
  border: none;
  font-size: 16px;
  padding: 0 16px;
  height: 32px;
  line-height: 32px;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fafbfc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.breakdown-item b { font-size: 16px; }

.remark-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.6;
  border: 1px dashed var(--border);
}
</style>