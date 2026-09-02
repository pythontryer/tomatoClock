<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { HABIT_COLORS } from '@/constants'
import { todayKey } from '@/utils/date'
import { isDueToday, streakOf, freqSummary } from '@/utils/habit'
import type { Habit, HabitFreq } from '@/types/models'

const store = useAppStore()

const name = ref('')
const color = ref<string>(HABIT_COLORS[0])
const today = todayKey()

// 新增习惯的频率配置
const freq = ref<HabitFreq>('daily')
const freqDays = ref<number[]>([])
const monthDay = ref<number>(1)
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

// 重命名相关
const editingId = ref<string | null>(null)
const editName = ref('')
const editFreq = ref<HabitFreq>('daily')
const editFreqDays = ref<number[]>([])
const editMonthDay = ref<number>(1)
const editRemind = ref<string>('')
const vFocus = { mounted: (el: HTMLInputElement) => el.focus() }

function resolvedFreqDays(): number[] {
  if (freq.value === 'monthly') return [monthDay.value]
  if (freq.value === 'weekly' || freq.value === 'custom') return freqDays.value
  return []
}

function addHabit() {
  store.addHabit(name.value, color.value, freq.value, resolvedFreqDays())
  name.value = ''
  freq.value = 'daily'
  freqDays.value = []
  monthDay.value = 1
}

function startEdit(h: Habit) {
  editingId.value = h.id
  editName.value = h.name
  editFreq.value = h.freq ?? 'daily'
  editFreqDays.value = h.freqDays ?? []
  editMonthDay.value = h.freqDays?.[0] ?? 1
  editRemind.value = h.remindAt ?? ''
}
function saveEdit() {
  if (editingId.value === null) return
  store.renameHabit(editingId.value, editName.value)
  const days =
    editFreq.value === 'monthly'
      ? [editMonthDay.value]
      : editFreq.value === 'weekly' || editFreq.value === 'custom'
        ? editFreqDays.value
        : []
  store.setHabitFreq(editingId.value, editFreq.value, days)
  store.setHabitRemind(editingId.value, editRemind.value || null)
  editingId.value = null
}
function cancelEdit() {
  editingId.value = null
}

function toggleFreqDay(arr: number[], d: number): number[] {
  return arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort((a, b) => a - b)
}

// 拖拽排序相关
const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(id: string, e: DragEvent) {
  dragId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id) // Firefox 需要
  }
}
function onDrop(targetId: string) {
  if (!dragId.value || dragId.value === targetId) {
    dragId.value = null
    dragOverId.value = null
    return
  }
  const from = store.habits.findIndex((h) => h.id === dragId.value)
  const to = store.habits.findIndex((h) => h.id === targetId)
  if (from === -1 || to === -1) return
  store.reorderHabits(from, to)
  dragId.value = null
  dragOverId.value = null
}

function isChecked(habitId: string) {
  return !!(store.habitChecks[today] && store.habitChecks[today][habitId])
}

// 今日应打卡的习惯数与已完成数（按频率过滤）
const dueTodayHabits = computed(() => store.habits.filter((h) => isDueToday(h)))
const doneDueToday = computed(() => dueTodayHabits.value.filter((h) => isChecked(h.id)).length)
const hasNonDue = computed(() => store.habits.length !== dueTodayHabits.value.length)

function streak(habitId: string) {
  return streakOf(store.$state, habitId)
}
</script>

<template>
  <section class="card habits">
    <h2>
      习惯打卡
      <span class="muted count">
        {{ doneDueToday }}/{{ dueTodayHabits.length }}
        <span v-if="hasNonDue" class="sub">（共 {{ store.habits.length }} 项）</span>
      </span>
    </h2>

    <form class="add" @submit.prevent="addHabit">
      <input v-model="name" placeholder="新增一个习惯，如「读书 30 分钟」" maxlength="40" />
      <div class="colors">
        <button
          v-for="c in HABIT_COLORS"
          :key="c"
          type="button"
          class="dot"
          :class="{ on: c === color }"
          :style="{ background: c }"
          @click="color = c"
        />
      </div>
      <button class="btn primary" type="submit">添加</button>

      <div class="freq-row">
        <select v-model="freq" class="freq-select" title="打卡频率">
          <option value="daily">每日</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="custom">自定义</option>
        </select>
        <div v-if="freq === 'weekly' || freq === 'custom'" class="chips">
          <button
            v-for="(w, i) in WEEKDAYS"
            :key="w"
            type="button"
            class="chip"
            :class="{ on: freqDays.includes(i) }"
            @click="freqDays = toggleFreqDay(freqDays, i)"
          >
            {{ w }}
          </button>
        </div>
        <div v-else-if="freq === 'monthly'" class="month-day">
          <span>每月</span>
          <input v-model.number="monthDay" type="number" min="1" max="31" />
          <span>日</span>
        </div>
      </div>
    </form>

    <ul v-if="store.habits.length" class="list">
      <li
        v-for="h in store.habits"
        :key="h.id"
        :draggable="editingId !== h.id"
        :class="{
          dragging: dragId === h.id,
          'drag-over': dragOverId === h.id,
          notdue: !isDueToday(h)
        }"
        @dragstart="onDragStart(h.id, $event)"
        @dragover.prevent="dragOverId = h.id"
        @dragleave="dragOverId = null"
        @drop.prevent="onDrop(h.id)"
        @dragend="dragId = null; dragOverId = null"
      >
        <span class="handle" title="拖拽排序">⠿</span>
        <button
          class="check"
          :class="{ on: isChecked(h.id) }"
          :aria-label="isChecked(h.id) ? '取消打卡' : '标记打卡'"
          :aria-pressed="isChecked(h.id)"
          @click="store.toggleHabitCheck(h.id)"
        >
          <span v-if="isChecked(h.id)">✓</span>
        </button>
        <span class="bar" :style="{ background: h.color }" />

        <template v-if="editingId === h.id">
          <div class="edit-box">
            <input
              v-model="editName"
              v-focus
              class="edit-input"
              maxlength="40"
              aria-label="习惯名称"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
            <div class="freq-row compact">
              <select v-model="editFreq" class="freq-select">
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="custom">自定义</option>
              </select>
              <div v-if="editFreq === 'weekly' || editFreq === 'custom'" class="chips">
                <button
                  v-for="(w, i) in WEEKDAYS"
                  :key="w"
                  type="button"
                  class="chip"
                  :class="{ on: editFreqDays.includes(i) }"
                  @click="editFreqDays = toggleFreqDay(editFreqDays, i)"
                >
                  {{ w }}
                </button>
              </div>
              <div v-else-if="editFreq === 'monthly'" class="month-day">
                <span>每月</span>
                <input v-model.number="editMonthDay" type="number" min="1" max="31" />
                <span>日</span>
              </div>
            </div>
            <div class="remind-row">
              <span class="remind-label">每日提醒</span>
              <input v-model="editRemind" type="time" class="remind-input" />
              <button
                v-if="editRemind"
                type="button"
                class="remind-clear"
                title="清除提醒"
                @click="editRemind = ''"
              >
                清除
              </button>
            </div>
            <div class="edit-actions">
              <button class="btn primary sm" @click="saveEdit">保存</button>
              <button class="btn ghost sm" @click="cancelEdit">取消</button>
            </div>
          </div>
        </template>

        <template v-else>
          <span class="hname">{{ h.name }}</span>
          <span v-if="h.freq && h.freq !== 'daily'" class="freq muted" :title="freqSummary(h)">
            {{ freqSummary(h) }}
          </span>
          <span class="streak muted" :title="`连续 ${streak(h.id)} 天`">
            🔥 {{ streak(h.id) }}
          </span>
          <button class="icon-btn" title="编辑" aria-label="重命名习惯" @click="startEdit(h)">
            ✎
          </button>
          <button class="del" title="删除" aria-label="删除习惯" @click="store.removeHabit(h.id)">
            ×
          </button>
        </template>
      </li>
    </ul>
    <p v-else class="empty muted">还没有习惯，添加第一个开始打卡吧。</p>
  </section>
</template>

<style scoped>
.count {
  font-size: 13px;
  font-weight: 400;
  margin-left: auto;
}
.count .sub {
  font-size: 11px;
}
.add {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.add > input {
  flex: 1;
  min-width: 160px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.colors {
  display: flex;
  gap: 6px;
}
.dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  outline: 2px solid transparent;
}
.dot.on {
  outline-color: var(--text);
  outline-offset: 1px;
}
.freq-row {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.freq-row.compact {
  margin-top: 6px;
}
.freq-select {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
}
.chips {
  display: flex;
  gap: 4px;
}
.chip {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  line-height: 1;
}
.chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.month-day {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}
.month-day input {
  width: 56px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;
  border-radius: 10px;
  transition:
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}
.list li.dragging {
  opacity: 0.4;
}
.list li.drag-over {
  box-shadow: inset 0 2px 0 var(--accent);
}
.list li.notdue {
  opacity: 0.62;
}
.handle {
  cursor: grab;
  color: var(--muted);
  user-select: none;
  font-size: 14px;
  line-height: 1;
}
.handle:active {
  cursor: grabbing;
}
.check {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--border);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.check.on {
  background: var(--good);
  border-color: var(--good);
}
.bar {
  width: 4px;
  height: 22px;
  border-radius: 2px;
  flex-shrink: 0;
}
.hname {
  flex: 1;
  font-size: 14px;
}
.freq {
  font-size: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.streak {
  font-size: 13px;
}
.icon-btn {
  color: var(--muted);
  font-size: 14px;
  padding: 0 4px;
  line-height: 1;
}
.icon-btn:hover {
  color: var(--accent);
}
.del {
  color: var(--muted);
  font-size: 20px;
  line-height: 1;
  padding: 0 4px;
}
.del:hover {
  color: var(--warn);
}
.empty {
  font-size: 14px;
  text-align: center;
  padding: 16px 0;
}
.edit-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.edit-input {
  padding: 6px 8px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 14px;
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.remind-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--muted);
}
.remind-label {
  white-space: nowrap;
}
.remind-input {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
}
.remind-clear {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
}
.btn {
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}
.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.btn.ghost {
  background: transparent;
}
.btn.sm {
  padding: 5px 12px;
  font-size: 13px;
}
</style>
