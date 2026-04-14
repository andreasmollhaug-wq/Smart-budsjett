import type { Transaction } from '@/lib/store'
import { formatNOK, formatTransactionDateNbNo } from '@/lib/utils'

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

export function buildPlannedOverdueNotification(
  transactions: Transaction[],
  today = todayYyyyMmDd(),
): { title: string; body: string } | null {
  const candidates = transactions
    .filter((t) => isOverduePlanFollowUp(t, today))
    .sort(sortTransactionsByDateAsc)

  if (candidates.length === 0) return null

  const lines: string[] = [
    'Følgende planlagte transaksjoner har passert dato og trenger at du huker av (gjennomgang/betaling) eller sletter dem under «Kommende».',
    '',
  ]
  const maxLines = 5
  for (let i = 0; i < Math.min(maxLines, candidates.length); i++) {
    const t = candidates[i]!
    const dateShow = formatTransactionDateNbNo(t.date) ?? t.date
    const desc = (t.description ?? '').trim() || 'Uten beskrivelse'
    const amt =
      typeof t.amount === 'number' && Number.isFinite(t.amount) ? formatNOK(t.amount) : '—'
    lines.push(`• ${dateShow}: ${desc} (${amt})`)
  }
  if (candidates.length > maxLines) {
    lines.push(`… og ${candidates.length - maxLines} til.`)
  }
  lines.push('')
  lines.push('Åpne Kommende under Transaksjoner for å fullføre.')

  return {
    title: 'Planlagte transaksjoner trenger oppfølging',
    body: lines.join('\n'),
  }
}
