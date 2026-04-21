import { BUDGET_MONTH_LABELS, periodRange, type PeriodMode } from '@/lib/budgetPeriod'
import { generateId } from '@/lib/utils'

export type IncomeSprintGoalBasis = 'afterTax' | 'beforeTax'

export interface IncomeSprintSource {
  id: string
  name: string
  /** Valgfri skattesats for denne kilden når plan.applyTax er true; ellers brukes plan.taxPercent. */
  taxPercent?: number
  amountsByMonthKey: Record<string, number>
}

export interface IncomeSprintPlan {
  id: string
  /** Valgfritt visningsnavn på dashbordet; tom bruker periodelabel. */
  name?: string
  startDate: string
  endDate: string
  goalBasis: IncomeSprintGoalBasis
  targetAmount: number
  applyTax: boolean
  taxPercent: number
  /** Engangs innbetalt utenom månedlige tilføringer (samme målgrunnlag som målet). */
  paidTowardGoal: number
  /** Faktisk innbetalt per kalendermåned (YYYY-MM), samme målgrunnlag som målet. */
  paidByMonthKey?: Record<string, number>
  sources: IncomeSprintSource[]
}

/** Sikrer stabil id (persistert data kan mangle id før migrering). */
export function ensureIncomeSprintPlanId(plan: IncomeSprintPlan): IncomeSprintPlan {
  if (typeof plan.id === 'string' && plan.id.trim().length > 0) return plan
  return { ...plan, id: generateId() }
}

/** Kort periodelabel til kort (f.eks. «mar 2026 – jun 2026»). */
export function formatIncomeSprintPlanPeriodNb(plan: Pick<IncomeSprintPlan, 'startDate' | 'endDate'>): string {
  const sk = plan.startDate.length >= 7 ? plan.startDate.slice(0, 7) : plan.startDate
  const ek = plan.endDate.length >= 7 ? plan.endDate.slice(0, 7) : plan.endDate
  return `${monthKeyLabel(sk)} – ${monthKeyLabel(ek)}`
}

export function yearMonthFromIsoDate(iso: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || mo < 1 || mo > 12) return null
  return { y, m: mo }
}

function ymCompare(a: { y: number; m: number }, b: { y: number; m: number }): number {
  if (a.y !== b.y) return a.y - b.y
  return a.m - b.m
}

/** Alle kalendermåneder som overlapper [startDate, endDate]. */
export function listMonthKeysInRange(startDate: string, endDate: string): string[] {
  const start = yearMonthFromIsoDate(startDate)
  const end = yearMonthFromIsoDate(endDate)
  if (!start || !end || ymCompare(start, end) > 0) return []

  const keys: string[] = []
  let y = start.y
  let mo = start.m
  for (;;) {
    keys.push(`${y}-${String(mo).padStart(2, '0')}`)
    if (y === end.y && mo === end.m) break
    mo++
    if (mo > 12) {
      mo = 1
      y++
    }
  }
  return keys
}

export function monthKeyLabel(monthKey: string): string {
  const p = /^(\d{4})-(\d{2})$/.exec(monthKey)
  if (!p) return monthKey
  const y = Number(p[1])
  const m = Number(p[2]) - 1
  const name = BUDGET_MONTH_LABELS[m] ?? p[2]
  return `${name.slice(0, 3)} ${y}`
}

/** Fullt månedsnavn + år (tabellhoder, f.eks. «Mars 2026»). */
export function monthKeyHeadingNb(monthKey: string): string {
  const p = /^(\d{4})-(\d{2})$/.exec(monthKey)
  if (!p) return monthKey
  const y = Number(p[1])
  const mi = Number(p[2]) - 1
  const name = BUDGET_MONTH_LABELS[mi] ?? monthKey
  return `${name} ${y}`
}

export function clampTaxPercent(p: number): number {
  if (!Number.isFinite(p)) return 0
  return Math.min(100, Math.max(0, p))
}

export function taxMultiplier(applyTax: boolean, taxPercent: number): number {
  if (!applyTax) return 1
  const r = clampTaxPercent(taxPercent) / 100
  return 1 - r
}

/** Effektiv skattesats (0–100) for en kilde når plan har skatt på. */
export function effectiveTaxPercentForSource(plan: IncomeSprintPlan, source: IncomeSprintSource): number {
  if (!plan.applyTax) return 0
  const p = source.taxPercent !== undefined && source.taxPercent !== null ? source.taxPercent : plan.taxPercent
  return clampTaxPercent(p)
}

/** Brutto, skatt og netto for én kilde i én måned (for modal). */
export function computeSourceMonthGrossTaxNet(
  plan: IncomeSprintPlan,
  sourceId: string,
  monthKey: string,
): { gross: number; tax: number; net: number; taxPercentUsed: number } | null {
  const src = plan.sources.find((s) => s.id === sourceId)
  if (!src) return null
  const grossRaw = src.amountsByMonthKey[monthKey]
  const gross = typeof grossRaw === 'number' && Number.isFinite(grossRaw) ? Math.max(0, grossRaw) : 0
  const tp = effectiveTaxPercentForSource(plan, src)
  const r = tp / 100
  const tax = plan.applyTax ? gross * r : 0
  const net = gross - tax
  return { gross, tax, net, taxPercentUsed: tp }
}

/** Referansedato for smartSpare-oversikt (alle planer): valgt periodes slutt, aldri etter i dag. */
export function smartSpareOverviewReferenceDate(
  filterYear: number,
  periodMode: PeriodMode,
  monthIndex: number,
): string {
  const today = new Date().toISOString().slice(0, 10)
  let endMonth0 = monthIndex
  if (periodMode === 'year') endMonth0 = 11
  const lastD = new Date(filterYear, endMonth0 + 1, 0).getDate()
  const candidate = `${filterYear}-${String(endMonth0 + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`
  return candidate > today ? today : candidate
}

/**
 * Siste dag i valgt periode (år + modus + måned), klippet mot plan og i dag.
 * Brukes med samme filter som dashboard (år / hittil i år / måned / hele året).
 */
export function smartSpareFilterToReferenceDate(
  plan: Pick<IncomeSprintPlan, 'startDate' | 'endDate'>,
  filterYear: number,
  periodMode: PeriodMode,
  monthIndex: number,
): string {
  const today = new Date().toISOString().slice(0, 10)
  let endMonth0 = monthIndex
  if (periodMode === 'year') endMonth0 = 11
  const lastD = new Date(filterYear, endMonth0 + 1, 0).getDate()
  const candidate = `${filterYear}-${String(endMonth0 + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`

  let ref = candidate
  if (ref > plan.endDate) ref = plan.endDate
  if (ref > today) ref = today
  if (ref < plan.startDate) ref = plan.startDate
  return ref
}

/** År som overlapper planperioden (for nedtrekk). */
export function yearOptionsTouchingPlan(plan: Pick<IncomeSprintPlan, 'startDate' | 'endDate'>): number[] {
  const sy = yearMonthFromIsoDate(plan.startDate)?.y
  const ey = yearMonthFromIsoDate(plan.endDate)?.y
  const cur = new Date().getFullYear()
  if (sy == null || ey == null) return [cur]
  const set = new Set<number>()
  for (let y = sy; y <= ey; y++) set.add(y)
  set.add(cur)
  return [...set].sort((a, b) => b - a)
}

export function reconcileIncomeSprintPlan(plan: IncomeSprintPlan): IncomeSprintPlan {
  const keys = listMonthKeysInRange(plan.startDate, plan.endDate)
  const paidIn = typeof plan.paidByMonthKey === 'object' && plan.paidByMonthKey !== null ? { ...plan.paidByMonthKey } : {}
  const paidClean: Record<string, number> = {}
  for (const k of keys) {
    const v = paidIn[k]
    paidClean[k] = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0
  }

  return {
    ...plan,
    targetAmount: Math.max(0, plan.targetAmount),
    paidTowardGoal: Math.max(0, plan.paidTowardGoal),
    paidByMonthKey: paidClean,
    taxPercent: clampTaxPercent(plan.taxPercent),
    sources: plan.sources.map((s) => {
      const amounts: Record<string, number> = {}
      for (const k of keys) {
        const v = s.amountsByMonthKey[k]
        amounts[k] = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0
      }
      const next: IncomeSprintSource = { ...s, amountsByMonthKey: amounts }
      if (s.taxPercent !== undefined && s.taxPercent !== null) {
        next.taxPercent = clampTaxPercent(s.taxPercent)
      }
      return next
    }),
  }
}

export function defaultNewIncomeSprintPlanWithOneSource(sourceId: string): IncomeSprintPlan {
  const base = defaultNewIncomeSprintPlan()
  return reconcileIncomeSprintPlan({
    ...base,
    id: base.id,
    sources: [{ id: sourceId, name: 'Ny kilde', amountsByMonthKey: {} }],
  })
}

export function defaultNewIncomeSprintPlan(): IncomeSprintPlan {
  const now = new Date()
  const sy = now.getFullYear()
  const sm = now.getMonth() + 1
  const startDate = `${sy}-${String(sm).padStart(2, '0')}-01`
  let ey = sy
  let em = sm + 3
  while (em > 12) {
    em -= 12
    ey++
  }
  const endDay = new Date(ey, em, 0).getDate()
  const endDate = `${ey}-${String(em).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  return reconcileIncomeSprintPlan({
    id: generateId(),
    startDate,
    endDate,
    goalBasis: 'afterTax',
    targetAmount: 0,
    applyTax: false,
    taxPercent: 40,
    paidTowardGoal: 0,
    paidByMonthKey: {},
    sources: [],
  })
}

export interface IncomeSprintSourceTotals {
  id: string
  name: string
  grossFullPeriod: number
  taxFullPeriod: number
  netFullPeriod: number
  grossToDate: number
  taxToDate: number
  netToDate: number
}

/** Samme periode som dashboard: avgrenser «tjent hittil» / månedlig innbetalt i KPI til valgt år og modus. */
export type IncomeSprintKpiPeriodFilter = {
  filterYear: number
  periodMode: PeriodMode
  monthIndex: number
}

export interface IncomeSprintDerived {
  monthKeys: string[]
  referenceDate: string
  referenceMonthKey: string
  sourceTotals: IncomeSprintSourceTotals[]
  grandGrossFull: number
  grandTaxFull: number
  grandNetFull: number
  earnedGrossToDate: number
  earnedNetToDate: number
  earnedInGoalBasis: number
  /** Sum innbetalt fra paidByMonthKey til og med ref-måned. */
  paidFromMonthsToDate: number
  /** Engangs innbetalt (paidTowardGoal). */
  paidLump: number
  /** Månedlig + engangs — «innbetalt hittil». */
  paidTotalToDate: number
  /** I avledet: samme som paidTotalToDate (gammelt navn unngått i nye skjermbilder). */
  paidTowardGoal: number
  targetAmount: number
  goalBasis: IncomeSprintGoalBasis
  /** max(0, tjent − innbetalt) i målgrunnlag. */
  pendingNotReceived: number
  /** Mål minus innbetalt hittil (konservativ fremdrift). */
  remaining: number
  /** Basert på innbetalt / mål. */
  progressPercent: number
  /** = paidTotalToDate — for bakoverkompatibilitet der «total mot mål» skal være kun innbetalt. */
  totalTowardGoal: number
  daysLeft: number
}

function sumSourceGrossForKeys(source: IncomeSprintSource, keys: string[]): number {
  let s = 0
  for (const k of keys) {
    const v = source.amountsByMonthKey[k]
    if (typeof v === 'number' && Number.isFinite(v)) s += Math.max(0, v)
  }
  return s
}

export function computeIncomeSprintDerived(
  plan: IncomeSprintPlan,
  referenceDate: string = new Date().toISOString().slice(0, 10),
  kpiPeriod?: IncomeSprintKpiPeriodFilter,
): IncomeSprintDerived | null {
  const keys = listMonthKeysInRange(plan.startDate, plan.endDate)
  if (keys.length === 0) return null

  const refYm = referenceDate.length >= 7 ? referenceDate.slice(0, 7) : keys[0]!
  let keysToDate = keys.filter((k) => k <= refYm)
  if (kpiPeriod) {
    const { start, end } = periodRange(kpiPeriod.periodMode, kpiPeriod.monthIndex)
    const periodStartMonthKey = `${kpiPeriod.filterYear}-${String(start + 1).padStart(2, '0')}`
    const periodEndMonthKey = `${kpiPeriod.filterYear}-${String(end + 1).padStart(2, '0')}`
    /** YTD: klipp til i dag (refYm). Måned/hele år: fullt kalendervindu i plan-tabellen (også fremtidige måneder i vinduet). */
    const upperYm =
      kpiPeriod.periodMode === 'ytd'
        ? refYm <= periodEndMonthKey
          ? refYm
          : periodEndMonthKey
        : periodEndMonthKey
    keysToDate = keys.filter((k) => k >= periodStartMonthKey && k <= upperYm)
  }

  const apply = plan.applyTax === true

  const sourceTotals: IncomeSprintSourceTotals[] = plan.sources.map((src) => {
    const grossFull = sumSourceGrossForKeys(src, keys)
    const grossTd = sumSourceGrossForKeys(src, keysToDate)
    const rate = effectiveTaxPercentForSource(plan, src) / 100
    const taxFull = apply ? grossFull * rate : 0
    const taxTd = apply ? grossTd * rate : 0
    const netFull = grossFull - taxFull
    const netTd = grossTd - taxTd
    return {
      id: src.id,
      name: src.name,
      grossFullPeriod: grossFull,
      taxFullPeriod: taxFull,
      netFullPeriod: netFull,
      grossToDate: grossTd,
      taxToDate: taxTd,
      netToDate: netTd,
    }
  })

  const earnedGrossToDate = sourceTotals.reduce((a, r) => a + r.grossToDate, 0)
  const earnedNetToDate = sourceTotals.reduce((a, r) => a + r.netToDate, 0)
  const earnedInGoalBasis = plan.goalBasis === 'beforeTax' ? earnedGrossToDate : earnedNetToDate

  let paidFromMonthsToDate = 0
  const paidMap = plan.paidByMonthKey ?? {}
  for (const k of keysToDate) {
    const v = paidMap[k]
    if (typeof v === 'number' && Number.isFinite(v)) paidFromMonthsToDate += Math.max(0, v)
  }
  const paidLump = Math.max(0, plan.paidTowardGoal)
  const paidTotalToDate = paidFromMonthsToDate + paidLump

  const pendingNotReceived = Math.max(0, earnedInGoalBasis - paidTotalToDate)

  const target = Math.max(0, plan.targetAmount)
  const remaining = Math.max(0, target - paidTotalToDate)
  const progressPercent = target > 0 ? Math.min(100, (paidTotalToDate / target) * 100) : 0

  const grandGrossFull = sourceTotals.reduce((a, r) => a + r.grossFullPeriod, 0)
  const grandTaxFull = sourceTotals.reduce((a, r) => a + r.taxFullPeriod, 0)
  const grandNetFull = sourceTotals.reduce((a, r) => a + r.netFullPeriod, 0)

  const endOk = yearMonthFromIsoDate(plan.endDate)
  let daysLeft = 0
  if (endOk) {
    const end = new Date(plan.endDate + 'T12:00:00')
    const from = new Date(referenceDate + 'T12:00:00')
    daysLeft = Math.max(0, Math.ceil((end.getTime() - from.getTime()) / 86400000))
  }

  return {
    monthKeys: keys,
    referenceDate,
    referenceMonthKey: refYm,
    sourceTotals,
    grandGrossFull,
    grandTaxFull,
    grandNetFull,
    earnedGrossToDate,
    earnedNetToDate,
    earnedInGoalBasis,
    paidFromMonthsToDate,
    paidLump,
    paidTotalToDate,
    paidTowardGoal: paidTotalToDate,
    targetAmount: target,
    goalBasis: plan.goalBasis,
    pendingNotReceived,
    remaining,
    progressPercent,
    totalTowardGoal: paidTotalToDate,
    daysLeft,
  }
}

/** Rader til stablet søylediagram: brutto per kilde per måned. */
export function buildStackedBarRows(
  plan: IncomeSprintPlan,
  monthKeys: string[],
  barKeyPrefix = 'src',
): { label: string; monthKey: string; [key: string]: string | number }[] {
  return monthKeys.map((mk) => {
    const row: { label: string; monthKey: string; [key: string]: string | number } = {
      label: monthKeyLabel(mk),
      monthKey: mk,
    }
    for (const s of plan.sources) {
      const v = s.amountsByMonthKey[mk]
      row[`${barKeyPrefix}_${s.id}`] = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0
    }
    return row
  })
}
