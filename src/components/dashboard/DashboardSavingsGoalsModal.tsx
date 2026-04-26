'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { getEffectiveCurrentAmount } from '@/lib/savingsDerived'
import { calcProgress } from '@/lib/utils'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  savingsGoals: SavingsGoal[]
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  activeProfileId: string
}

export default function DashboardSavingsGoalsModal({
  open,
  onClose,
  savingsGoals,
  transactions,
  budgetCategories,
  activeProfileId,
}: Props) {
  const { formatNOK } = useNokDisplayFormatters()
  const sortedGoals = useMemo(
    () =>
      [...savingsGoals].sort((a, b) => {
        const ea = getEffectiveCurrentAmount(a, transactions, budgetCategories, activeProfileId)
        const eb = getEffectiveCurrentAmount(b, transactions, budgetCategories, activeProfileId)
        return eb - ea
      }),
    [savingsGoals, transactions, budgetCategories, activeProfileId],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-savings-modal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id="dashboard-savings-modal-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Sparemål
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {sortedGoals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen sparemål ennå. Opprett mål på sparesiden.
            </p>
          ) : (
            <div className="space-y-5">
              {sortedGoals.map((g) => {
                const current = getEffectiveCurrentAmount(g, transactions, budgetCategories, activeProfileId)
                const pct = calcProgress(current, g.targetAmount)
                return (
                  <div key={g.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {g.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--primary-pale)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: g.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{formatNOK(current)}</span>
                      <span>{formatNOK(g.targetAmount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t p-5" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Lukk
          </button>
          <Link
            href="/sparing"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Gå til sparing
          </Link>
        </div>
      </div>
    </div>
  )
}
