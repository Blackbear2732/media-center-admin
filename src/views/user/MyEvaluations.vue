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

      <div v-else v-for="item in list" :key="item.id" class="eval-card surface-card" @click="viewDetail(item)">
        <div class="card-header">
          <div class="month-badge">{{ item.month }} 月度考评</div>
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
              <span class="label">部长附加分</span>
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
          <span class="link-text">查看得分明细 <el-icon><ArrowRight /></el-icon></span>
        </div>
      </div>
    </div>

    <!-- 👇 重构后的明细弹窗 -->
    <el-dialog v-model="detailVisible" title="考评得分明细" width="520px">
      <div v-if="currentEval" class="detail-content">

        <!-- 顶部总分展示 -->
        <div class="detail-top">
          <div>
            <div class="muted" style="color: rgba(255,255,255,0.8); margin-bottom: 4px;">{{ currentEval.month }} 综合总分</div>
            <div class="big-score">{{ currentEval.total }}<span>分</span></div>
          </div>
          <el-tag :type="getLevelType(currentEval.level)" effect="dark" size="large" style="border: none; font-weight: 600;">
            {{ currentEval.level || '未评级' }}
          </el-tag>
        </div>

        <!-- 算分明细区 -->
        <div class="breakdown-section">
          <div class="section-title">📈 系统自动算分（共 {{ currentEval.autoScore }} 分）</div>

          <div class="score-row">
            <span>📅 日常打卡（{{ currentEval.details?.checkinDays || 0 }}天）</span>
            <span class="plus-score">+{{ currentEval.details?.checkinScore || 0 }}</span>
          </div>

          <div class="score-row" style="flex-direction: column; align-items: flex-start; gap: 8px; padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span>📸 任务参与加分</span>
              <!-- 👇 合并展示：基础分 + 附加分 -->
              <span class="plus-score">+{{ (currentEval.details?.taskScore || 0) + (currentEval.details?.taskExtraScore || 0) }}</span>
            </div>
            <!-- 任务明细列表 -->
            <div class="sub-list" v-if="currentEval.details?.taskList?.length">
              <div v-for="(t, i) in currentEval.details.taskList" :key="i" class="sub-item">
                <span class="dot"></span> {{ t.title }}
                <span class="sub-score">+{{ t.score }}</span>
              </div>
              <!-- 如果有额外的任务表现分，单独列一条 -->
              <div v-if="currentEval.details?.taskExtraScore > 0" class="sub-item" style="color: var(--accent);">
                <span class="dot" style="background: var(--accent);"></span> 任务额外表现加分
                <span class="sub-score">+{{ currentEval.details.taskExtraScore }}</span>
              </div>
            </div>
          </div>

          <div class="score-row" style="flex-direction: column; align-items: flex-start; gap: 8px; border-bottom: none;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span>🏢 会议到场加分</span>
              <span class="plus-score">+{{ currentEval.details?.meetingScore || 0 }}</span>
            </div>
            <!-- 会议明细列表 -->
            <div class="sub-list" v-if="currentEval.details?.meetingList?.length">
              <div v-for="(m, i) in currentEval.details.meetingList" :key="i" class="sub-item">
                <span class="dot"></span> {{ m.title }}
                <span class="sub-score">+{{ m.score }}</span>
              </div>
            </div>
            <span v-else class="muted" style="font-size:12px; margin-top: 4px;">本月无会议加分</span>
          </div>
        </div>

        <!-- 部长手动加分 -->
        <div class="breakdown-section" style="margin-top: 16px;">
          <div class="section-title">👑 部长手动评分（共 {{ currentEval.manualScore }} 分）</div>
          <div class="score-row" style="border-bottom: none; padding-bottom: 0;">
            <span>额外附加分</span>
            <span class="plus-score" style="color: var(--accent);">+{{ currentEval.manualScore }}</span>
          </div>
          <div class="remark-box">
            <div class="muted" style="font-size: 12px; margin-bottom: 4px;">部长评语：</div>
            {{ currentEval.details?.extraNote || '本月表现良好，继续加油！' }}
          </div>
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

.card-header { display: flex; justify-content: space-between; align-items: center; }
.month-badge { font-size: 16px; font-weight: 700; color: var(--brand-deep); }

.score-block {
  display: flex;
  justify-content: space-between;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
}
.score-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.score-item .label { font-size: 12px; color: var(--text-sub); }
.score-item .value { font-size: 18px; font-weight: 600; }
.score-item.total .value { font-size: 22px; font-weight: 700; color: var(--accent); }

.card-footer { border-top: 1px dashed var(--border); padding-top: 14px; }
.link-text { font-size: 13px; color: var(--brand); display: flex; align-items: center; gap: 4px; }

/* 弹窗明细样式 */
.detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--brand), #4a86b8);
  padding: 20px 24px;
  border-radius: 12px;
  color: #fff;
  margin-bottom: 20px;
}
.big-score { font-size: 32px; font-weight: 700; line-height: 1; }
.big-score span { font-size: 14px; font-weight: normal; margin-left: 4px; }

.breakdown-section {
  background: #fafbfc;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.section-title { font-weight: 600; font-size: 14px; margin-bottom: 12px; color: var(--text); }

.score-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 14px;
  color: var(--text-sub);
}
.plus-score { color: var(--brand); font-weight: 600; font-size: 15px; }

.sub-list { margin-top: 4px; width: 100%; background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #eef2f6; }
.sub-item { display: flex; align-items: center; font-size: 13px; color: var(--text-sub); padding: 4px 0; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: #cbd5e1; margin-right: 8px; }
.sub-score { margin-left: auto; font-weight: 500; color: var(--brand); }

.remark-box {
  margin-top: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  color: var(--text);
  font-size: 13px;
  line-height: 1.6;
}
</style>