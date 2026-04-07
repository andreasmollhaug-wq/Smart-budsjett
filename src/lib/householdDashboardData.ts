import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type {
  ArchivedBudgetsByYear,
  BudgetCategory,
  PersonData,
  PersonProfile,
  Transaction,
} from '@/lib/store'

/** Utgiftsgrupper (ekskl. inntekter) — samme som COST_GROUPS på budsjett-siden. */
export const HOUSEHOLD_EXPENSE_GROUPS = ['regninger', 'utgifter', 'gjeld', 'sparing'] as const
export type HouseholdExpenseGroup = (typeof HOUSEHOLD_EXPENSE_GROUPS)[number]

export interface BudgetedExpenseByGroup {
  regninger: number
  utgifter: number
  gjeld: number
  sparing: number
}

export interface HouseholdMemberPeriodTotals {
  profileId: string
  name: string
  /** Budsjett: sum inntektslinjer i perioden */
  budgetedIncome: number
  /** Budsjett: per hovedgruppe (kostnader) */
  budgetedExpenseByGroup: BudgetedExpenseByGroup
  /** Sum av de fire utgiftsgruppene */
  budgetedTotalExpense: number
  /** Andel av husholdningens budsjetterte inntekt (0–1) */
  incomeShareOfHousehold: number
  /** Faktisk inntekt i perioden */
  actualIncome: number
  /** Faktisk utgift i perioden */
  actualExpense: number
  /** Faktisk utgift fordelt på gruppe (via kategorinavn → parent) */
  actualExpenseByGroup: BudgetedExpenseByGroup
}

export interface HouseholdPeriodSummary {
  householdBudgetedIncome: number
  householdBudgetedExpense: number
  householdBudgetedNet: number
  householdBudgetedSparing: number
  householdActualIncome: number
  householdActualExpense: number
  householdActualNet: number
  /** Budsjettert sparing som andel av budsjettert inntekt (0–100), null hvis inntekt 0 */
  savingRatePctBudgeted: number | null
}

export interface HouseholdPeriodResult {
  members: HouseholdMemberPeriodTotals[]
  summary: HouseholdPeriodSummary
  /** True hvis ingen profil hadde budsjettkategorier for valgt år */
  hasNoBudgetData: boolean
}

function ensureBudgetedArray(budgeted: unknown): number[] {
  if (Array.isArray(budgeted) && budgeted.length === 12) return budgeted
  return Array(12).fill(0)
}

function sumBudgetedForMonthRange(arr: number[], monthStart: number, monthEnd: number): number {
  let s = 0
  for (let i = monthStart; i <= monthEnd; i++) {
    s += arr[i] ?? 0
  }
  return s
}

function emptyExpenseByGroup(): BudgetedExpenseByGroup {
  return { regninger: 0, utgifter: 0, gjeld: 0, sparing: 0 }
}

/** Kategorinavn → parent (siste treff vinner ved duplikatnavn). */
function buildCategoryNameToParentMap(categories: BudgetCategory[]): Map<string, ParentCategory> {
  const m = new Map<string, ParentCategory>()
  for (const c of categories) {
    m.set(c.name, c.parentCategory)
  }
  return m
}

export function getBudgetCategoriesForProfileYear(
  people: Record<string, PersonData>,
  archivedBudgetsByYear: ArchivedBudgetsByYear,
  profileId: string,
  year: number,
  budgetYear: number,
): BudgetCategory[] {
  if (year === budgetYear) {
    return people[profileId]?.budgetCategories ?? []
  }
  return archivedBudgetsByYear[String(year)]?.[profileId] ?? []
}

function sumBudgetedExpenseGroupsForPeriod(
  categories: BudgetCategory[],
  monthStart: number,
  monthEnd: number,
): { income: number; byGroup: BudgetedExpenseByGroup } {
  let income = 0
  const byGroup = emptyExpenseByGroup()

  for (const c of categories) {
    const arr = ensureBudgetedArray(c.budgeted)
    const v = sumBudgetedForMonthRange(arr, monthStart, monthEnd)
    if (c.parentCategory === 'inntekter') {
      income += v
      continue
    }
    if (HOUSEHOLD_EXPENSE_GROUPS.includes(c.parentCategory as HouseholdExpenseGroup)) {
      byGroup[c.parentCategory as HouseholdExpenseGroup] += v
    }
  }

  return { income, byGroup }
}

function sumActualForProfileInRange(
  transactions: Transaction[],
  year: number,
  monthStart: number,
  monthEnd: number,
  profileId: string,
  categoryMap: Map<string, ParentCategory>,
): { income: number; expense: number; expenseByGroup: BudgetedExpenseByGroup } {
  let income = 0
  let expense = 0
  const expenseByGroup = emptyExpenseByGroup()

  for (const t of transactions) {
    if (!t.date || t.date.length < 7) continue
    const ym = t.date.slice(0, 7)
    const parts = ym.split('-')
    if (parts.length < 2) continue
    const yy = Number(parts[0])
    const mm = Number(parts[1])
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || yy !== year) continue
    if (mm < 1 || mm > 12) continue
    const monthIndex = mm - 1
    if (monthIndex < monthStart || monthIndex > monthEnd) continue

    const owner = t.profileId ?? profileId
    if (owner !== profileId) continue

    if (t.type === 'income') {
      income += t.amount
    } else {
      expense += t.amount
      const parent = categoryMap.get(t.category)
      if (parent && HOUSEHOLD_EXPENSE_GROUPS.includes(parent as HouseholdExpenseGroup)) {
        expenseByGroup[parent as HouseholdExpenseGroup] += t.amount
      } else {
        // Ukategorisert utgift ift. budsjett: tell som utgifter (vanligste fallback)
        expenseByGroup.utgifter += t.amount
      }
    }
  }

  return { income, expense, expenseByGroup }
}

export function buildHouseholdPeriodData(
  people: Record<string, PersonData>,
  archivedBudgetsByYear: ArchivedBudgetsByYear,
  profiles: PersonProfile[],
  budgetYear: number,
  year: number,
  monthStart: number,
  monthEnd: number,
  transactions: Transaction[],
): HouseholdPeriodResult {
  const members: HouseholdMemberPeriodTotals[] = []
  let householdBudgetedIncome = 0
  let householdBudgetedExpense = 0
  let householdBudgetedSparing = 0
  let householdActualIncome = 0
  let householdActualExpense = 0
  let hasAnyCategories = false

  for (const p of profiles) {
    const cats = getBudgetCategoriesForProfileYear(people, archivedBudgetsByYear, p.id, year, budgetYear)
    if (cats.length > 0) hasAnyCategories = true

    const { income: budgetedIncome, byGroup: budgetedExpenseByGroup } = sumBudgetedExpenseGroupsForPeriod(
      cats,
      monthStart,
      monthEnd,
    )
    const budgetedTotalExpense = HOUSEHOLD_EXPENSE_GROUPS.reduce(
      (s, g) => s + budgetedExpenseByGroup[g],
      0,
    )

    householdBudgetedIncome += budgetedIncome
    householdBudgetedExpense += budgetedTotalExpense
    householdBudgetedSparing += budgetedExpenseByGroup.sparing

    const categoryMap = buildCategoryNameToParentMap(cats)
    const { income: actualIncome, expense: actualExpense, expenseByGroup: actualExpenseByGroup } =
      sumActualForProfileInRange(transactions, year, monthStart, monthEnd, p.id, categoryMap)

    householdActualIncome += actualIncome
    householdActualExpense += actualExpense

    members.push({
      profileId: p.id,
      name: p.name,
      budgetedIncome,
      budgetedExpenseByGroup: { ...budgetedExpenseByGroup },
      budgetedTotalExpense,
      incomeShareOfHousehold: 0,
      actualIncome,
      actualExpense,
      actualExpenseByGroup: { ...actualExpenseByGroup },
    })
  }

  const totalIncome = householdBudgetedIncome
  for (const m of members) {
    m.incomeShareOfHousehold = totalIncome > 0 ? m.budgetedIncome / totalIncome : 0
  }

  const summary: HouseholdPeriodSummary = {
    householdBudgetedIncome,
    householdBudgetedExpense,
    householdBudgetedNet: householdBudgetedIncome - householdBudgetedExpense,
    householdBudgetedSparing,
    householdActualIncome,
    householdActualExpense,
    householdActualNet: householdActualIncome - householdActualExpense,
    savingRatePctBudgeted:
      householdBudgetedIncome > 0
        ? (householdBudgetedSparing / householdBudgetedIncome) * 100
        : null,
  }

  return {
    members,
    summary,
    hasNoBudgetData: !hasAnyCategories,
  }
}
