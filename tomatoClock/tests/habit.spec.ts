import { describe, it, expect } from 'vitest'
import { isDueOn, isDueOnKey, isDueToday, streakOf, freqSummary } from '@/utils/habit'
import { todayKey } from '@/utils/date'
import type { Habit, AppState } from '@/types/models'

function makeHabit(over: Partial<Habit>): Habit {
  return { id: 'h1', name: 't', color: '#fff', createdAt: 1, ...over }
}

/** 返回最近 count 个指定星期的日期 key（0=周日） */
function pastWeekdayKeys(weekday: number, count: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
    out.push(todayKey(d))
    d.setDate(d.getDate() - 1)
  }
  return out
}

function stateWithChecks(habit: Habit, keys: string[]): Pick<AppState, 'habits' | 'habitChecks'> {
  const checks: Record<string, Record<string, true>> = {}
  for (const k of keys) checks[k] = { [habit.id]: true }
  return { habits: [habit], habitChecks: checks }
}

describe('habits 频率判断', () => {
  it('默认（无 freq）按每日处理', () => {
    const h = makeHabit({})
    expect(isDueOn(h, new Date())).toBe(true)
  })

  it('daily 任意一天都到期', () => {
    const h = makeHabit({ freq: 'daily' })
    expect(isDueOn(h, new Date(2026, 0, 5))).toBe(true)
  })

  it('weekly 仅匹配指定星期', () => {
    const h = makeHabit({ freq: 'weekly', freqDays: [1, 3, 5] }) // 一三五
    expect(isDueOn(h, new Date(2026, 0, 5))).toBe(true) // 周一
    expect(isDueOn(h, new Date(2026, 0, 7))).toBe(true) // 周三
    expect(isDueOn(h, new Date(2026, 0, 4))).toBe(false) // 周日
  })

  it('monthly 仅匹配指定日期', () => {
    const h = makeHabit({ freq: 'monthly', freqDays: [5] })
    expect(isDueOn(h, new Date(2026, 0, 5))).toBe(true)
    expect(isDueOn(h, new Date(2026, 1, 5))).toBe(true)
    expect(isDueOn(h, new Date(2026, 0, 6))).toBe(false)
  })

  it('custom 行为同 weekly（按星期位匹配）', () => {
    const h = makeHabit({ freq: 'custom', freqDays: [0] }) // 仅周日
    expect(isDueOn(h, new Date(2026, 0, 4))).toBe(true) // 周日
    expect(isDueOn(h, new Date(2026, 0, 5))).toBe(false)
  })

  it('isDueOnKey / isDueToday 为包装器', () => {
    const h = makeHabit({ freq: 'weekly', freqDays: [1] })
    const key = pastWeekdayKeys(1, 1)[0]
    expect(isDueOnKey(h, key)).toBe(true)
    expect(typeof isDueToday(h)).toBe('boolean')
  })
})

describe('habits 频率文案', () => {
  it('daily → 每日', () => {
    expect(freqSummary(makeHabit({ freq: 'daily' }))).toBe('每日')
  })
  it('weekly → 每周一三五', () => {
    expect(freqSummary(makeHabit({ freq: 'weekly', freqDays: [1, 3, 5] }))).toBe('每周一三五')
  })
  it('monthly → 每月1日', () => {
    expect(freqSummary(makeHabit({ freq: 'monthly', freqDays: [1] }))).toBe('每月1日')
  })
})

describe('streakOf 频率感知连续打卡', () => {
  it('每日：今天+昨天打卡 → 2，今天未打但历史连续 → 1', () => {
    const h = makeHabit({ freq: 'daily' })
    const today = todayKey()
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yk = todayKey(y)

    expect(streakOf(stateWithChecks(h, [today, yk]), h.id)).toBe(2)

    // 今天未打卡、昨天打卡：今天作为到期日未打不再中断，昨天计 1
    expect(streakOf(stateWithChecks(h, [yk]), h.id)).toBe(1)
  })

  it('每周一：连续 3 个周一打卡 → 3', () => {
    const h = makeHabit({ freq: 'weekly', freqDays: [1] })
    const keys = pastWeekdayKeys(1, 3)
    expect(streakOf(stateWithChecks(h, keys), h.id)).toBe(3)
  })

  it('每周一：最近一个周一未打、更早一个打了 → 0（断签）', () => {
    const now = new Date(2026, 0, 7) // 周三：最近的周一(01-05)为过去的到期日
    const h = makeHabit({ freq: 'weekly', freqDays: [1] })
    // 只打了更早的周一(2025-12-29)，最近的周一(2026-01-05)漏打 → 断签
    expect(streakOf(stateWithChecks(h, ['2025-12-29']), h.id, now)).toBe(0)
  })

  it('非到期日不中断连续；今天（到期但未打）也不中断历史', () => {
    // 固定 now 为周三 2026-01-07（一三五的到期日）
    const now = new Date(2026, 0, 7)
    const h = makeHabit({ freq: 'weekly', freqDays: [1, 3, 5] })
    // 打上一个周一(01-05)与周五(01-02)，今天周三未打
    const keys = ['2026-01-05', '2026-01-02']
    // 今天(周三)未打不应中断：应数到周一、周五 = 2
    expect(streakOf(stateWithChecks(h, keys), h.id, now)).toBe(2)
  })

  it('过去到期日漏打则断签（周一漏打，只打更前的周五）', () => {
    const now = new Date(2026, 0, 7) // 周三
    const h = makeHabit({ freq: 'weekly', freqDays: [1, 3, 5] })
    // 只打周五 01-02，周一 01-05 漏打 → 在周一断签
    expect(streakOf(stateWithChecks(h, ['2026-01-02']), h.id, now)).toBe(0)
  })
})
