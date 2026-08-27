<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { todayKey, weekdayLabel } from '@/utils/date'

const store = useAppStore()
const WEEKS = 14

// 按天聚合专注分钟数
const agg = computed(() => {
  const m: Record<string, number> = {}
  for (const s of store.sessions) {
    const k = todayKey(new Date(s.ts))
    m[k] = (m[k] ?? 0) + s.minutes
  }
  return m
})

const grid = computed(() => {
  const today = new Date()
  const endSaturday = new Date(today)
  endSaturday.setDate(today.getDate() + (6 - today.getDay()))
  const startSunday = new Date(endSaturday)
  startSunday.setDate(endSaturday.getDate() - (WEEKS - 1) * 7)

  const weeks: { date: Date; key: string; minutes: number; future: boolean }[][] = []
  for (let w = 0; w < WEEKS; w++) {
    const col: { date: Date; key: string; minutes: number; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startSunday)
      date.setDate(startSunday.getDate() + w * 7 + d)
      const future = date > today
      const key = todayKey(date)
      col.push({ date, key, minutes: agg.value[key] ?? 0, future })
    }
    weeks.push(col)
  }
  return weeks
})

const total = computed(() => {
  let min = 0
  let pomo = 0
  for (const s of store.sessions) {
    min += s.minutes
    pomo += 1
  }
  return { min, pomo }
})

function level(min: number): number {
  if (min <= 0) return 0
  if (min <= 25) return 1
  if (min <= 60) return 2
  if (min <= 120) return 3
  return 4
}

function tip(cell: { date: Date; minutes: number; future: boolean }): string {
  if (cell.future) return '未到'
  const w = weekdayLabel(todayKey(cell.date))
  return `${todayKey(cell.date)} 周${w} · ${cell.minutes} 分`
}

// 左侧星期标签（一/三/五）
const ROW_LABELS = ['', '一', '', '三', '', '五', '']
</script>

<template>
  <div class="heatmap">
    <div class="title muted">
      专注热力图
      <span class="sub">近 {{ WEEKS }} 周 · 共 {{ total.min }} 分 / {{ total.pomo }} 🍅</span>
    </div>

    <div class="grid-wrap">
      <div class="row-labels">
        <span v-for="(l, i) in ROW_LABELS" :key="i" class="rl">{{ l }}</span>
      </div>
      <div class="weeks">
        <div v-for="(week, wi) in grid" :key="wi" class="week">
          <div
            v-for="(cell, di) in week"
            :key="di"
            class="cell"
            :class="[`lv${level(cell.minutes)}`, { future: cell.future }]"
            :title="tip(cell)"
          />
        </div>
      </div>
    </div>

    <div class="legend muted">
      少
      <span class="cell lv0" />
      <span class="cell lv1" />
      <span class="cell lv2" />
      <span class="cell lv3" />
      <span class="cell lv4" />
      多
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  margin-top: 18px;
}
.title {
  font-size: 13px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sub {
  font-size: 11px;
}
.grid-wrap {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.row-labels {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 0;
}
.rl {
  height: 13px;
  font-size: 10px;
  line-height: 13px;
  color: var(--muted);
}
.weeks {
  display: flex;
  gap: 3px;
  overflow-x: auto;
}
.week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--bg);
}
.cell.lv1 {
  background: color-mix(in srgb, var(--accent) 25%, var(--bg));
}
.cell.lv2 {
  background: color-mix(in srgb, var(--accent) 50%, var(--bg));
}
.cell.lv3 {
  background: color-mix(in srgb, var(--accent) 75%, var(--bg));
}
.cell.lv4 {
  background: var(--accent);
}
.cell.future {
  background: var(--bg);
  opacity: 0.4;
}
.legend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  margin-top: 8px;
}
.legend .cell {
  display: inline-block;
}
</style>
