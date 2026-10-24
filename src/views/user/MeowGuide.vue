<template>
  <div class="page">
    <!-- 返回 -->
    <button class="back-link" @click="router.back()">
      <el-icon><ArrowLeft /></el-icon> 返回
    </button>

    <!-- 头部 -->
    <div class="guide-hero">
      <div class="guide-hero-icon">📱</div>
      <div>
        <h1>MeoW 昵称获取教程</h1>
        <p>适用于华为鸿蒙（HarmonyOS）手机用户 · 五分钟完成配置</p>
      </div>
    </div>

    <!-- 简介 -->
    <div class="intro-card surface-card">
      <h3>什么是 MeoW？</h3>
      <p>
        MeoW 是运行在华为鸿蒙（HarmonyOS）手机上的通知接收应用。填写 MeoW 昵称后，
        融媒体中心的 <strong>任务、会议、公告</strong> 等通知将同步推送到您的手机，
        让您第一时间收到中心的工作提醒，不再错过任何重要消息。
      </p>
    </div>

    <!-- 步骤 -->
    <div class="section-head">
      <div>
        <h3>操作步骤</h3>
        <div class="sub">只需 5 步，即可完成配置</div>
      </div>
    </div>

    <div class="step-list">
      <div v-for="(s, i) in steps" :key="i" class="step-card surface-card">
        <div class="step-num">{{ i + 1 }}</div>
        <div class="step-body">
          <div class="step-title">{{ s.title }}</div>
          <div class="step-desc">{{ s.desc }}</div>
          <div v-if="s.tip" class="step-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ s.tip }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 注意事项 -->
    <div class="notice-card surface-card">
      <h3>⚠️ 注意事项</h3>
      <ul>
        <li>MeoW 仅支持华为鸿蒙（HarmonyOS 5.0 及以上）系统手机，其他品牌手机暂不支持。</li>
        <li>请确保 MeoW 应用已获得「通知权限」和「后台运行权限」，否则可能接收不到通知。</li>
        <li>昵称仅需填写一次，后续可在个人信息页面随时修改。</li>
        <li>如长时间未收到通知，请检查手机网络连接和 MeoW 的权限设置。</li>
        <li>如遇任何问题，可联系中心技术部协助处理。</li>
      </ul>
    </div>

    <!-- 底部按钮 -->
    <div class="guide-footer">
      <button class="pill active" @click="router.push('/profile')">
        <el-icon><Back /></el-icon> 返回个人信息填写昵称
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft, Back, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()

// 通用步骤模板，可根据 MeoW 实际 UI 调整
const steps = [
  {
    title: '下载安装 MeoW',
    desc: '在华为鸿蒙手机上打开「华为应用市场」，搜索 "MeoW"，点击下载并安装到手机。',
    tip: '请确认您的手机系统为 HarmonyOS 5.0 及以上版本。'
  },
  {
    title: '注册并登录账号',
    desc: '打开 MeoW 应用，使用手机号完成注册并登录。建议使用常用手机号，便于后续找回账号。'
  },
  {
    title: '设置个人昵称',
    desc: '进入「我的」→「个人资料」，点击「昵称」进行修改。',
    tip: '昵称用于系统通知的精准推送，填写后请勿频繁修改。'
  },
  {
    title: '复制昵称',
    desc: '修改完成后，返回个人资料页面，长按昵称或点击昵称旁的复制按钮，将昵称复制到剪贴板。'
  },
  {
    title: '填写到本系统',
    desc: '返回本系统的「个人信息」页面，将复制的昵称粘贴到「MeoW 昵称」输入框，点击「保存修改」即可。',
    tip: '保存后约 5–10 分钟生效，届时可在 MeoW 中接收到系统推送的通知。'
  }
]
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: var(--text-sub);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 12px;
  transition: color .18s;
}
.back-link:hover { color: var(--brand); }

.guide-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #153a56, #2b5f8e 60%, #3d7aab);
  color: #fff;
  border-radius: 16px;
  margin-bottom: 20px;
}
.guide-hero-icon { font-size: 40px; }
.guide-hero h1 { margin: 0; font-size: 24px; letter-spacing: .5px; }
.guide-hero p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.8); }

.intro-card {
  padding: 20px 24px;
  margin-bottom: 8px;
}
.intro-card h3 { margin: 0 0 10px; font-size: 16px; }
.intro-card p {
  margin: 0;
  line-height: 1.9;
  font-size: 14px;
  color: var(--text-sub);
}
.intro-card strong { color: var(--brand); font-weight: 600; }

.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-card {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  align-items: flex-start;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand), var(--accent));
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-body { flex: 1; min-width: 0; }
.step-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; color: var(--text); }
.step-desc { color: var(--text-sub); font-size: 14px; line-height: 1.75; }

.step-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  background: var(--brand-soft);
  border-radius: 8px;
  color: var(--brand);
  font-size: 13px;
  line-height: 1.6;
}
.step-tip .el-icon { margin-top: 2px; flex-shrink: 0; }

.notice-card {
  margin-top: 20px;
  padding: 20px 24px;
  background: #fdf8f2;
  border: 1px solid #f5e6d3;
}
.notice-card h3 { margin: 0 0 12px; font-size: 15px; color: #a06a2a; }
.notice-card ul { margin: 0; padding-left: 20px; }
.notice-card li {
  color: #7a6040;
  font-size: 13px;
  line-height: 2;
}

.guide-footer {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
.guide-footer .pill { padding: 10px 24px; font-size: 14px; }

@media (max-width: 768px) {
  .guide-hero { padding: 20px; }
  .guide-hero h1 { font-size: 20px; }
  .guide-hero-icon { font-size: 32px; }
  .step-card { padding: 14px 16px; }
  .intro-card, .notice-card { padding: 16px 18px; }
}
</style>