export function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min((current / target) * 100, 100)
}

export function toMonthly(
  amount: number,
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'once',
): number {
  if (frequency === 'yearly') return amount / 12
  if (frequency === 'quarterly') return amount / 3
  if (frequency === 'weekly') return amount * 4.33
  return amount // monthly + once
}

export function formatThousands(value: number | string): string {
  const num = String(value).replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('nb-NO')
}

export function parseThousands(formatted: string): number {
  return Number(formatted.replace(/\s/g, '').replace(/,/g, '')) || 0
}
