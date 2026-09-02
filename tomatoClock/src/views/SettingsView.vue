<script setup lang="ts">
import DataManager from '@/components/DataManager.vue'
import TimerSettings from '@/components/timer/TimerSettings.vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()
</script>

<template>
  <div class="settings-view">
    <!-- 偏好设置 -->
    <section class="card settings-section">
      <h2>⚙️ 偏好设置</h2>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">深色模式</div>
          <div class="setting-desc muted">切换界面主题</div>
        </div>
        <button
          class="toggle-btn"
          :class="{ on: store.settings.theme === 'dark' }"
          @click="store.settings.theme = store.settings.theme === 'dark' ? 'light' : 'dark'"
        >
          <span class="toggle-knob" />
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">桌面通知</div>
          <div class="setting-desc muted">番茄结束时弹出系统通知</div>
        </div>
        <button
          class="toggle-btn"
          :class="{ on: store.settings.notify }"
          @click="store.settings.notify = !store.settings.notify"
        >
          <span class="toggle-knob" />
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">提示音</div>
          <div class="setting-desc muted">番茄结束时播放提示音</div>
        </div>
        <button
          class="toggle-btn"
          :class="{ on: store.settings.sound }"
          @click="store.settings.sound = !store.settings.sound"
        >
          <span class="toggle-knob" />
        </button>
      </div>
    </section>

    <!-- 计时器设置 -->
    <TimerSettings />

    <!-- 数据管理 -->
    <DataManager />

    <!-- 关于 -->
    <section class="card about-section">
      <h2>ℹ️ 关于</h2>
      <p class="about-text muted">
        专注与习惯面板 · 本地优先的番茄钟应用<br />
        数据全部存储在浏览器本地，不上传任何服务器<br />
        支持 PWA 安装到桌面，离线可用
      </p>
    </section>
  </div>
</template>

<style scoped>
.settings-view {
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.settings-section h2 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.setting-row:last-child {
  border-bottom: none;
}
.setting-info {
  flex: 1;
}
.setting-title {
  font-size: 14px;
  font-weight: 600;
}
.setting-desc {
  font-size: 12px;
  margin-top: 2px;
}
.toggle-btn {
  width: 48px;
  height: 28px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  transition: background 0.25s ease;
  flex-shrink: 0;
}
.toggle-btn.on {
  background: var(--accent-gradient);
}
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle-btn.on .toggle-knob {
  transform: translateX(20px);
}
.about-section h2 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}
.about-text {
  font-size: 13px;
  line-height: 1.8;
  margin: 0;
}
</style>
