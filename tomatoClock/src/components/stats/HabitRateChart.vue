<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { lastNDays, weekdayLabel } from '@/utils/date'

const store = useAppStore()

// 近 7 天习惯完成率（固定周视图）
const weekHabit = computed(() =>
  lastNDays(7).map((day) => {
    const total = store.habits.length
    if (!total) return { day, rate: 0 }
    const done = store.habits.filter(
      (h) => store.habitChecks[day] && store.habitChecks[day][h.id]
    ).length
    return { day, rate: Math.round((done / total) * 100) }
  })
)
</script>

<template>
  <div class="chart-block">
    <div class="chart-title muted">近 7 天习惯完成率</div>
    <div class="bars">
      <div v-for="d in weekHabit" :key="d.day" class="bar-col">
        <div class="bar-track">
          <div class="bar-fill habit" :style="{ height: d.rate + '%' }" />
        </div>
        <div class="bar-val">{{ d.rate ? d.rate + '%' : '' }}</div>
        <div class="bar-day">{{ weekdayLabel(d.day) }}</div>
      </div>
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
.bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 120px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.bar-track {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--bg);
  border-radius: 8px;
  overflow: hidden;
}
.bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}
.bar-fill.habit {
  background: var(--good);
}
.bar-val {
  font-size: 11px;
  color: var(--muted);
  margin: 4px 0 2px;
  height: 14px;
}
.bar-day {
  font-size: 11px;
  color: var(--muted);
}
</style>
