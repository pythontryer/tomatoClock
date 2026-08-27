<script setup>
import { ref } from "vue"
import { useStore } from "../store/useStore"
import { todayKey } from "../utils/date"

const { state } = useStore()

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
      const err = validate(data)
      if (err) {
        msg.value = { type: "err", text: `文件格式不正确：${err}` }
        pending.value = null
      } else {
        const n = data.habits.length
        const s = data.sessions.length
        pending.value = data
        msg.value = {
          type: "ok",
          text: `「${file.name}」校验通过：${n} 个习惯 / ${s} 条专注记录。请选择导入方式`
        }
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

// 结构校验：返回错误描述，通过则返回 null
function validate(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return "根节点必须是 JSON 对象"
  }
  if (!Array.isArray(data.habits)) return "缺少 habits 数组"
  for (const h of data.habits) {
    if (typeof h !== "object" || h === null) return "habits 中存在无效条目"
    if (typeof h.id === "undefined") return "habits 条目缺少 id"
    if (typeof h.name !== "string") return "habits 条目缺少 name"
  }
  if (!Array.isArray(data.sessions)) return "缺少 sessions 数组"
  for (const s of data.sessions) {
    if (typeof s !== "object" || s === null) return "sessions 中存在无效条目"
    if (typeof s.ts !== "number") return "sessions 条目缺少 ts"
    if (typeof s.minutes !== "number") return "sessions 条目缺少 minutes"
  }
  if (
    typeof data.habitChecks !== "object" ||
    data.habitChecks === null ||
    Array.isArray(data.habitChecks)
  ) {
    return "缺少 habitChecks 对象"
  }
  if (data.settings !== undefined && typeof data.settings !== "object") {
    return "settings 必须是对象"
  }
  return null
}

// ---------- 应用导入 ----------
function applyImport(mode) {
  const data = pending.value
  if (!data) return
  if (mode === "overwrite") {
    state.habits = data.habits
    state.habitChecks = data.habitChecks
    state.sessions = data.sessions
    if (data.settings) state.settings = { ...state.settings, ...data.settings }
    msg.value = { type: "ok", text: "导入成功（已覆盖本地数据）" }
  } else {
    // 合并：习惯按 id 去重取本地优先，打卡按天取并集，专注记录按 id 去重追加
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
