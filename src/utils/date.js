export function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function lastNDays(n) {
  const arr = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    arr.push(todayKey(d))
  }
  return arr
}

export function weekdayLabel(key) {
  const d = new Date(key + "T00:00:00")
  return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()]
}
