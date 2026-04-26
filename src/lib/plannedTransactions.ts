import type { Transaction } from '@/lib/store'
import { formatNOK, formatTransactionDateNbNo } from '@/lib/utils'

type PlannedOverdueTxGroups = {
  overdue: Transaction[]
  thisMonthNotReviewed: Transaction[]
}

/** Dagens dato som YYYY-MM-DD (lokal kalender). */
export function todayYyyyMmDd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Transaksjonen er planlagt frem i tid (kun dato, ikke klokkeslett). */
export function isFutureTransactionDate(dateStr: string, today = todayYyyyMmDd()): boolean {
  return typeof dateStr === 'string' && dateStr.length >= 10 && dateStr.slice(0, 10) > today
}

/**
 * Skal følges opp som plan (varsler, «Kommende»): bruker-satte fremtidige poster,
 * eller app-genererte trekk fra gjeld / tjenesteabonnement.
 */
export function transactionRequiresPlanFollowUp(t: Transaction): boolean {
  return Boolean(
    t.plannedFollowUp ||
      t.linkedDebtId ||
      t.linkedServiceSubscriptionId,
  )
}

/** Bruker har bekreftet gjennomgang eller (for utgift) betaling. */
export function isPlanFollowUpComplete(t: Transaction): boolean {
  if (t.reviewedAt) return true
  if (t.type === 'expense' && t.paidAt) return true
  return false
}

/** Fremtidige planlagte (dato > i dag). */
export function isUpcomingPlannedTransaction(t: Transaction, today = todayYyyyMmDd()): boolean {
  if (!transactionRequiresPlanFollowUp(t)) return false
  const d = t.date?.slice(0, 10) ?? ''
  return d > today
}

/**
 * Planlagt dato er passert, men oppfølging ikke fullført.
 * Varsel «dagen etter»: krever `date` strengt før dagens dato (samme dag som plan telles ikke som «etter forfall»).
 */
export function isOverduePlanFollowUp(t: Transaction, today = todayYyyyMmDd()): boolean {
  if (!transactionRequiresPlanFollowUp(t)) return false
  const d = t.date?.slice(0, 10) ?? ''
  if (!(d < today)) return false
  return !isPlanFollowUpComplete(t)
}

export function sortTransactionsByDateAsc(a: Transaction, b: Transaction): number {
  const ad = a.date?.slice(0, 10) ?? ''
  const bd = b.date?.slice(0, 10) ?? ''
  if (ad !== bd) return ad.localeCompare(bd)
  return (a.description ?? '').localeCompare(b.description ?? '')
}

/** Første og siste kalenderdag i samme måned som `today` (YYYY-MM-DD). */
export function getCalendarMonthRange(today: string): { start: string; end: string } {
  const y = parseInt(today.slice(0, 4), 10)
  const m0 = parseInt(today.slice(5, 7), 10) - 1
  const start = `${today.slice(0, 7)}-01`
  const lastDay = new Date(y, m0 + 1, 0).getDate()
  const end = `${y}-${String(m0 + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export function isDateInCalendarMonth(dateStr: string, start: string, end: string): boolean {
  const d = dateStr.slice(0, 10)
  return d.length >= 10 && d >= start && d <= end
}

/**
 * Planlagt oppfølging i inneværende måned (inkl. i dag), ikke fullført, kun dato frem til månedsslutt.
 * Datoer tidligere i måneden (f.eks. 1. når i dag er 15.) er ekskludert; bruk `isIncompletePlannedInCalendarMonth` for full månedsliste.
 * @deprecated Prefer `isIncompletePlannedInCalendarMonth` for «Kommende»-visning.
 */
export function isPlannedKommendeThisMonth(t: Transaction, today = todayYyyyMmDd()): boolean {
  if (!transactionRequiresPlanFollowUp(t)) return false
  if (isPlanFollowUpComplete(t)) return false
  const d = t.date?.slice(0, 10) ?? ''
  if (d.length < 10) return false
  const { start, end } = getCalendarMonthRange(today)
  if (!isDateInCalendarMonth(d, start, end)) return false
  return d >= today
}

/**
 * Plan som trenger oppfølging, ikke fullført, med dato i inneværende kalendermåned (inkl. forfalte datoer samme måned).
 */
export function isIncompletePlannedInCalendarMonth(
  t: Transaction,
  today = todayYyyyMmDd(),
): boolean {
  if (!transactionRequiresPlanFollowUp(t)) return false
  if (isPlanFollowUpComplete(t)) return false
  const d = t.date?.slice(0, 10) ?? ''
  if (d.length < 10) return false
  const { start, end } = getCalendarMonthRange(today)
  return isDateInCalendarMonth(d, start, end)
}

/**
 * Forfalt plan med dato før inneværende kalendermåned (f.eks. fjor måned) — egen høy-prioritetsliste under «Kommende».
 */
export function isPlanOverdueFromEarlierMonths(
  t: Transaction,
  today = todayYyyyMmDd(),
): boolean {
  if (!isOverduePlanFollowUp(t, today)) return false
  const d = t.date?.slice(0, 10) ?? ''
  if (d.length < 10) return false
  const { start } = getCalendarMonthRange(today)
  return d < start
}

/** Sorter: forfalte datoer i måneden først (eldre forfall), deretter stigende dato. */
export function sortThisMonthPlannedByUrgency(
  a: Transaction,
  b: Transaction,
  today: string,
): number {
  const ad = a.date?.slice(0, 10) ?? ''
  const bd = b.date?.slice(0, 10) ?? ''
  const aOver = ad < today
  const bOver = bd < today
  if (aOver !== bOver) return aOver ? -1 : 1
  return sortTransactionsByDateAsc(a, b)
}

/**
 * Planlagt oppfølging med dato etter inneværende måneds siste dag, ikke fullført.
 */
export function isPlannedKommendeLater(t: Transaction, today = todayYyyyMmDd()): boolean {
  if (!transactionRequiresPlanFollowUp(t)) return false
  if (isPlanFollowUpComplete(t)) return false
  const d = t.date?.slice(0, 10) ?? ''
  if (d.length < 10) return false
  const { end } = getCalendarMonthRange(today)
  return d > end
}

/** Banner på transaksjonslisten: forfalte, eller månedens plan uten gjennomgang. */
export function shouldShowKommendeAttentionBanner(
  transactions: Transaction[],
  today = todayYyyyMmDd(),
): boolean {
  return transactions.some(
    (t) =>
      isOverduePlanFollowUp(t, today) ||
      (isIncompletePlannedInCalendarMonth(t, today) && !t.reviewedAt),
  )
}

/**
 * Ved lagring fra skjema: sett planlagt oppfølging for fremtidige datoer uten synk-lenke.
 */
export function plannedFollowUpForNewTransaction(dateStr: string): boolean | undefined {
  const today = todayYyyyMmDd()
  if (dateStr > today) return true
  return undefined
}

/**
 * Ved redigering av dato: oppdater plannedFollowUp når ikke styrt av gjeld/abonnement.
 */
export function inferPlannedFollowUpOnDateChange(
  prev: Transaction,
  nextDate: string,
): { plannedFollowUp?: boolean } {
  if (prev.linkedDebtId || prev.linkedServiceSubscriptionId) return {}
  const today = todayYyyyMmDd()
  if (nextDate > today) return { plannedFollowUp: true }
  if (prev.plannedFollowUp && !prev.reviewedAt) return { plannedFollowUp: true }
  return { plannedFollowUp: false }
}

export const PLANNED_OVERDUE_NOTIFICATION_ID = 'insight:planned-tx-overdue:active'

function collectPlannedOverdueGroups(transactions: Transaction[], today: string): PlannedOverdueTxGroups {
  const overdue = transactions
    .filter((t) => isOverduePlanFollowUp(t, today))
    .sort(sortTransactionsByDateAsc)
  const thisMonthNotReviewed = transactions
    .filter((t) => isIncompletePlannedInCalendarMonth(t, today) && !t.reviewedAt)
    .sort((a, b) => sortThisMonthPlannedByUrgency(a, b, today))
  return { overdue, thisMonthNotReviewed }
}

/**
 * Stabil signatur uavhengig av beløpsformatering i brødtekst (for les/u lest ved toggle «desimaler»).
 */
export function plannedOverdueContentSignature(transactions: Transaction[], today = todayYyyyMmDd()): string {
  const { overdue, thisMonthNotReviewed } = collectPlannedOverdueGroups(transactions, today)
  if (overdue.length === 0 && thisMonthNotReviewed.length === 0) return 'none'
  return JSON.stringify({
    o: overdue.map((t) => t.id),
    m: thisMonthNotReviewed.map((t) => t.id),
  })
}

function appendNotificationBullets(
  lines: string[],
  items: Transaction[],
  max: number,
  formatNok: (n: number) => string,
): number {
  const n = Math.min(max, items.length)
  for (let i = 0; i < n; i++) {
    const t = items[i]!
    const dateShow = formatTransactionDateNbNo(t.date) ?? t.date
    const desc = (t.description ?? '').trim() || 'Uten beskrivelse'
    const amt = typeof t.amount === 'number' && Number.isFinite(t.amount) ? formatNok(t.amount) : '—'
    lines.push(`• ${dateShow}: ${desc} (${amt})`)
  }
  return n
}

const MAX_OVERDUE_NOTIFICATION_LINES = 5
const MAX_THIS_MONTH_NOTIFICATION_LINES = 5
const MAX_TOTAL_NOTIFICATION_BULLETS = 10

/**
 * Innsikt når forfalte planlagte poster finnes og/eller uferdig plan i inneværende måned (ikke gjennomgått).
 * `formatNok` styrer visning; standard er hele kroner.
 */
export function buildPlannedOverdueNotification(
  transactions: Transaction[],
  today = todayYyyyMmDd(),
  formatNok: (n: number) => string = (n) => formatNOK(n),
): { title: string; body: string } | null {
  const { overdue, thisMonthNotReviewed } = collectPlannedOverdueGroups(transactions, today)

  if (overdue.length === 0 && thisMonthNotReviewed.length === 0) return null

  const lines: string[] = []
  let bulletsUsed = 0

  if (overdue.length > 0) {
    lines.push(
      'Følgende planlagte transaksjoner har passert dato og trenger at du huker av (gjennomgang/betaling) eller sletter dem under «Kommende».',
    )
    lines.push('')
    const cap = Math.min(MAX_OVERDUE_NOTIFICATION_LINES, MAX_TOTAL_NOTIFICATION_BULLETS - bulletsUsed)
    const shown = appendNotificationBullets(lines, overdue, cap, formatNok)
    bulletsUsed += shown
    if (overdue.length > shown) {
      lines.push(`… og ${overdue.length - shown} til.`)
    }
  }

  if (thisMonthNotReviewed.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('Planlagt denne måneden (ikke markert som gjennomgått):')
    lines.push('')
    const cap = Math.min(
      MAX_THIS_MONTH_NOTIFICATION_LINES,
      Math.max(0, MAX_TOTAL_NOTIFICATION_BULLETS - bulletsUsed),
    )
    const shown = appendNotificationBullets(lines, thisMonthNotReviewed, cap, formatNok)
    if (thisMonthNotReviewed.length > shown) {
      lines.push(`… og ${thisMonthNotReviewed.length - shown} til.`)
    }
  }

  lines.push('')
  lines.push('Åpne Kommende under Transaksjoner for å fullføre.')

  return {
    title: 'Planlagte transaksjoner trenger oppfølging',
    body: lines.join('\n'),
  }
}
