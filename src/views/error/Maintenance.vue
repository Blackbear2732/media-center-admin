<template>
  <div class="maintenance-container">
    <div class="container">
      <div class="icon">🛠️</div>
      <h1>系统正在升级维护</h1>
      <p>为了给您提供更优质的服务，融媒体中心系统目前正在进行短暂维护。<br>请稍后再试，感谢您的理解与支持。</p>
      <button class="btn" @click="retry">稍后重试</button>
    </div>
  </div>
</template>

<script setup>
// 整页刷新重试：后端恢复后刷新即可重新进入系统
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
