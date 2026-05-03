/** Trend: sammenlign sum av daglige «score» siste 7 dager vs forrige 7 (innen måned). Score = andel av daglige vaner som er krysset / mål brukt som 1 per dag. Her: bruk ratio dailyCompletedCount / max(dailyHabitCount,1) per dag. */
export type DailySummaryPoint = {
  date: string
  /** 0–1 */
  ratio: number
  dailyCompletedCount: number
  dailyHabitCount: number
  dailyGoalTotal: number
  /** om antall fullførte daglige vaner >= daily_goal_total for den dagen */
  dailyGoalMet: boolean
}

export function buildDailySummaryPoints(params: {
  daysInMonth: number
  year: number
  month: number
  /** dato -> antall distinkte daglige vaner krysset */
  completedCountByDay: Map<string, number>
  dailyHabitCount: number
  dailyGoalTotal: number
}): DailySummaryPoint[] {
  const { daysInMonth, year, month, completedCountByDay, dailyHabitCount, dailyGoalTotal } = params
  const points: DailySummaryPoint[] = []
  const denom = Math.max(1, dailyHabitCount)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = ymd(year, month, day)
    const dailyCompletedCount = completedCountByDay.get(date) ?? 0
    const ratio = Math.min(1, dailyCompletedCount / denom)
    const dailyGoalMet = dailyCompletedCount >= dailyGoalTotal
    points.push({
      date,
      ratio,
      dailyCompletedCount,
      dailyHabitCount,
      dailyGoalTotal,
      dailyGoalMet,
    })
  }
  return points
}

export type TrendArrow = 'up' | 'down' | 'flat'

const TREND_EPS = 0.05

export function trend7Vs7(points: DailySummaryPoint[]): TrendArrow {
  const n = points.length
  if (n < 2) return 'flat'
  const len = Math.min(7, Math.floor(n / 2))
  if (len === 0) return 'flat'
  const end = n - 1
  const aStart = end - 2 * len + 1
  const aEnd = end - len
  const bStart = end - len + 1
  let sumA = 0
  let sumB = 0
  for (let i = aStart; i <= aEnd; i++) {
    sumA += points[i]!.ratio
  }
  for (let i = bStart; i <= end; i++) {
    sumB += points[i]!.ratio
  }
  const meanA = sumA / len
  const meanB = sumB / len
  if (meanB - meanA > TREND_EPS) return 'up'
  if (meanA - meanB > TREND_EPS) return 'down'
  return 'flat'
}

/** Per ukedag 0=søndag .. 6=lørdag (JS getDay): hvor ofte dailyGoalMet blant dager der den ukedagen forekommer i måneden. */
export type WeekdayStrength = {
  weekday: number
  labelNo: string
  rate: number
  met: number
  total: number
}

const WEEKDAY_LABELS_NO = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']

export function weekdayStrengthInMonth(points: DailySummaryPoint[]): WeekdayStrength[] {
  const stats = new Map<number, { met: number; total: number }>()
  for (const p of points) {
    const d = parseYmdLocal(p.date)
    const wd = d.getDay()
    const cur = stats.get(wd) ?? { met: 0, total: 0 }
    cur.total += 1
    if (p.dailyGoalMet) cur.met += 1
    stats.set(wd, cur)
  }
  return Array.from({ length: 7 }, (_, weekday) => {
    const s = stats.get(weekday) ?? { met: 0, total: 0 }
    const rate = s.total > 0 ? s.met / s.total : 0
    return {
      weekday,
      labelNo: WEEKDAY_LABELS_NO[weekday]!,
      rate,
      met: s.met,
      total: s.total,
    }
  })
}

export function strongestAndWeakestWeekday(rows: WeekdayStrength[]): {
  strongest: WeekdayStrength | null
  weakest: WeekdayStrength | null
} {
  const withData = rows.filter((r) => r.total > 0)
  if (withData.length === 0) return { strongest: null, weakest: null }
  let strongest = withData[0]!
  let weakest = withData[0]!
  for (const r of withData) {
    if (r.rate > strongest.rate) strongest = r
    if (r.rate < weakest.rate) weakest = r
  }
  return { strongest, weakest }
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Lokal midnatt-parsing for konsistens med bruker-kalender (Europe/Oslo brukes i server senere). */
function parseYmdLocal(s: string): Date {
  const [y, mo, da] = s.split('-').map(Number)
  return new Date(y!, mo! - 1, da!)
}
