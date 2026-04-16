'use client'

import { useEffect, useMemo } from 'react'
import type { Debt } from '@/lib/store'
import { debtColors, debtIcons, debtTypeLabels } from '@/lib/debtDisplay'
import type { HouseholdDebtMemberRow } from '@/lib/householdDebtOverview'
import { effectiveDebtMonthlyPayment } from '@/lib/householdDebtOverview'
import { annualInterestCost, isDebtPauseActive } from '@/lib/debtHelpers'
import { effectiveIncludeInSnowball } from '@/lib/snowball'
import { formatNOK } from '@/lib/utils'
import { X, PauseCircle } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  member: HouseholdDebtMemberRow | null
  debts: Debt[]
}

export default function HouseholdMemberDebtModal({ open, onClose, member, debts }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => b.remainingAmount - a.remainingAmount)
  }, [debts])

  if (!open || !member) return null

  const titleId = 'household-member-debt-modal-title'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && e.button === 0) onClose()
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl min-w-0 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[min(92vh,900px)] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className="shrink-0 flex items-start justify-between gap-3 p-4 sm:p-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Gjeld · husholdning
            </p>
            <h2 id={titleId} className="text-lg sm:text-xl font-semibold truncate" style={{ color: 'var(--text)' }}>
              {member.name}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Alle registrerte lån og tall for denne profilen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 space-y-6">
          <section
            className="rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            aria-label="Sammendrag"
          >
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Restgjeld (sum)
              </p>
              <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--danger)' }}>
                {formatNOK(member.totalRemaining)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Månedlig (effektivt)
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {formatNOK(member.totalMonthlyEffective)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Ca. årlig rente
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {member.debtCount > 0 ? formatNOK(member.totalAnnualInterest) : '—'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Høyeste rente
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5" style={{ color: 'var(--warning)' }}>
                {member.debtCount > 0 ? `${member.highestInterestRate}%` : '—'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Antall lån
              </p>
              <p className="text-lg font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                {member.debtCount}
              </p>
            </div>
          </section>

          {sortedDebts.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingen gjeld registrert på denne profilen ennå.
              </p>
            </div>
          ) : (
            <section className="space-y-4" aria-label="Lån">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Lån ({sortedDebts.length})
              </h3>
              <ul className="space-y-4">
                {sortedDebts.map((debt) => (
                  <DebtDetailCard key={debt.id} debt={debt} />
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs leading-relaxed rounded-xl px-3 py-2.5" style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            For å endre lån: bytt til <strong style={{ color: 'var(--text)' }}>{member.name}</strong> under «Viser data for» øverst, og gå til{' '}
            <strong style={{ color: 'var(--text)' }}>Gjeld → Oversikt</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

function DebtDetailCard({ debt }: { debt: Debt }) {
  const Icon = debtIcons[debt.type]
  const color = debtColors[debt.type]
  const pause = isDebtPauseActive(debt)
  const effectiveMonthly = effectiveDebtMonthlyPayment(debt)
  const paidOff =
    debt.totalAmount > 0 ? Math.min(((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100, 100) : 0

  return (
    <li
      className="rounded-2xl p-4 sm:p-5 space-y-4 min-w-0"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22' }}
        >
          <Icon size={20} style={{ color }} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base leading-tight" style={{ color: 'var(--text)' }}>
            {debt.name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {debtTypeLabels[debt.type]}
          </p>
          {pause && (
            <span
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-1 rounded-lg"
              style={{ background: 'var(--warning)', color: 'var(--text)' }}
            >
              <PauseCircle size={12} aria-hidden />
              {debt.pauseEndDate ? `Avdrag pause til ${debt.pauseEndDate}` : 'Avdrag pauset'}
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Restgjeld</dt>
          <dd className="font-semibold tabular-nums text-right sm:text-left" style={{ color: 'var(--danger)' }}>
            {formatNOK(debt.remainingAmount)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Opprinnelig beløp</dt>
          <dd className="font-medium tabular-nums text-right sm:text-left" style={{ color: 'var(--text)' }}>
            {formatNOK(debt.totalAmount)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Nedbetalt</dt>
          <dd className="font-medium tabular-nums text-right sm:text-left" style={{ color: 'var(--text)' }}>
            {Math.round(paidOff)}%
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Månedlig avdrag</dt>
          <dd className="font-medium tabular-nums text-right sm:text-left" style={{ color: 'var(--text)' }}>
            {formatNOK(debt.monthlyPayment)} <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>registrert</span>
            <span className="text-xs block mt-1" style={{ color: 'var(--text-muted)' }}>
              Effektivt i oversikter: {formatNOK(effectiveMonthly)}/mnd
              {pause ? ' (pause)' : ''}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Rentefot</dt>
          <dd className="font-medium tabular-nums text-right sm:text-left" style={{ color: 'var(--warning)' }}>
            {debt.interestRate}%
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt style={{ color: 'var(--text-muted)' }}>Ca. årlig rentekostnad</dt>
          <dd className="font-medium tabular-nums text-right sm:text-left" style={{ color: 'var(--text)' }}>
            {formatNOK(annualInterestCost(debt))}
          </dd>
        </div>
      </dl>

      {debt.note?.trim() && (
        <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Notat
          </p>
          <p style={{ color: 'var(--text)' }}>{debt.note.trim()}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
          style={{
            background: 'var(--primary-pale)',
            color: 'var(--primary)',
            border: '1px solid var(--border)',
          }}
        >
          Snøball: {effectiveIncludeInSnowball(debt) ? 'Ja' : 'Nei'}
        </span>
        {debt.syncToBudget && (
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
            style={{
              background: 'var(--primary-pale)',
              color: 'var(--primary)',
              border: '1px solid var(--border)',
            }}
          >
            Synket til budsjett
            {debt.syncPlannedTransactions ? ' · Planlagte trekk' : ''}
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--primary-pale)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${paidOff}%`, background: color }} />
      </div>
    </li>
  )
}
