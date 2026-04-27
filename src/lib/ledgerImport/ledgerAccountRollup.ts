import { roundMoney2 } from '@/lib/money/parseNorwegianAmount'
import type { CanonicalLedgerLine } from '@/lib/ledgerImport/types'

export type LedgerAccountRollup = {
  count: number
  label: string
  sumIncome: number
  sumExpense: number
}

/**
 * Aggregerer hovedbokslinjer per kontonummer (antall, navn, sum inntekt/utgift etter ledgerSide).
 */
export function rollupLedgerLinesByAccount(lines: CanonicalLedgerLine[]): Map<string, LedgerAccountRollup> {
  const m = new Map<string, LedgerAccountRollup>()
  for (const l of lines) {
    let r = m.get(l.accountCode)
    if (!r) {
      r = { count: 0, label: l.accountName || l.accountCode, sumIncome: 0, sumExpense: 0 }
      m.set(l.accountCode, r)
    }
    r.count += 1
    if (l.accountName) r.label = l.accountName
    if (l.ledgerSide === 'income') r.sumIncome += l.amount
    else r.sumExpense += l.amount
  }
  for (const r of m.values()) {
    r.sumIncome = roundMoney2(r.sumIncome)
    r.sumExpense = roundMoney2(r.sumExpense)
  }
  return m
}
