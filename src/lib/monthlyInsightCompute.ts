import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import {
  buildBudgetVsActual,
  getMonthKey,
  MONTH_LABELS_SHORT_NB,
  sumMonthlyIncomeExpense,
  sumTransactionsByCategoryForMonth,
  type BudgetVsActualRow,
} from '@/lib/bankReportData'
import type { BudgetCategory, Transaction } from '@/lib/store'

function pctVariance(actual: number, budgeted: number): number | null {
  if (budgeted <= 0) return null
  return ((actual - budgeted) / budgeted) * 100
}

export type MonthlyInsightVarianceRow = {
  categoryId: string
  name: string
  parentCategory: ParentCategory
  budgeted: number
  actual: number
  variance: number
  variancePct: number | null
}

export type MonthlyInsightKpis = {
  budgetedIncome: number
  actualIncome: number
  incomeVariance: number
  incomeVariancePct: number | null
  budgetedExpense: number
  actualExpense: number
  expenseVariance: number
  expenseVariancePct: number | null
  netActual: number
  /** Snitt faktiske kostnader per måned for måneder 0..monthIndex-1 i samme år (null hvis monthIndex===0). */
  ytdAvgMonthlyExpense: number | null
  /** (valgt måneds faktiske kostnader − ytdAvg) / ytdAvg · 100 */
  expenseVsYtdAvgPct: number | null
}

export type MonthlyInsightPriorMonthExpense = {
  monthIndex: number
  label: string
  actualExpense: number
}

export type MonthlyInsightTopTx = {
  date: string
  description: string
  amount: number
  category: string
  /** Satt ved husholdningsaggregat — hvilken profil transaksjonen tilhører. */
  profileName?: string
}

export type MonthlyInsightPayload = {
  reportYear: number
  reportMonthIndex: number
  monthKey: string
  scopeLabel: string
  kpis: MonthlyInsightKpis
  overBudget: MonthlyInsightVarianceRow[]
  underBudget: MonthlyInsightVarianceRow[]
  priorMonthsExpense: MonthlyInsightPriorMonthExpense[]
  topExpenseTransactions: MonthlyInsightTopTx[]
}

function actualExpenseForMonth(transactions: Transaction[], year: number, monthIndex: number): number {
  const totals = sumTransactionsByCategoryForMonth(transactions, year, monthIndex)
  const { expense } = sumMonthlyIncomeExpense(totals)
  return expense
}

function rowToVarianceRow(r: BudgetVsActualRow): MonthlyInsightVarianceRow | null {
  if (r.type !== 'expense') return null
  return {
    categoryId: r.categoryId,
    name: r.name,
    parentCategory: r.parentCategory,
    budgeted: r.budgeted,
    actual: r.actual,
    variance: r.variance,
    variancePct: pctVariance(r.actual, r.budgeted),
  }
}

export type BuildMonthlyInsightPayloadOptions = {
  /** Når sann: topp-transaksjoner merkes med profilnavn der det finnes. */
  isHouseholdAggregate?: boolean
  profileNamesById?: Record<string, string>
}

/**
 * Bygger strukturert månedsinnsikt fra budsjett og transaksjoner (samme logikk som bankrapport).
 */
export function buildMonthlyInsightPayload(
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  reportYear: number,
  reportMonthIndex: number,
  scopeLabel: string,
  options?: BuildMonthlyInsightPayloadOptions,
): MonthlyInsightPayload {
  const monthTotals = sumTransactionsByCategoryForMonth(transactions, reportYear, reportMonthIndex)
  const rows = buildBudgetVsActual(budgetCategories, monthTotals, reportMonthIndex)

  let budgetedIncome = 0
  let actualIncome = 0
  let budgetedExpense = 0
  let actualExpense = 0

  for (const r of rows) {
    if (r.type === 'income') {
      budgetedIncome += r.budgeted
      actualIncome += r.actual
    } else {
      budgetedExpense += r.budgeted
      actualExpense += r.actual
    }
  }

  const incomeVariance = actualIncome - budgetedIncome
  const expenseVariance = actualExpense - budgetedExpense
  const netActual = actualIncome - actualExpense

  const kpis: MonthlyInsightKpis = {
    budgetedIncome,
    actualIncome,
    incomeVariance,
    incomeVariancePct: pctVariance(actualIncome, budgetedIncome),
    budgetedExpense,
    actualExpense,
    expenseVariance,
    expenseVariancePct: pctVariance(actualExpense, budgetedExpense),
    netActual,
    ytdAvgMonthlyExpense: null,
    expenseVsYtdAvgPct: null,
  }

  if (reportMonthIndex > 0) {
    let sumPrior = 0
    for (let m = 0; m < reportMonthIndex; m++) {
      sumPrior += actualExpenseForMonth(transactions, reportYear, m)
    }
    const ytdAvg = sumPrior / reportMonthIndex
    kpis.ytdAvgMonthlyExpense = ytdAvg
    if (ytdAvg > 0) {
      kpis.expenseVsYtdAvgPct = ((actualExpense - ytdAvg) / ytdAvg) * 100
    }
  }

  const expenseRows = rows.filter((r) => r.type === 'expense').map(rowToVarianceRow).filter(Boolean) as MonthlyInsightVarianceRow[]

  const overBudget = expenseRows
    .filter((r) => r.budgeted > 0 && r.variance > 0)
    .sort((a, b) => b.variance - a.variance)

  const underBudget = expenseRows
    .filter((r) => r.budgeted > 0 && r.variance < 0)
    .sort((a, b) => a.variance - b.variance)

  const priorMonthsExpense: MonthlyInsightPriorMonthExpense[] = []
  for (let m = 0; m < reportMonthIndex; m++) {
    priorMonthsExpense.push({
      monthIndex: m,
      label: MONTH_LABELS_SHORT_NB[m] ?? String(m + 1),
      actualExpense: actualExpenseForMonth(transactions, reportYear, m),
    })
  }

  const monthPrefix = getMonthKey(reportYear, reportMonthIndex)
  const monthTxs = transactions.filter((t) => t.date && t.date.startsWith(monthPrefix) && t.type === 'expense')
  const topExpenseTransactions: MonthlyInsightTopTx[] = [...monthTxs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((t) => {
      const pid = t.profileId
      const map = options?.profileNamesById
      const profileName =
        options?.isHouseholdAggregate && pid && map && map[pid] ? map[pid] : undefined
      return {
        date: t.date,
        description: (t.description ?? '').trim() || '(uten beskrivelse)',
        amount: t.amount,
        category: (t.category ?? '').trim() || '(uten kategori)',
        ...(profileName ? { profileName } : {}),
      }
    })

  return {
    reportYear,
    reportMonthIndex,
    monthKey: monthPrefix,
    scopeLabel,
    kpis,
    overBudget,
    underBudget,
    priorMonthsExpense,
    topExpenseTransactions,
  }
}

/** JSON til systemprompt for OpenAI (ingen Markdown i svar). */
export function formatMonthlyInsightContextForAi(payload: MonthlyInsightPayload): string {
  const { kpis } = payload
  const lines: string[] = []
  lines.push('--- Strukturerte tall for månedsinnsikt (sannhetskilde — ikke finn opp andre beløp) ---')
  lines.push(`Periode: ${payload.monthKey} (${payload.scopeLabel})`)
  lines.push('')
  lines.push('Nøkkeltall:')
  lines.push(
    `Inntekt: budsjettert ${kpis.budgetedIncome.toFixed(0)} kr, faktisk ${kpis.actualIncome.toFixed(0)} kr, avvik ${kpis.incomeVariance.toFixed(0)} kr` +
      (kpis.incomeVariancePct != null ? ` (${kpis.incomeVariancePct.toFixed(1)} %)` : ''),
  )
  lines.push(
    `Kostnader (alle utgiftskategorier): budsjettert ${kpis.budgetedExpense.toFixed(0)} kr, faktisk ${kpis.actualExpense.toFixed(0)} kr, avvik ${kpis.expenseVariance.toFixed(0)} kr` +
      (kpis.expenseVariancePct != null ? ` (${kpis.expenseVariancePct.toFixed(1)} %)` : ''),
  )
  lines.push(`Netto (faktisk inntekt − faktiske kostnader): ${kpis.netActual.toFixed(0)} kr`)
  if (kpis.ytdAvgMonthlyExpense != null) {
    lines.push(
      `Snitt faktiske kostnader per måned hittil i år (jan–${MONTH_LABELS_SHORT_NB[payload.reportMonthIndex - 1] ?? '?'}): ${kpis.ytdAvgMonthlyExpense.toFixed(0)} kr`,
    )
    if (kpis.expenseVsYtdAvgPct != null) {
      lines.push(`Faktiske kostnader denne måneden vs dette snittet: ${kpis.expenseVsYtdAvgPct.toFixed(1)} %`)
    }
  }
  lines.push('')
  lines.push('Tidligere måneder samme år (faktiske kostnader):')
  if (payload.priorMonthsExpense.length === 0) {
    lines.push('(ingen tidligere måneder i året før valgt måned)')
  } else {
    for (const p of payload.priorMonthsExpense) {
      lines.push(`- ${p.label}: ${p.actualExpense.toFixed(0)} kr`)
    }
  }
  lines.push('')
  lines.push('Største avvik mot budsjett — over budsjett (kostnader):')
  for (const r of payload.overBudget.slice(0, 12)) {
    lines.push(
      `- ${r.name} (${r.parentCategory}): budsjett ${r.budgeted.toFixed(0)} kr, faktisk ${r.actual.toFixed(0)} kr, avvik +${r.variance.toFixed(0)} kr` +
        (r.variancePct != null ? ` (${r.variancePct.toFixed(1)} %)` : ''),
    )
  }
  lines.push('')
  lines.push('Under budsjett (kostnader):')
  for (const r of payload.underBudget.slice(0, 12)) {
    lines.push(
      `- ${r.name} (${r.parentCategory}): budsjett ${r.budgeted.toFixed(0)} kr, faktisk ${r.actual.toFixed(0)} kr, avvik ${r.variance.toFixed(0)} kr` +
        (r.variancePct != null ? ` (${r.variancePct.toFixed(1)} %)` : ''),
    )
  }
  lines.push('')
  lines.push('Største enkelttransaksjoner (utgift) i måneden (kan forklare engangskjøp):')
  if (payload.topExpenseTransactions.length === 0) {
    lines.push('(ingen)')
  } else {
    for (const t of payload.topExpenseTransactions) {
      const prof = t.profileName ? ` | profil: ${t.profileName}` : ''
      lines.push(`- ${t.date} | ${t.description} | ${t.amount.toFixed(0)} kr | ${t.category}${prof}`)
    }
  }
  return lines.join('\n')
}
