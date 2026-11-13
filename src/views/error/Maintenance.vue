<template>
  <div class="maintenance-container">
    <div class="container">
      <div class="icon">{{ planned ? '🛠️' : '⚠️' }}</div>
      <h1>{{ planned ? '系统例行维护中' : '服务暂时不可用' }}</h1>
      <template v-if="planned">
        <p>
          融媒体中心系统每日 23:00 至次日 07:00 为例行维护时段，<br>
          期间将进行升级与数据备份，预计 07:00 恢复服务。<br>
          感谢您的理解与支持。
        </p>
        <p class="tip">维护时段：每日 23:00 - 次日 07:00</p>
      </template>
      <p v-else>服务暂时不可用，请稍后重试。</p>
      <button class="btn" @click="retry">重新连接</button>
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
.maintenance-container {
  background-color: #f4f6f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.container {
  text-align: center;
  background: #fff;
  padding: 40px;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(24, 52, 77, .08);
  max-width: 500px;
  border-top: 4px solid #e8833a;
}

.icon {
  font-size: 60px;
  margin-bottom: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #e8833a;
}

p {
  color: #6b7a8c;
  font-size: 14px;
  margin-bottom: 25px;
  line-height: 1.6;
}

.tip {
  font-size: 13px;
  margin-top: -15px;
  color: #9aa7b5;
}

.btn {
  display: inline-block;
  padding: 10px 24px;
  background: #2b5f8e;
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 50px;
  font-size: 14px;
  transition: background 0.2s;
}

.btn:hover {
  background: #153a56;
}
</style>
