<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { todayKey, lastNDays, weekdayLabel } from '@/utils/date'

const store = useAppStore()

type Metric = 'focus' | 'pomo'

// 趋势图状态：7=周视图, 30=月视图
const range = ref(7)
const metric = ref<Metric>('focus')

const unit = computed(() => (metric.value === 'focus' ? '分' : '个'))
const chartTitle = computed(() =>
  metric.value === 'focus' ? `近 ${range.value} 天专注时长` : `近 ${range.value} 天完成番茄数`
)

const days = computed(() => lastNDays(range.value))

const target = computed(() =>
  metric.value === 'focus' ? store.settings.dailyFocusTarget : store.settings.dailyPomoTarget
)

// 每日数值序列
const series = computed(() => {
  const byDay = new Map<string, number>()
  for (const s of store.sessions) {
    const key = todayKey(new Date(s.ts))
    const v = metric.value === 'focus' ? s.minutes : 1
    byDay.set(key, (byDay.get(key) || 0) + v)
  }
  return days.value.map((day) => ({ day, value: byDay.get(day) || 0 }))
})

// 纵轴上限：至少包含目标值，避免目标线贴顶
const maxVal = computed(() => Math.max(target.value, ...series.value.map((d) => d.value), 1))
const targetPct = computed(() => Math.min(100, Math.max(0, (target.value / maxVal.value) * 100)))

const rangeTotal = computed(() => series.value.reduce((a, b) => a + b.value, 0))
const rangeAvg = computed(() =>
  series.value.length ? Math.round(rangeTotal.value / series.value.length) : 0
)
const daysHit = computed(
  () => series.value.filter((d) => target.value > 0 && d.value >= target.value).length
)

// 月视图下标签太密，每 5 天显示一个 + 最后一天
function dayLabel(d: { day: string }, i: number) {
  if (range.value === 7) return weekdayLabel(d.day)
  if (i === series.value.length - 1 || i % 5 === 0) return d.day.slice(8)
  return ''
}
</script>

<template>
  <div class="chart-block">
    <div class="chart-head">
      <div class="chart-title muted">{{ chartTitle }}</div>
      <div class="seg-group">
        <div class="seg">
          <button :class="{ active: range === 7 }" @click="range = 7">周</button>
          <button :class="{ active: range === 30 }" @click="range = 30">月</button>
        </div>
        <div class="seg">
          <button :class="{ active: metric === 'focus' }" @click="metric = 'focus'">时长</button>
          <button :class="{ active: metric === 'pomo' }" @click="metric = 'pomo'">个数</button>
        </div>
      </div>
    </div>

    <div class="tracks-wrap">
      <div v-if="target > 0" class="target-line" :style="{ bottom: targetPct + '%' }">
        <span class="target-label">目标 {{ target }}{{ unit }}</span>
      </div>
      <div
        v-for="d in series"
        :key="d.day"
        class="track"
        :title="`${d.day}：${d.value}${unit}（目标 ${target}${unit}）`"
      >
        <div
          class="fill"
          :class="{ hit: target > 0 && d.value >= target }"
          :style="{ height: (d.value / maxVal) * 100 + '%' }"
        >
          <span v-if="range === 7 && d.value > 0" class="val">{{ d.value }}</span>
        </div>
      </div>
    </div>
    <div class="labels-row">
      <div v-for="(d, i) in series" :key="d.day" class="lab">
        {{ dayLabel(d, i) }}
      </div>
    </div>
    <div class="summary muted">
      近 {{ range }} 天合计 <b>{{ rangeTotal }}</b>{{ unit }} · 日均 <b>{{ rangeAvg }}</b
      >{{ unit }} · 达标 <b>{{ daysHit }}</b>/{{ range }} 天
    </div>
  </div>
</template>

<style scoped>
.chart-block {
  margin-top: 18px;
}
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.chart-title {
  font-size: 13px;
}
.seg-group {
  display: flex;
  gap: 8px;
}
.seg {
  display: flex;
  background: var(--bg);
  border-radius: 999px;
  padding: 2px;
}
.seg button {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 999px;
  color: var(--muted);
}
.seg button.active {
  background: var(--accent);
  color: #fff;
}
.tracks-wrap {
  position: relative;
  display: flex;
  gap: 4px;
  height: 160px;
}
.track {
  flex: 1;
  position: relative;
  background: var(--bg);
  border-radius: 6px;
  overflow: visible;
}
.fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--accent);
  border-radius: 6px 6px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}
.fill.hit {
  background: var(--good);
}
.fill .val {
  position: absolute;
  top: -18px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: var(--muted);
}
.target-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dashed var(--warn);
  z-index: 2;
  pointer-events: none;
}
.target-label {
  position: absolute;
  right: 2px;
  top: -18px;
  font-size: 10px;
  color: var(--warn);
  background: var(--card);
  padding: 0 4px;
  border-radius: 4px;
}
.labels-row {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.lab {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: var(--muted);
  min-height: 12px;
}
.summary {
  font-size: 12px;
  margin-top: 10px;
}
.summary b {
  color: var(--text);
}
</style>
