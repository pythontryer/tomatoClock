<script setup lang="ts">
import { watch } from 'vue'
import BottomNav from './components/BottomNav.vue'
import ToastHost from './components/ToastHost.vue'
import { useAppStore } from '@/stores/useAppStore'
import { useHabitReminders } from '@/composables/useHabitReminders'

const store = useAppStore()
useHabitReminders()

// 主题应用到根元素；导入旧备份缺 theme 键时回退亮色
watch(
  () => store.settings.theme,
  (t) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
  },
  { immediate: true }
)

function toggleTheme() {
  store.settings.theme = store.settings.theme === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="brand-icon">🎯</span>
        <span class="brand-text">专注与习惯</span>
      </div>
      <button
        class="theme-toggle"
        :title="store.settings.theme === 'dark' ? '切换到亮色' : '切换到暗色'"
        @click="toggleTheme"
      >
        {{ store.settings.theme === 'dark' ? '☀️' : '🌙' }}
      </button>
    </header>

    <main class="content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <BottomNav />
    <ToastHost />
  </div>
</template>

<style scoped>
.app {
  max-width: 1080px;
  margin: 0 auto;
  padding: 70px 20px 40px;
  min-height: 100vh;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.brand-icon {
  font-size: 22px;
}
.brand-text {
  font-size: 18px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}
.theme-toggle {
  font-size: 16px;
  line-height: 1;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--card);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  cursor: pointer;
}
.theme-toggle:hover {
  transform: scale(1.1) rotate(15deg);
}
.content {
  min-height: calc(100vh - 140px);
}
/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
