'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { BudgetCategory, PersonProfile, Transaction } from '@/lib/store'
import { actualsPerMonthForCategoryAllProfiles } from '@/lib/budgetActualsToBudgeted'
import { MONTH_LABELS_SHORT_NB } from '@/lib/bankReportData'
import { transactionsHrefForCategory } from '@/lib/budgetDashboardLinks'
import { formatNOK } from '@/lib/utils'
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
}

function findExpenseCategoryByName(cats: BudgetCategory[], name: string): BudgetCategory | undefined {
  return cats.find((c) => c.type === 'expense' && c.name === name)
}

function signedNOK(n: number): string {
  const abs = formatNOK(Math.abs(n))
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
}: Props) {
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

  const txsForCategory = useMemo(() => {
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

  const profileName = (pid: string | undefined) => {
    if (!isHouseholdAggregate) return null
    const id = pid ?? profiles[0]?.id
    return profiles.find((p) => p.id === id)?.name ?? null
  }

  if (!open) return null

  const hrefYear = transactionsHrefForCategory('year', budgetYear, 0, categoryName)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-cat-modal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,800px)] w-full max-w-lg flex-col rounded-2xl shadow-2xl md:max-w-xl"
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
            <p className="text-[13px] mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
              Faktisk utgift i {budgetYear}:{' '}
              <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                {formatNOK(yearTotal)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 space-y-6">
          {!budgetRow && txsForCategory.length > 0 && (
            <p className="text-[12px] leading-relaxed rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
              Ingen budsjettkategori med nøyaktig samme navn — månedlig budsjett vises ikke, men transaksjoner finnes.
            </p>
          )}

          <section>
            <h3 className="text-[13px] font-semibold mb-3 tracking-tight" style={{ color: 'var(--text)' }}>
              Måned for måned
            </h3>
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
                {MONTH_LABELS_SHORT_NB.map((label, m) => {
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
                      key={label}
                      className="grid grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,4.25rem))] gap-x-3 sm:gap-x-4 px-4 py-2.5 text-[14px] leading-tight items-baseline border-b border-[var(--border)] last:border-b-0"
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
              Transaksjoner ({txsForCategory.length})
            </h3>
            {txsForCategory.length === 0 ? (
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Ingen transaksjoner i {budgetYear} for denne kategorien.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {txsForCategory.map((t) => {
                  const pname = profileName(t.profileId)
                  const amt = Number.isFinite(t.amount) ? t.amount : 0
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
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
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end px-6 pb-6 pt-2 shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-[15px] font-medium w-full sm:w-auto"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={hrefYear}
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-[15px] font-semibold text-white text-center w-full sm:w-auto"
            style={{ background: 'var(--primary)' }}
          >
            Transaksjoner
          </Link>
        </div>
      </div>
    </div>
  )
}
