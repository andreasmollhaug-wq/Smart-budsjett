import { BUDGET_MONTH_LABELS, periodRange, type PeriodMode } from '@/lib/budgetPeriod'
import { generateId, parseThousands } from '@/lib/utils'

export type IncomeSprintGoalBasis = 'afterTax' | 'beforeTax'

export interface IncomeSprintSource {
  id: string
  name: string
  /** Valgfri skattesats for denne kilden når plan.applyTax er true; ellers brukes plan.taxPercent. */
  taxPercent?: number
  amountsByMonthKey: Record<string, number>
}

/** Enkel post under «Innbetalt mot mål» per kalendermåned (summen bor i paidByMonthKey). */
export interface IncomeSprintPaidLine {
  id: string
  /** Hele kroner, >= 0 */
  amount: number
  /** ISO 8601 — når posten ble lagt inn i appen */
  createdAt: string
  note?: string
}

/** Syntetisk merknad når første post splitter tidligere kun paidByMonthKey; telles ikke som egen brukerpreg i UI. */
export const INCOME_SPRINT_LEGACY_ROLLUP_NOTE = 'Tidligere ført samlet'

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
  /**
   * Detaljerte innbetalingsposter per måned. Når en månednøkkel mangler eller ikke er eksplisitt satt,
   * kommer summen kun fra paidByMonthKey (legacy). Tom array på en nøkkel betyr eksplisitt 0 kr.
   */
  paidLinesByMonthKey?: Record<string, IncomeSprintPaidLine[]>
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

/** Skatteprosent fra felt: kun siffer, maks tre tegn før klem; fjerner «010»-variant via parseInt. */
export function parseTaxPercentFieldInput(raw: string): number {
  const digits = raw.replace(/\D/g, '').slice(0, 3)
  if (digits === '') return 0
  return clampTaxPercent(parseInt(digits, 10))
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

function coercePaidLineAmount(amtRaw: unknown): number {
  if (typeof amtRaw === 'number' && Number.isFinite(amtRaw)) return Math.round(Math.max(0, amtRaw))
  if (typeof amtRaw === 'string') return Math.round(Math.max(0, parseThousands(amtRaw)))
  return 0
}

function normalizePaidLinesArray(raw: unknown): IncomeSprintPaidLine[] {
  if (!Array.isArray(raw)) return []
  const nowIso = new Date().toISOString()
  const out: IncomeSprintPaidLine[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' && o.id.trim().length > 0 ? o.id.trim() : generateId()
    const amt = coercePaidLineAmount(o.amount)
    if (amt <= 0) continue
    const ca =
      typeof o.createdAt === 'string' && Number.isFinite(Date.parse(o.createdAt)) ? o.createdAt : nowIso
    const noteRaw = o.note
    const note =
      typeof noteRaw === 'string' && noteRaw.trim().length > 0 ? noteRaw.trim().slice(0, 140) : undefined
    out.push({ id, amount: amt, createdAt: ca, note })
  }
  return out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

/**
 * Formatterer lagringstidsstempel for innbetalingsposter (lokal norsk tid via Europe/Oslo).
 */
export function formatIncomeSprintPaidLineTimestampNb(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  return new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Oslo',
  }).format(new Date(t))
}

/** Sann om måned har eksplisitt paidLines-flagg (evt. tom array = «nullstill til 0 kr»). */
export function incomeSprintPaidLinesExplicitForMonth(plan: IncomeSprintPlan, monthKey: string): boolean {
  const m = plan.paidLinesByMonthKey
  if (typeof m !== 'object' || m === null) return false
  return Object.prototype.hasOwnProperty.call(m, monthKey)
}

/**
 * Legger til ny post på måned og synker paidByMonthKey via reconcile.
 * Har måned kun legacy-sum uten eksplisitte linjer, flyttes eksisterende beløp til én samlet første linje før tillegget.
 */
export function appendIncomeSprintPaidLine(
  plan: IncomeSprintPlan,
  monthKey: string,
  amount: number,
  note?: string,
): IncomeSprintPlan {
  const amt = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0))
  if (amt <= 0) return reconcileIncomeSprintPlan(plan)

  const keys = listMonthKeysInRange(plan.startDate, plan.endDate)
  if (!keys.includes(monthKey)) return reconcileIncomeSprintPlan(plan)

  const linesBag = typeof plan.paidLinesByMonthKey === 'object' && plan.paidLinesByMonthKey !== null ? plan.paidLinesByMonthKey : {}
  const hasExplicit = Object.prototype.hasOwnProperty.call(linesBag, monthKey)
  const normalizedExisting = hasExplicit ? normalizePaidLinesArray(linesBag[monthKey]) : []

  const prevPaidRaw = plan.paidByMonthKey?.[monthKey]
  const prevPaid = typeof prevPaidRaw === 'number' && Number.isFinite(prevPaidRaw) ? Math.max(0, prevPaidRaw) : 0

  const noteTrim = note?.trim() ? note.trim().slice(0, 140) : undefined
  const tail: IncomeSprintPaidLine = {
    id: generateId(),
    amount: amt,
    createdAt: new Date().toISOString(),
    note: noteTrim,
  }

  let lines: IncomeSprintPaidLine[]
  const startTrim = plan.startDate.trim().slice(0, 10)
  const rollupAt =
    /^(\d{4})-(\d{2})-(\d{2})$/.test(startTrim) ? `${startTrim}T12:00:00.000Z` : new Date().toISOString()

  if (!hasExplicit && normalizedExisting.length === 0 && prevPaid > 0) {
    lines = [
      {
        id: generateId(),
        amount: prevPaid,
        createdAt: rollupAt,
        note: INCOME_SPRINT_LEGACY_ROLLUP_NOTE,
      },
      tail,
    ]
  } else {
    lines = [...normalizedExisting, tail]
  }

  return reconcileIncomeSprintPlan({
    ...plan,
    paidLinesByMonthKey: { ...linesBag, [monthKey]: lines },
  })
}

/** Antall faktiske innbetalingsposter (utenom syntetisk opprulling fra gammelt månedsfelt). Brukes til bl.a. fet sum i månedstabell ved ≥ 2. */
/** Normaliserte gyldige poster for én måned (coercer beløp, sorterer nyeste først). */
export function incomeSprintNormalizedPaidLinesForMonth(
  plan: IncomeSprintPlan,
  monthKey: string,
): IncomeSprintPaidLine[] {
  return normalizePaidLinesArray(plan.paidLinesByMonthKey?.[monthKey])
}

export function incomeSprintUserEnteredPaidLineCount(plan: IncomeSprintPlan, monthKey: string): number {
  const normalized = incomeSprintNormalizedPaidLinesForMonth(plan, monthKey)
  let n = 0
  for (const line of normalized) {
    const nu = line.note?.trim() ?? ''
    if (nu === INCOME_SPRINT_LEGACY_ROLLUP_NOTE) continue
    n++
  }
  return n
}

export function reconcileIncomeSprintPlan(plan: IncomeSprintPlan): IncomeSprintPlan {
  const keys = listMonthKeysInRange(plan.startDate, plan.endDate)
  const paidIn = typeof plan.paidByMonthKey === 'object' && plan.paidByMonthKey !== null ? { ...plan.paidByMonthKey } : {}
  const linesIn =
    typeof plan.paidLinesByMonthKey === 'object' && plan.paidLinesByMonthKey !== null ? plan.paidLinesByMonthKey : {}

  const paidClean: Record<string, number> = {}
  const linesOut: Record<string, IncomeSprintPaidLine[]> = {}
  for (const k of keys) {
    const hasExplicitLinesKey = Object.prototype.hasOwnProperty.call(linesIn, k)
    const normalized = hasExplicitLinesKey ? normalizePaidLinesArray(linesIn[k]) : []
    if (hasExplicitLinesKey) {
      if (normalized.length > 0) {
        paidClean[k] = normalized.reduce((s, l) => s + l.amount, 0)
        linesOut[k] = normalized
      } else {
        paidClean[k] = 0
        linesOut[k] = []
      }
    } else {
      const v = paidIn[k]
      paidClean[k] = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0
    }
  }

  const nextPaidLines: Record<string, IncomeSprintPaidLine[]> | undefined =
    Object.keys(linesOut).length > 0 ? linesOut : undefined

  return {
    ...plan,
    targetAmount: Math.max(0, plan.targetAmount),
    paidTowardGoal: Math.max(0, plan.paidTowardGoal),
    paidByMonthKey: paidClean,
    paidLinesByMonthKey: nextPaidLines,
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

/** Planmåneder som inngår i KPI-vinduet (samme logikk som keysToDate i computeIncomeSprintDerived). */
export function filterPlanMonthKeysToKpiWindow(
  planMonthKeys: string[],
  referenceDate: string,
  kpiPeriod: IncomeSprintKpiPeriodFilter,
): string[] {
  const refYm = referenceDate.length >= 7 ? referenceDate.slice(0, 7) : planMonthKeys[0] ?? ''
  const { start, end } = periodRange(kpiPeriod.periodMode, kpiPeriod.monthIndex)
  const periodStartMonthKey = `${kpiPeriod.filterYear}-${String(start + 1).padStart(2, '0')}`
  const periodEndMonthKey = `${kpiPeriod.filterYear}-${String(end + 1).padStart(2, '0')}`
  const upperYm =
    kpiPeriod.periodMode === 'ytd'
      ? refYm <= periodEndMonthKey
        ? refYm
        : periodEndMonthKey
      : periodEndMonthKey
  return planMonthKeys.filter((k) => k >= periodStartMonthKey && k <= upperYm)
}

/** Opptjent i valgt målgrunnlag for én kalendermåned (sum kilder). */
export function monthEarnedInGoalBasis(plan: IncomeSprintPlan, monthKey: string): number {
  let grossTotal = 0
  let netTotal = 0
  for (const s of plan.sources) {
    const v = s.amountsByMonthKey[monthKey]
    const gross = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0
    grossTotal += gross
    if (plan.applyTax) {
      const rate = effectiveTaxPercentForSource(plan, s) / 100
      netTotal += gross * (1 - rate)
    } else {
      netTotal += gross
    }
  }
  return plan.goalBasis === 'beforeTax' ? grossTotal : netTotal
}

/** Maks beløp som kan legges til innbetalt for måneden uten å overstige opptjent i målgrunnlag (planfelles innbetalt). */
export function maxAdditionalPaidForMonth(plan: IncomeSprintPlan, monthKey: string): number {
  const earned = monthEarnedInGoalBasis(plan, monthKey)
  const paidRaw = plan.paidByMonthKey?.[monthKey]
  const paid = typeof paidRaw === 'number' && Number.isFinite(paidRaw) ? Math.max(0, paidRaw) : 0
  return Math.max(0, earned - paid)
}

export interface SmartSpareMonthlyPaidEarnedRow {
  monthKey: string
  monthHeading: string
  earnedInGoalBasis: number
  paid: number
  pendingInMonth: number
}

/** Månedlig oversikt: opptjent vs innbetalt innenfor valgt KPI-periode (innbetalt er felles per plan). */
export function buildSmartSpareMonthlyPaidEarnedRows(
  plan: IncomeSprintPlan,
  referenceDate: string,
  kpiPeriod: IncomeSprintKpiPeriodFilter,
): SmartSpareMonthlyPaidEarnedRow[] {
  const planMonthKeys = listMonthKeysInRange(plan.startDate, plan.endDate)
  const windowKeys = filterPlanMonthKeysToKpiWindow(planMonthKeys, referenceDate, kpiPeriod)
  const paidMap = plan.paidByMonthKey ?? {}
  return windowKeys.map((monthKey) => {
    const earned = monthEarnedInGoalBasis(plan, monthKey)
    const paidRaw = paidMap[monthKey]
    const paid = typeof paidRaw === 'number' && Number.isFinite(paidRaw) ? Math.max(0, paidRaw) : 0
    return {
      monthKey,
      monthHeading: monthKeyHeadingNb(monthKey),
      earnedInGoalBasis: earned,
      paid,
      pendingInMonth: Math.max(0, earned - paid),
    }
  })
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
