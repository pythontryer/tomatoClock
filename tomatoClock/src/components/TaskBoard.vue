<script setup>
import { ref, computed } from "vue"
import { useStore } from "../store/useStore"

const { state, uid } = useStore()
const text = ref("")

const activeTask = computed(
  () => state.tasks.find((t) => t.id === state.activeTaskId) || null
)

function addTask() {
  const name = text.value.trim()
  if (!name) return
  state.tasks.push({ id: uid(), name, done: false, pomo: 0 })
  text.value = ""
}

function delTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id)
  if (state.activeTaskId === id) state.activeTaskId = null
}

// 点击任务行切换绑定到番茄钟（再次点击解绑）
function toggleBind(id) {
  state.activeTaskId = state.activeTaskId === id ? null : id
}

function onKey(e) {
  if (e.key === "Enter") addTask()
}
</script>

<template>
  <section class="card tasks">
    <h2>📋 任务</h2>

    <div class="add">
      <input
        v-model="text"
        type="text"
        placeholder="添加一个任务，回车确认"
        maxlength="60"
        @keydown="onKey"
      />
      <button class="btn small" @click="addTask">添加</button>
    </div>

    <p v-if="activeTask" class="active-hint">
      🎯 计时绑定任务：<b>{{ activeTask.name }}</b>（完成后自动 +1 🍅）
    </p>

    <ul v-if="state.tasks.length" class="list">
      <li
        v-for="t in state.tasks"
        :key="t.id"
        :class="{ done: t.done, active: t.id === state.activeTaskId }"
        @click="toggleBind(t.id)"
      >
        <label class="row" @click.stop>
          <input type="checkbox" v-model="t.done" />
        </label>
        <span class="name">{{ t.name }}</span>
        <span class="pomo" :title="`已完成 ${t.pomo} 个番茄`">🍅 {{ t.pomo || 0 }}</span>
        <button
          class="bind"
          :class="{ on: t.id === state.activeTaskId }"
          @click.stop="toggleBind(t.id)"
        >
          {{ t.id === state.activeTaskId ? "计时中" : "绑定" }}
        </button>
        <button class="del" @click.stop="delTask(t.id)" title="删除">✕</button>
      </li>
    </ul>
    <p v-else class="empty muted">还没有任务，添加后点「绑定」即可把番茄计入任务。</p>
  </section>
</template>

<style scoped>
.tasks {
  display: flex;
  flex-direction: column;
}
.add {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.add input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
}
.active-hint {
  font-size: 12px;
  color: var(--accent);
  margin: 0 0 10px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.list li.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.list li.done .name {
  text-decoration: line-through;
  color: var(--muted);
}
.name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pomo {
  font-size: 13px;
  color: var(--muted);
  min-width: 42px;
  text-align: right;
}
.bind {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
}
.bind.on {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.del {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
}
.del:hover {
  color: var(--warn);
}
.empty {
  font-size: 13px;
}
</style>
