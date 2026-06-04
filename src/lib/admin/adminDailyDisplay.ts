import type { CSSProperties } from 'react'
import type { AdminMetricsPayload } from '@/lib/admin/types'

export function pct(n: number, d: number): string {
  if (d <= 0) return '—'
  return `${Math.round((n / d) * 1000) / 10} %`
}

export function avgPerDay(total: number, days: number): string {
  if (days <= 0) return '0'
  const v = total / days
  return v % 1 === 0 ? String(v) : v.toFixed(1).replace('.', ',')
}

export function computeDailyDerived(
  daily: AdminMetricsPayload['daily'],
  dailyTotals: AdminMetricsPayload['dailyTotals'],
) {
  const dayCount = daily.length || 30
  const bestRegDay = daily.reduce(
    (best, row) => (row.registrations > best.registrations ? row : best),
    daily[0] ?? { dayLabel: '—', registrations: 0 },
  )
  const last7 = daily.slice(-7)
  const last7Reg = last7.reduce((s, r) => s + r.registrations, 0)
  const last7Checkout = last7.reduce((s, r) => s + r.checkouts, 0)

  return {
    dayCount,
    bestRegDay,
    last7Reg,
    last7Checkout,
    avgReg: avgPerDay(dailyTotals.registrations, dayCount),
    avgConfirmed: avgPerDay(dailyTotals.confirmed, dayCount),
    avgCheckout: avgPerDay(dailyTotals.checkouts, dayCount),
    confirmRate: pct(dailyTotals.confirmed, dailyTotals.registrations),
    checkoutRate: pct(dailyTotals.checkouts, dailyTotals.confirmed),
  }
}

export function cellTint(value: number, max: number, accent: string): CSSProperties | undefined {
  if (value <= 0 || max <= 0) return undefined
  const intensity = Math.min(1, value / max)
  const alpha = 0.06 + intensity * 0.14
  return { background: `color-mix(in srgb, ${accent} ${Math.round(alpha * 100)}%, transparent)` }
}
