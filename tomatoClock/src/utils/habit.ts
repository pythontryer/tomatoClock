import type { AppState, Habit } from '@/types/models'
import { todayKey } from '@/utils/date'

/** streakOf 不依赖完整 AppState，只取它需要的字段，便于测试与复用 */
export type HabitState = Pick<AppState, 'habits' | 'habitChecks'>

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

/** 某习惯在某日期是否应打卡 */
export function isDueOn(habit: Habit, date: Date): boolean {
  const freq = habit.freq ?? 'daily'
  if (freq === 'daily') return true
  const days = habit.freqDays ?? []
  if (freq === 'weekly' || freq === 'custom') return days.includes(date.getDay())
  if (freq === 'monthly') return days.includes(date.getDate())
  return true
}

export function isDueOnKey(habit: Habit, dayKey: string): boolean {
  return isDueOn(habit, new Date(dayKey + 'T00:00:00'))
}

export function isDueToday(habit: Habit): boolean {
  return isDueOn(habit, new Date())
}

function isSameDay(a: Date, b: Date): boolean {
  return todayKey(a) === todayKey(b)
}

/**
 * 频率感知的连续打卡天数：从今天往前数，直到断签。
 * - 应打卡日且已打卡：计数 +1 继续
 * - 今天（应打卡）还没打卡：不中断历史，往前走
 * - 过去的应打卡日没打卡：中断
 * - 非打卡日：中性跳过，不中断（避免「每周一三五」在周二误断连续）
 */
export function streakOf(state: HabitState, habitId: string, now: Date = new Date()): number {
  const habit = state.habits.find((h) => h.id === habitId)
  if (!habit) return 0
  const checks = state.habitChecks
  let count = 0
  const d = new Date(now)
  let guard = 0
  const MAX = 3660 // 约 10 年上限，防死循环
  while (guard++ < MAX) {
    if (isDueOn(habit, d)) {
      const key = todayKey(d)
      const checked = !!(checks[key] && checks[key][habitId])
      if (checked) {
        count++
        d.setDate(d.getDate() - 1)
        continue
      }
      if (isSameDay(d, now)) {
        d.setDate(d.getDate() - 1)
        continue
      }
      break
    }
    d.setDate(d.getDate() - 1)
  }
  return count
}

const FREQ_LABEL: Record<NonNullable<Habit['freq']>, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  custom: '自定义'
}

/** 人类可读的频率摘要：每日 / 每周一三五 / 每月1日 */
export function freqSummary(habit: Habit): string {
  const freq = habit.freq ?? 'daily'
  if (freq === 'daily') return '每日'
  const days = habit.freqDays ?? []
  if (freq === 'weekly' || freq === 'custom') {
    if (!days.length) return FREQ_LABEL[freq]
    const s = days
      .slice()
      .sort((a, b) => a - b)
      .map((n) => WEEKDAY_LABELS[n] ?? '')
      .join('')
    return `${FREQ_LABEL[freq]}${s}`
  }
  if (freq === 'monthly') {
    return `每月${days.join('/')}日`
  }
  return '每日'
}
