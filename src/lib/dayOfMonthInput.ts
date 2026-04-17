import { clampBillingDay } from '@/lib/subscriptionTransactions'

export function commitDayOfMonthText(
  text: string,
  previousValue: number | undefined,
): { value: number; text: string } {
  const cleaned = String(text ?? '').trim()
  const fallback = clampBillingDay(previousValue ?? 1)
  if (cleaned === '') return { value: fallback, text: String(fallback) }
  const n = Number.parseInt(cleaned, 10)
  if (!Number.isFinite(n)) return { value: fallback, text: String(fallback) }
  const clamped = clampBillingDay(n)
  return { value: clamped, text: String(clamped) }
}

