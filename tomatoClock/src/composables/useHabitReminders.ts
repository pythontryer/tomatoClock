import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { isDueToday } from '@/utils/habit'
import { todayKey } from '@/utils/date'
import { pushToast } from './useToast'
import { useNotification } from './useNotification'

/**
 * 习惯提醒：每分钟检查一次「今日应打卡 + 设定了提醒时间 + 当前分钟匹配 + 当天未提醒过」，
 * 命中则弹出应用内 toast 并尝试桌面通知。同一习惯每天只提醒一次。
 */
export function useHabitReminders() {
  const store = useAppStore()
  const notif = useNotification()
  const reminded = new Set<string>()

  function nowHHmm(): string {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getHours())}:${p(d.getMinutes())}`
  }

  function check() {
    const now = nowHHmm()
    const dayKey = todayKey()
    for (const h of store.habits) {
      if (!h.remindAt || h.remindAt !== now) continue
      if (!isDueToday(h)) continue
      const key = `${dayKey}-${h.id}`
      if (reminded.has(key)) continue
      reminded.add(key)
      // 已完成打卡则不再打扰
      if (store.habitChecks[dayKey]?.[h.id]) continue
      pushToast(`⏰ 该打卡啦：${h.name}`, 'info')
      notif.notify('⏰ 习惯提醒', `该打卡啦：${h.name}`)
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    check()
    timer = setInterval(check, 30_000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
