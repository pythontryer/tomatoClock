<script setup lang="ts">
import PomodoroTimer from '@/components/PomodoroTimer.vue'
import TaskBoard from '@/components/TaskBoard.vue'
import HabitList from '@/components/HabitList.vue'
</script>

<template>
  <div class="focus-view">
    <div class="page-header">
      <h1 class="page-title">今日专注</h1>
      <p class="page-subtitle">设定目标，开始你的番茄工作法</p>
    </div>

    <div class="focus-grid">
      <PomodoroTimer class="cell timer-cell" />
      <TaskBoard class="cell" />
      <HabitList class="cell" />
    </div>
  </div>
</template>

<style scoped>
.focus-view {
  padding-bottom: 20px;
}
.focus-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.timer-cell {
  grid-row: span 2;
}
.cell :deep(.card) {
  height: 100%;
}
@media (max-width: 760px) {
  .focus-grid {
    grid-template-columns: 1fr;
  }
  .timer-cell {
    grid-row: auto;
  }
}
</style>
