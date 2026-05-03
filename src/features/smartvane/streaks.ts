export function currentStreakFromAnchor(sortedIsoDates: string[], anchorDateIso: string): number {
  const set = new Set(sortedIsoDates)
  if (!set.has(anchorDateIso)) return 0
  let streak = 0
  let d = parseYmd(anchorDateIso)
  while (set.has(formatYmd(d))) {
    streak += 1
    d = addDays(d, -1)
  }
  return streak
}

/** Streak som slutter på eller før asOf: finner siste fullførte dag ≤ asOf, teller bakover. */
export function currentStreakUpto(sortedIsoDates: string[], asOfIso: string): number {
  const set = new Set(sortedIsoDates)
  let d = parseYmd(asOfIso)
  for (let guard = 0; guard < 62; guard++) {
    const key = formatYmd(d)
    if (set.has(key)) {
      return currentStreakFromAnchor(sortedIsoDates, key)
    }
    d = addDays(d, -1)
  }
  return 0
}

export function longestStreak(sortedIsoDates: string[]): number {
  if (sortedIsoDates.length === 0) return 0
  const sorted = [...sortedIsoDates].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseYmd(sorted[i - 1]!)
    const cur = parseYmd(sorted[i]!)
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      run += 1
      best = Math.max(best, run)
    } else if (diffDays === 0) {
      continue
    } else {
      run = 1
    }
  }
  return best
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

function formatYmd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime())
  x.setUTCDate(x.getUTCDate() + n)
  return x
}
