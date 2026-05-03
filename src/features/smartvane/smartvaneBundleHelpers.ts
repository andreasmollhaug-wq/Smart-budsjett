import type { SmartvaneSerializableBundle } from './types'

export function dailyCompletedCountByDay(
  dailyHabitIds: string[],
  bundle: SmartvaneSerializableBundle,
  year: number,
  month: number,
): Map<string, number> {
  const dim = new Date(year, month, 0).getDate()
  const map = new Map<string, number>()
  const { dailyCompleted } = bundle
  for (let day = 1; day <= dim; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    let n = 0
    for (const hid of dailyHabitIds) {
      if ((dailyCompleted[hid] ?? []).includes(date)) n++
    }
    map.set(date, n)
  }
  return map
}

export function localTodayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmdToDay(ymd: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = ymd.split('-')
  return { y: Number(ys), m: Number(ms), d: Number(ds) }
}
