export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function lastNDays(n: number): string[] {
  const arr: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    arr.push(todayKey(d))
  }
  return arr
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function weekdayLabel(key: string): string {
  const d = new Date(key + 'T00:00:00')
  return WEEKDAYS[d.getDay()]
}
