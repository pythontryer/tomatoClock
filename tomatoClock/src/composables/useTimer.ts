import { ref, computed, watch, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import type { TimerMode } from '@/types/models'
import { computeRemainingSeconds, isLongBreakDue, cycleInfo } from './timerLogic'

export interface TimerHooks {
  onFocusComplete: (minutes: number, isLong: boolean, sessionId: string) => void
  onBreakComplete: () => void
}

/**
 * 番茄钟计时核心：基于时间戳（结束时刻锚点）的状态机。
 * 只负责计时与节奏，不关心声音/通知——完成时通过 hooks 回调交给调用方。
 */
export function useTimer(hooks: TimerHooks) {
  const store = useAppStore()

  const mode = ref<TimerMode>('focus')
  const running = ref(false)
  const remaining = ref(store.settings.focusMin * 60)
  // 本段总时长（秒）：开始一段时锁定，避免计时中改设置导致进度跳变
  const segmentTotal = ref(remaining.value)

  let timer: ReturnType<typeof setInterval> | null = null
  let endAt = 0
  // 本次专注的意图（开始专注时写入，完成时随会话记录）
  let currentIntention = ''
  // 屏幕常亮锁（专注期间防止息屏）；不支持的浏览器静默降级
  let wakeLockSentinel: { release: () => Promise<void> } | null = null

  // 兜底：输入框被清空时可能是空串/NaN，回退到默认时长，避免计时变成 0 分钟卡死
  const safeFocus = computed(() => Number(store.settings.focusMin) || 25)
  const safeBreak = computed(() => Number(store.settings.breakMin) || 5)
  const safeLong = computed(() => Number(store.settings.longBreakMin) || 15)
  const safeInterval = computed(() => Number(store.settings.longBreakInterval) || 4)

  const totalSeconds = computed(() => {
    if (mode.value === 'focus') return safeFocus.value * 60
    if (mode.value === 'long') return safeLong.value * 60
    return safeBreak.value * 60
  })

  const progress = computed(() => {
    const t = segmentTotal.value
    return t > 0 ? 1 - remaining.value / t : 0
  })

  const display = computed(() => {
    const sec = Math.floor(remaining.value)
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const s = String(sec % 60).padStart(2, '0')
    return `${m}:${s}`
  })

  function loop() {
    remaining.value = computeRemainingSeconds(endAt, Date.now())
    if (remaining.value <= 0) complete()
  }

  function start(intention?: string) {
    if (running.value) return
    currentIntention = typeof intention === 'string' ? intention.trim() : ''
    running.value = true
    endAt = Date.now() + remaining.value * 1000
    // 250ms 刷新一次足够平滑；核心精度来自 Date.now()，与刷新频率无关
    timer = setInterval(loop, 250)
    // 专注期间锁定屏幕常亮，离开页面再回来时也会重新申请
    if (mode.value === 'focus') acquireWakeLock()
  }

  function pause() {
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
    // 暂停瞬间按真实时间结算剩余，避免整数秒累加误差
    remaining.value = computeRemainingSeconds(endAt, Date.now())
    releaseWakeLock()
  }

  // ---------- 屏幕常亮（Wake Lock） ----------
  async function acquireWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen')
    } catch {
      /* 不支持或被拒绝，静默忽略 */
    }
  }
  function releaseWakeLock() {
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release()
      } catch {
        /* ignore */
      }
      wakeLockSentinel = null
    }
  }
  function onVisibilityChange() {
    if (typeof document === 'undefined') return
    if (document.visibilityState === 'hidden') releaseWakeLock()
    else if (running.value && mode.value === 'focus') acquireWakeLock()
  }

  function reset() {
    pause()
    remaining.value = totalSeconds.value
    segmentTotal.value = totalSeconds.value
  }

  function switchMode(m: TimerMode) {
    mode.value = m
    pause()
    remaining.value = totalSeconds.value
    segmentTotal.value = totalSeconds.value
  }

  function complete() {
    pause()
    if (mode.value === 'focus') {
      const minutes = safeFocus.value
      const sessionId = store.recordFocus(minutes, currentIntention)
      // 每完成 longBreakInterval 个番茄后进入长休息，其余为短休息
      const isLong = isLongBreakDue(store.pomoCycle, safeInterval.value)
      mode.value = isLong ? 'long' : 'break'
      hooks.onFocusComplete(minutes, isLong, sessionId)
      currentIntention = ''
    } else {
      mode.value = 'focus'
      hooks.onBreakComplete()
    }
    remaining.value = totalSeconds.value
    segmentTotal.value = totalSeconds.value
    // 自动开始下一段（默认关闭，避免在不经意间连续计时）
    if (store.settings.autoStart) start()
  }

  // 距下次长休息还差几个番茄（用于 UI 提示，如「第 2/4 个」）
  const cycleInfoComputed = computed(() => cycleInfo(store.pomoCycle, safeInterval.value))

  // 设置变更时（且未在计时）同步刷新剩余时间
  watch(
    () => [
      store.settings.focusMin,
      store.settings.breakMin,
      store.settings.longBreakMin,
      mode.value
    ],
    () => {
      if (!running.value) {
        remaining.value = totalSeconds.value
        segmentTotal.value = totalSeconds.value
      }
    }
  )

  // ---------- 标签页标题倒计时 ----------
  const BASE_TITLE = typeof document !== 'undefined' ? document.title : ''
  const idle = computed(() => !running.value && remaining.value === totalSeconds.value)

  watch([display, mode, idle, running], () => {
    if (typeof document === 'undefined') return
    if (idle.value) {
      document.title = BASE_TITLE
      return
    }
    const icon = mode.value === 'focus' ? '🍅' : '☕'
    const label =
      mode.value === 'focus' ? '专注中' : mode.value === 'long' ? '长休息中' : '休息中'
    document.title = running.value
      ? `${icon} ${display.value} ${label}`
      : `${icon} ${display.value} 已暂停`
  })

  function restoreTitle() {
    if (typeof document !== 'undefined') document.title = BASE_TITLE
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    releaseWakeLock()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    restoreTitle()
  })

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  return {
    mode,
    running,
    remaining,
    display,
    progress,
    cycleInfo: cycleInfoComputed,
    start,
    pause,
    reset,
    switchMode
  }
}
