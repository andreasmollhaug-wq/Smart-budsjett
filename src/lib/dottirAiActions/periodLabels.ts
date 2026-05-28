import { MONTH_NAMES_NB, type BudgetPeriod } from '@/lib/dottirAiActions/types'

function monthName(m: number): string {
  const idx = Math.min(12, Math.max(1, Math.floor(m))) - 1
  return MONTH_NAMES_NB[idx] ?? '???'
}

export function formatBudgetPeriodLabel(period: BudgetPeriod): string {
  switch (period.mode) {
    case 'monthly_all':
      return 'Hver måned (jan–des)'
    case 'single_month':
      return `Kun ${monthName(period.month)}`
    case 'month_range': {
      const from = Math.min(period.from, period.to)
      const to = Math.max(period.from, period.to)
      if (from === to) return `Kun ${monthName(from)}`
      return `${monthName(from)}–${monthName(to)}`
    }
    case 'months': {
      const sorted = [...new Set(period.months)]
        .filter((m) => m >= 1 && m <= 12)
        .sort((a, b) => a - b)
      if (sorted.length === 0) return 'Ingen måneder'
      if (sorted.length === 1) return `Kun ${monthName(sorted[0]!)}`
      if (sorted.length === 12) return 'Hver måned (jan–des)'
      return sorted.map((m) => monthName(m)).join(', ')
    }
    default:
      return 'Ukjent periode'
  }
}

export function buildBudgetedFromPeriod(period: BudgetPeriod, amountNok: number, existing?: number[]): number[] {
  const base = Array.isArray(existing) && existing.length === 12 ? [...existing] : Array(12).fill(0)
  const amt = Math.round(amountNok)

  switch (period.mode) {
    case 'monthly_all':
      return Array(12).fill(amt)
    case 'single_month': {
      const idx = Math.min(11, Math.max(0, Math.floor(period.month) - 1))
      base[idx] = amt
      return base
    }
    case 'month_range': {
      const from = Math.min(period.from, period.to)
      const to = Math.max(period.from, period.to)
      for (let m = from; m <= to; m++) {
        const idx = m - 1
        if (idx >= 0 && idx < 12) base[idx] = amt
      }
      return base
    }
    case 'months':
      for (const m of period.months) {
        const idx = Math.floor(m) - 1
        if (idx >= 0 && idx < 12) base[idx] = amt
      }
      return base
    default:
      return base
  }
}

export function formatAmountLabel(amountNok: number, period: BudgetPeriod): string {
  const formatted = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(Math.round(amountNok))

  if (period.mode === 'monthly_all') return `${formatted} / mnd`
  return formatted
}

export function formatIsoDateNb(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}
