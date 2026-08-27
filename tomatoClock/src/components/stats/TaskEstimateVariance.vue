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
  <div class="variance" v-if="rows.length">
    <div class="title muted">
      任务预估 vs 实际
      <span class="sum">共 {{ summary.count }} 项 · 已达标 {{ summary.onTrack }} 项</span>
    </div>

    <div class="row" v-for="r in rows" :key="r.id">
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
  margin-top: 4px;
  height: 8px;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}
.fill.done {
  background: var(--good);
}
.fill.over {
  background: var(--warn);
}
.footer {
  margin-top: 12px;
  font-size: 12px;
}
</style>
