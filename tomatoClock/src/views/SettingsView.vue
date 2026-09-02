<script setup lang="ts">
import { ref } from 'vue'
import DataManager from '@/components/DataManager.vue'
import TimerSettings from '@/components/timer/TimerSettings.vue'
import SoundCustomizer from '@/components/SoundCustomizer.vue'
import { useAppStore } from '@/stores/useAppStore'
import { useNotification } from '@/composables/useNotification'

const store = useAppStore()
const { notifPerm, isSecure, requestNotify } = useNotification()

const notifStatus = ref('')

async function toggleNotify() {
  store.settings.notify = !store.settings.notify
  if (!store.settings.notify) {
    notifStatus.value = ''
    return
  }
  // HTTP 公网环境：浏览器禁用通知，给出明确说明
  if (!isSecure) {
    notifStatus.value = '⚠️ 当前为 HTTP 访问，浏览器已禁用桌面通知。请使用 HTTPS 访问后再开启（或在 localhost 下使用）。'
    store.settings.notify = false
    return
  }
  if (notifPerm.value === 'default') {
    notifStatus.value = '正在申请通知权限…'
    const result = await requestNotify()
    notifStatus.value =
      result === 'granted'
        ? '✅ 通知已开启'
        : result === 'denied'
          ? '❌ 已被浏览器拒绝：点击地址栏左侧的 🔒/铃铛图标，把通知设为「允许」后再点「开启通知」'
          : '⚠️ 未选择，可再次点击开启'
    setTimeout(() => (notifStatus.value = ''), 5000)
  } else if (notifPerm.value === 'denied') {
    notifStatus.value = '❌ 已被浏览器拒绝：点击地址栏左侧的 🔒/铃铛图标，把通知设为「允许」后再点「开启通知」'
    store.settings.notify = false
  }
}
</script>

<template>
  <div class="settings-view">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
      <p class="page-subtitle">个性化你的专注体验</p>
    </div>

    <!-- 偏好设置 -->
    <section class="card settings-section">
      <h2 class="section-title">偏好设置</h2>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">深色模式</div>
          <div class="setting-desc">切换界面主题</div>
        </div>
        <button
          class="switch-toggle"
          :class="{ on: store.settings.theme === 'dark' }"
          @click="store.settings.theme = store.settings.theme === 'dark' ? 'light' : 'dark'"
        >
          <span class="knob" />
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">桌面通知</div>
          <div class="setting-desc">番茄结束时弹出系统通知</div>
          <div v-if="!isSecure" class="notif-warn">
            ⚠️ 当前为 HTTP 访问，浏览器已禁用桌面通知。需使用 HTTPS 访问后才能开启。
          </div>
          <div v-if="notifStatus" class="notif-status">{{ notifStatus }}</div>
        </div>
        <button
          class="switch-toggle"
          :class="{ on: store.settings.notify }"
          :disabled="!isSecure"
          @click="toggleNotify"
        >
          <span class="knob" />
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-title">提示音</div>
          <div class="setting-desc">番茄结束时播放提示音</div>
        </div>
        <button
          class="switch-toggle"
          :class="{ on: store.settings.sound }"
          @click="store.settings.sound = !store.settings.sound"
        >
          <span class="knob" />
        </button>
      </div>
    </section>

    <!-- 计时器设置 -->
    <TimerSettings />

    <!-- 提示音设置 -->
    <SoundCustomizer />

    <!-- 数据管理 -->
    <DataManager />

    <!-- 关于 -->
    <section class="card about-section">
      <h2 class="section-title">关于</h2>
      <p class="about-text">
        专注与习惯面板 · 本地优先的番茄钟应用<br />
        数据全部存储在浏览器本地，不上传任何服务器<br />
        支持 PWA 安装到桌面，离线可用
      </p>
      <div class="about-links">
        <a href="https://github.com/pythontryer/tomatoClock" target="_blank" rel="noopener" class="about-link">
          <span>🐙</span> GitHub 仓库
        </a>
        <a href="https://github.com/pythontryer/tomatoClock/issues" target="_blank" rel="noopener" class="about-link">
          <span>💬</span> 反馈建议 / 报 Bug
        </a>
        <a href="https://github.com/pythontryer/tomatoClock#readme" target="_blank" rel="noopener" class="about-link">
          <span>📖</span> 使用文档
        </a>
      </div>
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
.settings-section h2,
.about-section h2 {
  margin: 0 0 8px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}
.about-text {
  font-size: 13px;
  line-height: 1.8;
  margin: 12px 0 14px;
  color: var(--muted);
}
.about-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.about-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}
.about-link:hover {
  background: var(--accent);
  color: #fff;
}
.notif-status {
  font-size: 11px;
  margin-top: 4px;
  color: var(--accent);
  font-weight: 500;
}
.notif-warn {
  font-size: 11px;
  margin-top: 4px;
  color: var(--warn);
  font-weight: 500;
  line-height: 1.5;
}
.switch-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
