import {
  mealIngredientToLines,
  portionFactorForMeal,
  type IngredientLineInput,
} from './mergeIngredients'
import { MEAL_SLOT_ORDER, type DayPlan, type Meal, type MealSlotId, type MatHandlelisteState } from './types'
import { MEAL_SLOT_LABELS } from './slotLabels'

export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Mandag som dag 0 i uken (ISO-lignende visning) */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

/** Visning: `dd.mm.yyyy` fra `YYYY-MM-DD`. Ugyldig nøkkel returneres uendret. */
export function formatDateKeyNb(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!m) return dateKey
  return `${m[3]}.${m[2]}.${m[1]}`
}

/** Mandag i uke 1 (ISO 8601) for gitt år. */
function mondayOfIsoWeekOne(isoYear: number): Date {
  const jan4 = new Date(isoYear, 0, 4)
  const dow = (jan4.getDay() + 6) % 7
  return new Date(isoYear, 0, 4 - dow)
}

/** ISO-uke og ISO-år for uken som inneholder `weekStartMonday` (lokal mandag). */
export function isoWeekAndYearFromMonday(weekStartMonday: Date): { week: number; isoYear: number } {
  const mon = new Date(weekStartMonday.getFullYear(), weekStartMonday.getMonth(), weekStartMonday.getDate())
  const thu = addDays(mon, 3)
  let isoYear = thu.getFullYear()
  let w1 = mondayOfIsoWeekOne(isoYear)
  if (mon < w1) {
    isoYear -= 1
    w1 = mondayOfIsoWeekOne(isoYear)
  }
  const week = Math.floor((mon.getTime() - w1.getTime()) / 604800000) + 1
  return { week, isoYear }
}

/**
 * Menneskelesbar uke-linje, norsk dato (dag først).
 * Eksempel: `Uke 17 (2026) · 21.–27. april 2026` når alt er i samme måned.
 */
export function formatWeekRangeLabelNb(weekStart: Date): string {
  const sunday = addDays(weekStart, 6)
  const { week, isoYear } = isoWeekAndYearFromMonday(weekStart)
  const prefix = `Uke ${week} (${isoYear}) ·`
  const sm = weekStart.getMonth()
  const sy = weekStart.getFullYear()
  const em = sunday.getMonth()
  const ey = sunday.getFullYear()
  const sd = weekStart.getDate()
  const ed = sunday.getDate()
  if (sm === em && sy === ey) {
    const monthLong = weekStart.toLocaleDateString('nb-NO', { month: 'long' })
    return `${prefix} ${sd}.–${ed}. ${monthLong} ${sy}`
  }
  const a = formatDateKeyNb(dateKeyFromDate(weekStart))
  const b = formatDateKeyNb(dateKeyFromDate(sunday))
  return `${prefix} ${a} – ${b}`
}

/** Kort ukedagsnavn (nb) fra dato-nøkkel. */
export function weekdayLongNbFromDateKey(dateKey: string): string {
  const [y, mo, d] = dateKey.split('-').map(Number)
  if (!y || !mo || !d) return ''
  const dt = new Date(y, mo - 1, d)
  return dt.toLocaleDateString('nb-NO', { weekday: 'long' })
}

export type WeekPlanExportRow = [string, string, string, string, string]

/** Én rad per planlagt celle: Dato, ukedag, tidsrom, måltid, porsjoner. */
export function buildWeekPlanExportRows(
  dayKeys: string[],
  planByDate: Record<string, DayPlan>,
  visibleSlots: MealSlotId[],
  mealById: Map<string, Meal>,
): WeekPlanExportRow[] {
  const rows: WeekPlanExportRow[] = []
  for (const dk of dayKeys) {
    const day = planByDate[dk]
    if (!day?.slots) continue
    const weekday = weekdayLongNbFromDateKey(dk)
    const dateNb = formatDateKeyNb(dk)
    for (const slot of visibleSlots) {
      const pl = day.slots[slot]
      if (!pl) continue
      const meal = mealById.get(pl.mealId)
      if (!meal) continue
      const por = pl.servings ?? meal.defaultServings
      rows.push([dateNb, weekday, MEAL_SLOT_LABELS[slot], meal.title, String(por)])
    }
  }
  return rows
}

function csvEscapeCell(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\r') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** CSV med `;` og UTF-8 BOM (Excel-vennlig). */
export function weekPlanToCsvString(rows: WeekPlanExportRow[]): string {
  const header: WeekPlanExportRow = ['Dato', 'Ukedag', 'Tidsrom', 'Måltid', 'Porsjoner']
  const lines = [header, ...rows].map((r) => r.map(csvEscapeCell).join(';'))
  return `\uFEFF${lines.join('\r\n')}`
}

export function listDateKeysInRange(fromKey: string, toKey: string): string[] {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  const start = new Date(fy!, fm! - 1, fd!)
  const end = new Date(ty!, tm! - 1, td!)
  if (start > end) return []
  const out: string[] = []
  for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
    out.push(dateKeyFromDate(cur))
  }
  return out
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** Alle dato-nøkler i en kalendermåned (første–siste dag). */
export function monthDateRangeKeys(year: number, monthIndex0: number): string[] {
  const first = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-01`
  const lastD = daysInMonth(year, monthIndex0)
  const last = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`
  return listDateKeysInRange(first, last)
}

export function summarizeLinesForDialog(
  lines: IngredientLineInput[],
): { normalizedKey: string; displayName: string }[] {
  const map = new Map<string, string>()
  for (const l of lines) {
    if (!map.has(l.normalizedKey)) map.set(l.normalizedKey, l.displayName)
  }
  return [...map.entries()].map(([normalizedKey, displayName]) => ({ normalizedKey, displayName }))
}

export function calendarGridForMonth(year: number, monthIndex0: number): { key: string; inMonth: boolean }[][] {
  const first = new Date(year, monthIndex0, 1)
  const start = startOfWeekMonday(first)
  const cells: { key: string; inMonth: boolean }[] = []
  let cur = new Date(start)
  for (let i = 0; i < 42; i++) {
    const inMonth = cur.getMonth() === monthIndex0
    cells.push({
      key: dateKeyFromDate(cur),
      inMonth,
    })
    cur = addDays(cur, 1)
  }
  const rows: typeof cells[] = []
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7))
  }
  return rows
}

export function dayHasPlannedMeals(plan: DayPlan | undefined): boolean {
  if (!plan?.slots) return false
  return Object.keys(plan.slots).length > 0
}

export type WeekPlanSummary = {
  plannedMealCount: number
  daysWithPlan: number
  filledSlots: number
  totalSlots: number
  bySlot: Record<MealSlotId, number>
}

/** Avledet ukesstatistikk for KPI (ingen nettverkskall). Kun `activeSlots` teller med. */
export function summarizeWeekPlan(
  dayKeys: string[],
  planByDate: Record<string, DayPlan>,
  activeSlots: MealSlotId[] = [...MEAL_SLOT_ORDER],
): WeekPlanSummary {
  const slots: MealSlotId[] = activeSlots.length ? [...activeSlots] : [...MEAL_SLOT_ORDER]
  const bySlot = Object.fromEntries(MEAL_SLOT_ORDER.map((s) => [s, 0])) as Record<MealSlotId, number>
  let plannedMealCount = 0
  let daysWithPlan = 0
  for (const dk of dayKeys) {
    const day = planByDate[dk]
    let dayHas = false
    if (day?.slots) {
      for (const slot of slots) {
        if (day.slots[slot]) {
          plannedMealCount++
          bySlot[slot]++
          dayHas = true
        }
      }
    }
    if (dayHas) daysWithPlan++
  }
  const totalSlots = dayKeys.length * slots.length
  return {
    plannedMealCount,
    daysWithPlan,
    filledSlots: plannedMealCount,
    totalSlots,
    bySlot,
  }
}

/** Måltid vises i gitt plan-slot: ingen tags = alle slots; ellers må slot være i tags. */
export function mealVisibleInSlot(meal: Meal, slot: MealSlotId): boolean {
  const t = meal.tags
  if (!t?.length) return true
  return t.includes(slot)
}

export function collectIngredientLinesFromPlanRange(
  state: MatHandlelisteState,
  dateKeys: string[],
  mealById: Map<string, Meal>,
  options?: { slots?: MealSlotId[] },
): IngredientLineInput[] {
  const lines: IngredientLineInput[] = []
  const slots: MealSlotId[] =
    options?.slots?.length ? [...options.slots] : [...MEAL_SLOT_ORDER]
  for (const date of dateKeys) {
    const day = state.planByDate[date]
    if (!day?.slots) continue
    for (const slot of slots) {
      const pl = day.slots[slot]
      if (!pl) continue
      const meal = mealById.get(pl.mealId)
      if (!meal) continue
      const servings = pl.servings ?? meal.defaultServings
      const factor = portionFactorForMeal(meal.defaultServings, servings)
      const slotLabel = MEAL_SLOT_LABELS[slot]
      const source = {
        mealId: meal.id,
        mealTitle: meal.title,
        slotLabel,
        date,
      }
      lines.push(...mealIngredientToLines(meal.ingredients, factor, source))
    }
  }
  return lines
}
