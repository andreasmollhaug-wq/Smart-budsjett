'use client'

import { ChevronDown } from 'lucide-react'
import CreditorRegistryKpiRow from '@/components/debt/creditorRegistry/CreditorRegistryKpiRow'
import {
  CREDITOR_REGISTRY_DEMO_CREDITORS,
  CREDITOR_REGISTRY_DEMO_EXPANDED_ID,
  CREDITOR_REGISTRY_DEMO_OVERVIEW,
  creditorRegistryDemoCopy,
} from '@/lib/creditorRegistry/demoOverview'
import { computeGroupTotals } from '@/lib/creditorRegistry/aggregate'
import type { CreditorRegistryLoan } from '@/lib/creditorRegistry/types'
import type { Debt } from '@/lib/store'
import { debtColors, debtIcons, debtTypeLabels } from '@/lib/debtDisplay'

type Props = {
  formatNOK: (n: number) => string
}

function DemoLoanRow({ loan, formatNOK }: { loan: CreditorRegistryLoan; formatNOK: (n: number) => string }) {
  const Icon = debtIcons[loan.type as Debt['type']]
  const color = debtColors[loan.type as Debt['type']]
  const typeLabel = debtTypeLabels[loan.type as Debt['type']]

  return (
    <div
      className="flex items-center gap-3 min-h-[44px] py-3 px-3 sm:px-4 rounded-lg min-w-0"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}22` }}
      >
        <Icon size={16} style={{ color }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate m-0" style={{ color: 'var(--text)' }}>
          {loan.name}
        </p>
        <p className="text-xs truncate m-0" style={{ color: 'var(--text-muted)' }}>
          {typeLabel}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs sm:text-sm space-y-0.5 tabular-nums">
        <p className="font-semibold m-0" style={{ color: 'var(--danger)' }}>
          {formatNOK(loan.remainingAmount)}
        </p>
        <p className="m-0" style={{ color: 'var(--text-muted)' }}>
          {formatNOK(loan.monthlyPayment)}/mnd · {loan.interestRate}%
        </p>
      </div>
    </div>
  )
}

export default function CreditorRegistryDemoVisuals({ formatNOK }: Props) {
  return (
    <div className="space-y-4 min-w-0">
      <p
        className="text-sm m-0 leading-relaxed rounded-xl px-4 py-3"
        style={{ background: 'var(--primary-pale)', color: 'var(--text-muted)' }}
      >
        <strong style={{ color: 'var(--text)' }}>Fiktivt eksempel</strong> — {creditorRegistryDemoCopy.demoBanner}
      </p>

      <CreditorRegistryKpiRow overview={CREDITOR_REGISTRY_DEMO_OVERVIEW} formatNOK={formatNOK} compact />

      <div className="space-y-2 min-w-0">
        <p className="text-xs font-medium m-0 px-0.5" style={{ color: 'var(--text-muted)' }}>
          Kreditorer (accordion)
        </p>
        {CREDITOR_REGISTRY_DEMO_CREDITORS.map((group) => {
          const totals = computeGroupTotals(group)
          const expanded = group.id === CREDITOR_REGISTRY_DEMO_EXPANDED_ID
          const loanWord = totals.loanCount === 1 ? 'lån' : 'lån'

          return (
            <div
              key={group.id}
              className="rounded-2xl overflow-hidden min-w-0 opacity-95"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 p-4 min-h-[44px] min-w-0">
                <ChevronDown
                  size={20}
                  className="shrink-0"
                  style={{
                    color: 'var(--text-muted)',
                    transform: expanded ? 'rotate(180deg)' : undefined,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="font-semibold text-sm m-0 truncate" style={{ color: 'var(--text)' }}>
                      {group.name}
                    </p>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {totals.loanCount} {loanWord}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs tabular-nums">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Restgjeld{' '}
                      <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                        {formatNOK(totals.totalRemaining)}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Mnd{' '}
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {formatNOK(totals.totalMonthly)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {expanded && (
                <div
                  className="border-t px-2 sm:px-3 pb-3 pt-1 space-y-1"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {group.loans.map((loan) => (
                    <DemoLoanRow key={loan.id} loan={loan} formatNOK={formatNOK} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
