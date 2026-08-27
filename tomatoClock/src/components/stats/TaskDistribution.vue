<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()

// 番茄按任务分布
const taskDist = computed(() => {
  const list = store.tasks
    .filter((t) => (t.pomo || 0) > 0)
    .slice()
    .sort((a, b) => (b.pomo || 0) - (a.pomo || 0))
  const max = list.length ? Math.max(...list.map((t) => t.pomo || 0)) : 1
  const total = list.reduce((a, t) => a + (t.pomo || 0), 0)
  return { list, max, total }
})
</script>

<template>
  <div class="chart-block">
    <div class="chart-title muted">
      番茄按任务分布<span v-if="taskDist.total"> · 共 🍅 {{ taskDist.total }}</span>
    </div>
    <div v-if="taskDist.list.length" class="task-dist">
      <div v-for="t in taskDist.list" :key="t.id" class="td-row">
        <div class="td-name" :title="t.name">{{ t.name }}</div>
        <div class="td-track">
          <div class="td-fill" :style="{ width: (t.pomo / taskDist.max) * 100 + '%' }" />
        </div>
        <div class="td-val">🍅 {{ t.pomo }}</div>
      </div>
    </div>
    <div v-else class="muted td-empty">
      还没有绑定任务完成的番茄，计时时绑定一个任务即可在这里看到分布
    </div>
  </div>
</template>

<style scoped>
.chart-block {
  margin-top: 18px;
}
.chart-title {
  font-size: 13px;
}
.task-dist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.td-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.td-name {
  flex: 0 0 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}
.td-track {
  flex: 1;
  height: 14px;
  background: var(--bg);
  border-radius: 7px;
  overflow: hidden;
}
.td-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 7px;
  transition: width 0.3s ease;
  min-width: 2px;
}
.td-val {
  flex: 0 0 auto;
  color: var(--muted);
}
.td-empty {
  font-size: 12px;
  margin-top: 6px;
}
</style>
