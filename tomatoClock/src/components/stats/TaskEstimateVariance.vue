<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()

const rows = computed(() =>
  store.tasks
    .filter((t) => (t.estimate ?? 0) > 0)
    .map((t) => {
      const actual = t.pomo || 0
      const est = t.estimate as number
      return {
        id: t.id,
        name: t.name,
        actual,
        est,
        ratio: est > 0 ? Math.min(1, actual / est) : 0,
        over: actual > est,
        done: actual >= est
      }
    })
    .sort((a, b) => Number(b.over) - Number(a.over))
)

const summary = computed(() => {
  const totalEst = rows.value.reduce((s, r) => s + r.est, 0)
  const totalAct = rows.value.reduce((s, r) => s + r.actual, 0)
  const onTrack = rows.value.filter((r) => r.done).length
  return { totalEst, totalAct, onTrack, count: rows.value.length }
})
</script>

<template>
  <div v-if="rows.length" class="variance">
    <div class="title muted">
      任务预估 vs 实际
      <span class="sum">共 {{ summary.count }} 项 · 已达标 {{ summary.onTrack }} 项</span>
    </div>

    <div v-for="r in rows" :key="r.id" class="row">
      <div class="meta">
        <span class="rname" :title="r.name">{{ r.name }}</span>
        <span class="nums" :class="{ over: r.over }">{{ r.actual }}/{{ r.est }} 🍅</span>
      </div>
      <div class="track">
        <div
          class="fill"
          :class="{ over: r.over, done: r.done }"
          :style="{ width: (r.ratio * 100).toFixed(0) + '%' }"
        />
      </div>
    </div>

    <div class="footer muted">
      汇总：实际 {{ summary.totalAct }} / 预估 {{ summary.totalEst }} 🍅
    </div>
  </div>
</template>

<style scoped>
.variance {
  margin-top: 18px;
}
.title {
  font-size: 13px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sum {
  font-size: 11px;
}
.row {
  margin-top: 10px;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}
.rname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nums {
  color: var(--muted);
  white-space: nowrap;
}
.nums.over {
  color: var(--warn);
}
.track {
  margin-top: 6px;
  height: 10px;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: linear-gradient(90deg, #5b6cff, #8b5cf6);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.25), transparent);
  border-radius: 999px 999px 0 0;
}
.fill.done {
  background: linear-gradient(90deg, #2bbf8a, #1fb6d6);
}
.fill.over {
  background: linear-gradient(90deg, #ffae42, #ff6b6b);
}
.footer {
  margin-top: 12px;
  font-size: 12px;
}
</style>
