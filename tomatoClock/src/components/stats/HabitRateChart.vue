<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { lastNDays, weekdayLabel } from '@/utils/date'
import { isDueOnKey } from '@/utils/habit'

const store = useAppStore()

// 近 7 天习惯完成率（固定周视图），仅按「当日应打卡」的习惯计算
const weekHabit = computed(() =>
  lastNDays(7).map((day) => {
    const due = store.habits.filter((h) => isDueOnKey(h, day))
    if (!due.length) return { day, rate: null as number | null }
    const done = due.filter((h) => store.habitChecks[day] && store.habitChecks[day][h.id]).length
    return { day, rate: Math.round((done / due.length) * 100) }
  })
)
</script>

<template>
  <div class="chart-block">
    <div class="chart-title muted">近 7 天习惯完成率</div>
    <div class="bars">
      <div v-for="d in weekHabit" :key="d.day" class="bar-col">
        <div class="bar-track">
          <div class="bar-fill habit" :style="{ height: (d.rate ?? 0) + '%' }" />
        </div>
        <div class="bar-val">{{ d.rate == null ? '' : d.rate + '%' }}</div>
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
  border-radius: 8px 8px 4px 4px;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 3px;
  animation: barGrow 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}
@keyframes barGrow {
  from { height: 0 !important; }
}
.bar-fill.habit {
  background: linear-gradient(180deg, #37c992 0%, #2bbf8a 100%);
}
.bar-fill.habit:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(43, 191, 138, 0.3);
}
.bar-val {
  font-size: 11px;
  color: var(--good);
  font-weight: 600;
  margin: 4px 0 2px;
  height: 14px;
}
.bar-day {
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
}
</style>
