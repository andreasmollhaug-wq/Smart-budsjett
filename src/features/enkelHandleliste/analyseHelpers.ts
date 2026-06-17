import type { EhProductStat } from './types'

export function topProductsByCheckCount(
  stats: Record<string, EhProductStat>,
  days = 90,
  limit = 10,
): EhProductStat[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return Object.values(stats)
    .filter((s) => s.checkCount > 0 && s.lastCheckedAt && Date.parse(s.lastCheckedAt) >= cutoff)
    .sort((a, b) => b.checkCount - a.checkCount || b.addCount - a.addCount)
    .slice(0, limit)
}
