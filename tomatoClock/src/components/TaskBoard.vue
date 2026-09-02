<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import type { Task } from '@/types/models'

const store = useAppStore()
const text = ref('')
const estimate = ref<number | null>(null)
const vFocus = { mounted: (el: HTMLInputElement) => el.focus() }

function addTask() {
  const name = text.value.trim()
  if (!name) return
  store.addTask(name, estimate.value && estimate.value > 0 ? estimate.value : 0)
  text.value = ''
  estimate.value = null
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') addTask()
}

// 行内编辑预估番茄数
const editId = ref<string | null>(null)
const editEstimate = ref<number>(0)
function startEditEstimate(t: Task) {
  editId.value = t.id
  editEstimate.value = t.estimate ?? 0
}
function saveEstimate() {
  if (editId.value === null) return
  store.setTaskEstimate(editId.value, editEstimate.value)
  editId.value = null
}

/** 完成度徽标：达标 / 超出 / 进行中 */
function estBadge(t: Task): { text: string; cls: string } {
  if (!t.estimate || t.estimate <= 0) return { text: '', cls: '' }
  if (t.pomo >= t.estimate) return { text: '达标', cls: 'ok' }
  if (t.pomo > 0) return { text: '进行中', cls: 'doing' }
  return { text: '未开始', cls: 'idle' }
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
      <input
        v-model.number="estimate"
        type="number"
        min="0"
        class="est-add"
        placeholder="预估🍅"
        title="预估番茄数（可选）"
      />
      <button class="btn small" @click="addTask">添加</button>
    </div>

    <p v-if="store.activeTask" class="active-hint">
      🎯 计时绑定任务：<b>{{ store.activeTask.name }}</b
      >（完成后自动 +1 🍅）
    </p>

    <ul v-if="store.tasks.length" class="list">
      <li
        v-for="t in store.tasks"
        :key="t.id"
        :class="{ done: t.done, active: t.id === store.activeTaskId }"
        @click="store.toggleBind(t.id)"
      >
        <label class="row" @click.stop>
          <input v-model="t.done" type="checkbox" />
        </label>
        <span class="name">{{ t.name }}</span>
        <span class="pomo" :title="`已完成 ${t.pomo} 个番茄`">🍅 {{ t.pomo || 0 }}</span>

        <template v-if="editId !== t.id">
          <span
            v-if="t.estimate && t.estimate > 0"
            class="estimate"
            :title="`目标 ${t.estimate} 🍅`"
            @click.stop="startEditEstimate(t)"
          >
            <span class="est-text">{{ t.pomo || 0 }}/{{ t.estimate }} 🍅</span>
            <span class="badge" :class="estBadge(t).cls">{{ estBadge(t).text }}</span>
          </span>
          <button v-else class="est-set" @click.stop="startEditEstimate(t)">设目标</button>
        </template>
        <input
          v-else
          v-model.number="editEstimate"
          v-focus
          class="est-input"
          type="number"
          min="0"
          @keyup.enter="saveEstimate"
          @keyup.esc="editId = null"
          @blur="saveEstimate"
        />

        <button
          class="bind"
          :class="{ on: t.id === store.activeTaskId }"
          @click.stop="store.toggleBind(t.id)"
        >
          {{ t.id === store.activeTaskId ? '计时中' : '绑定' }}
        </button>
        <button class="del" title="删除" aria-label="删除任务" @click.stop="store.removeTask(t.id)">
          ✕
        </button>
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
.add input[type='text'] {
  flex: 1;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
}
.est-add {
  width: 84px;
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
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
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
.estimate {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
}
.est-text {
  white-space: nowrap;
}
.badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  white-space: nowrap;
}
.badge.ok {
  background: var(--good);
  color: #fff;
}
.badge.doing {
  background: var(--accent-soft);
  color: var(--accent);
}
.badge.idle {
  background: var(--bg);
  color: var(--muted);
}
.est-set {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px dashed var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
}
.est-input {
  width: 64px;
  padding: 3px 6px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 13px;
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
