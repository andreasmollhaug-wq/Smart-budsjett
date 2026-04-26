'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { BudgetCategory, PersonProfile, Transaction } from '@/lib/store'
import { actualsPerMonthForCategoryAllProfiles } from '@/lib/budgetActualsToBudgeted'
import { MONTH_LABELS_SHORT_NB } from '@/lib/bankReportData'
import type { PeriodMode } from '@/lib/budgetPeriod'
import { transactionsListeHrefForCategory } from '@/lib/budgetDashboardLinks'
import { transactionInMonthRange } from '@/lib/dashboardOverviewHelpers'
import { formatNokCurrencyDisplay } from '@/lib/money/nokDisplayFormat'
import { useStore } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  categoryName: string
  yearTotal: number
  budgetYear: number
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  profiles: PersonProfile[]
  isHouseholdAggregate: boolean
  /** Når satt: toppbeløpet beskrives som valgt periode på oversikten. */
  periodHighlightLabel?: string
  /** Når satt: månedstabell og transaksjonsliste avgrenses til [start..end]; «kommende» viser resten av året. */
  focusMonthRange?: { start: number; end: number }
  /** For lenke til transaksjonsliste som matcher dashbordets periode. */
  periodMode?: PeriodMode
  monthIndex?: number
}

function findExpenseCategoryByName(cats: BudgetCategory[], name: string): BudgetCategory | undefined {
  return cats.find((c) => c.type === 'expense' && c.name === name)
}

function signedNOK(n: number): string {
  const show = useStore.getState().showAmountDecimals
  const abs = formatNokCurrencyDisplay(Math.abs(n), show)
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

export default function DashboardCategoryExpenseModal({
  open,
  onClose,
  categoryName,
  yearTotal,
  budgetYear,
  transactions,
  budgetCategories,
  profiles,
  isHouseholdAggregate,
  periodHighlightLabel,
  focusMonthRange,
  periodMode,
  monthIndex = 0,
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

  const budgetRow = useMemo(
    () => findExpenseCategoryByName(budgetCategories, categoryName),
    [budgetCategories, categoryName],
  )

  const actualsMonth = useMemo(
    () => actualsPerMonthForCategoryAllProfiles(transactions ?? [], budgetYear, categoryName, 'expense'),
    [transactions, budgetYear, categoryName],
  )

  const yearPrefix = `${budgetYear}-`

  const txsInPeriod = useMemo(() => {
    const list = (transactions ?? []).filter((t) => {
      if (t.type !== 'expense' || t.category !== categoryName) return false
      const d = t.date
      if (typeof d !== 'string' || !d.startsWith(yearPrefix)) return false
      if (focusMonthRange) {
        return transactionInMonthRange(t, budgetYear, focusMonthRange.start, focusMonthRange.end)
      }
      return true
    })
    return list.sort((a, b) => {
      const da = typeof a.date === 'string' ? a.date : ''
      const db = typeof b.date === 'string' ? b.date : ''
      return db.localeCompare(da)
    })
  }, [transactions, categoryName, yearPrefix, budgetYear, focusMonthRange])

  /** Transaksjoner i samme år, men etter valgt periodes siste måned (når perioden ikke er hele året). */
  const txsKommende = useMemo(() => {
    if (!focusMonthRange || focusMonthRange.end >= 11) return []
    const afterEnd = focusMonthRange.end
    const list = (transactions ?? []).filter((t) => {
      if (t.type !== 'expense' || t.category !== categoryName) return false
      const d = t.date
      if (typeof d !== 'string' || !d.startsWith(yearPrefix)) return false
      const mm = Number.parseInt(d.slice(5, 7), 10) - 1
      if (!Number.isFinite(mm) || mm < 0 || mm > 11) return false
      return mm > afterEnd
    })
    return list.sort((a, b) => {
      const da = typeof a.date === 'string' ? a.date : ''
      const db = typeof b.date === 'string' ? b.date : ''
      return db.localeCompare(da)
    })
  }, [transactions, categoryName, yearPrefix, focusMonthRange])

  /** Bakoverkompatibilitet: uten fokus-intervall = hele året (som tidligere). */
  const txsForCategoryFullYear = useMemo(() => {
    const list = (transactions ?? []).filter((t) => {
      if (t.type !== 'expense' || t.category !== categoryName) return false
      const d = t.date
      return typeof d === 'string' && d.startsWith(yearPrefix)
    })
    return list.sort((a, b) => {
      const da = typeof a.date === 'string' ? a.date : ''
      const db = typeof b.date === 'string' ? b.date : ''
      return db.localeCompare(da)
    })
  }, [transactions, categoryName, yearPrefix])

  const txsForCategory = focusMonthRange ? txsInPeriod : txsForCategoryFullYear

  const monthIndicesForTable = useMemo(() => {
    if (focusMonthRange) {
      const out: number[] = []
      for (let m = focusMonthRange.start; m <= focusMonthRange.end; m++) out.push(m)
      return out
    }
    return MONTH_LABELS_SHORT_NB.map((_, m) => m)
  }, [focusMonthRange])

  /** Budsjettert sum for måneder etter valgt periode (til og med desember). */
  const kommendeBudgetSummary = useMemo(() => {
    if (!focusMonthRange || focusMonthRange.end >= 11) return null
    const start = focusMonthRange.end + 1
    const firstLabel = MONTH_LABELS_SHORT_NB[start] ?? ''
    const lastLabel = MONTH_LABELS_SHORT_NB[11] ?? ''
    const rangeLabel = start >= 11 ? firstLabel : `${firstLabel}–${lastLabel}`
    const bud = budgetRow?.budgeted
    if (!bud) return { sum: 0, rangeLabel, hasBudgetRow: false as const }
    let sum = 0
    for (let m = start; m <= 11; m++) sum += bud[m] ?? 0
    return { sum, rangeLabel, hasBudgetRow: true as const }
  }, [budgetRow, focusMonthRange])

  const profileName = (pid: string | undefined) => {
    if (!isHouseholdAggregate) return null
    const id = pid ?? profiles[0]?.id
    return profiles.find((p) => p.id === id)?.name ?? null
  }

  if (!open) return null

  const hrefListe =
    periodMode !== undefined
      ? transactionsListeHrefForCategory(periodMode, budgetYear, monthIndex, categoryName)
      : `/transaksjoner?year=${budgetYear}&month=all&category=${encodeURIComponent(categoryName)}&vis=liste`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center touch-manipulation"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-cat-modal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90dvh,800px)] w-full max-w-lg min-h-0 flex-col rounded-2xl shadow-2xl md:max-w-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="dashboard-cat-modal-title"
              className="text-[17px] font-semibold tracking-tight truncate"
              style={{ color: 'var(--text)' }}
            >
              {categoryName}
            </h2>
            {periodHighlightLabel ? (
              <>
                <p className="text-[13px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Faktisk utgift · {periodHighlightLabel}:{' '}
                  <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatNOK(yearTotal)}
                  </span>
                </p>
                <p className="text-[12px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {focusMonthRange
                    ? focusMonthRange.end < 11
                      ? `Måned for måned og listen «I valgt periode» gjelder ${periodHighlightLabel}. Seksjonen «Kommende» viser transaksjoner senere i ${budgetYear} (utenfor perioden).`
                      : `Måned for måned og listen «I valgt periode» gjelder ${periodHighlightLabel}.`
                    : `Måned for måned og transaksjonslisten under viser hele ${budgetYear}.`}
                </p>
              </>
            ) : (
              <p className="text-[13px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Faktisk utgift i {budgetYear}:{' '}
                <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNOK(yearTotal)}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 space-y-6 touch-manipulation">
          {!budgetRow && (focusMonthRange ? txsInPeriod.length > 0 : txsForCategoryFullYear.length > 0) && (
            <p className="text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              Ingen budsjettkategori med nøyaktig samme navn — månedlig budsjett vises ikke, men transaksjoner finnes.
            </p>
          )}

          <section>
            <h3
              className={`text-[13px] font-semibold tracking-tight ${focusMonthRange ? 'mb-1' : 'mb-3'}`}
              style={{ color: 'var(--text)' }}
            >
              Måned for måned
            </h3>
            {focusMonthRange ? (
              <p className="text-[12px] mb-3 leading-snug" style={{ color: 'var(--text-muted)' }}>
                Kun måneder i valgt periode (som på oversikten).
              </p>
            ) : null}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div
                className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-3 sm:gap-x-4 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.05em]"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
              >
                <span>Måned</span>
                <span className="text-right tabular-nums">Budsjett</span>
                <span className="text-right tabular-nums">Faktisk</span>
                <span className="text-right tabular-nums">Avvik</span>
              </div>
              <div>
                {monthIndicesForTable.map((m) => {
                  const label = MONTH_LABELS_SHORT_NB[m] ?? String(m + 1)
                  const bud = budgetRow?.budgeted?.[m] ?? 0
                  const act = actualsMonth[m] ?? 0
                  const variance = act - bud
                  const avvikColor =
                    !budgetRow || variance === 0
                      ? 'var(--text-muted)'
                      : variance > 0
                        ? 'var(--danger)'
                        : 'var(--success)'

                  return (
                    <div
                      key={m}
                      className="grid min-h-[44px] grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-3 sm:gap-x-4 px-4 py-2 text-[14px] leading-tight items-center border-b border-[var(--border)] last:border-b-0"
                    >
                      <span style={{ color: 'var(--text)' }}>{label}</span>
                      <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                        {budgetRow ? formatNOK(bud) : '—'}
                      </span>
                      <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                        {formatNOK(act)}
                      </span>
                      <span className="text-right tabular-nums text-[13px]" style={{ color: avvikColor }}>
                        {budgetRow ? signedNOK(variance) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-[12px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Beløp er vist som positive tall. Avvik er faktisk minus budsjett (positivt betyr over budsjett).
            </p>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold mb-3 tracking-tight" style={{ color: 'var(--text)' }}>
              {focusMonthRange ? `I valgt periode (${txsForCategory.length})` : `Transaksjoner (${txsForCategory.length})`}
            </h3>
            {txsForCategory.length === 0 ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {focusMonthRange
                  ? 'Ingen transaksjoner i valgt periode for denne kategorien.'
                  : `Ingen transaksjoner i ${budgetYear} for denne kategorien.`}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {txsForCategory.map((t) => {
                  const pname = profileName(t.profileId)
                  const amt = Number.isFinite(t.amount) ? t.amount : 0
                  return (
                    <li
                      key={t.id}
                      className="flex min-h-[44px] min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2"
                      style={{ background: 'var(--bg)' }}
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium leading-snug truncate" style={{ color: 'var(--text)' }}>
                          {t.description || 'Uten beskrivelse'}
                        </p>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {typeof t.date === 'string' ? t.date : '—'}
                          {pname ? ` · ${pname}` : ''}
                        </p>
                      </div>
                      <p className="text-[14px] font-medium tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                        {formatNOK(amt)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {focusMonthRange && focusMonthRange.end < 11 ? (
            <section>
              <h3 className="text-[13px] font-semibold mb-1 tracking-tight" style={{ color: 'var(--text)' }}>
                Kommende (senere i {budgetYear}) ({txsKommende.length})
              </h3>
              <p className="text-[12px] mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Transaksjoner i måneder etter valgt periode — f.eks. planlagte trekk eller utgifter som allerede er bokført.
              </p>
              {txsKommende.length === 0 ? (
                <div
                  className="rounded-xl px-3 py-3 text-[13px] leading-relaxed"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  {kommendeBudgetSummary && kommendeBudgetSummary.sum > 0 ? (
                    <>
                      <p style={{ color: 'var(--text)' }}>
                        I budsjettet for <span className="font-medium">{kommendeBudgetSummary.rangeLabel}</span> er det
                        lagt inn{' '}
                        <span className="font-semibold tabular-nums">{formatNOK(kommendeBudgetSummary.sum)}</span> totalt
                        for denne kategorien.
                      </p>
                      <p className="mt-2 text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                        Ingen transaksjoner er bokført i disse månedene ennå — de vises her når de importeres eller
                        legges inn.
                      </p>
                    </>
                  ) : kommendeBudgetSummary?.hasBudgetRow ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      Ingen transaksjoner er bokført ennå for <span className="font-medium">{kommendeBudgetSummary.rangeLabel}</span>.
                      Budsjettert beløp for disse månedene er 0&nbsp;kr (eller ikke fordelt per måned).
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>
                      Ingen transaksjoner etter valgt periode ennå. Kategorien har ikke månedlig budsjett i planen, så vi
                      kan ikke vise et forventet beløp her.
                    </p>
                  )}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {txsKommende.map((t) => {
                    const pname = profileName(t.profileId)
                    const amt = Number.isFinite(t.amount) ? t.amount : 0
                    return (
                      <li
                        key={t.id}
                        className="flex min-h-[44px] min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2"
                        style={{ background: 'var(--bg)' }}
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium leading-snug truncate" style={{ color: 'var(--text)' }}>
                            {t.description || 'Uten beskrivelse'}
                          </p>
                          <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                            {typeof t.date === 'string' ? t.date : '—'}
                            {pname ? ` · ${pname}` : ''}
                          </p>
                        </div>
                        <p className="text-[14px] font-medium tabular-nums shrink-0" style={{ color: 'var(--text)' }}>
                          {formatNOK(amt)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ) : null}
        </div>

        <div
          className="flex flex-col-reverse gap-2 border-t px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end shrink-0 touch-manipulation"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-[15px] font-medium sm:w-auto"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={hrefListe}
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-[15px] font-semibold text-white sm:w-auto"
            style={{ background: 'var(--primary)' }}
          >
            Transaksjoner
          </Link>
        </div>
      </div>
    </div>
  )
}
