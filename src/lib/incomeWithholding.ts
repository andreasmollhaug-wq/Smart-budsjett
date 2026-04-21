import type { BudgetCategory, Transaction } from '@/lib/store'
import { clampTaxPercent, taxMultiplier } from '@/lib/incomeSprint'

/** Forenklet trekk på inntekt (budsjettprofil-standard eller per linje). */
export type IncomeWithholdingRule = {
  apply: boolean
  percent: number
}

export function normalizeIncomeWithholdingRule(
  raw: Partial<IncomeWithholdingRule> | undefined | null,
): IncomeWithholdingRule {
  if (!raw || typeof raw !== 'object') return { apply: false, percent: 0 }
  return {
    apply: raw.apply === true,
    percent: clampTaxPercent(typeof raw.percent === 'number' ? raw.percent : 0),
  }
}

/** Brutto-inntekt på budsjettlinje brukes som lagret beløp når trekk er på. */
export function budgetCategoryUsesIncomeWithholding(c: BudgetCategory): boolean {
  return (
    c.type === 'income' &&
    c.parentCategory === 'inntekter' &&
    c.incomeWithholding?.apply === true
  )
}

export function withholdingPercentForBudgetCategory(c: BudgetCategory): number {
  if (!budgetCategoryUsesIncomeWithholding(c)) return 0
  return clampTaxPercent(c.incomeWithholding?.percent ?? 0)
}

/**
 * Netto budsjettert inntekt for én måned (0–11).
 * Uten trekk: returnerer råverdi i budgeted (Modus A).
 */
export function effectiveBudgetedIncomeMonth(
  category: BudgetCategory,
  monthIndex: number,
): number {
  const arr = category.budgeted
  const raw =
    Array.isArray(arr) && typeof arr[monthIndex] === 'number' && Number.isFinite(arr[monthIndex]!)
      ? Math.max(0, arr[monthIndex]!)
      : 0
  if (!budgetCategoryUsesIncomeWithholding(category)) return raw
  const p = withholdingPercentForBudgetCategory(category)
  return Math.round(raw * taxMultiplier(true, p))
}

export function grossWithholdingNetForBudgetMonth(
  category: BudgetCategory,
  monthIndex: number,
): { gross: number; withholding: number; net: number } {
  const arr = category.budgeted
  const gross =
    Array.isArray(arr) && typeof arr[monthIndex] === 'number' && Number.isFinite(arr[monthIndex]!)
      ? Math.max(0, arr[monthIndex]!)
      : 0
  if (!budgetCategoryUsesIncomeWithholding(category)) {
    return { gross, withholding: 0, net: gross }
  }
  const p = withholdingPercentForBudgetCategory(category)
  const net = Math.round(gross * taxMultiplier(true, p))
  return { gross, withholding: gross - net, net }
}

/**
 * Brutto (hele kroner) slik at `Math.round(gross * taxMultiplier(true, percent)) === net`,
 * samme avrunding som {@link effectiveBudgetedIncomeMonth}. Brukes når bruker redigerer netto i budsjett-UI.
 * Ved 100 % trekk (multiplier 0) returneres 0. Finnes ikke eksakt netto: nærmeste brutto velges.
 */
export function grossFromDesiredNet(net: number, percent: number): number {
  const n = Math.max(0, Math.round(Number(net)))
  if (!Number.isFinite(n)) return 0
  const p = clampTaxPercent(percent)
  const m = taxMultiplier(true, p)
  if (m <= 0) return 0

  const rNet = (g: number) => Math.round(g * m)

  let lo = 0
  let hi = 1
  while (rNet(hi) < n && hi < 1e15) hi *= 2

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (rNet(mid) >= n) hi = mid
    else lo = mid + 1
  }

  const g0 = lo
  const candidates = [g0, g0 - 1, g0 - 2, g0 + 1, g0 + 2].filter((g) => g >= 0)
  for (const g of candidates) {
    if (rNet(g) === n) return g
  }

  let best = Math.max(0, g0)
  let bestErr = Math.abs(rNet(best) - n)
  for (let d = 0; d <= 10; d++) {
    for (const g of [g0 + d, g0 - d]) {
      if (g < 0) continue
      const err = Math.abs(rNet(g) - n)
      if (err < bestErr) {
        bestErr = err
        best = g
      }
    }
  }
  return best
}

/** Manglende felt: netto (utbetalt), som før. */
export function transactionIncomeIsNet(tx: Transaction): boolean {
  if (tx.type !== 'income') return true
  return tx.incomeIsNet !== false
}

export function effectiveWithholdingPercentForIncomeTransaction(
  tx: Transaction,
  profileDefault: IncomeWithholdingRule | undefined | null,
): number {
  if (tx.type !== 'income' || transactionIncomeIsNet(tx)) return 0
  if (typeof tx.incomeWithholdingPercent === 'number' && Number.isFinite(tx.incomeWithholdingPercent)) {
    return clampTaxPercent(tx.incomeWithholdingPercent)
  }
  const d = normalizeIncomeWithholdingRule(profileDefault)
  return d.apply ? clampTaxPercent(d.percent) : 0
}

export function effectiveIncomeTransactionAmount(
  tx: Transaction,
  profileDefault: IncomeWithholdingRule | undefined | null,
): number {
  if (tx.type !== 'income') return tx.amount
  const gross = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? Math.max(0, tx.amount) : 0
  if (transactionIncomeIsNet(tx)) return gross
  const p = effectiveWithholdingPercentForIncomeTransaction(tx, profileDefault)
  return Math.round(gross * taxMultiplier(true, p))
}

export function grossWithholdingNetForIncomeTransaction(
  tx: Transaction,
  profileDefault: IncomeWithholdingRule | undefined | null,
): { gross: number; withholding: number; net: number } {
  if (tx.type !== 'income') {
    const a = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? tx.amount : 0
    return { gross: a, withholding: 0, net: a }
  }
  const gross = typeof tx.amount === 'number' && Number.isFinite(tx.amount) ? Math.max(0, tx.amount) : 0
  if (transactionIncomeIsNet(tx)) {
    return { gross, withholding: 0, net: gross }
  }
  const p = effectiveWithholdingPercentForIncomeTransaction(tx, profileDefault)
  const net = Math.round(gross * taxMultiplier(true, p))
  return { gross, withholding: gross - net, net }
}
