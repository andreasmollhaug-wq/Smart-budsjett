import type { BudgetCategory } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'

export type BudgetSetupOverridesByYear = Record<string, Partial<Record<ParentCategory, boolean>>>

/** Standard rekkefølge for sjekkliste-grupper (samme som bygging). */
export const CHECKLIST_GROUP_ORDER: ParentCategory[] = [
  'inntekter',
  'regninger',
  'utgifter',
  'gjeld',
  'sparing',
]

export type BudgetSetupChecklistStatusKind = 'auto' | 'override' | 'open'

export type BudgetSetupChecklistLine = {
  name: string
  yearTotal: number
}

export type BudgetSetupChecklistItem = {
  id: ParentCategory
  title: string
  done: boolean
  autoDone: boolean
  overriddenDone: boolean
  threshold: number
  countWithAmount: number
  missing: number
  message: string
  ctaHref: string
  /** Linjer i gruppen med årssum (sortert synkende på beløp). */
  lines: BudgetSetupChecklistLine[]
  statusKind: BudgetSetupChecklistStatusKind
}

export const STRICT_THRESHOLDS: Record<ParentCategory, number> = {
  inntekter: 1,
  regninger: 5,
  utgifter: 8,
  gjeld: 1,
  sparing: 1,
}

const TITLES: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

function ensureArrayBudgeted(budgeted: unknown): number[] {
  if (Array.isArray(budgeted)) return budgeted as number[]
  return Array(12).fill((budgeted as number) || 0)
}

function yearTotalForCategory(cat: BudgetCategory): number {
  const arr = ensureArrayBudgeted(cat.budgeted)
  let sum = 0
  for (const n of arr) sum += Number.isFinite(n) ? n : 0
  return sum
}

function buildLinesForGroup(groupCats: BudgetCategory[]): BudgetSetupChecklistLine[] {
  const lines: BudgetSetupChecklistLine[] = groupCats.map((c) => ({
    name: c.name,
    yearTotal: yearTotalForCategory(c),
  }))
  lines.sort((a, b) => b.yearTotal - a.yearTotal || a.name.localeCompare(b.name, 'nb'))
  return lines
}

function computeStatusKind(done: boolean, autoDone: boolean, overriddenDone: boolean): BudgetSetupChecklistStatusKind {
  if (!done) return 'open'
  if (autoDone) return 'auto'
  if (overriddenDone) return 'override'
  return 'open'
}

export function buildBudgetSetupChecklist(params: {
  budgetCategories: BudgetCategory[]
  budgetYear: number
  overridesByYear?: BudgetSetupOverridesByYear | null
  thresholds?: Partial<Record<ParentCategory, number>>
}): BudgetSetupChecklistItem[] {
  const { budgetCategories, budgetYear, overridesByYear, thresholds } = params
  const y = String(Math.floor(budgetYear))
  const overrides = overridesByYear?.[y] ?? {}

  const groups = CHECKLIST_GROUP_ORDER
  const out: BudgetSetupChecklistItem[] = []

  for (const g of groups) {
    const threshold = Math.max(0, Math.floor(thresholds?.[g] ?? STRICT_THRESHOLDS[g] ?? 0))
    const items = budgetCategories.filter((c) => c.parentCategory === g)
    const lines = buildLinesForGroup(items)
    const countWithAmount = items.reduce((acc, c) => (yearTotalForCategory(c) > 0 ? acc + 1 : acc), 0)
    const autoDone = threshold === 0 ? true : countWithAmount >= threshold
    const overriddenDone = overrides[g] === true
    const done = autoDone || overriddenDone
    const missing = Math.max(0, threshold - countWithAmount)
    const statusKind = computeStatusKind(done, autoDone, overriddenDone)

    let message = ''
    if (done) {
      if (overriddenDone && !autoDone && threshold > 0) {
        message = `Markert som ferdig. (Valgfritt) Du mangler ${missing} linje${missing === 1 ? '' : 'r'} med beløp.`
      } else {
        message = 'Ferdig.'
      }
    } else if (threshold === 0) {
      message = 'Ferdig.'
    } else if (countWithAmount === 0) {
      message = `Ingen linjer med beløp ennå. Legg inn minst ${threshold}.`
    } else {
      message = `Du har lagt inn ${countWithAmount}. Legg inn ${missing} til for å få check.`
    }

    out.push({
      id: g,
      title: TITLES[g],
      done,
      autoDone,
      overriddenDone,
      threshold,
      countWithAmount,
      missing,
      message,
      ctaHref: '/budsjett',
      lines,
      statusKind,
    })
  }

  return out
}
