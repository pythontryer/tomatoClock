import { describe, it, expect } from 'vitest'
import {
  computeRemainingSeconds,
  isLongBreakDue,
  nextModeAfterFocus,
  cycleInfo
} from '@/composables/timerLogic'

describe('computeRemainingSeconds', () => {
  it('返回正差值（秒）', () => {
    expect(computeRemainingSeconds(1000, 0)).toBe(1)
    expect(computeRemainingSeconds(25000, 0)).toBe(25)
  })

  it('过期后钳制为 0', () => {
    expect(computeRemainingSeconds(1000, 2000)).toBe(0)
    expect(computeRemainingSeconds(0, 999999)).toBe(0)
  })

  it('后台节流安全：定时器只触发一次但已过去很久，剩余仍正确归零', () => {
    // 结束时刻 = T+25s，但页面被节流 60s 才触发一次 loop
    const endAt = 25_000
    const now = 60_000
    expect(computeRemainingSeconds(endAt, now)).toBe(0)
  })
})

describe('isLongBreakDue', () => {
  it('第 N 个（N 为 interval 整数倍）后应进入长休息', () => {
    expect(isLongBreakDue(4, 4)).toBe(true)
    expect(isLongBreakDue(8, 4)).toBe(true)
    expect(isLongBreakDue(12, 4)).toBe(true)
  })

  it('非整数倍时为短休息', () => {
    expect(isLongBreakDue(1, 4)).toBe(false)
    expect(isLongBreakDue(3, 4)).toBe(false)
    expect(isLongBreakDue(5, 4)).toBe(false)
  })

  it('0 个番茄不算长休息（尚未完成任何专注）', () => {
    expect(isLongBreakDue(0, 4)).toBe(false)
  })

  it('interval 非法时回退默认 4', () => {
    expect(isLongBreakDue(4, 0)).toBe(true)
    expect(isLongBreakDue(4, NaN)).toBe(true)
    expect(isLongBreakDue(2, 0)).toBe(false)
  })

  it('interval=1 时每个番茄后都长休息', () => {
    expect(isLongBreakDue(1, 1)).toBe(true)
    expect(isLongBreakDue(2, 1)).toBe(true)
  })
})

describe('nextModeAfterFocus', () => {
  it('长休息节点返回 long，否则 break', () => {
    expect(nextModeAfterFocus(4, 4)).toBe('long')
    expect(nextModeAfterFocus(5, 4)).toBe('break')
    expect(nextModeAfterFocus(0, 4)).toBe('break')
  })
})

describe('cycleInfo', () => {
  it('基础节奏', () => {
    expect(cycleInfo(0, 4)).toEqual({ interval: 4, done: 0, nextLongAt: 4 })
    expect(cycleInfo(1, 4)).toEqual({ interval: 4, done: 1, nextLongAt: 3 })
    expect(cycleInfo(3, 4)).toEqual({ interval: 4, done: 3, nextLongAt: 1 })
  })

  it('刚好完成长休息节点：done 归零，nextLongAt 为整周期', () => {
    expect(cycleInfo(4, 4)).toEqual({ interval: 4, done: 0, nextLongAt: 4 })
    expect(cycleInfo(8, 4)).toEqual({ interval: 4, done: 0, nextLongAt: 4 })
  })

  it('interval 非法回退默认 4', () => {
    expect(cycleInfo(3, 0)).toEqual({ interval: 4, done: 3, nextLongAt: 1 })
  })
})
