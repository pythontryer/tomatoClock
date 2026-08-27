<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const store = useAppStore()
const RECENT = 12

const recent = computed(() => store.sessions.slice(-RECENT).reverse())

function fmt(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
</script>

<template>
  <div v-if="recent.length" class="sess">
    <div class="title muted">
      专注复盘 <span class="sub">（最近 {{ recent.length }} 次，可补评）</span>
    </div>

    <div v-for="s in recent" :key="s.id" class="item">
      <div class="line1">
        <span class="time">{{ fmt(s.ts) }}</span>
        <span class="min">🍅 {{ s.minutes }} 分</span>
      </div>
      <div v-if="s.intention" class="intent">意图：{{ s.intention }}</div>

      <div class="stars">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="star"
          :class="{ on: n <= (s.rating || 0) }"
          @click="store.reflect(s.id, n, s.note || '')"
        >★</button>
        <span class="muted sm">{{ s.rating ? s.rating + ' 分' : '未评' }}</span>
      </div>

      <textarea
        :value="s.note"
        class="note"
        placeholder="复盘备注…"
        maxlength="300"
        @blur="(e: any) => store.reflect(s.id, s.rating || 0, e.target.value)"
      />
    </div>
  </div>
</template>

<style scoped>
.sess {
  margin-top: 18px;
}
.title {
  font-size: 13px;
}
.sub {
  font-size: 11px;
}
.item {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.line1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.time {
  color: var(--muted);
}
.min {
  font-weight: 600;
}
.intent {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}
.stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 6px 0;
}
.star {
  font-size: 18px;
  line-height: 1;
  background: none;
  border: none;
  color: var(--border);
  cursor: pointer;
  padding: 0 1px;
}
.star.on {
  color: #f5a623;
}
.sm {
  font-size: 11px;
  margin-left: 4px;
}
.note {
  width: 100%;
  min-height: 48px;
  resize: vertical;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
}
</style>
