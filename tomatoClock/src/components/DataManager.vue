<script setup>
import { ref } from "vue"
import { useStore } from "../store/useStore"
import { todayKey } from "../utils/date"

const { state, uid } = useStore()

const fileInput = ref(null)
// 待确认的导入数据（已通过校验）
const pending = ref(null)
// { type: 'ok' | 'err', text: string }
const msg = ref(null)
const fileName = ref("")

// ---------- 导出 ----------
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `focus-habit-backup-${todayKey()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    msg.value = { type: "ok", text: "已导出备份文件" }
  } catch (e) {
    msg.value = { type: "err", text: "导出失败：" + e.message }
  }
}

// ---------- 导入：读取 + 校验 ----------
function pickFile() {
  msg.value = null
  pending.value = null
  fileInput.value && fileInput.value.click()
}

function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  fileName.value = file.name
  const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const res = sanitize(data)
        if (res.error) {
          msg.value = { type: "err", text: `文件格式不正确：${res.error}` }
          pending.value = null
        } else {
          const { data: clean, skipped, present } = res
          pending.value = clean
          const parts = []
          parts.push(`${clean.habits.length} 个习惯`)
          parts.push(`${clean.sessions.length} 条专注`)
          if (present.tasks) parts.push(`${clean.tasks.length} 个任务`)
          let text = `「${file.name}」校验通过：${parts.join(" / ")}。`
          const totalSkip = skipped.habits + skipped.sessions + skipped.tasks
          if (totalSkip > 0) {
            text += `已跳过 ${totalSkip} 条异常记录（缺字段或数值非法）。`
          }
          text += "请选择导入方式"
          msg.value = { type: "ok", text }
        }
      } catch (err) {
        msg.value = { type: "err", text: "文件不是有效的 JSON：" + err.message }
      }
      e.target.value = "" // 允许重复选择同一文件
    }
  reader.onerror = () => {
    msg.value = { type: "err", text: "文件读取失败，请重试" }
  }
  reader.readAsText(file)
}

// 字段级校验 + 清洗：剔除非法条目、补齐缺省，返回干净数据或错误描述。
// 这样导入「大体可用但有少量坏数据」的备份时，不会整文件失败（冲突合并的字段级处理）。
function sanitize(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { error: "根节点必须是 JSON 对象" }
  }
  const skipped = { habits: 0, sessions: 0, tasks: 0 }

  if (!Array.isArray(data.habits)) return { error: "缺少 habits 数组" }
  const habits = []
  for (const h of data.habits) {
    if (!h || typeof h !== "object") { skipped.habits++; continue }
    if (typeof h.id !== "string") { skipped.habits++; continue }
    if (typeof h.name !== "string" || !h.name.trim()) { skipped.habits++; continue }
    habits.push({
      id: h.id,
      name: h.name.trim(),
      color: typeof h.color === "string" ? h.color : "#5b6cff",
      createdAt: typeof h.createdAt === "number" ? h.createdAt : Date.now()
    })
  }

  if (!Array.isArray(data.sessions)) return { error: "缺少 sessions 数组" }
  const sessions = []
  for (const s of data.sessions) {
    if (!s || typeof s !== "object") { skipped.sessions++; continue }
    if (typeof s.ts !== "number" || !isFinite(s.ts) || s.ts <= 0) { skipped.sessions++; continue }
    if (
      typeof s.minutes !== "number" ||
      !isFinite(s.minutes) ||
      s.minutes <= 0 ||
      s.minutes > 1440
    ) {
      skipped.sessions++; continue
    }
    sessions.push({
      id: typeof s.id === "string" ? s.id : uid(),
      minutes: s.minutes,
      ts: s.ts
    })
  }

  if (
    typeof data.habitChecks !== "object" ||
    data.habitChecks === null ||
    Array.isArray(data.habitChecks)
  ) {
    return { error: "缺少 habitChecks 对象" }
  }
  const habitChecks = {}
  for (const day of Object.keys(data.habitChecks)) {
    const v = data.habitChecks[day]
    if (v && typeof v === "object" && !Array.isArray(v)) habitChecks[day] = v
  }

  // tasks / pomoCycle / activeTaskId 是后加的字段，老备份可能没有，需记录是否存在
  const present = {
    tasks: Array.isArray(data.tasks),
    pomoCycle: "pomoCycle" in data,
    activeTaskId: "activeTaskId" in data
  }
  const tasks = []
  if (present.tasks) {
    for (const t of data.tasks) {
      if (!t || typeof t !== "object") { skipped.tasks++; continue }
      if (typeof t.id !== "string") { skipped.tasks++; continue }
      tasks.push({
        id: t.id,
        name: typeof t.name === "string" ? t.name : "未命名任务",
        done: t.done === true,
        pomo: typeof t.pomo === "number" && t.pomo >= 0 ? t.pomo : 0
      })
    }
  }
  const pomoCycle =
    typeof data.pomoCycle === "number" && data.pomoCycle >= 0 ? data.pomoCycle : 0
  const activeTaskId =
    data.activeTaskId === null || typeof data.activeTaskId === "string"
      ? data.activeTaskId
      : null
  const settings =
    data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)
      ? data.settings
      : null

  return {
    data: { habits, sessions, habitChecks, tasks, pomoCycle, activeTaskId, settings },
    skipped,
    present
  }
}

// ---------- 应用导入 ----------
function applyImport(mode) {
  const data = pending.value
  if (!data) return
  if (mode === "overwrite") {
    state.habits = data.habits
    state.habitChecks = data.habitChecks
    state.sessions = data.sessions
    // 仅当导入文件本身包含这些后加字段时才覆盖，避免用旧备份清空本地的任务/计数
    if (data.present && data.present.tasks) state.tasks = data.tasks
    if (data.present && data.present.pomoCycle) state.pomoCycle = data.pomoCycle
    if (data.present && data.present.activeTaskId) state.activeTaskId = data.activeTaskId
    if (data.settings) state.settings = { ...state.settings, ...data.settings }
    msg.value = { type: "ok", text: "导入成功（已覆盖本地数据）" }
  } else {
    // 合并：习惯按 id 去重取本地优先，打卡按天取并集，专注/任务按 id 去重追加，
    // 番茄计数取较大值避免丢失，绑定任务本地优先
    const habitMap = new Map(state.habits.map((h) => [h.id, h]))
    for (const h of data.habits) if (!habitMap.has(h.id)) habitMap.set(h.id, h)
    state.habits = [...habitMap.values()]

    const mergedChecks = { ...state.habitChecks }
    for (const day of Object.keys(data.habitChecks)) {
      mergedChecks[day] = { ...(mergedChecks[day] || {}), ...(data.habitChecks[day] || {}) }
    }
    state.habitChecks = mergedChecks

    const sMap = new Map(state.sessions.map((s) => [s.id, s]))
    for (const s of data.sessions) if (!sMap.has(s.id)) sMap.set(s.id, s)
    state.sessions = [...sMap.values()]

    if (data.present && data.present.tasks) {
      const tMap = new Map(state.tasks.map((t) => [t.id, t]))
      for (const t of data.tasks) if (!tMap.has(t.id)) tMap.set(t.id, t)
      state.tasks = [...tMap.values()]
    }
    if (data.present && data.present.pomoCycle) {
      state.pomoCycle = Math.max(state.pomoCycle || 0, data.pomoCycle)
    }
    if (data.present && data.present.activeTaskId && !state.activeTaskId) {
      state.activeTaskId = data.activeTaskId
    }
    if (data.settings) state.settings = { ...state.settings, ...data.settings }
    msg.value = { type: "ok", text: "导入成功（已与本地数据合并）" }
  }
  pending.value = null
}

function cancelImport() {
  pending.value = null
  msg.value = null
}
</script>

<template>
  <section class="card data">
    <h2>💾 数据备份 <span class="muted sub">换设备不丢数据</span></h2>

    <div class="row">
      <button class="btn primary" @click="exportData">导出 JSON</button>
      <button class="btn" @click="pickFile">导入 JSON</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <div v-if="pending" class="confirm">
      <span class="muted">如何处理「{{ fileName }}」的数据？</span>
      <button class="btn primary" @click="applyImport('overwrite')">覆盖本地</button>
      <button class="btn" @click="applyImport('merge')">合并到本地</button>
      <button class="btn ghost" @click="cancelImport">取消</button>
    </div>

    <p v-if="msg" class="msg" :class="msg.type">{{ msg.text }}</p>
  </section>
</template>

<style scoped>
.sub {
  font-size: 12px;
  font-weight: 400;
  margin-left: 8px;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 12px;
  background: var(--accent-soft);
  border-radius: 10px;
  font-size: 13px;
}
.msg {
  margin: 10px 0 0;
  font-size: 13px;
}
.msg.ok {
  color: var(--good);
}
.msg.err {
  color: var(--warn);
}
</style>
