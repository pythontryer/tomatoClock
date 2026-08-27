import { defineStore } from 'pinia'
import { loadState, withDefaults } from './persistence'
import { uid } from '@/utils/id'
import { todayKey } from '@/utils/date'
import type { AppState, Task } from '@/types/models'
import type { SanitizedData } from '@/utils/importExport'

export const useAppStore = defineStore('app', {
  state: (): AppState => withDefaults(loadState()),

  getters: {
    /** 当前绑定到番茄钟的任务 */
    activeTask(state): Task | null {
      return state.tasks.find((t) => t.id === state.activeTaskId) ?? null
    }
  },

  actions: {
    // ---------- 习惯 ----------
    addHabit(name: string, color: string) {
      const n = name.trim()
      if (!n) return
      this.habits.push({ id: uid(), name: n, color, createdAt: Date.now() })
    },

    removeHabit(id: string) {
      this.habits = this.habits.filter((h) => h.id !== id)
      // 清掉该习惯在所有日期的打卡记录
      for (const day of Object.keys(this.habitChecks)) {
        delete this.habitChecks[day]?.[id]
      }
    },

    renameHabit(id: string, name: string) {
      const n = name.trim()
      const h = this.habits.find((x) => x.id === id)
      if (h && n) h.name = n
    },

    reorderHabits(from: number, to: number) {
      const list = [...this.habits]
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      this.habits = list
    },

    toggleHabitCheck(habitId: string, dateKey: string = todayKey()) {
      const day = this.habitChecks[dateKey] ?? (this.habitChecks[dateKey] = {})
      if (day[habitId]) delete day[habitId]
      else day[habitId] = true
    },

    // ---------- 任务 ----------
    addTask(name: string) {
      const n = name.trim()
      if (!n) return
      this.tasks.push({ id: uid(), name: n, done: false, pomo: 0 })
    },

    removeTask(id: string) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
      if (this.activeTaskId === id) this.activeTaskId = null
    },

    toggleBind(id: string) {
      this.activeTaskId = this.activeTaskId === id ? null : id
    },

    // ---------- 专注 ----------
    /** 补记一次专注（离开番茄钟时的漏记） */
    logSession(minutes: number) {
      if (!minutes || minutes <= 0) return
      this.sessions.push({ id: uid(), minutes, ts: Date.now() })
    },

    /** 完成一个专注番茄：记录会话、推进长休息节奏、给绑定任务 +1 🍅 */
    recordFocus(minutes: number) {
      this.sessions.push({ id: uid(), minutes, ts: Date.now() })
      this.pomoCycle += 1
      const t = this.tasks.find((x) => x.id === this.activeTaskId)
      if (t) t.pomo += 1
    },

    // ---------- 导入 ----------
    overwrite(data: SanitizedData) {
      this.habits = data.habits
      this.habitChecks = data.habitChecks
      this.sessions = data.sessions
      // 仅当导入文件包含后加字段时才覆盖，避免旧备份清空本地任务/计数
      if (data.present.tasks) this.tasks = data.tasks
      if (data.present.pomoCycle) this.pomoCycle = data.pomoCycle
      if (data.present.activeTaskId) this.activeTaskId = data.activeTaskId
      if (data.settings) this.settings = { ...this.settings, ...data.settings }
    },

    merge(data: SanitizedData) {
      // 习惯按 id 去重取本地优先
      const habitMap = new Map(this.habits.map((h) => [h.id, h]))
      for (const h of data.habits) if (!habitMap.has(h.id)) habitMap.set(h.id, h)
      this.habits = [...habitMap.values()]

      // 打卡按天取并集
      const mergedChecks = { ...this.habitChecks }
      for (const day of Object.keys(data.habitChecks)) {
        mergedChecks[day] = { ...(mergedChecks[day] ?? {}), ...(data.habitChecks[day] ?? {}) }
      }
      this.habitChecks = mergedChecks

      // 专注/任务按 id 去重追加
      const sMap = new Map(this.sessions.map((s) => [s.id, s]))
      for (const s of data.sessions) if (!sMap.has(s.id)) sMap.set(s.id, s)
      this.sessions = [...sMap.values()]

      if (data.present.tasks) {
        const tMap = new Map(this.tasks.map((t) => [t.id, t]))
        for (const t of data.tasks) if (!tMap.has(t.id)) tMap.set(t.id, t)
        this.tasks = [...tMap.values()]
      }
      // 计数取较大值避免丢失；绑定任务本地优先
      if (data.present.pomoCycle) {
        this.pomoCycle = Math.max(this.pomoCycle, data.pomoCycle)
      }
      if (data.present.activeTaskId && !this.activeTaskId) {
        this.activeTaskId = data.activeTaskId
      }
      if (data.settings) this.settings = { ...this.settings, ...data.settings }
    }
  }
})
