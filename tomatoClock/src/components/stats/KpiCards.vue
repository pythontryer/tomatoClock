<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { todayKey } from '@/utils/date'
import { isDueToday } from '@/utils/habit'

const store = useAppStore()
const today = todayKey()

const todayFocusMin = computed(() =>
  store.sessions
    .filter((s) => todayKey(new Date(s.ts)) === today)
    .reduce((sum, s) => sum + s.minutes, 0)
)

const todayPomodoros = computed(
  () => store.sessions.filter((s) => todayKey(new Date(s.ts)) === today).length
)

const todayHabitRate = computed(() => {
  const due = store.habits.filter((h) => isDueToday(h))
  if (!due.length) return 0
  const done = due.filter(
    (h) => store.habitChecks[today] && store.habitChecks[today][h.id]
  ).length
  return Math.round((done / due.length) * 100)
})
</script>

<template>
  <div class="kpis">
    <div class="kpi">
      <div class="k-num">{{ todayFocusMin }}<small>分</small></div>
      <div class="k-label muted">今日专注</div>
    </div>
    <div class="kpi">
      <div class="k-num">{{ todayPomodoros }}<small>个</small></div>
      <div class="k-label muted">今日番茄</div>
    </div>
    <div class="kpi">
      <div class="k-num">{{ todayHabitRate }}<small>%</small></div>
      <div class="k-label muted">习惯完成</div>
    </div>
  </div>
</template>

<style scoped>
.kpis {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.kpi {
  flex: 1;
  background: var(--accent-soft);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
.k-num {
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
}
.k-num small {
  font-size: 13px;
  font-weight: 500;
  margin-left: 2px;
  color: var(--muted);
}
.k-label {
  font-size: 12px;
  margin-top: 2px;
}
</style>
