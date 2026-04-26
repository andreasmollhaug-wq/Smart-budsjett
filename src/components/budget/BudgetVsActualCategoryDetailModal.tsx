'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import VariancePctLine from '@/components/budget/VariancePctLine'
import type { BudgetVsActualRow } from '@/lib/bankReportData'
import { buildCategoryBudgetActualVarianceByProfile } from '@/lib/householdDashboardData'
import type { ArchivedBudgetsByYear, PersonData, PersonProfile, Transaction } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { X } from 'lucide-react'

function varianceColor(r: BudgetVsActualRow): string {
  if (r.variance === 0) return 'var(--text-muted)'
  if (r.type === 'expense' && r.variance > 0) return 'var(--danger)'
  if (r.type === 'income' && r.variance < 0) return 'var(--danger)'
  return 'var(--success)'
}

function varianceColorForAmount(type: 'income' | 'expense', variance: number): string {
  if (variance === 0) return 'var(--text-muted)'
  if (type === 'expense' && variance > 0) return 'var(--danger)'
  if (type === 'income' && variance < 0) return 'var(--danger)'
  return 'var(--success)'
}

function profileDisplayName(pid: string, profiles: PersonProfile[]): string {
  if (pid === '') return 'Ikke tilordnet'
  const name = profiles.find((p) => p.id === pid)?.name?.trim()
  return name || '—'
}

function collectTransactionsInRange(
  transactions: Transaction[],
  year: number,
  monthStartInclusive: number,
  monthEndInclusive: number,
  categoryName: string,
  type: 'income' | 'expense',
): Transaction[] {
  const out: Transaction[] = []
  for (const t of transactions) {
    if (t.category !== categoryName || t.type !== type) continue
    if (!t.date || t.date.length < 7) continue
    const ym = t.date.slice(0, 7)
    const parts = ym.split('-')
    if (parts.length < 2) continue
    const yy = Number(parts[0])
    const mm = Number(parts[1])
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || yy !== year) continue
    if (mm < 1 || mm > 12) continue
    const monthIndex = mm - 1
    if (monthIndex < monthStartInclusive || monthIndex > monthEndInclusive) continue
    out.push(t)
  }
  out.sort((a, b) => {
    const da = typeof a.date === 'string' ? a.date : ''
    const db = typeof b.date === 'string' ? b.date : ''
    return db.localeCompare(da)
  })
  return out
}

type Props = {
  open: boolean
  onClose: () => void
  row: BudgetVsActualRow | null
  periodLabel: string
  year: number
  budgetYear: number
  monthStartInclusive: number
  monthEndInclusive: number
  transactions: Transaction[]
  people: Record<string, PersonData>
  archivedBudgetsByYear: ArchivedBudgetsByYear
  profiles: PersonProfile[]
  isHouseholdAggregate: boolean
  transactionsHref: string
}

export default function BudgetVsActualCategoryDetailModal({
  open,
  onClose,
  row,
  periodLabel,
  year,
  budgetYear,
  monthStartInclusive,
  monthEndInclusive,
  transactions,
  people,
  archivedBudgetsByYear,
  profiles,
  isHouseholdAggregate,
  transactionsHref,
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

  const profileBreakdown = useMemo(() => {
    if (!row) return []
    return buildCategoryBudgetActualVarianceByProfile(
      people,
      archivedBudgetsByYear,
      profiles,
      budgetYear,
      year,
      monthStartInclusive,
      monthEndInclusive,
      row.name,
      row.type,
      transactions ?? [],
    )
  }, [
    people,
    archivedBudgetsByYear,
    profiles,
    budgetYear,
    year,
    monthStartInclusive,
    monthEndInclusive,
    row,
    transactions,
  ])

  /** Kun profiler med budsjett eller faktisk i kategorien — skjul tomme rader. */
  const profileRowsVisible = useMemo(
    () => profileBreakdown.filter((p) => p.budgeted !== 0 || p.actual !== 0),
    [profileBreakdown],
  )

  const txsInPeriod = useMemo(() => {
    if (!row) return []
    return collectTransactionsInRange(
      transactions ?? [],
      year,
      monthStartInclusive,
      monthEndInclusive,
      row.name,
      row.type,
    )
  }, [transactions, year, monthStartInclusive, monthEndInclusive, row])

  if (!open || !row) return null

  const titleId = 'budget-vs-actual-cat-modal-title'
  const vColor = varianceColor(row)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,820px)] w-full max-w-lg flex-col rounded-2xl shadow-2xl md:max-w-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {row.name}
            </h2>
            <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {periodLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 space-y-5">
          <section className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div className="grid grid-cols-3">
              <div className="px-3 py-3 sm:px-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  Budsjett
                </p>
                <p className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNOK(row.budgeted)}
                </p>
              </div>
              <div
                className="px-3 py-3 sm:px-4 text-center border-l border-solid"
                style={{ borderLeftColor: 'color-mix(in srgb, var(--border) 42%, transparent)' }}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  Faktisk
                </p>
                <p className="text-[15px] font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNOK(row.actual)}
                </p>
              </div>
              <div
                className="px-3 py-3 sm:px-4 text-center border-l border-solid"
                style={{ borderLeftColor: 'color-mix(in srgb, var(--border) 42%, transparent)' }}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  Avvik
                </p>
                <p className="text-[15px] font-semibold tabular-nums" style={{ color: vColor }}>
                  {row.variance > 0 ? '+' : ''}
                  {formatNOK(row.variance)}
                </p>
                <div className="mt-1 flex justify-center">
                  <VariancePctLine variance={row.variance} budgeted={row.budgeted} />
                </div>
              </div>
            </div>
          </section>

          {isHouseholdAggregate && profiles.length > 0 && profileRowsVisible.length > 0 && (
            <section>
              <h3 className="text-[13px] font-semibold mb-1 tracking-tight" style={{ color: 'var(--text)' }}>
                Per profil
              </h3>
              <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
                Budsjett per profil summeres til linjen over. Avvik er faktisk minus budsjettert for hver profil i perioden.
              </p>
              <div className="rounded-xl overflow-hidden overflow-x-auto min-w-0" style={{ background: 'var(--bg)' }}>
                <div
                  className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.04em] min-w-[min(100%,20rem)]"
                  style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="min-w-0">Profil</span>
                  <span className="text-right tabular-nums">Budsj.</span>
                  <span className="text-right tabular-nums">Fakt.</span>
                  <span className="text-right tabular-nums">Avvik</span>
                </div>
                {profileRowsVisible.map((p) => {
                  const vc = varianceColorForAmount(row.type, p.variance)
                  return (
                    <div
                      key={p.profileId || '_orphan'}
                      className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px] border-b border-[var(--border)] last:border-b-0 items-baseline min-w-[min(100%,20rem)]"
                    >
                      <span className="truncate min-w-0" style={{ color: 'var(--text)' }}>
                        {profileDisplayName(p.profileId, profiles)}
                      </span>
                      <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                        {formatNOK(p.budgeted)}
                      </span>
                      <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                        {formatNOK(p.actual)}
                      </span>
                      <span className="text-right tabular-nums font-medium" style={{ color: vc }}>
                        {p.variance > 0 ? '+' : ''}
                        {formatNOK(p.variance)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[13px] font-semibold mb-2 tracking-tight" style={{ color: 'var(--text)' }}>
              Transaksjoner i perioden ({txsInPeriod.length})
            </h3>
            {txsInPeriod.length === 0 ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ingen transaksjoner i denne kategorien i perioden.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {txsInPeriod.map((t) => {
                  const pname = isHouseholdAggregate
                    ? profileDisplayName(t.profileId ?? '', profiles)
                    : null
                  const amt = Number.isFinite(t.amount) ? t.amount : 0
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 min-w-0"
                      style={{ background: 'var(--bg)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-snug truncate" style={{ color: 'var(--text)' }}>
                          {t.description || 'Uten beskrivelse'}
                        </p>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {typeof t.date === 'string' ? t.date : '—'}
                          {pname && pname !== '—' ? ` · ${pname}` : ''}
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
        </div>

        <div
          className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end px-6 pb-6 pt-2 shrink-0 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-[15px] font-medium w-full sm:w-auto min-h-[44px]"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={transactionsHref}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-[15px] font-semibold text-white text-center w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            Åpne i transaksjoner
          </Link>
        </div>
      </div>
    </div>
  )
}
