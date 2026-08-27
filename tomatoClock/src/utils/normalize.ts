import type { Habit, HabitFreq, Session, Task } from '@/types/models'

/**
 * 归一化工具：把「可能有缺失字段」的对象补齐为完整、合法的领域模型。
 * 供 persistence.withDefaults（加载/迁移老数据）与 importExport.sanitize（导入清洗）共用，
 * 避免各处的默认值逻辑发散。所有函数对非法输入只补默认、不抛错。
 */

const HABIT_FREQS: HabitFreq[] = ['daily', 'weekly', 'monthly', 'custom']

export function normalizeHabit(
  h: Partial<Habit> & { id: string; name: string }
): Habit {
  const freq: HabitFreq = HABIT_FREQS.includes(h.freq as HabitFreq)
    ? (h.freq as HabitFreq)
    : 'daily'
  const freqDays = Array.isArray(h.freqDays)
    ? h.freqDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 31)
    : []
  return {
    id: h.id,
    name: h.name.trim(),
    color: typeof h.color === 'string' && h.color ? h.color : '#5b6cff',
    createdAt:
      typeof h.createdAt === 'number' && Number.isFinite(h.createdAt)
        ? h.createdAt
        : Date.now(),
    freq,
    freqDays,
    remindAt: typeof h.remindAt === 'string' ? h.remindAt : null
  }
}

export function normalizeTask(t: Partial<Task> & { id: string; name: string }): Task {
  return {
    id: t.id,
    name: t.name.trim(),
    done: t.done === true,
    pomo: typeof t.pomo === 'number' && t.pomo >= 0 ? t.pomo : 0,
    estimate: typeof t.estimate === 'number' && t.estimate >= 0 ? t.estimate : 0
  }
}

export function normalizeSession(
  s: Partial<Session> & { id: string; minutes: number; ts: number }
): Session {
  return {
    id: s.id,
    minutes: s.minutes,
    ts: s.ts,
    intention: typeof s.intention === 'string' ? s.intention : '',
    rating: typeof s.rating === 'number' && s.rating >= 1 && s.rating <= 5 ? s.rating : 0,
    note: typeof s.note === 'string' ? s.note : ''
  }
}
