'use client'

import Header from '@/components/layout/Header'
import MatHandlelisteBudgetCard from '@/components/matHandleliste/MatHandlelisteBudgetCard'
import { MatHandlelisteShoppingListPrint } from '@/components/matHandleliste/MatHandlelisteShoppingListPrint'
import { ShoppingListPdfPortalShell } from '@/components/matHandleliste/ShoppingListPdfPortalShell'
import { MatHandlelisteCollapsiblePanel } from '@/components/matHandleliste/MatHandlelisteCollapsiblePanel'
import { MatHandlelistePlanSlotFields } from '@/components/matHandleliste/MatHandlelistePlanSlotFields'
import { MatHandlelistePlanToolbar } from '@/components/matHandleliste/MatHandlelistePlanToolbar'
import { MatHandlelistePlanWeekGrid } from '@/components/matHandleliste/MatHandlelistePlanWeekGrid'
import { MatHandlelistePlanWeekKpi } from '@/components/matHandleliste/MatHandlelistePlanWeekKpi'
import { MatHandlelisteMealEditorModal } from '@/components/matHandleliste/MatHandlelisteMealEditorModal'
import { MatHandlelisteAppendRangeDialog } from '@/features/matHandleliste/MatHandlelisteAppendDialog'
import { appendIngredientsToShoppingList } from '@/features/matHandleliste/mergeIngredients'
import {
  addDays,
  collectIngredientLinesFromPlanRange,
  dateKeyFromDate,
  formatDateKeyNb,
  formatWeekRangeLabelNb,
  isoWeekAndYearFromMonday,
  startOfWeekMonday,
  summarizeLinesForDialog,
  summarizeWeekPlan,
} from '@/features/matHandleliste/planHelpers'
import { MatHandlelistePageShell } from '@/features/matHandleliste/MatHandlelistePageShell'
import { MEAL_SLOT_LABELS } from '@/features/matHandleliste/slotLabels'
import type { MealSlotId, PlanWeekLayout, ShoppingListItem } from '@/features/matHandleliste/types'
import { exportShoppingListPdf } from '@/lib/exportShoppingListPdf'
import { useStore } from '@/lib/store'
import { CalendarDays, ChevronLeft, ChevronRight, FileDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createPortal, flushSync } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PLAN_WEEK_PDF_INTRO =
  'Listen samler ingredienser fra måltidsplanen for den valgte uken, gruppert etter butikkrekkefølge. Der samme vare brukes flere ganger, er mengdene summert.'

type MealCreateModalState = {
  presetTags: MealSlotId[]
  assignTo?: { dateKey: string; slot: MealSlotId }
} | null

const weekdayShort = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

function planWeekLayoutNb(layout: PlanWeekLayout): string {
  switch (layout) {
    case 'auto':
      return 'Automatisk'
    case 'grid':
      return 'Rutenett'
    case 'list':
      return 'Liste'
  }
}

function planLayoutGridClass(layout: PlanWeekLayout): string {
  if (layout === 'list') return 'hidden'
  if (layout === 'grid') return 'block'
  return 'hidden lg:block'
}

function planLayoutListClass(layout: PlanWeekLayout): string {
  if (layout === 'grid') return 'hidden'
  if (layout === 'list') return 'block'
  return 'lg:hidden'
}

export function MatHandlelistePlanPage() {
  const searchParams = useSearchParams()
  const activeProfileId = useStore((s) => s.activeProfileId)
  const meals = useStore((s) => s.matHandleliste.meals)
  const categoryOrder = useStore((s) => s.matHandleliste.categoryOrder)
  const planByDate = useStore((s) => s.matHandleliste.planByDate)
  const planVisibleSlots = useStore((s) => s.matHandleliste.settings.planVisibleSlots)
  const planWeekLayout = useStore((s) => s.matHandleliste.settings.planWeekLayout)
  const mhSetPlanSlot = useStore((s) => s.mhSetPlanSlot)
  const mhSetPlanVisibleSlots = useStore((s) => s.mhSetPlanVisibleSlots)
  const mhSetPlanWeekLayout = useStore((s) => s.mhSetPlanWeekLayout)

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))

  useEffect(() => {
    const u = searchParams.get('uke')
    if (!u || !/^\d{4}-\d{2}-\d{2}$/.test(u)) return
    const d = new Date(
      Number.parseInt(u.slice(0, 4), 10),
      Number.parseInt(u.slice(5, 7), 10) - 1,
      Number.parseInt(u.slice(8, 10), 10),
    )
    if (!Number.isFinite(d.getTime())) return
    setWeekStart(startOfWeekMonday(d))
  }, [searchParams])
  const [appendOpen, setAppendOpen] = useState(false)
  const [rangeLines, setRangeLines] = useState<{ normalizedKey: string; displayName: string }[]>([])
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [mealCreateOpen, setMealCreateOpen] = useState<MealCreateModalState>(null)
  const mealCreateRef = useRef<MealCreateModalState>(null)

  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfExportItems, setPdfExportItems] = useState<ShoppingListItem[] | null>(null)
  const [pdfPortalReady, setPdfPortalReady] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPdfPortalReady(true)
  }, [])

  useEffect(() => {
    mealCreateRef.current = mealCreateOpen
  }, [mealCreateOpen])

  function openMealCreate(presetTags: MealSlotId[] = [], assignTo?: { dateKey: string; slot: MealSlotId }) {
    const next: MealCreateModalState = { presetTags, assignTo }
    mealCreateRef.current = next
    setMealCreateOpen(next)
  }

  function closeMealCreate() {
    mealCreateRef.current = null
    setMealCreateOpen(null)
  }

  function onMealCreatedFromPlan(id: string) {
    const ctx = mealCreateRef.current
    mealCreateRef.current = null
    setMealCreateOpen(null)
    if (ctx?.assignTo) {
      mhSetPlanSlot(ctx.assignTo.dateKey, ctx.assignTo.slot, { mealId: id, servings: null })
    }
  }

  const dayKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dateKeyFromDate(addDays(weekStart, i))),
    [weekStart],
  )

  const mealMap = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals])

  const weekLabel = useMemo(() => formatWeekRangeLabelNb(weekStart), [weekStart])

  const weekStats = useMemo(
    () => summarizeWeekPlan(dayKeys, planByDate, planVisibleSlots),
    [dayKeys, planByDate, planVisibleSlots],
  )

  const planSettingsTitle = `Planinnstillinger · ${planVisibleSlots.length} tidsrom, ${planWeekLayoutNb(planWeekLayout)}`

  const exportPlanPdf = useCallback(async () => {
    const st = useStore.getState().matHandleliste
    const lines = collectIngredientLinesFromPlanRange(st, dayKeys, mealMap, {
      slots: st.settings.planVisibleSlots,
    })
    const now = new Date().toISOString()
    const merged = appendIngredientsToShoppingList([], lines, activeProfileId, now)
    const toShow = merged.filter((it) => !it.checked)
    if (toShow.length === 0) {
      window.alert(
        'Ingen ingredienser å eksportere for denne uken. Legg inn måltider i planen, eller sjekk at valgte tidsrom under Planinnstillinger matcher det du har planlagt.',
      )
      return
    }

    setPdfBusy(true)
    try {
      flushSync(() => {
        setPdfExportItems(toShow)
      })
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })
      const el = pdfRef.current
      if (!el) {
        window.alert('Kunne ikke forberede PDF. Prøv å laste siden på nytt.')
        return
      }
      const { week, isoYear } = isoWeekAndYearFromMonday(weekStart)
      const fn = `maltidsplan-uke-${week}-${isoYear}.pdf`
      await exportShoppingListPdf(el, fn)
    } catch (e) {
      console.error('exportPlanPdf', e)
      const detail = e instanceof Error ? e.message : String(e)
      window.alert(
        process.env.NODE_ENV === 'development'
          ? `PDF-eksport feilet (dev): ${detail}\n\nSjekk også at nedlasting ikke er blokkert.`
          : 'PDF-eksport feilet. Sjekk at nedlasting ikke er blokkert (popup/nettleser), og prøv igjen.',
      )
    } finally {
      setPdfBusy(false)
      setPdfExportItems(null)
    }
  }, [activeProfileId, dayKeys, mealMap, weekStart])

  function openAppendWeek() {
    const st = useStore.getState().matHandleliste
    const lines = collectIngredientLinesFromPlanRange(st, dayKeys, mealMap, {
      slots: st.settings.planVisibleSlots,
    })
    setRangeLines(summarizeLinesForDialog(lines))
    setRangeFrom(dayKeys[0]!)
    setRangeTo(dayKeys[6]!)
    setAppendOpen(true)
  }

  return (
    <>
      <Header title="Måltidsplan" subtitle={`Planlegg ${weekLabel} · Måned`} />
      <MatHandlelistePageShell>
        <div className="w-full max-w-none pb-8">
          <div className="flex min-w-0 flex-col gap-6">
            <section aria-labelledby="plan-overview-heading">
              <h2
                id="plan-overview-heading"
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Oversikt
              </h2>
              <div
                className="mt-3 flex flex-col gap-4 rounded-2xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <MatHandlelistePlanWeekKpi stats={weekStats} weekLabel={weekLabel} weekDayCount={dayKeys.length} />
                <MatHandlelisteBudgetCard planWeekStart={weekStart} />
              </div>
            </section>

            <section aria-labelledby="plan-week-heading">
              <h2
                id="plan-week-heading"
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Denne uken
              </h2>
              <div className="mt-3 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Forrige uke"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      onClick={() => setWeekStart(addDays(weekStart, -7))}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Neste uke"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      onClick={() => setWeekStart(addDays(weekStart, 7))}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <p
                    className="min-w-0 flex-1 text-center text-sm font-medium leading-snug sm:flex-none sm:text-left"
                    style={{ color: 'var(--text)' }}
                  >
                    {weekLabel}
                  </p>
                  <Link
                    href="/intern/mat-handleliste/plan/maned"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-sm font-medium"
                    style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                  >
                    <CalendarDays size={18} /> Måned
                  </Link>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={openAppendWeek}
                    className="min-h-[48px] flex-1 rounded-xl text-sm font-semibold text-white touch-manipulation sm:min-w-[12rem]"
                    style={{ background: 'var(--primary)' }}
                  >
                    Legg hele uken på handleliste
                  </button>
                  <button
                    type="button"
                    onClick={() => openMealCreate()}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold touch-manipulation sm:min-w-[12rem]"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-pale)' }}
                  >
                    <Plus size={18} aria-hidden />
                    Nytt måltid
                  </button>
                  <button
                    type="button"
                    disabled={pdfBusy}
                    onClick={() => void exportPlanPdf()}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold touch-manipulation disabled:opacity-50 sm:max-w-xs"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <FileDown size={18} aria-hidden />
                    {pdfBusy ? 'Eksporterer…' : 'Eksporter PDF'}
                  </button>
                </div>
              </div>
            </section>

            <section aria-labelledby="plan-settings-heading">
              <h2 id="plan-settings-heading" className="sr-only">
                Planinnstillinger
              </h2>
              <MatHandlelisteCollapsiblePanel title={planSettingsTitle} defaultOpen={false}>
                <MatHandlelistePlanToolbar
                  visibleSlots={planVisibleSlots}
                  onVisibleSlotsChange={mhSetPlanVisibleSlots}
                  layout={planWeekLayout}
                  onLayoutChange={mhSetPlanWeekLayout}
                  variant="plain"
                />
              </MatHandlelisteCollapsiblePanel>
            </section>

            <section aria-labelledby="plan-grid-heading">
              <h2
                id="plan-grid-heading"
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Planlegg
              </h2>
              <div className="mt-3">
                <div className={planLayoutGridClass(planWeekLayout)}>
                  <MatHandlelistePlanWeekGrid
                    weekStart={weekStart}
                    dayKeys={dayKeys}
                    visibleSlots={planVisibleSlots}
                    planByDate={planByDate}
                    meals={meals}
                    mealMap={mealMap}
                    mhSetPlanSlot={mhSetPlanSlot}
                    onRequestCreateMeal={({ dateKey, slot }) => openMealCreate([slot], { dateKey, slot })}
                  />
                </div>

                <div className={`space-y-4 ${planLayoutListClass(planWeekLayout)}`}>
                  {dayKeys.map((dk, di) => {
                    const d = addDays(weekStart, di)
                    const wdIdx = (d.getDay() + 6) % 7
                    const wd = weekdayShort[wdIdx] ?? ''
                    const plan = planByDate[dk] ?? { slots: {} }
                    return (
                      <section
                        key={dk}
                        className="rounded-xl border p-3"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                      >
                        <h3 className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>
                          {wd} {formatDateKeyNb(dk)}
                        </h3>
                        <div className="mt-3 space-y-4">
                          {planVisibleSlots.map((slot) => {
                            const cur = plan.slots?.[slot]
                            return (
                              <div
                                key={slot}
                                className="rounded-lg border p-3"
                                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                              >
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                                  {MEAL_SLOT_LABELS[slot]}
                                </h4>
                                <MatHandlelistePlanSlotFields
                                  dateKey={dk}
                                  slot={slot}
                                  cur={cur}
                                  meals={meals}
                                  mealMap={mealMap}
                                  mhSetPlanSlot={mhSetPlanSlot}
                                  fieldIdPrefix={`plan-${dk}-${slot}`}
                                  density="comfortable"
                                  onRequestCreateMeal={({ dateKey: dKey, slot: s }) =>
                                    openMealCreate([s], { dateKey: dKey, slot: s })
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </MatHandlelistePageShell>

      <MatHandlelisteAppendRangeDialog
        open={appendOpen}
        onClose={() => setAppendOpen(false)}
        fromKey={rangeFrom}
        toKey={rangeTo}
        lines={rangeLines}
      />

      <MatHandlelisteMealEditorModal
        editing={mealCreateOpen ? 'new' : null}
        onClose={closeMealCreate}
        initialTagsWhenCreating={mealCreateOpen?.presetTags}
        onCreated={onMealCreatedFromPlan}
      />

      {pdfPortalReady && pdfExportItems !== null
        ? createPortal(
            <ShoppingListPdfPortalShell>
              <MatHandlelisteShoppingListPrint
                ref={pdfRef}
                list={pdfExportItems}
                categoryOrder={categoryOrder}
                title="Måltidsplanlegger"
                subtitle={weekLabel}
                intro={PLAN_WEEK_PDF_INTRO}
                showBrand
                variant="plan"
              />
            </ShoppingListPdfPortalShell>,
            document.body,
          )
        : null}
    </>
  )
}
