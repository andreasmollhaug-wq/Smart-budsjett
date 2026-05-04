import type { RenovationProject } from './types'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'

export function renovationDateRangeLabel(p: { startDate?: string; endDate?: string }): string | null {
  const { startDate, endDate } = p
  if (!startDate && !endDate) return null
  const a = startDate ? formatIsoDateDdMmYyyy(startDate) : null
  const b = endDate ? formatIsoDateDdMmYyyy(endDate) : null
  if (a && b) return `${a} – ${b}`
  if (a) return `fra ${a}`
  if (b) return `til ${b}`
  return null
}

export function renovationProjectListMetaLine(p: RenovationProject): string | null {
  const bits: string[] = []
  if (p.location) bits.push(p.location)
  const range = renovationDateRangeLabel(p)
  if (range) bits.push(range)
  return bits.length ? bits.join(' · ') : null
}
