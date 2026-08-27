import type { TimerMode } from '@/types/models'

/**
 * 番茄钟纯逻辑：从 useTimer 中抽取，便于在 Node 环境做单元测试，
 * 不依赖 Vue / DOM / 定时器。所有函数都是纯函数，输入决定输出。
 */

/** 剩余秒数：以「结束时刻 - 当前时刻」推算，与刷新频率无关（后台节流安全） */
export function computeRemainingSeconds(endAt: number, now: number): number {
  return Math.max(0, (endAt - now) / 1000)
}

/** 完成第 pomoCycle 个番茄后是否进入长休息（interval 非法时回退默认 4） */
export function isLongBreakDue(pomoCycle: number, interval: number): boolean {
  const safe = Number.isFinite(interval) && interval > 0 ? interval : 4
  return pomoCycle > 0 && pomoCycle % safe === 0
}

/** 专注完成后的下一个模式：长休息或短休息 */
export function nextModeAfterFocus(pomoCycle: number, interval: number): TimerMode {
  return isLongBreakDue(pomoCycle, interval) ? 'long' : 'break'
}

/** 长休息节奏信息：当前周期已完成几个、距下次长休息还差几个 */
export function cycleInfo(
  pomoCycle: number,
  interval: number
): { interval: number; done: number; nextLongAt: number } {
  const safe = Number.isFinite(interval) && interval > 0 ? interval : 4
  const done = ((pomoCycle % safe) + safe) % safe
  const nextLongAt = done === 0 ? safe : safe - done
  return { interval: safe, done, nextLongAt }
}
