'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import DashboardPeriodToolbar from '@/components/dashboard/DashboardPeriodToolbar'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { periodSubtitle } from '@/lib/budgetPeriod'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { chartColorsForUiPalette } from '@/lib/uiColorPalette'
import {
  appendIncomeSprintPaidLine,
  buildSmartSpareMonthlyPaidEarnedRows,
  buildStackedBarRows,
  computeIncomeSprintDerived,
  computeSourceMonthGrossTaxNet,
  formatIncomeSprintPaidLineTimestampNb,
  formatIncomeSprintPlanPeriodNb,
  incomeSprintPaidLinesExplicitForMonth,
  incomeSprintNormalizedPaidLinesForMonth,
  listMonthKeysInRange,
  maxAdditionalPaidForMonth,
  monthEarnedInGoalBasis,
  monthKeyHeadingNb,
  parseTaxPercentFieldInput,
  reconcileIncomeSprintPlan,
  smartSpareFilterToReferenceDate,
  yearOptionsTouchingPlan,
  type IncomeSprintPaidLine,
  type IncomeSprintPlan,
} from '@/lib/incomeSprint'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatThousands, generateId, parseThousands } from '@/lib/utils'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Clock,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GoalDonutSlice = { name: string; value: number; fill: string }

function InnbetaltMotMalMonthEditor(props: {
  plan: IncomeSprintPlan
  monthKey: string
  readOnly: boolean
  persistPlan: (next: IncomeSprintPlan) => void
  persistPaidForMonth: (monthKey: string, raw: string) => void
  /** Når sann: kortere hjelpetekst (brukt inne i kildemodal). */
  compactHint?: boolean
}) {
  const { plan, monthKey, readOnly, persistPlan, persistPaidForMonth, compactHint } = props
  const { formatNOK } = useNokDisplayFormatters()
  const explicit = incomeSprintPaidLinesExplicitForMonth(plan, monthKey)
  const lines: IncomeSprintPaidLine[] = explicit ? (plan.paidLinesByMonthKey?.[monthKey] ?? []) : []
  const total = plan.paidByMonthKey?.[monthKey] ?? 0
  const earned = monthEarnedInGoalBasis(plan, monthKey)
  const room = maxAdditionalPaidForMonth(plan, monthKey)

  const [totalDraftStr, setTotalDraftStr] = useState('')
  const [newLineAmtStr, setNewLineAmtStr] = useState('')
  const [newLineNote, setNewLineNote] = useState('')

  useEffect(() => {
    setTotalDraftStr(total ? formatThousands(String(total)) : '')
    setNewLineAmtStr('')
    setNewLineNote('')
  }, [monthKey, total, plan.id])

  const applyTotalFromField = useCallback(() => {
    persistPaidForMonth(monthKey, totalDraftStr)
  }, [monthKey, persistPaidForMonth, totalDraftStr])

  return (
    <div className="rounded-xl p-3 sm:p-4 space-y-4 min-w-0" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Innbetalt mot mål ({monthKeyHeadingNb(monthKey)})
        </h3>
        <p className="text-sm tabular-nums font-medium" style={{ color: 'var(--text)' }}>
          Sum {formatNOK(total)}
          <span className="text-xs font-normal block sm:inline sm:ml-1" style={{ color: 'var(--text-muted)' }}>
            (opptjent {formatNOK(earned)})
          </span>
        </p>
      </div>
      <p className="text-xs leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
        Tidspunktet viser når posten ble registrert i appen (Europe/Oslo). Nyeste øverst.
        {!compactHint
          ? ' Når måneden har beløp eller poster trykker du cellen mot modal. Fet skrift når måneden har minst to linjer i loggen (f.eks. gammelt beløp splittet til én rad pluss en ny innbetaling). Tom måned lar deg taste inn direkte.'
          : null}
      </p>
      {!explicit && total > 0 ? (
        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          Beløpet er én samlet sum. Legg til post eller bruk «Tilfør» for å dele i flere linjer med logg.
        </p>
      ) : null}
      {lines.length > 0 ? (
        <ul className="space-y-2 min-w-0">
          {lines.map((line) => (
            <li
              key={line.id}
              className="rounded-lg p-2 sm:p-2.5 space-y-2"
              style={{ border: '1px solid var(--border)', background: 'var(--primary-pale)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {formatIncomeSprintPaidLineTimestampNb(line.createdAt)}
                  </p>
                  {line.note ? (
                    <p className="text-xs mt-1 break-words" style={{ color: 'var(--text)' }}>
                      {line.note}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    const nextArr = lines.filter((l) => l.id !== line.id)
                    persistPlan({
                      ...plan,
                      paidLinesByMonthKey: {
                        ...(plan.paidLinesByMonthKey ?? {}),
                        [monthKey]: nextArr.length > 0 ? nextArr : [],
                      },
                    })
                  }}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation disabled:opacity-40"
                  style={{ color: 'var(--danger)' }}
                  aria-label="Slett post"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm font-medium min-w-0" style={{ color: 'var(--text)' }}>
                  Beløp (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={readOnly}
                    defaultValue={formatThousands(String(line.amount))}
                    key={`${line.id}-${line.amount}`}
                    onBlur={(e) => {
                      let n = Math.max(0, parseThousands(e.target.value.trim() || '0'))
                      const otherSum = lines.filter((l) => l.id !== line.id).reduce((s, l) => s + l.amount, 0)
                      const maxForLine = Math.max(0, earned - otherSum)
                      if (n > maxForLine) n = maxForLine
                      if (n === line.amount) return
                      persistPlan({
                        ...plan,
                        paidLinesByMonthKey: {
                          ...(plan.paidLinesByMonthKey ?? {}),
                          [monthKey]: lines.map((l) => (l.id === line.id ? { ...l, amount: n } : l)),
                        },
                      })
                    }}
                    className="min-h-[44px] px-2 py-2 rounded-lg text-sm tabular-nums w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium min-w-0" style={{ color: 'var(--text)' }}>
                  Merknad (valgfritt)
                  <input
                    type="text"
                    disabled={readOnly}
                    defaultValue={line.note ?? ''}
                    key={`note-${line.id}-${line.note ?? ''}`}
                    onBlur={(e) => {
                      const noteTrim = e.target.value.trim().slice(0, 140)
                      const noteNext = noteTrim.length > 0 ? noteTrim : undefined
                      const prev = (line.note ?? '').trim()
                      if ((noteNext ?? '') === prev) return
                      persistPlan({
                        ...plan,
                        paidLinesByMonthKey: {
                          ...(plan.paidLinesByMonthKey ?? {}),
                          [monthKey]: lines.map((l) =>
                            l.id === line.id ? { ...l, note: noteNext } : l,
                          ),
                        },
                      })
                    }}
                    className="min-h-[44px] px-2 py-2 rounded-lg text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    placeholder="F.eks. lønn 15.4"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : explicit ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ingen poster for denne måneden ennå — legg til under.
        </p>
      ) : null}

      <div
        className="rounded-lg p-3 sm:p-3.5 space-y-3 min-w-0"
        style={{ border: '1px solid var(--border)', background: 'var(--primary-pale)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Legg til ny post
          </p>
          <p className="text-[11px] sm:text-xs leading-snug mt-1 break-words" style={{ color: 'var(--text-muted)' }}>
            På{' '}
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {monthKeyHeadingNb(monthKey)}
            </span>{' '}
            kan du ennå registrere innbetalt for opptil{' '}
            <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
              {formatNOK(room)}
            </span>{' '}
            (opptjent for måneden minus det som allerede er ført).
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium min-w-0" style={{ color: 'var(--text)' }}>
            Beløp (kr)
            <input
              type="text"
              inputMode="numeric"
              disabled={readOnly || room <= 0}
              value={newLineAmtStr}
              onChange={(e) => setNewLineAmtStr(formatThousands(e.target.value))}
              placeholder={room > 0 ? 'Skriv beløp' : 'Ikke rom for mer'}
              className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm tabular-nums touch-manipulation w-full min-w-0"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium min-w-0" style={{ color: 'var(--text)' }}>
            Merknad (valgfritt)
            <input
              type="text"
              disabled={readOnly || room <= 0}
              value={newLineNote}
              onChange={(e) => setNewLineNote(e.target.value.slice(0, 140))}
              className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 touch-manipulation"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              placeholder="F.eks. ekstra BSU"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={
            readOnly ||
            room <= 0 ||
            !Number.isFinite(parseThousands(newLineAmtStr.trim() || '0')) ||
            parseThousands(newLineAmtStr.trim() || '0') <= 0
          }
          onClick={() => {
            const raw = parseThousands(newLineAmtStr.trim() || '0')
            const add = Math.max(0, Math.round(Number.isFinite(raw) ? raw : 0))
            if (add <= 0) return
            const capped = Math.min(add, room)
            persistPlan(appendIncomeSprintPaidLine(plan, monthKey, capped, newLineNote.trim() || undefined))
            setNewLineAmtStr('')
            setNewLineNote('')
          }}
          className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Legg til post
        </button>
      </div>

      <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <label className="flex flex-col gap-1.5 text-sm min-w-0 font-medium" style={{ color: 'var(--text)' }}>
          Sett månedsum direkte (kr)
          <span className="text-xs font-normal leading-snug" style={{ color: 'var(--text-muted)' }}>
            Erstatter enkeltsummer med én totalsum og fjerner postlisten for måneden. Bruk poster over for å logge flere
            innbetalinger med tidspunkt.
          </span>
          <input
            type="text"
            inputMode="numeric"
            disabled={readOnly}
            value={totalDraftStr}
            onChange={(e) => setTotalDraftStr(formatThousands(e.target.value))}
            className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums touch-manipulation"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </label>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => applyTotalFromField()}
          className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Oppdater månedsum
        </button>
      </div>
    </div>
  )
}


function SmartSpareGoalDonutBlock({ pieData, centerPercent }: { pieData: GoalDonutSlice[]; centerPercent: number }) {
  const { formatNOK } = useNokDisplayFormatters()
  if (pieData.length === 0) return null
  const label = `${Math.round(centerPercent)} %`
  return (
    <>
      {/*
        Ingen <Legend> inne i PieChart (gjorde senter feilplassert). Senter-tekst som HTML overlagt i relative-boks
        for nøyaktig visuell midtstilling, ikke Recharts-Label.
      */}
      <div className="w-full max-w-[min(100%,280px)] min-w-0 mx-auto">
        <div className="relative h-[196px] w-full min-w-0 sm:h-[210px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="76%"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((row, i) => (
                  <Cell key={i} fill={row.fill} stroke="var(--surface)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatNOK(Number(v ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
          <p
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-full max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center tabular-nums text-[clamp(0.9375rem,3.5vw+0.6rem,1.375rem)] font-bold leading-none"
            style={{ color: 'var(--text)' }}
          >
            {label}
          </p>
        </div>
        <div
          className="flex max-w-full flex-wrap justify-center gap-x-2 gap-y-0.5 px-0.5 pt-1 text-[11px] leading-snug sm:gap-x-3"
          style={{ color: 'var(--text-muted)' }}
        >
          {pieData.map((row) => (
            <span key={row.name} className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-sm border"
                style={{ background: row.fill, borderColor: 'var(--border)' }}
                aria-hidden
              />
              {row.name}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
        av målet
      </p>
    </>
  )
}

type Props = { planId: string }

export default function SmartSparePlanDetail({ planId }: Props) {
  const { formatNOK, formatNOKChartLabel } = useNokDisplayFormatters()
  const router = useRouter()
  const people = useStore((s) => s.people)
  const profiles = useStore((s) => s.profiles)
  const {
    incomeSprintPlans,
    upsertIncomeSprintPlan,
    removeIncomeSprintPlan,
    isHouseholdAggregate,
    activeProfileId,
    setActiveProfileId,
    setFinanceScope,
  } = useActivePersonFinance()

  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const chartPalette = useMemo(() => chartColorsForUiPalette(uiColorPalette), [uiColorPalette])
  const sourceBarColors = useMemo(() => {
    const { primary, primaryLight } = chartPalette
    return [primary, primaryLight, '#0CA678', '#F08C00', '#AE3EC9', '#E03131', '#0B7285', '#7048E8']
  }, [chartPalette])

  const readOnly = isHouseholdAggregate

  const planExistsSomewhere = useMemo(
    () =>
      profiles.some((p) => (people[p.id]?.incomeSprintPlans ?? []).some((pl) => pl.id === planId)),
    [people, profiles, planId],
  )

  useEffect(() => {
    if (!planExistsSomewhere) return
    const owner = profiles.find((p) =>
      (people[p.id]?.incomeSprintPlans ?? []).some((pl) => pl.id === planId),
    )
    if (owner) {
      setFinanceScope('profile')
      if (owner.id !== activeProfileId) setActiveProfileId(owner.id)
    }
  }, [planId, people, profiles, activeProfileId, setActiveProfileId, setFinanceScope, planExistsSomewhere])

  const plan = useMemo(
    () => incomeSprintPlans.find((p) => p.id === planId) ?? null,
    [incomeSprintPlans, planId],
  )

  const persistPlan = useCallback(
    (next: IncomeSprintPlan) => {
      if (readOnly) return
      upsertIncomeSprintPlan(reconcileIncomeSprintPlan(next))
    },
    [readOnly, upsertIncomeSprintPlan],
  )

  const planYearOptions = useMemo(() => (plan ? yearOptionsTouchingPlan(plan) : []), [plan])

  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear())
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth())

  const planRef = useRef(plan)
  planRef.current = plan

  useEffect(() => {
    const p = planRef.current
    if (!p) return
    const opts = yearOptionsTouchingPlan(p)
    if (opts.length === 0) return
    const y = new Date().getFullYear()
    setFilterYear(opts.includes(y) ? y : opts[0]!)
  }, [plan?.id, plan?.startDate, plan?.endDate])

  const referenceDate = useMemo(
    () => (plan ? smartSpareFilterToReferenceDate(plan, filterYear, periodMode, monthIndex) : ''),
    [plan, filterYear, periodMode, monthIndex],
  )

  const derived = useMemo(
    () =>
      plan && referenceDate
        ? computeIncomeSprintDerived(plan, referenceDate, {
            filterYear,
            periodMode,
            monthIndex,
          })
        : null,
    [plan, referenceDate, filterYear, periodMode, monthIndex],
  )

  type CellModal = { sourceId: string; monthKey: string }
  const [cellModal, setCellModal] = useState<CellModal | null>(null)
  const [cellModalHelpOpen, setCellModalHelpOpen] = useState(false)
  const [innbetaltDetailMonthKey, setInnbetaltDetailMonthKey] = useState<string | null>(null)
  const cellModalBackdropDismiss = useModalBackdropDismiss(() => setCellModal(null))
  const innbetaltDetailBackdropDismiss = useModalBackdropDismiss(() => setInnbetaltDetailMonthKey(null))
  const cellModalHelpRef = useRef<HTMLDivElement>(null)
  const [renamingSourceId, setRenamingSourceId] = useState<string | null>(null)
  const [modalAddCustomStr, setModalAddCustomStr] = useState('')
  const [periodFilterExpanded, setPeriodFilterExpanded] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [planTaxPercentStr, setPlanTaxPercentStr] = useState('')

  useEffect(() => {
    if (!cellModal) setModalAddCustomStr('')
  }, [cellModal])

  useEffect(() => {
    if (!cellModal) {
      setCellModalHelpOpen(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCellModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cellModal])

  useEffect(() => {
    if (!cellModalHelpOpen) return
    const close = (e: PointerEvent) => {
      if (cellModalHelpRef.current && !cellModalHelpRef.current.contains(e.target as Node)) {
        setCellModalHelpOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [cellModalHelpOpen])

  useEffect(() => {
    if (!innbetaltDetailMonthKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInnbetaltDetailMonthKey(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [innbetaltDetailMonthKey])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const apply = () => {
      if (mq.matches) setPeriodFilterExpanded(true)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!plan) return
    setPlanTaxPercentStr(plan.taxPercent === 0 ? '' : String(plan.taxPercent))
  }, [plan])

  const cellModalBreakdown = useMemo(() => {
    if (!plan || !cellModal) return null
    return computeSourceMonthGrossTaxNet(plan, cellModal.sourceId, cellModal.monthKey)
  }, [plan, cellModal])

  const cellModalSource = useMemo(
    () => (plan && cellModal ? plan.sources.find((s) => s.id === cellModal.sourceId) ?? null : null),
    [plan, cellModal],
  )

  const suggestedTransferAmount = useMemo(() => {
    if (!cellModalBreakdown || !plan) return 0
    return plan.goalBasis === 'afterTax' ? cellModalBreakdown.net : cellModalBreakdown.gross
  }, [cellModalBreakdown, plan])

  const tilforCap = useMemo(() => {
    if (!plan || !cellModal) return 0
    return maxAdditionalPaidForMonth(plan, cellModal.monthKey)
  }, [plan, cellModal])

  const tilforDesiredAmount = useMemo(() => {
    if (!cellModal) return Number.NaN
    if (modalAddCustomStr.trim()) return parseThousands(modalAddCustomStr)
    return suggestedTransferAmount
  }, [cellModal, modalAddCustomStr, suggestedTransferAmount])

  const tilforEffectiveAmount = useMemo(() => {
    if (!Number.isFinite(tilforDesiredAmount) || tilforDesiredAmount <= 0) return 0
    return Math.min(tilforDesiredAmount, tilforCap)
  }, [tilforDesiredAmount, tilforCap])

  const safePad = 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))'

  const monthKeys = useMemo(() => {
    if (!plan) return []
    return listMonthKeysInRange(plan.startDate, plan.endDate)
  }, [plan])

  const persistPaidForMonth = useCallback(
    (monthKey: string, raw: string) => {
      if (readOnly || !plan) return
      const n = Math.max(0, parseThousands(raw.trim() || '0'))
      const nextPaidLines = { ...(plan.paidLinesByMonthKey ?? {}) }
      delete nextPaidLines[monthKey]
      const lineKeys = Object.keys(nextPaidLines)
      persistPlan({
        ...plan,
        paidByMonthKey: { ...(plan.paidByMonthKey ?? {}), [monthKey]: n },
        paidLinesByMonthKey: lineKeys.length > 0 ? nextPaidLines : undefined,
      })
    },
    [plan, readOnly, persistPlan],
  )

  /** Siste planmåned t.o.m. filtrets referansemåned — kildemodal, rask innbetalt under brutto-tabell. */
  const primaryInnbetaltMonthKey = useMemo(() => {
    if (monthKeys.length === 0) return ''
    const refMk = derived?.referenceMonthKey ?? monthKeys[monthKeys.length - 1]!
    const eligible = monthKeys.filter((k) => k <= refMk)
    return eligible.length ? eligible[eligible.length - 1]! : monthKeys[0]!
  }, [monthKeys, derived?.referenceMonthKey])

  /** Per kalendermåned: opptjent i målgrunnlag og rom til mer innbetalt (hjelperader under innbetalt i tabellen). */
  const innbetaltHjelpetallPerMåned = useMemo(() => {
    if (!plan) {
      return { opptjent: [] as number[], romTilMer: [] as number[] }
    }
    const opptjent: number[] = []
    const romTilMer: number[] = []
    for (const mk of monthKeys) {
      opptjent.push(monthEarnedInGoalBasis(plan, mk))
      romTilMer.push(maxAdditionalPaidForMonth(plan, mk))
    }
    return { opptjent, romTilMer }
  }, [plan, monthKeys])

  const barRows = useMemo(() => (plan && monthKeys.length ? buildStackedBarRows(plan, monthKeys) : []), [plan, monthKeys])

  const pieProgress = useMemo((): GoalDonutSlice[] => {
    if (!derived || derived.targetAmount <= 0) return []
    const achieved = Math.min(derived.targetAmount, derived.paidTotalToDate)
    const left = Math.max(0, derived.targetAmount - achieved)
    return [
      { name: 'Innbetalt', value: achieved, fill: 'var(--primary)' },
      { name: 'Igjen', value: left, fill: 'var(--border)' },
    ]
  }, [derived])

  const pieEarnedTowardGoal = useMemo((): GoalDonutSlice[] => {
    if (!derived || derived.targetAmount <= 0) return []
    const achieved = Math.min(derived.targetAmount, derived.earnedInGoalBasis)
    const left = Math.max(0, derived.targetAmount - achieved)
    return [
      { name: 'Tjent', value: achieved, fill: 'var(--success)' },
      { name: 'Igjen', value: left, fill: 'var(--border)' },
    ]
  }, [derived])

  const earnedProgressPercent = useMemo(() => {
    if (!derived || derived.targetAmount <= 0) return 0
    return Math.min(100, (derived.earnedInGoalBasis / derived.targetAmount) * 100)
  }, [derived])

  const monthlyPaidEarnedRows = useMemo(() => {
    if (!plan || !referenceDate) return []
    return buildSmartSpareMonthlyPaidEarnedRows(plan, referenceDate, {
      filterYear,
      periodMode,
      monthIndex,
    })
  }, [plan, referenceDate, filterYear, periodMode, monthIndex])

  const periodFilterToggleId = `smartspare-period-filter-${planId}`
  const periodFilterPanelId = `${periodFilterToggleId}-panel`

  const goalSub =
    plan?.goalBasis === 'beforeTax'
      ? 'Beløpet er før skatt — «Tjent hittil» følger brutto.'
      : 'Beløpet er etter skatt — «Tjent hittil» følger netto når skatt er på.'

  const earnedSub =
    plan?.goalBasis === 'beforeTax'
      ? 'Brutto inn til og med inneværende måned i perioden.'
      : plan?.applyTax
        ? 'Netto (etter skatt) til og med inneværende måned.'
        : 'Samme som brutto når skatt er av.'

  const planTitle = plan ? (plan.name?.trim() || formatIncomeSprintPlanPeriodNb(plan)) : ''

  const ownerProfileName = profiles.find((p) => p.id === activeProfileId)?.name ?? ''
  const headerSubtitle =
    planTitle && profiles.length >= 2 ? `${planTitle} · ${ownerProfileName}` : planTitle

  if (!planExistsSomewhere) {
    return (
      <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
        <Header title="SmartSpare" subtitle="Plan ikke funnet" />
        <SparingSubnav />
        <div
          className="p-4 sm:p-6 lg:p-8 max-w-7xl xl:max-w-[90rem] mx-auto w-full min-w-0 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
        >
          <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
            Denne planen finnes ikke (eller er slettet).
          </p>
          <Link
            href="/sparing/smartspare"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium touch-manipulation w-full sm:w-auto"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <ChevronLeft size={18} aria-hidden />
            Til oversikt
          </Link>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
        <Header title="SmartSpare" subtitle="Laster …" />
        <SparingSubnav />
        <div
          className="p-6 text-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{
            color: 'var(--text-muted)',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          Laster plan …
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto min-w-0" style={{ background: 'var(--bg)' }}>
      <Header title="SmartSpare" subtitle={headerSubtitle} />
      <SparingSubnav />
      <div
        className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl xl:max-w-[90rem] mx-auto w-full min-w-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}
      >
        <Link
          href="/sparing/smartspare"
          className="inline-flex min-h-[44px] w-full sm:w-auto max-w-full items-center justify-center sm:justify-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium touch-manipulation min-w-0"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <ChevronLeft size={18} className="shrink-0" aria-hidden />
          <span className="min-w-0">Til oversikt</span>
        </Link>

        {readOnly && (
          <div
            className="rounded-2xl p-4 flex gap-3 items-start"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle className="shrink-0 mt-0.5" size={20} style={{ color: 'var(--primary)' }} />
            <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text)' }}>
              Du viser <strong>husholdning</strong>. Bytt til <strong>én profil</strong> (ikke husholdning) for å redigere
              denne planen.
            </p>
          </div>
        )}

        {plan && planYearOptions.length > 0 && (
          <div
            className="rounded-2xl p-4 sm:p-5 space-y-2 min-w-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              id={periodFilterToggleId}
              aria-expanded={periodFilterExpanded}
              aria-controls={periodFilterPanelId}
              onClick={() => setPeriodFilterExpanded((e) => !e)}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-2 rounded-xl px-1 py-1 text-left outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:hidden"
              style={{ color: 'var(--text)' }}
            >
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                Tall per: {periodSubtitle(periodMode, filterYear, monthIndex)}
              </span>
              <ChevronDown
                size={20}
                className="shrink-0 transition-transform duration-200"
                style={{
                  color: 'var(--text-muted)',
                  transform: periodFilterExpanded ? 'rotate(180deg)' : undefined,
                }}
                aria-hidden
              />
            </button>
            <p className="hidden text-sm font-medium sm:block" style={{ color: 'var(--text)' }}>
              Tall per: {periodSubtitle(periodMode, filterYear, monthIndex)}
            </p>
            <div
              id={periodFilterPanelId}
              role="region"
              aria-label={`Periodefilter: ${periodSubtitle(periodMode, filterYear, monthIndex)}`}
              className={`min-w-0 space-y-2 ${periodFilterExpanded ? 'block' : 'hidden'} sm:block`}
            >
              <p className="text-xs min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                «Hittil i år» klippes til i dag og plan. «Én måned» og «Hele året» summerer brutto-tabellen for hele valgt
                vindu (også måneder som ikke er passert). Tabellen under viser hele planperioden for redigering.
              </p>
              <DashboardPeriodToolbar
                variant="inline"
                filterYear={filterYear}
                onFilterYearChange={setFilterYear}
                periodMode={periodMode}
                onPeriodModeChange={setPeriodMode}
                monthIndex={monthIndex}
                onMonthIndexChange={setMonthIndex}
                yearOptions={planYearOptions}
              />
            </div>
          </div>
        )}

        {!derived && (
          <p className="text-sm rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Ingen gyldige måneder i perioden. Sjekk at startdato er før eller samme måned som sluttdato.
          </p>
        )}

        {derived && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              <StatCard
                label="Mål"
                value={formatNOK(derived.targetAmount)}
                sub={goalSub}
                icon={Target}
                color={chartPalette.primary}
                info="Målbeløpet tolkes i det du valgte under «Målgrunnlag» (før eller etter skatt)."
              />
              <StatCard
                label="Tjent hittil"
                value={
                  plan.goalBasis === 'beforeTax' ? formatNOK(derived.earnedGrossToDate) : formatNOK(derived.earnedNetToDate)
                }
                sub={earnedSub}
                icon={TrendingUp}
                color="#0CA678"
                info="Opptjent/forventet fra brutto-tabellen innenfor valgt periode — kan være utbetalt eller ikke."
              />
              <StatCard
                label="Innbetalt hittil"
                value={formatNOK(derived.paidTotalToDate)}
                sub="Månedlige tilføringer + eventuelt engangs (samme målgrunnlag som målet)."
                icon={PiggyBank}
                color="#7048E8"
              />
              <StatCard
                label="Ventende"
                value={formatNOK(derived.pendingNotReceived)}
                sub="Tjent hittil minus innbetalt (min. 0)."
                icon={Clock}
                color="#AE3EC9"
              />
              <StatCard
                label="Resterende"
                value={formatNOK(derived.remaining)}
                sub="Mål minus innbetalt hittil (konservativ fremdrift)."
                icon={Wallet}
                color="#F08C00"
              />
            </div>

            {monthlyPaidEarnedRows.length > 0 && (
              <div
                className="rounded-2xl p-4 sm:p-5 overflow-x-auto min-w-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  Innbetalt og opptjent per måned
                </h2>
                <p className="text-xs mb-3 min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                  Gjelder valgt periode over. <strong style={{ color: 'var(--text)' }}>Innbetalt</strong> er felles for
                  hele planen per måned (samme beløp som i kildemodal). <strong style={{ color: 'var(--text)' }}>Opptjent</strong>{' '}
                  er summert fra brutto-tabellen i målgrunnlaget. <strong style={{ color: 'var(--text)' }}>Ventende</strong> i
                  måneden er opptjent minus innbetalt (min. 0).
                </p>
                <table className="w-full text-xs sm:text-sm border-collapse min-w-[18rem]">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2 pr-2 font-medium">Måned</th>
                      <th className="text-right py-2 px-2 font-medium tabular-nums">Opptjent</th>
                      <th className="text-right py-2 px-2 font-medium tabular-nums">Innbetalt</th>
                      <th className="text-right py-2 pl-2 font-medium tabular-nums">Ventende</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPaidEarnedRows.map((row) => (
                      <tr key={row.monthKey} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                        <td className="py-2 pr-2 whitespace-nowrap">{row.monthHeading}</td>
                        <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.earnedInGoalBasis)}</td>
                        <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.paid)}</td>
                        <td className="text-right py-2 pl-2 tabular-nums">{formatNOK(row.pendingInMonth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
              <div
                className="rounded-2xl p-4 sm:p-5 min-w-0 smartspare-recharts-no-focus"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                  Bruttoinntekt per måned
                </h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Fordelt på kilder (stablet).
                </p>
                {barRows.length === 0 || plan.sources.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Legg til minst én kilde for å se diagrammet.
                  </p>
                ) : (
                  <div className="h-[220px] sm:h-[260px] lg:h-[280px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barRows} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
                        <YAxis
                          tickFormatter={(v) => {
                            const n = Number(v)
                            return Number.isFinite(n) && Math.abs(n) >= 1000 ? formatNOKChartLabel(n) : String(v)
                          }}
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                          width={44}
                        />
                        <Tooltip
                          formatter={(value) => formatNOK(Number(value ?? 0))}
                          contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            color: 'var(--text)',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {plan.sources.map((s, i) => (
                          <Bar
                            key={s.id}
                            dataKey={`src_${s.id}`}
                            name={s.name || `Kilde ${i + 1}`}
                            stackId="income"
                            fill={sourceBarColors[i % sourceBarColors.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/*
                md: to donuter side om side — sm (640px) gjorde to veldig smale felt på mange telefoner i landskap.
              */}
              <div className="grid grid-cols-1 gap-4 min-w-0 md:grid-cols-2">
                <div
                  className="flex min-h-0 min-w-0 w-full flex-col items-stretch touch-manipulation rounded-2xl p-4 sm:p-5 smartspare-recharts-no-focus"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <h3 className="shrink-0 font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                    Tjent mot mål
                  </h3>
                  <p
                    className="mb-2 min-h-[3.75rem] shrink-0 break-words text-xs leading-snug sm:min-h-[2.75rem]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Tjent hittil i valgt periode, i planens målgrunnlag (før/etter skatt som for målet).
                  </p>
                  {derived.targetAmount <= 0 ? (
                    <p className="text-sm self-start" style={{ color: 'var(--text-muted)' }}>
                      Sett et målbeløp over null for å se diagrammet.
                    </p>
                  ) : (
                    <SmartSpareGoalDonutBlock pieData={pieEarnedTowardGoal} centerPercent={earnedProgressPercent} />
                  )}
                </div>

                <div
                  className="flex min-h-0 min-w-0 w-full flex-col items-stretch touch-manipulation rounded-2xl p-4 sm:p-5 smartspare-recharts-no-focus"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <h3 className="shrink-0 font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>
                    Innbetalt mot mål
                  </h3>
                  <p
                    className="mb-2 min-h-[3.75rem] shrink-0 break-words text-xs leading-snug sm:min-h-[2.75rem]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Kun faktisk innbetalt mot målbeløp (valgt periode).
                  </p>
                  {derived.targetAmount <= 0 ? (
                    <p className="text-sm self-start" style={{ color: 'var(--text-muted)' }}>
                      Sett et målbeløp over null for å se diagrammet.
                    </p>
                  ) : (
                    <SmartSpareGoalDonutBlock pieData={pieProgress} centerPercent={derived.progressPercent} />
                  )}
                </div>
              </div>
            </div>

            <StatCard
              label="Dager til sluttdato"
              value={String(derived.daysLeft)}
              sub="Fra referansedato (filter) til siste dag i planen."
              icon={Calendar}
              color={chartPalette.primaryLight}
            />

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-3 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                    Brutto per måned
                  </h2>
                  <p className="text-xs mt-1 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                    Trykk på <strong style={{ color: 'var(--text)' }}>kildenavnet</strong> i den blå ruten for innbetalt,
                    brutto/netto og valgfri skatt — velg måned i vinduet (navn kan også endres der). Månedlig innbetalt
                    mot mål (felles for planen) tastes rad for rad nederst i tabellen sammen med opptjent og rom til mer.
                    Bruk blyanten for å endre navn i tabellen. Brutto per måned tastes i kilderadene over.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    persistPlan({
                      ...plan,
                      sources: [...plan.sources, { id: generateId(), name: `Kilde ${plan.sources.length + 1}`, amountsByMonthKey: {} }],
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50"
                  style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                >
                  <Plus size={18} />
                  Legg til kilde
                </button>
              </div>

              {monthKeys.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Velg gyldig start- og sluttdato.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-1 min-w-0 touch-manipulation overscroll-x-contain [scrollbar-gutter:stable]">
                  <table className="w-full text-[10px] sm:text-xs border-collapse min-w-[42rem]">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th
                          className="text-left py-2 pr-2 font-medium sticky left-0 z-10 min-w-[8.5rem] sm:min-w-[9.5rem] w-[8.5rem] sm:w-[9.5rem] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
                          style={{ background: 'var(--surface)' }}
                        >
                          Kilde
                        </th>
                        {monthKeys.map((mk) => (
                          <th
                            key={mk}
                            className="text-right py-2 px-1 font-medium whitespace-nowrap"
                            title={monthKeyHeadingNb(mk)}
                          >
                            <span className="inline-block leading-tight">{monthKeyHeadingNb(mk)}</span>
                          </th>
                        ))}
                        <th className="text-right py-2 pl-2 font-medium w-10" aria-label="Slett" />
                      </tr>
                    </thead>
                    <tbody>
                      {plan.sources.map((src, si) => (
                        <tr key={src.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                          <td
                            className="py-1 pr-1.5 sticky left-0 z-10 align-middle min-w-0 w-[8.5rem] sm:w-[9.5rem] max-w-[9.5rem] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
                            style={{ background: 'var(--surface)' }}
                          >
                            {(() => {
                              const displayName = src.name.trim() || `Kilde ${si + 1}`
                              const openSourceModal = () => {
                                setRenamingSourceId(null)
                                setCellModal({
                                  sourceId: src.id,
                                  monthKey: primaryInnbetaltMonthKey || monthKeys[0]!,
                                })
                              }
                              const isRenaming = renamingSourceId === src.id
                              return (
                                <div
                                  className="flex items-stretch gap-0 min-w-0 rounded-lg border px-0.5 touch-manipulation"
                                  style={{
                                    borderColor: 'var(--primary)',
                                    background: 'var(--primary-pale)',
                                  }}
                                >
                                  {isRenaming && !readOnly ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={src.name}
                                      onChange={(e) =>
                                        persistPlan({
                                          ...plan,
                                          sources: plan.sources.map((s) =>
                                            s.id === src.id ? { ...s, name: e.target.value } : s,
                                          ),
                                        })
                                      }
                                      onBlur={() => setRenamingSourceId(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          e.currentTarget.blur()
                                          setRenamingSourceId(null)
                                        }
                                      }}
                                      placeholder={`Kilde ${si + 1}`}
                                      className="flex-1 min-w-0 border-0 bg-transparent font-semibold outline-none focus:ring-0 py-2 px-1 text-[10px] sm:text-sm"
                                      style={{ color: 'var(--text)' }}
                                      aria-label={`Rediger kildenavn ${si + 1}`}
                                    />
                                  ) : readOnly ? (
                                    <span
                                      className="flex-1 min-w-0 font-semibold truncate py-2 px-1 text-[10px] sm:text-sm"
                                      style={{ color: 'var(--text)' }}
                                    >
                                      {displayName}
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={openSourceModal}
                                        className="flex flex-1 min-w-0 items-center text-left font-semibold py-2 px-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation text-[10px] sm:text-sm"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        <span className="break-words line-clamp-2 sm:line-clamp-1 leading-snug">{displayName}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setRenamingSourceId(src.id)
                                        }}
                                        className="inline-flex shrink-0 items-center justify-center py-2 px-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
                                        style={{ color: 'var(--primary)' }}
                                        aria-label={`Endre navn: ${displayName}`}
                                      >
                                        <Pencil size={18} aria-hidden />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          {monthKeys.map((mk) => {
                            const v = src.amountsByMonthKey[mk] ?? 0
                            return (
                              <td key={mk} className="py-1 px-0.5 align-middle">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  disabled={readOnly}
                                  value={v ? formatThousands(String(v)) : ''}
                                  onChange={(e) => {
                                    const n = parseThousands(e.target.value)
                                    persistPlan({
                                      ...plan,
                                      sources: plan.sources.map((s) =>
                                        s.id === src.id
                                          ? { ...s, amountsByMonthKey: { ...s.amountsByMonthKey, [mk]: n } }
                                          : s,
                                      ),
                                    })
                                  }}
                                  className="w-full min-h-[44px] min-w-[4.25rem] sm:min-w-[4.5rem] px-1 py-2 rounded-lg text-right tabular-nums text-[10px] sm:text-sm touch-manipulation"
                                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                  aria-label={`Beløp ${src.name} ${monthKeyHeadingNb(mk)}`}
                                />
                              </td>
                            )
                          })}
                          <td className="py-1 pl-1 align-middle text-right">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                persistPlan({
                                  ...plan,
                                  sources: plan.sources.filter((s) => s.id !== src.id),
                                })
                              }
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg touch-manipulation disabled:opacity-40"
                              style={{ color: 'var(--danger)' }}
                              aria-label={`Slett kilde ${src.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr
                        className="align-middle"
                        style={{ borderTop: '2px solid var(--border)', color: 'var(--text)' }}
                      >
                        <td
                          className="py-1.5 pr-2 sticky left-0 z-10 min-w-0 w-[8.5rem] sm:w-[9.5rem] max-w-[9.5rem] align-top shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
                          style={{ background: 'var(--surface)' }}
                        >
                          <div className="font-semibold leading-tight pr-1 min-w-0 break-words" style={{ color: 'var(--text)' }}>
                            Innbetalt mot mål
                            <p className="text-[10px] sm:text-[11px] font-normal mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                              Felles per måned, samme som i kildemodal
                            </p>
                          </div>
                        </td>
                        {monthKeys.map((mk) => {
                          const v = plan.paidByMonthKey?.[mk] ?? 0
                          /** Normaliser like reconcile (bl.a. beløp lagret som streng etter persist). */
                          const normalizedLinesForMonth = incomeSprintNormalizedPaidLinesForMonth(plan, mk)
                          const lineCount = normalizedLinesForMonth.length
                          /** Tom måned (0 kr, ingen gyldige linjer) → tallfelt. Ellers trykk åpner modal; fet skrift når minst to rader i månedens logg (f.eks. opprulling «Tidligere ført samlet» + ny post). */
                          const openInnbetaltDetail = lineCount >= 1 || v > 0
                          const boldTabellSum = lineCount >= 2
                          return (
                            <td key={mk} className="py-1 px-0.5 align-middle">
                              {openInnbetaltDetail ? (
                                <button
                                  type="button"
                                  disabled={readOnly}
                                  onClick={() => setInnbetaltDetailMonthKey(mk)}
                                  className={`w-full min-h-[44px] min-w-[4.25rem] sm:min-w-[4.5rem] flex items-center justify-end px-1 py-2 rounded-lg tabular-nums text-[10px] sm:text-sm touch-manipulation outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${boldTabellSum ? 'font-bold' : 'font-normal'}`}
                                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                  aria-label={`Innbetalt mot mål ${monthKeyHeadingNb(mk)}, innbetalingsposter – åpne redigering`}
                                >
                                  {v ? formatThousands(String(v)) : ''}
                                </button>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  disabled={readOnly}
                                  value={v ? formatThousands(String(v)) : ''}
                                  onChange={(e) => {
                                    if (readOnly) return
                                    persistPaidForMonth(mk, e.target.value)
                                  }}
                                  className="w-full min-h-[44px] min-w-[4.25rem] sm:min-w-[4.5rem] px-1 py-2 rounded-lg text-right tabular-nums text-[10px] sm:text-sm touch-manipulation"
                                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                  aria-label={`Innbetalt mot mål ${monthKeyHeadingNb(mk)}`}
                                />
                              )}
                            </td>
                          )
                        })}
                        <td className="py-1.5 pl-1 w-10" aria-hidden />
                      </tr>
                      <tr style={{ color: 'var(--text)' }}>
                        <td
                          className="py-1.5 pr-2 text-left sticky left-0 z-10 align-middle min-w-0 w-[8.5rem] sm:w-[9.5rem] max-w-[9.5rem] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
                          style={{ background: 'var(--surface)' }}
                        >
                          <span className="text-[10px] sm:text-xs font-medium leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                            Opptjent i målgrunnlag
                          </span>
                        </td>
                        {monthKeys.map((mk, mi) => (
                          <td
                            key={mk}
                            className="py-1.5 px-0.5 text-right tabular-nums text-[10px] sm:text-xs leading-tight align-middle"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatNOK(innbetaltHjelpetallPerMåned.opptjent[mi] ?? 0)}
                          </td>
                        ))}
                        <td className="w-10" aria-hidden />
                      </tr>
                      <tr style={{ color: 'var(--text)' }}>
                        <td
                          className="py-1.5 pr-2 text-left pb-2 sticky left-0 z-10 align-middle min-w-0 w-[8.5rem] sm:w-[9.5rem] max-w-[9.5rem] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]"
                          style={{ background: 'var(--surface)' }}
                        >
                          <span className="text-[10px] sm:text-xs font-medium leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                            Rom til mer innbetalt
                          </span>
                        </td>
                        {monthKeys.map((mk, mi) => (
                          <td
                            key={mk}
                            className="py-1.5 px-0.5 pb-2 text-right tabular-nums text-[10px] sm:text-xs leading-tight align-middle"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatNOK(innbetaltHjelpetallPerMåned.romTilMer[mi] ?? 0)}
                          </td>
                        ))}
                        <td className="w-10 pb-2" aria-hidden />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 overflow-x-auto min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Oppsummering (hele perioden)
              </h2>
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[20rem]">
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-2 pr-2 font-medium">Kilde</th>
                    <th className="text-right py-2 px-2 font-medium tabular-nums">Brutto</th>
                    {plan.applyTax && <th className="text-right py-2 px-2 font-medium tabular-nums">Skatt</th>}
                    <th className="text-right py-2 pl-2 font-medium tabular-nums">Netto</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.sourceTotals.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                      <td className="py-2 pr-2">{row.name || '—'}</td>
                      <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.grossFullPeriod)}</td>
                      {plan.applyTax && (
                        <td className="text-right py-2 px-2 tabular-nums">{formatNOK(row.taxFullPeriod)}</td>
                      )}
                      <td className="text-right py-2 pl-2 tabular-nums">{formatNOK(row.netFullPeriod)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold" style={{ borderTop: '2px solid var(--border)', color: 'var(--text)' }}>
                    <td className="py-2 pr-2">Totalt</td>
                    <td className="text-right py-2 px-2 tabular-nums">{formatNOK(derived.grandGrossFull)}</td>
                    {plan.applyTax && (
                      <td className="text-right py-2 px-2 tabular-nums">{formatNOK(derived.grandTaxFull)}</td>
                    )}
                    <td className="text-right py-2 pl-2 tabular-nums">{formatNOK(derived.grandNetFull)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                  type="button"
                  id={`smartspare-settings-trigger-${planId}`}
                  aria-expanded={settingsExpanded}
                  aria-controls={`smartspare-settings-panel-${planId}`}
                  onClick={() => setSettingsExpanded((o) => !o)}
                  className="flex min-h-[44px] w-full sm:w-auto sm:flex-1 sm:min-w-0 items-center justify-between gap-2 rounded-xl py-1.5 px-1 -mx-1 text-left touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] sm:justify-start"
                  style={{ color: 'var(--text)' }}
                >
                  <span className="font-semibold min-w-0" style={{ color: 'var(--text)' }}>
                    Innstillinger
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${settingsExpanded ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (typeof window !== 'undefined' && !window.confirm('Slette denne planen? Dette kan ikke angres.'))
                      return
                    removeIncomeSprintPlan(plan.id)
                    router.push('/sparing/smartspare')
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50 self-start sm:self-auto"
                  style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
                >
                  Slett plan
                </button>
              </div>

              {settingsExpanded ? (
                <div
                  id={`smartspare-settings-panel-${planId}`}
                  role="region"
                  aria-labelledby={`smartspare-settings-trigger-${planId}`}
                  className="space-y-4 min-w-0"
                >
              <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                Navn på plan (valgfritt)
                <input
                  type="text"
                  disabled={readOnly}
                  value={plan.name ?? ''}
                  onChange={(e) => persistPlan({ ...plan, name: e.target.value })}
                  placeholder={formatIncomeSprintPlanPeriodNb(plan)}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Startdato
                  <input
                    type="date"
                    disabled={readOnly}
                    value={plan.startDate}
                    onChange={(e) => persistPlan({ ...plan, startDate: e.target.value })}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Sluttdato
                  <input
                    type="date"
                    disabled={readOnly}
                    value={plan.endDate}
                    onChange={(e) => persistPlan({ ...plan, endDate: e.target.value })}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
              </div>

              <fieldset className="space-y-2 border-0 p-0 m-0">
                <legend className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Målgrunnlag
                </legend>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name={`smartspare-detail-goal-${planId}`}
                      disabled={readOnly}
                      checked={plan.goalBasis === 'afterTax'}
                      onChange={() => persistPlan({ ...plan, goalBasis: 'afterTax' })}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Mål etter skatt
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer">
                    <input
                      type="radio"
                      name={`smartspare-detail-goal-${planId}`}
                      disabled={readOnly}
                      checked={plan.goalBasis === 'beforeTax'}
                      onChange={() => persistPlan({ ...plan, goalBasis: 'beforeTax' })}
                      className="shrink-0"
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Mål før skatt
                    </span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Målbeløp (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={readOnly}
                    value={formatThousands(String(plan.targetAmount || ''))}
                    onChange={(e) =>
                      persistPlan({ ...plan, targetAmount: parseThousands(e.target.value) })
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  Ekstra innbetalt, engangs (kr)
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={readOnly}
                    value={formatThousands(String(plan.paidTowardGoal || ''))}
                    onChange={(e) =>
                      persistPlan({ ...plan, paidTowardGoal: parseThousands(e.target.value) })
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                  <span className="text-xs leading-snug break-words">
                    Utenom månedlige tilføringer via kildenavnet i tabellen (åpner vindu). Samme målgrunnlag som målet.
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
                <label className="inline-flex items-center gap-3 min-h-[44px] touch-manipulation cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={plan.applyTax}
                    onChange={(e) => persistPlan({ ...plan, applyTax: e.target.checked })}
                    className="shrink-0 w-5 h-5"
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Trekk skatt av inntekten i tabellen
                  </span>
                </label>
                {plan.applyTax && (
                  <label className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-2 min-w-0">
                    <span style={{ color: 'var(--text-muted)' }}>Skatteprosent (0–100)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={readOnly}
                      value={planTaxPercentStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 3)
                        setPlanTaxPercentStr(raw)
                        persistPlan({ ...plan, taxPercent: parseTaxPercentFieldInput(raw) })
                      }}
                      onBlur={() => {
                        const c = parseTaxPercentFieldInput(planTaxPercentStr)
                        setPlanTaxPercentStr(c === 0 ? '' : String(c))
                        persistPlan({ ...plan, taxPercent: c })
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl w-full sm:w-24 text-base sm:text-sm tabular-nums"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </label>
                )}
              </div>
                </div>
              ) : null}
            </div>

            {cellModal && plan && cellModalSource && cellModalBreakdown && (
              <div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center touch-manipulation"
                style={{ padding: safePad }}
                role="presentation"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Lukk"
                  {...cellModalBackdropDismiss}
                />
                <div
                  className="relative flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden touch-manipulation"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="smartspare-cell-modal-title"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginTop: 'max(0.5rem, env(safe-area-inset-top))',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 shrink-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <h2
                        id="smartspare-cell-modal-title"
                        className="text-lg font-semibold pr-1 min-w-0 break-words"
                        style={{ color: 'var(--text)' }}
                      >
                        Kilde og innbetalt
                      </h2>
                      <div className="relative flex shrink-0 items-center" ref={cellModalHelpRef}>
                        <button
                          type="button"
                          onClick={() => setCellModalHelpOpen((o) => !o)}
                          aria-expanded={cellModalHelpOpen}
                          aria-label="Mer om kilde og innbetalt"
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <CircleHelp size={20} strokeWidth={2} aria-hidden />
                        </button>
                        {cellModalHelpOpen && (
                          <div
                            className="absolute left-0 top-full z-[110] mt-1.5 w-[min(calc(100vw-2rem),20rem)] max-w-[calc(100vw-2rem)] rounded-xl p-3 shadow-lg"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                            }}
                            role="region"
                          >
                            <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                              <li>
                                <strong style={{ color: 'var(--text)' }}>Kildenavn</strong> grupperer brutto-rader; du kan
                                endre det her eller med blyanten i tabellen.
                              </li>
                              <li>
                                <strong style={{ color: 'var(--text)' }}>Månedlig innbetalt</strong> er{' '}
                                <strong style={{ color: 'var(--text)' }}>felles for hele planen</strong> — ikke per kilde.
                              </li>
                              <li>
                                <strong style={{ color: 'var(--text)' }}>Tilfør</strong> og «Legg til post» legger en ny
                                post i loggen for valgt måned (tidspunktet settes når du trykker). Forslag følger
                                brutto/netto og målgrunnlag; maks er opptjent minus allerede innbetalt.
                              </li>
                              <li>
                                Valgfri <strong style={{ color: 'var(--text)' }}>skatt per kilde</strong> overstyrer
                                planens sats når skatt er på.
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCellModal(null)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl shrink-0 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Lukk"
                    >
                      <X size={22} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 space-y-4 flex-1 min-h-0">
                    <label className="flex flex-col gap-1.5 text-sm min-w-0 font-medium" style={{ color: 'var(--text)' }}>
                      Navn på kilde
                      <input
                        type="text"
                        disabled={readOnly}
                        value={cellModalSource.name}
                        onChange={(e) =>
                          persistPlan({
                            ...plan,
                            sources: plan.sources.map((s) =>
                              s.id === cellModalSource.id ? { ...s, name: e.target.value } : s,
                            ),
                          })
                        }
                        placeholder="Kildenavn"
                        className="min-h-[48px] w-full px-3 py-2.5 rounded-xl text-base sm:text-sm touch-manipulation"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm min-w-0 font-medium" style={{ color: 'var(--text)' }}>
                      Måned
                      <select
                        value={cellModal.monthKey}
                        onChange={(e) => setCellModal({ ...cellModal, monthKey: e.target.value })}
                        className="min-h-[48px] w-full px-3 py-2.5 rounded-xl text-base sm:text-sm touch-manipulation"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        {monthKeys.map((mk) => (
                          <option key={mk} value={mk}>
                            {monthKeyHeadingNb(mk)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-sm min-w-0 leading-snug break-words" style={{ color: 'var(--text-muted)' }}>
                      Brutto er det du har lagt inn i cellen for valgt måned. Netto følger skattesats (plan eller egen for
                      kilden).
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Brutto</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {formatNOK(cellModalBreakdown.gross)}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Skatt</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {plan.applyTax ? formatNOK(cellModalBreakdown.tax) : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: 'var(--text-muted)' }}>Netto</dt>
                        <dd className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                          {plan.applyTax ? formatNOK(cellModalBreakdown.net) : formatNOK(cellModalBreakdown.gross)}
                        </dd>
                      </div>
                    </dl>

                    {plan.applyTax && (
                      <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                        Skatteprosent for denne kilden (tom = planens {plan.taxPercent} %)
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={readOnly}
                          value={
                            cellModalSource.taxPercent !== undefined && cellModalSource.taxPercent !== null
                              ? String(cellModalSource.taxPercent)
                              : ''
                          }
                          placeholder={String(plan.taxPercent)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 3)
                            persistPlan({
                              ...plan,
                              sources: plan.sources.map((s) => {
                                if (s.id !== cellModalSource.id) return s
                                if (raw.trim() === '') return { ...s, taxPercent: undefined }
                                return { ...s, taxPercent: parseTaxPercentFieldInput(raw) }
                              }),
                            })
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            persistPlan({
                              ...plan,
                              sources: plan.sources.map((s) => {
                                if (s.id !== cellModalSource.id) return s
                                if (raw === '') return { ...s, taxPercent: undefined }
                                return { ...s, taxPercent: parseTaxPercentFieldInput(raw) }
                              }),
                            })
                          }}
                          className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full sm:w-28 tabular-nums"
                          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                      </label>
                    )}

                    <InnbetaltMotMalMonthEditor
                      plan={plan}
                      monthKey={cellModal.monthKey}
                      readOnly={readOnly}
                      persistPlan={persistPlan}
                      persistPaidForMonth={persistPaidForMonth}
                      compactHint
                    />

                    <label className="flex flex-col gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                      Legg til ekstra innbetalt for valgt måned (kr) — tom bruker forslag under. Maks tilgjengelig er
                      gjenværende opptjent for måneden (samme som «ventende» i oversiktstabellen).
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={readOnly}
                        value={modalAddCustomStr}
                        onChange={(e) => setModalAddCustomStr(formatThousands(e.target.value))}
                        placeholder={formatThousands(String(suggestedTransferAmount))}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-base sm:text-sm w-full min-w-0 tabular-nums"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </label>
                    {tilforCap > 0 &&
                      Number.isFinite(tilforDesiredAmount) &&
                      tilforDesiredAmount > tilforCap && (
                        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                          Tilføres maks {formatNOK(tilforCap)} for {monthKeyHeadingNb(cellModal.monthKey)} (ikke mer enn
                          opptjent minus allerede innbetalt).
                        </p>
                      )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setCellModal(null)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
                        style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        Lukk
                      </button>
                      <button
                        type="button"
                        disabled={readOnly || tilforCap <= 0 || tilforEffectiveAmount <= 0}
                        onClick={() => {
                          const add = tilforEffectiveAmount
                          if (add <= 0) return
                          const mk = cellModal.monthKey
                          persistPlan(appendIncomeSprintPaidLine(plan, mk, add))
                          setModalAddCustomStr('')
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium touch-manipulation disabled:opacity-50"
                        style={{ background: 'var(--primary)', color: '#fff' }}
                      >
                        Tilfør {formatNOK(tilforEffectiveAmount)} til innbetalt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {plan && innbetaltDetailMonthKey ? (
              <div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center touch-manipulation"
                style={{ padding: safePad }}
                role="presentation"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/40"
                  aria-label="Lukk"
                  {...innbetaltDetailBackdropDismiss}
                />
                <div
                  className="relative flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden touch-manipulation"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="smartspare-innbetalt-detail-title"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    marginTop: 'max(0.5rem, env(safe-area-inset-top))',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 shrink-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <h2
                      id="smartspare-innbetalt-detail-title"
                      className="text-lg font-semibold min-w-0 pr-1 break-words"
                      style={{ color: 'var(--text)' }}
                    >
                      Innbetalt mot mål · {monthKeyHeadingNb(innbetaltDetailMonthKey)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setInnbetaltDetailMonthKey(null)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl shrink-0 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Lukk"
                    >
                      <X size={22} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 flex-1 min-h-0">
                    <InnbetaltMotMalMonthEditor
                      plan={plan}
                      monthKey={innbetaltDetailMonthKey}
                      readOnly={readOnly}
                      persistPlan={persistPlan}
                      persistPaidForMonth={persistPaidForMonth}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
