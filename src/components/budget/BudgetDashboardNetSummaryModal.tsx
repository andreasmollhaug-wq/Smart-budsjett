'use client'

import { useEffect, useMemo } from 'react'
import type { PersonData, PersonProfile, Transaction } from '@/lib/store'
import { sumIncomeExpenseNetByProfileForMonthRange } from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'
import { X } from 'lucide-react'

export type BudgetDashboardNetSummaryVariant = 'actual' | 'budget' | 'variance'

export type BudgetDashboardNetKpis = {
  budgetedIncome: number
  budgetedExpense: number
  budgetNet: number
  actualIncome: number
  actualExpense: number
  actualNet: number
  varianceNet: number
}

type Props = {
  open: boolean
  onClose: () => void
  variant: BudgetDashboardNetSummaryVariant
  periodLabel: string
  year: number
  monthStartInclusive: number
  monthEndInclusive: number
  kpis: BudgetDashboardNetKpis
  transactions: Transaction[]
  profiles: PersonProfile[]
  isHouseholdAggregate: boolean
  people: Record<string, PersonData>
}

function signedNOK(n: number): string {
  const abs = formatNOK(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

function profileDisplayName(pid: string, profiles: PersonProfile[]): string {
  const id = pid || profiles[0]?.id
  const name = profiles.find((p) => p.id === id)?.name?.trim()
  return name || '—'
}

export default function BudgetDashboardNetSummaryModal({
  open,
  onClose,
  variant,
  periodLabel,
  year,
  monthStartInclusive,
  monthEndInclusive,
  kpis,
  transactions,
  profiles,
  isHouseholdAggregate,
  people,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const profileRows = useMemo(
    () =>
      sumIncomeExpenseNetByProfileForMonthRange(
        transactions ?? [],
        year,
        monthStartInclusive,
        monthEndInclusive,
        people,
      ),
    [transactions, year, monthStartInclusive, monthEndInclusive, people],
  )

  const incomeVariance = kpis.actualIncome - kpis.budgetedIncome
  const expenseContribution = kpis.budgetedExpense - kpis.actualExpense

  if (!open) return null

  const title =
    variant === 'actual'
      ? 'Faktisk netto'
      : variant === 'budget'
        ? 'Budsjettert netto'
        : 'Netto avvik'
  const titleId = 'budget-dashboard-net-modal-title'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col rounded-2xl shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {title}
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
          {variant === 'actual' && (
            <>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Inntekter minus utgifter fra transaksjoner i perioden — samme grunnlag som KPI-kortet.
              </p>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                <SummaryRow label="Inntekt (faktisk)" value={formatNOK(kpis.actualIncome)} />
                <SummaryRow label="Utgift (faktisk)" value={formatNOK(kpis.actualExpense)} />
                <SummaryRow label="Netto" value={signedNOK(kpis.actualNet)} emphasize />
              </div>
              {isHouseholdAggregate && profileRows.length > 0 && (
                <section>
                  <h3 className="text-[13px] font-semibold mb-2 tracking-tight" style={{ color: 'var(--text)' }}>
                    Per profil (faktisk)
                  </h3>
                  <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,4.5rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.05em]"
                      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      <span>Profil</span>
                      <span className="text-right tabular-nums">Innt.</span>
                      <span className="text-right tabular-nums">Utg.</span>
                      <span className="text-right tabular-nums">Netto</span>
                    </div>
                    {profileRows.map((r) => (
                      <div
                        key={r.profileId || '_'}
                        className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,4.5rem))] gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 text-[14px] border-b border-[var(--border)] last:border-b-0 items-baseline"
                      >
                        <span className="truncate min-w-0" style={{ color: 'var(--text)' }}>
                          {profileDisplayName(r.profileId, profiles)}
                        </span>
                        <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                          {formatNOK(r.income)}
                        </span>
                        <span className="text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                          {formatNOK(r.expense)}
                        </span>
                        <span className="text-right tabular-nums text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {signedNOK(r.net)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {variant === 'budget' && (
            <>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summerte budsjettlinjer for perioden (plan). Tallene er ikke fordelt på person — bruk Husholdning-siden for
                mer fordeling der det finnes.
              </p>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                <SummaryRow label="Inntekt (budsjettert)" value={formatNOK(kpis.budgetedIncome)} />
                <SummaryRow label="Utgift (budsjettert)" value={formatNOK(kpis.budgetedExpense)} />
                <SummaryRow label="Netto" value={signedNOK(kpis.budgetNet)} emphasize />
              </div>
            </>
          )}

          {variant === 'variance' && (
            <>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Netto avvik er faktisk netto minus budsjettert netto. Under ser du hvordan inntekt og utgifter bidrar til
                avviket.
              </p>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                <SummaryRow label="Netto avvik" value={signedNOK(kpis.varianceNet)} emphasize />
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                <SummaryRow
                  label="Bidrag fra inntekt (faktisk − budsjettert)"
                  value={signedNOK(incomeVariance)}
                  sub="Høyere er bedre for netto"
                />
                <SummaryRow
                  label="Bidrag fra utgifter (budsjettert − faktisk)"
                  value={signedNOK(expenseContribution)}
                  sub="Høyere betyr lavere utgift enn budsjett — bra for netto"
                />
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Summen av de to bidragene tilsvarer netto avvik (avrunding kan gi små avvik i visning).
              </p>
            </>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 rounded-xl text-[15px] font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string
  value: string
  sub?: string
  emphasize?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-0.5 px-4 py-3 border-b border-[var(--border)] last:border-b-0"
      style={emphasize ? { background: 'var(--surface)' } : undefined}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-[14px] min-w-0 ${emphasize ? 'font-semibold' : ''}`} style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span
          className={`tabular-nums shrink-0 ${emphasize ? 'text-[16px] font-bold' : 'text-[14px] font-medium'}`}
          style={{ color: 'var(--text)' }}
        >
          {value}
        </span>
      </div>
      {sub ? (
        <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      ) : null}
    </div>
  )
}
