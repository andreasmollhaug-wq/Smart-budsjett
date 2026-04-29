import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodRange } from '@/lib/budgetPeriod'
import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import {
  aggregateSavingsGoalsKpi,
  buildSavingsGoalPaceSummary,
  getEffectiveCurrentAmount,
  isSavingsGoalCompleted,
  resolveGoalProfileId,
  type SavingsGoalPaceSummary,
} from '@/lib/savingsDerived'

export type AnalyseGoalShareRow = {
  goalId: string
  name: string
  color: string
  effectiveNok: number
  pctOfTotal: number
}

/** Én slisse til donut (etter «topp N», kan slå sammen resten til «Øvrige»). */
export type AnalysePieSlice = {
  /** `goalId` eller `_other` */
  key: string
  name: string
  value: number
  color: string
  /** Andel av summert positiv effektiv sparing (matcher tooltip og sirkel). */
  pctOfPositiveTotal: number
}

const DEFAULT_OTHER_LABEL = 'Øvrige'
const DEFAULT_OTHER_COLOR = '#ADB5BD'

/**
 * Bygger pai-data med maks `topN` enkeltvis — resten slås til én «Øvrige»-slisse.
 * Kun rader med `effectiveNok > 0` brukes; total er summen av disse.
 */
export function buildPieSlicesWithOther(
  rows: AnalyseGoalShareRow[],
  topN: number,
  options?: { otherLabel?: string; otherColor?: string },
): { slices: AnalysePieSlice[]; totalPositive: number } {
  const positive = rows
    .filter((r) => r.effectiveNok > 0)
    .sort((a, b) => b.effectiveNok - a.effectiveNok)
  const totalPositive = positive.reduce((s, r) => s + r.effectiveNok, 0)

  if (positive.length === 0 || totalPositive <= 0) {
    return { slices: [], totalPositive: 0 }
  }

  const otherLabel = options?.otherLabel ?? DEFAULT_OTHER_LABEL
  const otherColor = options?.otherColor ?? DEFAULT_OTHER_COLOR
  const n = Math.max(1, topN)

  const pct = (v: number) =>
    totalPositive > 0 ? Math.round((v / totalPositive) * 1000) / 10 : 0

  if (positive.length <= n) {
    const slices: AnalysePieSlice[] = positive.map((r) => ({
      key: r.goalId,
      name: r.name,
      value: r.effectiveNok,
      color: r.color,
      pctOfPositiveTotal: pct(r.effectiveNok),
    }))
    return { slices, totalPositive }
  }

  const head = positive.slice(0, n)
  const tail = positive.slice(n)
  const otherValue = tail.reduce((s, r) => s + r.effectiveNok, 0)

  const slices: AnalysePieSlice[] = head.map((r) => ({
    key: r.goalId,
    name: r.name,
    value: r.effectiveNok,
    color: r.color,
    pctOfPositiveTotal: pct(r.effectiveNok),
  }))

  slices.push({
    key: '_other',
    name: otherLabel,
    value: otherValue,
    color: otherColor,
    pctOfPositiveTotal: pct(otherValue),
  })

  return { slices, totalPositive }
}

export type AnalyseHouseholdProfileRow = {
  profileId: string
  effectiveNok: number
  pctOfTotal: number
}

export type AnalyseMonthlyActivityPoint = {
  monthIndex: number
  /** Kort månedsetikett (Jan … Des) */
  label: string
  nok: number
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

/** yyyy-mm-dd eller prefiks → år og måned 0–11, eller null ved ugyldig format. */
export function parseYearMonthFromIsoDate(dateStr: string): { year: number; monthIndex: number } | null {
  const part = dateStr.trim().split('T')[0]
  if (!part || part.length < 7) return null
  const y = Number(part.slice(0, 4))
  const m = Number(part.slice(5, 7))
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null
  return { year: y, monthIndex: m - 1 }
}

export function filterSavingsGoalsForAnalyse(
  goals: SavingsGoal[],
  opts: { excludeCompleted: boolean },
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): SavingsGoal[] {
  if (!opts.excludeCompleted) return goals
  return goals.filter((g) => {
    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId)
    return !isSavingsGoalCompleted(eff, g.targetAmount)
  })
}

/** Sum registrerte sparingstransaksjoner for målets kategori i én kalendermåned. */
function sumLinkedGoalTxnMonth(
  goal: SavingsGoal,
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
  year: number,
  monthIndex: number,
): number {
  const linkedId = goal.linkedBudgetCategoryId
  if (!linkedId) return 0
  const cat = budgetCategories.find((c) => c.id === linkedId)
  if (!cat) return 0
  const pid = resolveGoalProfileId(goal, fallbackProfileId)
  let sum = 0
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    if (t.category !== cat.name) continue
    if ((t.profileId ?? pid) !== pid) continue
    const ym = parseYearMonthFromIsoDate(t.date)
    if (!ym || ym.year !== year || ym.monthIndex !== monthIndex) continue
    sum += t.amount
  }
  return sum
}

/** Sum manuelle innskudd i én kalendermåned for mål uten kategori-kobling. */
function sumUnlinkedDepositsMonth(goal: SavingsGoal, year: number, monthIndex: number): number {
  if (goal.linkedBudgetCategoryId) return 0
  let sum = 0
  for (const d of goal.deposits ?? []) {
    const ym = parseYearMonthFromIsoDate(d.date)
    if (!ym || ym.year !== year || ym.monthIndex !== monthIndex) continue
    sum += d.amount
  }
  return sum
}

function sumGoalActivityInMonth(
  goal: SavingsGoal,
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
  year: number,
  monthIndex: number,
): number {
  if (goal.linkedBudgetCategoryId) {
    return sumLinkedGoalTxnMonth(goal, transactions, budgetCategories, fallbackProfileId, year, monthIndex)
  }
  return sumUnlinkedDepositsMonth(goal, year, monthIndex)
}

/**
 * Månedlig sparingaktivitet (sum av valgte mål) i valgt år og måned-intervall fra periodRange.
 */
export function buildMonthlySparingActivitySeries(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
  filterYear: number,
  periodMode: PeriodMode,
  monthIndexForPeriod: number,
): AnalyseMonthlyActivityPoint[] {
  const { start, end } = periodRange(periodMode, monthIndexForPeriod)
  const points: AnalyseMonthlyActivityPoint[] = []
  for (let m = start; m <= end; m++) {
    let nok = 0
    for (const g of goals) {
      nok += sumGoalActivityInMonth(g, transactions, budgetCategories, fallbackProfileId, filterYear, m)
    }
    points.push({
      monthIndex: m,
      label: MONTHS_SHORT[m] ?? String(m + 1),
      nok,
    })
  }
  return points
}

export function buildGoalShareRows(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): AnalyseGoalShareRow[] {
  const rows: AnalyseGoalShareRow[] = []
  let totalEff = 0
  for (const g of goals) {
    const effectiveNok = getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId)
    totalEff += effectiveNok
    rows.push({
      goalId: g.id,
      name: g.name,
      color: g.color,
      effectiveNok,
      pctOfTotal: 0,
    })
  }
  for (const r of rows) {
    r.pctOfTotal = totalEff > 0 ? Math.round((r.effectiveNok / totalEff) * 1000) / 10 : 0
  }
  rows.sort((a, b) => b.effectiveNok - a.effectiveNok)
  return rows
}

/** Effektiv sparing summert per kildeprofil (husholdningsaggregat med sourceProfileId). */
export function sumEffectiveSavedBySourceProfile(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
  profileIdsOrdered: string[],
): AnalyseHouseholdProfileRow[] {
  const map = new Map<string, number>()
  for (const pid of profileIdsOrdered) {
    map.set(pid, 0)
  }
  let unmatched = 0
  for (const g of goals) {
    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId)
    const pid = g.sourceProfileId ?? fallbackProfileId
    if (map.has(pid)) {
      map.set(pid, (map.get(pid) ?? 0) + eff)
    } else {
      unmatched += eff
    }
  }
  if (unmatched > 0 && profileIdsOrdered.length > 0) {
    const first = profileIdsOrdered[0]!
    map.set(first, (map.get(first) ?? 0) + unmatched)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  const rows: AnalyseHouseholdProfileRow[] = profileIdsOrdered.map((profileId) => ({
    profileId,
    effectiveNok: map.get(profileId) ?? 0,
    pctOfTotal:
      total > 0 ? Math.round(((map.get(profileId) ?? 0) / total) * 1000) / 10 : 0,
  }))
  rows.sort((a, b) => b.effectiveNok - a.effectiveNok)
  return rows
}

/** Én sparemålsrad til husholdnings-sparetempo (kr/uke, kr/mnd mot måldato). */
export type HouseholdAnalysePaceRow = {
  goalId: string
  name: string
  color: string
  profileId: string
  profileName: string
  remainingNok: number
  pace: SavingsGoalPaceSummary
}

/**
 * Bygger sparetempo per mål med kildeprofilnavn — lineært snitt mot måldato via {@link buildSavingsGoalPaceSummary}.
 * Tenkt brukt i husholdningsaggregat (flere profiler); kan kalles med alle filtrerte mål fra analysen.
 */
export function buildHouseholdAnalysePaceRows(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
  profiles: { id: string; name: string }[],
  nowMs = Date.now(),
): HouseholdAnalysePaceRow[] {
  const nameById = new Map(profiles.map((p) => [p.id, p.name.trim() || p.id]))
  const rows: HouseholdAnalysePaceRow[] = []
  for (const g of goals) {
    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId)
    const remaining = Math.max(0, g.targetAmount - eff)
    const pace = buildSavingsGoalPaceSummary(remaining, g.targetDate, nowMs)
    const profileId = resolveGoalProfileId(g, fallbackProfileId)
    rows.push({
      goalId: g.id,
      name: g.name,
      color: g.color,
      profileId,
      profileName: nameById.get(profileId) ?? profileId,
      remainingNok: remaining,
      pace,
    })
  }
  rows.sort(
    (a, b) =>
      a.profileName.localeCompare(b.profileName, 'nb') ||
      a.name.localeCompare(b.name, 'nb', { sensitivity: 'base' }),
  )
  return rows
}

/** Aggreger kr/uke og kr/mnd for mål med status `ok` per profil (summerte krav ved parallelle mål). */
export type HouseholdPaceProfileTotals = {
  profileId: string
  profileName: string
  weeklyNokSum: number
  monthlyNokSum: number
}

export function sumHouseholdPaceByProfile(
  rows: HouseholdAnalysePaceRow[],
  profiles: { id: string; name: string }[],
): HouseholdPaceProfileTotals[] {
  const nameById = new Map(profiles.map((p) => [p.id, p.name.trim() || p.id]))
  const sums = new Map<string, { weekly: number; monthly: number }>()
  for (const r of rows) {
    if (r.pace.status !== 'ok') continue
    const w = r.pace.weeklyNok ?? 0
    const m = r.pace.monthlyNok ?? 0
    const cur = sums.get(r.profileId) ?? { weekly: 0, monthly: 0 }
    cur.weekly += w
    cur.monthly += m
    sums.set(r.profileId, cur)
  }
  return profiles.map((p) => ({
    profileId: p.id,
    profileName: nameById.get(p.id) ?? p.id,
    weeklyNokSum: sums.get(p.id)?.weekly ?? 0,
    monthlyNokSum: sums.get(p.id)?.monthly ?? 0,
  }))
}

/** Sum av kr/mnd for mål med aktiv spareplan (`pace.status === 'ok'`). Matcher KPI «samlet månedlig sparekrav». */
export function sumAggregateMonthlyPace(rows: HouseholdAnalysePaceRow[]): number {
  return rows.reduce((s, r) => {
    if (r.pace.status !== 'ok') return s
    return s + (r.pace.monthlyNok ?? 0)
  }, 0)
}

/** Sum av kr/uke for mål med aktiv spareplan (`pace.status === 'ok'`). */
export function sumAggregateWeeklyPace(rows: HouseholdAnalysePaceRow[]): number {
  return rows.reduce((s, r) => {
    if (r.pace.status !== 'ok') return s
    return s + (r.pace.weeklyNok ?? 0)
  }, 0)
}

export function buildAnalyseKpi(
  goals: SavingsGoal[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  fallbackProfileId: string,
): {
  totalSaved: number
  totalTarget: number
  progressPct: number
  activeCount: number
  completedCount: number
  remainingTotalNok: number
} {
  const { totalSaved, totalTarget, progressPct } = aggregateSavingsGoalsKpi(
    goals,
    transactions,
    budgetCategories,
    fallbackProfileId,
  )
  let activeCount = 0
  let completedCount = 0
  let remainingTotalNok = 0
  for (const g of goals) {
    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, fallbackProfileId)
    const done = isSavingsGoalCompleted(eff, g.targetAmount)
    if (done) completedCount += 1
    else activeCount += 1
    remainingTotalNok += Math.max(0, g.targetAmount - eff)
  }
  return {
    totalSaved,
    totalTarget,
    progressPct,
    activeCount,
    completedCount,
    remainingTotalNok,
  }
}

/** Årstall til nedtrekk: aktivt budsjettår, inneværende år, år fra transaksjoner og depositdatoer. */
export function buildAnalyseYearOptions(input: {
  budgetYear: number
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
}): number[] {
  const s = new Set<number>()
  s.add(new Date().getFullYear())
  s.add(input.budgetYear)
  for (const t of input.transactions) {
    const ym = parseYearMonthFromIsoDate(t.date)
    if (ym) s.add(ym.year)
  }
  for (const g of input.savingsGoals) {
    for (const d of g.deposits ?? []) {
      const ym = parseYearMonthFromIsoDate(d.date)
      if (ym) s.add(ym.year)
    }
  }
  return [...s].sort((a, b) => b - a)
}
