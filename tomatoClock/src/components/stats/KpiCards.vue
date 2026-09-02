<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  const done = due.filter((h) => store.habitChecks[today] && store.habitChecks[today][h.id]).length
  return Math.round((done / due.length) * 100)
})

// 数字滚动动画：初始直接显示目标值，变化时平滑过渡
const displayFocus = ref(todayFocusMin.value)
const displayPomo = ref(todayPomodoros.value)
const displayRate = ref(todayHabitRate.value)

function animateTo(fromRef: { value: number }, target: number, duration = 500) {
  const from = fromRef.value
  if (from === target) return
  const start = performance.now()
  function tick(now: number) {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    fromRef.value = Math.round(from + (target - from) * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

watch(todayFocusMin, (v) => animateTo(displayFocus, v))
watch(todayPomodoros, (v) => animateTo(displayPomo, v))
watch(todayHabitRate, (v) => animateTo(displayRate, v))
</script>

<template>
  <div class="kpis">
    <div class="kpi kpi-focus">
      <div class="kpi-icon">⏱️</div>
      <div class="kpi-content">
        <div class="k-num">{{ displayFocus }}<small>分</small></div>
        <div class="k-label">今日专注</div>
      </div>
    </div>
    <div class="kpi kpi-pomo">
      <div class="kpi-icon">🍅</div>
      <div class="kpi-content">
        <div class="k-num">{{ displayPomo }}<small>个</small></div>
        <div class="k-label">今日番茄</div>
      </div>
    </div>
    <div class="kpi kpi-habit">
      <div class="kpi-icon">✅</div>
      <div class="kpi-content">
        <div class="k-num">{{ displayRate }}<small>%</small></div>
        <div class="k-label">习惯完成</div>
      </div>
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
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.kpi::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.kpi-focus {
  background: linear-gradient(135deg, rgba(91, 108, 255, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%);
}
.kpi-focus::before {
  background: linear-gradient(90deg, #5b6cff, #8b5cf6);
}
.kpi-pomo {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 174, 66, 0.08) 100%);
}
.kpi-pomo::before {
  background: linear-gradient(90deg, #ff6b6b, #ffae42);
}
.kpi-habit {
  background: linear-gradient(135deg, rgba(43, 191, 138, 0.1) 0%, rgba(31, 182, 214, 0.08) 100%);
}
.kpi-habit::before {
  background: linear-gradient(90deg, #2bbf8a, #1fb6d6);
}
.kpi-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.kpi-content {
  flex: 1;
  min-width: 0;
}
.k-num {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.kpi-focus .k-num {
  background: linear-gradient(135deg, #5b6cff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.kpi-pomo .k-num {
  background: linear-gradient(135deg, #ff6b6b, #ffae42);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.kpi-habit .k-num {
  background: linear-gradient(135deg, #2bbf8a, #1fb6d6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.k-num small {
  font-size: 12px;
  font-weight: 500;
  margin-left: 3px;
  color: var(--muted);
  -webkit-text-fill-color: var(--muted);
}
.k-label {
  font-size: 12px;
  margin-top: 3px;
  color: var(--muted);
  font-weight: 500;
}
@media (max-width: 480px) {
  .kpis {
    flex-direction: column;
  }
}
</style>
