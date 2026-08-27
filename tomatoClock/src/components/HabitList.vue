<script setup>
import { ref, computed } from "vue"
import { useStore } from "../store/useStore"
import { todayKey } from "../utils/date"

const { state, uid } = useStore()

const name = ref("")
const palette = ["#5b6cff", "#2bbf8a", "#ffae42", "#ff6b6b", "#9b6bff", "#1fb6d6"]
const color = ref(palette[0])

const today = todayKey()

// 重命名相关
const editingId = ref(null)
const editName = ref("")
const vFocus = { mounted: (el) => el.focus() }

function addHabit() {
  const n = name.value.trim()
  if (!n) return
  state.habits.push({ id: uid(), name: n, color: color.value, createdAt: Date.now() })
  name.value = ""
}

function removeHabit(id) {
  state.habits = state.habits.filter((h) => h.id !== id)
  // 清掉该习惯在所有日期的打卡记录
  for (const day of Object.keys(state.habitChecks)) {
    if (state.habitChecks[day]) delete state.habitChecks[day][id]
  }
}

function startEdit(h) {
  editingId.value = h.id
  editName.value = h.name
}
function saveEdit() {
  if (editingId.value === null) return
  const h = state.habits.find((x) => x.id === editingId.value)
  if (h) {
    const n = editName.value.trim()
    if (n) h.name = n
  }
  editingId.value = null
}
function cancelEdit() {
  editingId.value = null
}

// 拖拽排序相关
const dragId = ref(null)
const dragOverId = ref(null)

function onDragStart(id, e) {
  dragId.value = id
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", id) // Firefox 需要
}
function onDrop(targetId) {
  if (!dragId.value || dragId.value === targetId) {
    dragId.value = null
    dragOverId.value = null
    return
  }
  const from = state.habits.findIndex((h) => h.id === dragId.value)
  const to = state.habits.findIndex((h) => h.id === targetId)
  if (from === -1 || to === -1) return
  const list = [...state.habits]
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  state.habits = list
  dragId.value = null
  dragOverId.value = null
}

function isChecked(habitId) {
  return !!(state.habitChecks[today] && state.habitChecks[today][habitId])
}

function toggle(habitId) {
  if (!state.habitChecks[today]) state.habitChecks[today] = {}
  if (state.habitChecks[today][habitId]) delete state.habitChecks[today][habitId]
  else state.habitChecks[today][habitId] = true
}

// 计算连续打卡天数：从今天往前数，直到断签
function streak(habitId) {
  let count = 0
  const d = new Date()
  while (true) {
    const key = todayKey(d)
    if (state.habitChecks[key] && state.habitChecks[key][habitId]) {
      count++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return count
}

const doneCount = computed(
  () => state.habits.filter((h) => isChecked(h.id)).length
)
</script>

<template>
  <section class="card habits">
    <h2>✅ 习惯打卡 <span class="muted count">{{ doneCount }}/{{ state.habits.length }}</span></h2>

    <form class="add" @submit.prevent="addHabit">
      <input v-model="name" placeholder="新增一个习惯，如「读书 30 分钟」" maxlength="40" />
      <div class="colors">
        <button
          v-for="c in palette"
          :key="c"
          type="button"
          class="dot"
          :class="{ on: c === color }"
          :style="{ background: c }"
          @click="color = c"
        />
      </div>
      <button class="btn primary" type="submit">添加</button>
    </form>

    <ul v-if="state.habits.length" class="list">
      <li
        v-for="h in state.habits"
        :key="h.id"
        :draggable="editingId !== h.id"
        :class="{ dragging: dragId === h.id, 'drag-over': dragOverId === h.id }"
        @dragstart="onDragStart(h.id, $event)"
        @dragover.prevent="dragOverId = h.id"
        @dragleave="dragOverId = null"
        @drop.prevent="onDrop(h.id)"
        @dragend="dragId = null; dragOverId = null"
      >
        <span class="handle" title="拖拽排序">⠿</span>
        <button class="check" :class="{ on: isChecked(h.id) }" @click="toggle(h.id)">
          <span v-if="isChecked(h.id)">✓</span>
        </button>
        <span class="bar" :style="{ background: h.color }" />
        <input
          v-if="editingId === h.id"
          class="edit-input"
          v-focus
          v-model="editName"
          maxlength="40"
          @keyup.enter="saveEdit"
          @keyup.esc="cancelEdit"
          @blur="saveEdit"
        />
        <span v-else class="hname">{{ h.name }}</span>
        <span class="streak muted" :title="`连续 ${streak(h.id)} 天`">
          🔥 {{ streak(h.id) }}
        </span>
        <button class="icon-btn" title="重命名" @click="startEdit(h)">✎</button>
        <button class="del" title="删除" @click="removeHabit(h.id)">×</button>
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
.add {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.add input {
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
  transition: box-shadow 0.15s ease, opacity 0.15s ease;
}
.list li.dragging {
  opacity: 0.4;
}
.list li.drag-over {
  box-shadow: inset 0 2px 0 var(--accent);
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
.edit-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 14px;
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
</style>
