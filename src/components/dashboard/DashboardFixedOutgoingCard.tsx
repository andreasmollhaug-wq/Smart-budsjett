'use client'

import Link from 'next/link'
import type { BudgetCategory } from '@/lib/store'
import { listBudgetedFixedMonthlyExpensesForMonth } from '@/lib/bankReportData'
import { formatNOK } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

type Props = {
  budgetCategories: BudgetCategory[]
  endMonthIndex: number
  onOpenDetails: () => void
  serviceSubscriptionLine?: { count: number; monthlySumNok: number } | null
}

export default function DashboardFixedOutgoingCard({
  budgetCategories,
  endMonthIndex,
  onOpenDetails,
  serviceSubscriptionLine,
}: Props) {
  const rows = listBudgetedFixedMonthlyExpensesForMonth(budgetCategories, endMonthIndex).slice(0, 6)

  return (
    <div
      className="flex min-w-0 flex-col rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Faste trekk (budsjett)
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Månedlige budsjettposter for valgt sluttmåned — plan, ikke banktrekk
      </p>
      {rows.length === 0 ? (
        <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
          Ingen månedlige utgiftslinjer med budsjett for denne måneden.
        </p>
      ) : (
        <ul className="space-y-2 flex-1 min-h-0 overflow-y-auto max-h-[240px]">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-xl p-3 text-sm"
              style={{ background: 'var(--bg)' }}
            >
              <span className="truncate font-medium" style={{ color: 'var(--text)' }}>
                {row.name}
              </span>
              <span className="shrink-0 tabular-nums font-semibold" style={{ color: 'var(--danger)' }}>
                −{formatNOK(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {serviceSubscriptionLine && serviceSubscriptionLine.count > 0 && (
        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {serviceSubscriptionLine.count} aktive tjenesteabonnement · ca. {formatNOK(serviceSubscriptionLine.monthlySumNok)}{' '}
          / mnd{' '}
          <Link href="/abonnementer" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--primary)' }}>
            Abonnementer
          </Link>
        </p>
      )}
      <button
        type="button"
        onClick={onOpenDetails}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg w-fit"
        style={{ color: 'var(--primary)' }}
      >
        Se alle faste utgifter i budsjett
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
