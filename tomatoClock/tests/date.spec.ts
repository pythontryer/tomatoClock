import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { todayKey, lastNDays, weekdayLabel } from '@/utils/date'

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 27, 12, 0, 0)) // 2026-08-27 周四
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('todayKey 格式化为 YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('lastNDays 返回升序的最近 n 天（含今天）', () => {
    expect(lastNDays(3)).toEqual(['2026-08-25', '2026-08-26', '2026-08-27'])
    expect(lastNDays(7)).toHaveLength(7)
    expect(lastNDays(7)[6]).toBe('2026-08-27')
  })

  it('weekdayLabel 映射星期', () => {
    expect(weekdayLabel('2026-08-27')).toBe('四') // 周四
    expect(weekdayLabel('2026-08-23')).toBe('日') // 周日
  })
})
