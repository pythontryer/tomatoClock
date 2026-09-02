import { normalizeHabit, normalizeTask, normalizeSession } from '@/utils/normalize'
import type { Habit, HabitChecks, Session, Task, Settings } from '@/types/models'

/** 校验+清洗后的干净数据 */
export interface SanitizedData {
  habits: Habit[]
  sessions: Session[]
  habitChecks: HabitChecks
  tasks: Task[]
  pomoCycle: number
  activeTaskId: string | null
  settings: Settings | null
  /** 这些是后加字段，老备份可能没有 */
  present: { tasks: boolean; pomoCycle: boolean; activeTaskId: boolean }
}

export interface ImportResult {
  error?: string
  data?: SanitizedData
  skipped: { habits: number; sessions: number; tasks: number }
}

/**
 * 字段级校验 + 清洗：剔除非法条目、补齐缺省，返回干净数据或错误描述。
 * 这样导入「大体可用但有少量坏数据」的备份时，不会整文件失败（冲突合并的字段级处理）。
 */
export function sanitize(raw: unknown): ImportResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { error: '根节点必须是 JSON 对象', skipped: { habits: 0, sessions: 0, tasks: 0 } }
  }
  const data = raw as Record<string, unknown>
  const skipped = { habits: 0, sessions: 0, tasks: 0 }

  if (!Array.isArray(data.habits)) return { error: '缺少 habits 数组', skipped }
  const habits: Habit[] = []
  for (const item of data.habits) {
    const h = item as Partial<Habit> | null
    if (!h || typeof h !== 'object') {
      skipped.habits++
      continue
    }
    if (typeof h.id !== 'string') {
      skipped.habits++
      continue
    }
    if (typeof h.name !== 'string' || !h.name.trim()) {
      skipped.habits++
      continue
    }
    habits.push(normalizeHabit(h as Partial<Habit> & { id: string; name: string }))
  }

  if (!Array.isArray(data.sessions)) return { error: '缺少 sessions 数组', skipped }
  const sessions: Session[] = []
  for (const item of data.sessions) {
    const s = item as Partial<Session> | null
    if (!s || typeof s !== 'object') {
      skipped.sessions++
      continue
    }
    if (typeof s.ts !== 'number' || !Number.isFinite(s.ts) || s.ts <= 0) {
      skipped.sessions++
      continue
    }
    if (
      typeof s.minutes !== 'number' ||
      !Number.isFinite(s.minutes) ||
      s.minutes <= 0 ||
      s.minutes > 1440
    ) {
      skipped.sessions++
      continue
    }
    sessions.push(
      normalizeSession(s as Partial<Session> & { id: string; minutes: number; ts: number })
    )
  }

  if (
    typeof data.habitChecks !== 'object' ||
    data.habitChecks === null ||
    Array.isArray(data.habitChecks)
  ) {
    return { error: '缺少 habitChecks 对象', skipped }
  }
  const habitChecks: HabitChecks = {}
  for (const day of Object.keys(data.habitChecks as Record<string, unknown>)) {
    const v = (data.habitChecks as Record<string, unknown>)[day]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      habitChecks[day] = v as Record<string, true>
    }
  }

  // tasks / pomoCycle / activeTaskId 是后加字段，老备份可能没有，需记录是否存在
  const present = {
    tasks: Array.isArray(data.tasks),
    pomoCycle: 'pomoCycle' in data,
    activeTaskId: 'activeTaskId' in data
  }
  const tasks: Task[] = []
  if (present.tasks) {
    for (const item of data.tasks as unknown[]) {
      const t = item as Partial<Task> | null
      if (!t || typeof t !== 'object') {
        skipped.tasks++
        continue
      }
      if (typeof t.id !== 'string') {
        skipped.tasks++
        continue
      }
      tasks.push(normalizeTask(t as Partial<Task> & { id: string; name: string }))
    }
  }
  const pomoCycle = typeof data.pomoCycle === 'number' && data.pomoCycle >= 0 ? data.pomoCycle : 0
  const activeTaskId =
    data.activeTaskId === null || typeof data.activeTaskId === 'string'
      ? (data.activeTaskId as string | null)
      : null
  const settings =
    data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
      ? (data.settings as Settings)
      : null

  return {
    data: { habits, sessions, habitChecks, tasks, pomoCycle, activeTaskId, settings, present },
    skipped
  }
}
