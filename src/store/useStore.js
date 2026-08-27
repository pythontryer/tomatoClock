import { reactive, watch } from "vue"

const STORAGE_KEY = "focus-habit-panel:v1"

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* ignore corrupt storage */
  }
  return null
}

const defaults = {
  habits: [], // { id, name, color, createdAt }
  habitChecks: {}, // { 'YYYY-MM-DD': { habitId: true } }
  sessions: [], // { id, minutes, ts }
  pomoCycle: 0, // 已完成专注数（用于长休息节奏）
  settings: {
    focusMin: 25,
    breakMin: 5,
    longBreakMin: 15, // 长休息时长
    longBreakInterval: 4, // 每完成 N 个番茄后进入长休息
    autoStart: false, // 一段结束后是否自动开始下一段
    notify: true, // 桌面通知
    sound: true, // 提示音
    dailyFocusTarget: 120, // 每日专注目标（分钟）
    dailyPomoTarget: 8, // 每日番茄目标（个）
    theme: "light" // 'light' | 'dark'
  }
}

const base = load() || {}

// 合并默认值，保证老数据也补齐新增设置项
const state = reactive({
  habits: base.habits || [],
  habitChecks: base.habitChecks || {},
  sessions: base.sessions || [],
  pomoCycle: base.pomoCycle || 0,
  settings: { ...defaults.settings, ...(base.settings || {}) }
})

// 任意深层变更都持久化到 localStorage
watch(
  state,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

let _seq = 0
function uid() {
  return Date.now().toString(36) + (_seq++).toString(36)
}

export function useStore() {
  return { state, uid }
}
