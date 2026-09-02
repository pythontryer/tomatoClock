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
  gap: 10px;
  margin-top: 10px;
}
.td-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  transition: transform 0.15s ease;
}
.td-row:hover {
  transform: translateX(2px);
}
.td-name {
  flex: 0 0 35%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-weight: 500;
}
.td-track {
  flex: 1;
  height: 16px;
  background: var(--bg);
  border-radius: 8px;
  overflow: hidden;
}
.td-fill {
  height: 100%;
  background: linear-gradient(90deg, #5b6cff, #8b5cf6);
  border-radius: 8px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 3px;
  position: relative;
}
.td-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.2), transparent);
  border-radius: 8px 8px 0 0;
}
.td-val {
  flex: 0 0 auto;
  color: var(--accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}
.td-empty {
  font-size: 12px;
  margin-top: 6px;
}
</style>
