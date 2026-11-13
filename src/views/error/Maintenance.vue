<template>
  <div class="maintenance-page">
    <div class="maintenance-panel">
      <!-- 左侧品牌区：与登录页同一套标识与配色 -->
      <aside class="brand-side">
        <div class="brand-top">
          <div class="brand-logos">
            <img src="/image/logo/school.png" alt="校徽" />
            <img src="/image/logo/league.png" alt="团徽" />
            <img src="/image/logo/media.png" alt="融媒 Logo" class="main-logo" />
          </div>
          <h2>青年融媒体中心</h2>
          <p>山西农业大学 · 一次采集 · 多元生成 · 多端发布</p>
        </div>
        <div class="brand-foot">{{ planned ? 'SCHEDULED MAINTENANCE' : 'SERVICE UNAVAILABLE' }}</div>
      </aside>

      <!-- 右侧状态区：纯静态，不依赖任何接口 -->
      <main class="status-side">
        <section class="status-card" role="status" aria-live="polite">
          <span class="status-badge" :class="planned ? 'is-planned' : 'is-down'">
            <i class="dot"></i>{{ planned ? '计划维护' : '服务异常' }}
          </span>

          <div class="status-icon" :class="planned ? 'is-planned' : 'is-down'">
            <svg v-if="planned" viewBox="0 0 48 48" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="24" cy="24" r="7.5" />
              <path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M36.7 11.3l-3.5 3.5M14.8 33.2l-3.5 3.5" />
            </svg>
            <svg v-else viewBox="0 0 48 48" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="7" y="9" width="25" height="10" rx="3" />
              <rect x="7" y="24" width="25" height="10" rx="3" />
              <path d="M13 14h.01M13 29h.01" />
              <circle cx="35.5" cy="35" r="6.5" />
              <path d="M35.5 31.8v4M35.5 38.6v.1" />
            </svg>
          </div>

          <h1>{{ planned ? '系统例行维护中' : '服务暂时不可用' }}</h1>

          <template v-if="planned">
            <p class="status-desc">
              系统正在按计划进行升级与数据备份，维护期间数据不会丢失，
              请在维护结束后再访问，感谢您的理解与支持。
            </p>
            <dl class="status-meta">
              <div>
                <dt>维护时段</dt>
                <dd>每日 23:00 - 次日 07:00</dd>
              </div>
              <div>
                <dt>预计恢复</dt>
                <dd>07:00</dd>
              </div>
            </dl>
          </template>
          <p v-else class="status-desc">服务暂时不可用，请稍后重试。</p>

          <div class="status-actions">
            <button class="retry-btn" type="button" @click="retry">重新连接</button>
            <span class="status-hint">恢复后点击即可返回系统</span>
          </div>

          <p class="status-foot">如长时间无法访问，请联系系统管理员。</p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MAINTENANCE_TYPE, getMaintenanceType } from '@/utils/maintenance'

const route = useRoute()

// query.type 只作为进入维护页那一刻的参考（由请求层按时段写入）；
// 之后每分钟按当前时间重新判断，长时间停留跨过 23:00 / 07:00 时文案自动切换
const queryType = route.query.type
const type = ref(
  queryType === MAINTENANCE_TYPE.PLANNED || queryType === MAINTENANCE_TYPE.UNPLANNED
    ? queryType
    : getMaintenanceType()
)
const planned = computed(() => type.value === MAINTENANCE_TYPE.PLANNED)

let tickTimer = null
onMounted(() => {
  tickTimer = setInterval(() => {
    type.value = getMaintenanceType()
  }, 60 * 1000)
})
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
})

// 项目里没有免鉴权的健康检查接口，后端恢复后整页刷新即可重新进入系统
const retry = () => {
  window.location.replace('/')
}
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: var(--bg);
}

.maintenance-panel {
  width: min(100%, 880px);
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  background: #fff;
  border: 1px solid rgba(230, 235, 241, 0.8);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* ===================== 左侧品牌区 ===================== */
.brand-side {
  background: linear-gradient(160deg, #153a56 0%, #2b5f8e 100%);
  color: #fff;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}

.brand-logos {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.brand-logos img {
  height: 38px;
  width: auto;
  background: rgba(255, 255, 255, 0.15);
  padding: 5px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-logos .main-logo {
  height: 46px;
  background: #fff;
}

.brand-top h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.brand-top p {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.72);
}

.brand-foot {
  font-size: 11px;
  letter-spacing: 1.6px;
  color: rgba(255, 255, 255, 0.5);
}

/* ===================== 右侧状态区 ===================== */
.status-side {
  display: flex;
  align-items: center;
  padding: 44px 44px 36px;
}

.status-card {
  width: 100%;
  min-width: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.is-planned {
  color: var(--accent);
  background: #fdf2e9;
}

.status-badge.is-down {
  color: var(--el-color-danger);
  background: #fdeeee;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 22px 0 18px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon svg {
  width: 30px;
  height: 30px;
}

.status-icon.is-planned {
  color: var(--accent);
  background: #fdf2e9;
}

.status-icon.is-down {
  color: var(--el-color-danger);
  background: #fdeeee;
}

.status-card h1 {
  margin: 0 0 12px;
  font-size: 24px;
  letter-spacing: 0.5px;
  color: var(--text);
}

.status-desc {
  margin: 0;
  max-width: 40ch;
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-sub);
}

.status-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.status-meta div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-meta dt {
  font-size: 12px;
  color: var(--text-sub);
}

.status-meta dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-deep);
}

.status-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 26px;
}

.retry-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: var(--brand-deep);
}

.status-hint {
  font-size: 12px;
  color: var(--text-sub);
}

.status-foot {
  margin: 24px 0 0;
  font-size: 12px;
  color: #9aa7b5;
}

/* ===================== 响应式 ===================== */
@media (max-width: 820px) {
  .maintenance-page {
    padding: 24px 16px;
    align-items: flex-start;
  }

  .maintenance-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .brand-side {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
    padding: 18px 20px;
  }

  .brand-logos {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .brand-logos img {
    height: 30px;
  }

  .brand-logos .main-logo {
    height: 36px;
  }

  .brand-top h2 {
    margin: 0;
    font-size: 16px;
  }

  .brand-top p,
  .brand-foot {
    display: none;
  }

  .status-side {
    padding: 28px 22px 26px;
  }

  .status-icon {
    width: 56px;
    height: 56px;
    margin: 18px 0 16px;
    border-radius: 14px;
  }

  .status-icon svg {
    width: 26px;
    height: 26px;
  }

  .status-card h1 {
    font-size: 22px;
  }
}

@media (max-width: 420px) {
  .status-meta {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .status-actions {
    gap: 10px;
  }

  .retry-btn {
    width: 100%;
  }
}
</style>
