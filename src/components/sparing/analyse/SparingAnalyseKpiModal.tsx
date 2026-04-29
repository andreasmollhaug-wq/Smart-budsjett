'use client'

import { useEffect, useMemo } from 'react'
import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { getEffectiveCurrentAmount, isSavingsGoalCompleted } from '@/lib/savingsDerived'
import type { AnalyseMonthlyActivityPoint, HouseholdAnalysePaceRow } from '@/lib/sparingAnalyseDerived'
import { calcProgress } from '@/lib/utils'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { X } from 'lucide-react'

export type SparingAnalyseKpiKind =
  | 'totalSaved'
  | 'progress'
  | 'remaining'
  | 'counts'
  | 'activity'
  | 'requiredPace'

export type SparingAnalyseKpiBundle = {
  totalSaved: number
  totalTarget: number
  progressPct: number
  activeCount: number
  completedCount: number
  remainingTotalNok: number
}

type Props = {
  open: boolean
  onClose: () => void
  kind: SparingAnalyseKpiKind | null
  periodLabel: string
  kpi: SparingAnalyseKpiBundle
  monthlySeries: AnalyseMonthlyActivityPoint[]
  filteredGoals: SavingsGoal[]
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  activeProfileId: string
  activitySumPeriod: number
  chartPrimary: string
  aggregateMonthlyNok: number
  aggregateWeeklyNok: number
  householdPaceRows: HouseholdAnalysePaceRow[]
}

const TITLE_IDS: Record<SparingAnalyseKpiKind, string> = {
  totalSaved: 'sparing-analyse-kpi-total',
  progress: 'sparing-analyse-kpi-progress',
  remaining: 'sparing-analyse-kpi-remaining',
  counts: 'sparing-analyse-kpi-counts',
  activity: 'sparing-analyse-kpi-activity',
  requiredPace: 'sparing-analyse-kpi-required-pace',
}

const LABELS: Record<SparingAnalyseKpiKind, string> = {
  totalSaved: 'Totalt spart (effektiv)',
  progress: 'Samlet fremgang',
  remaining: 'Gjenstår til mål',
  counts: 'Aktive mål',
  activity: 'Aktivitet i perioden',
  requiredPace: 'Månedlig sparekrav (plan)',
}

export default function SparingAnalyseKpiModal({
  open,
  onClose,
  kind,
  periodLabel,
  kpi,
  monthlySeries,
  filteredGoals,
  transactions,
  budgetCategories,
  activeProfileId,
  activitySumPeriod,
  chartPrimary,
  aggregateMonthlyNok,
  aggregateWeeklyNok,
  householdPaceRows,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const sortedByEffective = useMemo(() => {
    return [...filteredGoals].sort((a, b) => {
      const ea = getEffectiveCurrentAmount(a, transactions, budgetCategories, activeProfileId)
      const eb = getEffectiveCurrentAmount(b, transactions, budgetCategories, activeProfileId)
      return eb - ea
    })
  }, [filteredGoals, transactions, budgetCategories, activeProfileId])

  const activeGoals = useMemo(
    () =>
      filteredGoals.filter(
        (g) =>
          !isSavingsGoalCompleted(
            getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId),
            g.targetAmount,
          ),
      ),
    [filteredGoals, transactions, budgetCategories, activeProfileId],
  )

  const completedGoals = useMemo(
    () =>
      filteredGoals.filter((g) =>
        isSavingsGoalCompleted(
          getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId),
          g.targetAmount,
        ),
      ),
    [filteredGoals, transactions, budgetCategories, activeProfileId],
  )

  const paceOkGoalCount = useMemo(
    () => householdPaceRows.filter((r) => r.pace.status === 'ok').length,
    [householdPaceRows],
  )

  if (!open || kind === null) return null

  const titleId = TITLE_IDS[kind]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/40 touch-manipulation" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-xl min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5 min-w-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id={titleId} className="text-lg font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {LABELS[kind]}
            </h2>
            <p className="text-xs leading-snug sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Effektiv sparing og aktivitet · {periodLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            aria-label="Lukk"
          >
            <X size={22} style={{ color: 'var(--text-muted)' }} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 min-w-0">
          {kind === 'totalSaved' ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Tallet er summen av <strong style={{ color: 'var(--text)' }}>effektiv sparing</strong> på alle mål i
                utvalget — samme logikk som på sparemål-kortene (koblet budsjett og manuelle innskudd).
              </p>
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <div className="flex justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Spart mot målsum</span>
                  <span className="tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                    {formatNOK(kpi.totalSaved)} / {formatNOK(kpi.totalTarget)}
                  </span>
                </div>
                <div className="h-3 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, kpi.progressPct))}%`,
                      background: chartPrimary,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  <span>Samlet fremgang</span>
                  <span>{kpi.progressPct} %</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Per mål (topp {Math.min(5, sortedByEffective.length)})
                </h3>
                <ul className="space-y-3">
                  {sortedByEffective.slice(0, 5).map((g) => {
                    const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId)
                    const pct = calcProgress(eff, g.targetAmount)
                    return (
                      <li key={g.id} className="space-y-1.5">
                        <div className="flex justify-between gap-2 text-sm min-w-0">
                          <span className="font-medium truncate min-w-0" style={{ color: 'var(--text)' }}>
                            {g.name}
                          </span>
                          <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {formatNOK(eff)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: g.color }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {sortedByEffective.length > 5 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    … og {sortedByEffective.length - 5} flere mål i utvalget.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {kind === 'progress' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Samlet fremgang</strong> er ikke gjennomsnitt per mål, men én
                brøk: summen av effektiv sparing på tvers av mål, dividert med summen av alle målbeløp i utvalget (samme
                nevner som KPI-kortet).
              </p>
              <div
                className="rounded-xl border p-4 space-y-2 text-sm tabular-nums"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <div className="flex justify-between gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Totalt spart</span>
                  <span style={{ color: 'var(--text)' }}>{formatNOK(kpi.totalSaved)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Sum målbeløp</span>
                  <span style={{ color: 'var(--text)' }}>{formatNOK(kpi.totalTarget)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between gap-2 font-semibold" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text)' }}>Andel</span>
                  <span style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{kpi.progressPct} %</span>
                </div>
              </div>
            </div>
          ) : null}

          {kind === 'remaining' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                For hvert mål trekkes effektiv sparing fra målbeløpet (aldri under null per mål). Tallene under summeres
                til <strong style={{ color: 'var(--text)' }}>{formatNOK(kpi.remainingTotalNok)}</strong>.
              </p>
              <div className="space-y-4">
                {sortedByEffective.map((g) => {
                  const eff = getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId)
                  const left = Math.max(0, g.targetAmount - eff)
                  const pctToward = calcProgress(eff, g.targetAmount)
                  return (
                    <div key={g.id} className="space-y-2">
                      <div className="flex justify-between gap-2 text-sm min-w-0">
                        <span className="font-medium truncate min-w-0" style={{ color: 'var(--text)' }}>
                          {g.name}
                        </span>
                        <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(left)} gjenstår
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctToward}%`, background: g.color }}
                        />
                      </div>
                      <div className="flex justify-between text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        <span>{formatNOK(eff)} spart</span>
                        <span>{formatNOK(g.targetAmount)} mål</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {kind === 'counts' ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Tallene gjelder målene som er med i analysen (samme filter som «Inkluder fullførte mål» på siden).
                Fullførte telles bare når du har slått på visning av fullførte mål.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                    Aktive ({kpi.activeCount})
                  </p>
                  <ul className="text-sm space-y-1.5 max-h-48 overflow-y-auto min-w-0">
                    {activeGoals.length === 0 ? (
                      <li style={{ color: 'var(--text-muted)' }}>Ingen</li>
                    ) : (
                      activeGoals.map((g) => (
                        <li key={g.id} className="truncate min-w-0" style={{ color: 'var(--text)' }} title={g.name}>
                          {g.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border p-4 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                    Fullførte ({kpi.completedCount})
                  </p>
                  <ul className="text-sm space-y-1.5 max-h-48 overflow-y-auto min-w-0">
                    {completedGoals.length === 0 ? (
                      <li style={{ color: 'var(--text-muted)' }}>Ingen</li>
                    ) : (
                      completedGoals.map((g) => (
                        <li key={g.id} className="truncate min-w-0" style={{ color: 'var(--text)' }} title={g.name}>
                          {g.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {kind === 'activity' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen er registrerte <strong style={{ color: 'var(--text)' }}>utgifter</strong> til koblede
                sparekategorier og <strong style={{ color: 'var(--text)' }}>manuelle innskudd</strong> på mål uten
                kategori — bare poster datert innenfor valgt periode (ingen komplett banksaldo-historikk).
              </p>
              <div className="overflow-x-auto rounded-xl border min-w-0" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm min-w-[240px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th scope="col" className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text)' }}>
                        Måned
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Beløp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySeries.map((row) => (
                      <tr key={row.monthIndex} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-2" style={{ color: 'var(--text)' }}>
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {formatNOK(row.nok)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="rounded-xl border p-4 flex flex-wrap items-center justify-between gap-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Sum i perioden
                </span>
                <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--success)' }}>
                  {formatNOK(activitySumPeriod)}
                </span>
              </div>
            </div>
          ) : null}

          {kind === 'requiredPace' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Tallet er summen av <strong style={{ color: 'var(--text)' }}>lineært sparetempo</strong> per mål mot
                måldato (gjenværende beløp fordelt på kalenderdager) — samme logikk som på sparemål-kortene og i
                sparemål-modal. Det er ikke en prognose fra tidligere sparing.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Har du flere aktive mål samtidig, <strong style={{ color: 'var(--text)' }}>summeres kravene</strong>{' '}
                parallelt (total månedlig og ukentlig belastning om alle planene følges).
              </p>
              {paceOkGoalCount === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ingen mål i utvalget har både måldato i fremtiden og gjenværende beløp — sett måldato eller juster
                  målene dine for å se sparekrav her.
                </p>
              ) : (
                <>
                  <div
                    className="rounded-xl border p-4 space-y-3 text-sm tabular-nums"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex justify-between gap-2">
                      <span style={{ color: 'var(--text-muted)' }}>Mål med aktiv plan</span>
                      <span style={{ color: 'var(--text)' }}>{paceOkGoalCount}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span style={{ color: 'var(--text-muted)' }}>Samlet krav per uke</span>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {formatNOK(aggregateWeeklyNok)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 border-t pt-3 font-semibold" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text)' }}>Samlet krav per måned</span>
                      <span style={{ color: chartPrimary }}>{formatNOK(aggregateMonthlyNok)}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    Detaljert oversikt per mål og per medlem finner du under «Sparetempo mot måldato» på denne siden.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t p-4 sm:p-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-semibold touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
