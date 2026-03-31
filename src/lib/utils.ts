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

/** Lys bane for fremdriftsring: blander hex med hvitt (0 = ren farge, 1 = hvitt). */
export function mixHexWithWhite(hex: string, whiteBlend: number): string {
  const n = hex.replace('#', '').trim()
  if (n.length !== 6 || !/^[0-9a-fA-F]+$/.test(n)) return '#E8EAEF'
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const t = Math.min(1, Math.max(0, whiteBlend))
  const rr = Math.round(r + (255 - r) * t)
  const gg = Math.round(g + (255 - g) * t)
  const bb = Math.round(b + (255 - b) * t)
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`
}

/** Mørkere tone for fremdriftsfyll: blander hex mot svart (0 = ren farge, 1 = svart). */
export function mixHexWithBlack(hex: string, blackBlend: number): string {
  const n = hex.replace('#', '').trim()
  if (n.length !== 6 || !/^[0-9a-fA-F]+$/.test(n)) return '#2E3440'
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const t = Math.min(1, Math.max(0, blackBlend))
  const rr = Math.round(r * (1 - t))
  const gg = Math.round(g * (1 - t))
  const bb = Math.round(b * (1 - t))
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`
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
