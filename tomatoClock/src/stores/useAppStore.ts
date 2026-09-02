import { defineStore } from 'pinia'
import { loadState, withDefaults } from './persistence'
import { uid } from '@/utils/id'
import { todayKey } from '@/utils/date'
import { focusCoins, findCosmetic, PLANT_FORMS, CELEBRATIONS } from '@/constants'
import type { AppState, Task, HabitFreq } from '@/types/models'
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
    addHabit(name: string, color: string, freq: HabitFreq = 'daily', freqDays: number[] = []) {
      const n = name.trim()
      if (!n) return
      this.habits.push({
        id: uid(),
        name: n,
        color,
        createdAt: Date.now(),
        freq,
        freqDays: freq === 'daily' ? [] : freqDays
      })
    },

    /** 修改习惯的打卡频率配置 */
    setHabitFreq(id: string, freq: HabitFreq, freqDays: number[] = []) {
      const h = this.habits.find((x) => x.id === id)
      if (!h) return
      h.freq = freq
      h.freqDays = freq === 'daily' ? [] : freqDays
    },

    /** 设置习惯的每日提醒时间（HH:mm，null=不提醒） */
    setHabitRemind(id: string, remindAt: string | null) {
      const h = this.habits.find((x) => x.id === id)
      if (!h) return
      h.remindAt =
        typeof remindAt === 'string' && /^\d{1,2}:\d{2}$/.test(remindAt) ? remindAt : null
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
    addTask(name: string, estimate: number = 0) {
      const n = name.trim()
      if (!n) return
      this.tasks.push({ id: uid(), name: n, done: false, pomo: 0, estimate })
    },

    /** 设置任务的预估番茄数（0=未预估） */
    setTaskEstimate(id: string, estimate: number) {
      const t = this.tasks.find((x) => x.id === id)
      if (t) t.estimate = Math.max(0, Math.floor(estimate))
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

    /** 完成一个专注番茄：记录会话、推进长休息节奏、给绑定任务 +1 🍅 、给陪伴角色发放专注币；返回新建会话 id 以便复盘 */
    recordFocus(minutes: number, intention?: string): string {
      const id = uid()
      this.sessions.push({
        id,
        minutes,
        ts: Date.now(),
        intention: typeof intention === 'string' ? intention.trim() : '',
        rating: 0,
        note: ''
      })
      this.pomoCycle += 1
      const t = this.tasks.find((x) => x.id === this.activeTaskId)
      if (t) t.pomo += 1
      // 完成专注 → 陪伴角色获得专注币（完成才是奖励，提前退出不奖励）
      this.companion.coins += focusCoins(minutes)
      return id
    },

    /** 给某次专注补写复盘：质量评分 1-5（0=未评）与备注 */
    reflect(sessionId: string, rating: number, note: string) {
      const s = this.sessions.find((x) => x.id === sessionId)
      if (!s) return
      s.rating = Math.max(0, Math.min(5, Math.round(rating || 0)))
      s.note = typeof note === 'string' ? note : ''
    },

    // ---------- 陪伴角色（专注小园）----------
    /** 解锁一个装饰（植物形态或庆祝特效）。余额不足/已拥有/不存在时返回 false */
    unlockCosmetic(id: string): boolean {
      const item = findCosmetic(id)
      if (!item) return false
      if (this.companion.unlocked.includes(id)) return false
      if (this.companion.coins < item.cost) return false
      this.companion.coins -= item.cost
      this.companion.unlocked.push(id)
      // 解锁后自动选用，让奖励立即可见
      if (PLANT_FORMS.some((s) => s.id === id)) this.companion.activeCompanion = id
      if (CELEBRATIONS.some((c) => c.id === id)) this.companion.activeCelebration = id
      return true
    },

    setActiveCompanion(id: string) {
      if (this.companion.unlocked.includes(id)) this.companion.activeCompanion = id
    },
    setActiveCelebration(id: string) {
      if (this.companion.unlocked.includes(id)) this.companion.activeCelebration = id
    },
    setCompanionName(name: string) {
      const n = (name || '').trim().slice(0, 16)
      this.companion.name = n || '小绿'
    },
    setCompanionMsg(kind: 'complete' | 'fail', text: string) {
      const t = (text || '').slice(0, 60)
      if (kind === 'complete') this.companion.completeMsg = t
      else this.companion.failMsg = t
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
