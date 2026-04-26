import { formatIntegerNbNo, formatNOKChartLabel } from '@/lib/utils'

const nokCurrency = (amount: number, showAmountDecimals: boolean) =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: showAmountDecimals ? 2 : 0,
  }).format(amount)

/**
 * NOK for visning i app (lister, KPI) — 0 des (standard) eller 0–2 des.
 */
export function formatNokCurrencyDisplay(amount: number, showAmountDecimals: boolean): string {
  if (!Number.isFinite(amount)) return ''
  return nokCurrency(amount, showAmountDecimals)
}

/**
 * Som formatNokCurrencyDisplay, men 0/NaN → tankestrek.
 */
export function formatNokOrDashDisplay(amount: number, showAmountDecimals: boolean): string {
  if (!Number.isFinite(amount) || amount === 0) return '—'
  return nokCurrency(amount, showAmountDecimals)
}

/**
 * Tett diagram-etikett (M / k / vanlige tall). Når `showAmountDecimals` er av, følger
 * gammel `formatNOKChartLabel`. Når den er på: M-grenen som før; 10k+ får inntil én desimal
 * i «k»; under 10k viser vi inntil to desimaler uten valutasymbol (kort akse/legend).
 */
export function formatNokChartLabelDisplay(amount: number, showAmountDecimals: boolean): string {
  if (!Number.isFinite(amount) || showAmountDecimals === false) {
    return formatNOKChartLabel(amount)
  }
  const n = amount
  if (n === 0) return ''
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    const s =
      m >= 10
        ? m.toLocaleString('nb-NO', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
        : m.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
    return `${sign}${s} M`
  }
  if (abs >= 10_000) {
    const k = abs / 1000
    const s = k.toLocaleString('nb-NO', { maximumFractionDigits: 1, minimumFractionDigits: 0 })
    return `${sign}${s} k`
  }
  return `${sign}${abs.toLocaleString('nb-NO', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`
}

/**
 * Aksen / tooltip der vi tidligere brukte heltall uten valutasymbol; bruk når y-aksen er NOK.
 */
export function formatNokAxisNoCurrencyDisplay(amount: number, showAmountDecimals: boolean): string {
  if (!Number.isFinite(amount)) return ''
  if (!showAmountDecimals) {
    return formatIntegerNbNo(amount)
  }
  return new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount)
}
