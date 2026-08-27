<script setup lang="ts">
import { watch } from 'vue'
import PomodoroTimer from './components/PomodoroTimer.vue'
import HabitList from './components/HabitList.vue'
import StatsPanel from './components/StatsPanel.vue'
import DataManager from './components/DataManager.vue'
import TaskBoard from './components/TaskBoard.vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()

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
      <div class="brand">🎯 专注与习惯面板</div>
      <div class="sub muted">本地数据 · 自动保存</div>
      <button
        class="theme-toggle"
        :title="store.settings.theme === 'dark' ? '切换到亮色' : '切换到暗色'"
        @click="toggleTheme"
      >
        {{ store.settings.theme === 'dark' ? '☀️' : '🌙' }}
      </button>
    </header>

    <main class="grid">
      <PomodoroTimer class="cell timer-cell" />
      <TaskBoard class="cell" />
      <HabitList class="cell" />
      <StatsPanel class="cell stats-cell" />
      <DataManager class="cell stats-cell" />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}
.topbar {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 22px;
}
.theme-toggle {
  margin-left: auto;
  align-self: center;
  font-size: 18px;
  line-height: 1;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--card);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  transition: transform 0.15s ease;
}
.theme-toggle:hover {
  transform: scale(1.08);
}
.brand {
  font-size: 22px;
  font-weight: 700;
}
.sub {
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.timer-cell {
  grid-row: span 2;
}
.stats-cell {
  grid-column: 1 / -1;
}
.cell :deep(.card) {
  height: 100%;
}
@media (max-width: 760px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .timer-cell {
    grid-row: auto;
  }
  .stats-cell {
    grid-column: auto;
  }
}
</style>
