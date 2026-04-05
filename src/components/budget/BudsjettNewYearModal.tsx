'use client'

import type { BudgetYearCopySource } from '@/lib/store'

type BudsjettNewYearModalProps = {
  budgetYear: number
  incomeCopySource: BudgetYearCopySource
  expenseCopySource: BudgetYearCopySource
  onIncomeCopySourceChange: (v: BudgetYearCopySource) => void
  onExpenseCopySourceChange: (v: BudgetYearCopySource) => void
  onClose: () => void
  onConfirm: () => void
}

export default function BudsjettNewYearModal({
  budgetYear,
  incomeCopySource,
  expenseCopySource,
  onIncomeCopySourceChange,
  onExpenseCopySourceChange,
  onClose,
  onConfirm,
}: BudsjettNewYearModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-year-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 id="new-year-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Start nytt budsjettår?
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          År {budgetYear} arkiveres for alle profiler. Du går til {budgetYear + 1}. Transaksjoner slettes ikke — de ligger
          fortsatt under Transaksjoner og i rapporter.
        </p>

        <fieldset className="mt-5 space-y-2 border-0 p-0">
          <legend className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            Inntekter — hva skal inn i neste års plan?
          </legend>
          {(
            [
              { v: 'budget' as const, label: `Budsjett fra ${budgetYear}` },
              { v: 'actual' as const, label: `Faktisk fra ${budgetYear} (per måned)` },
              { v: 'zero' as const, label: 'Nullstill beløp (linjer beholdes)' },
            ] as const
          ).map(({ v, label }) => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
              <input
                type="radio"
                name="income-copy"
                checked={incomeCopySource === v}
                onChange={() => onIncomeCopySourceChange(v)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="mt-5 space-y-2 border-0 p-0">
          <legend className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            Kostnader (alle grupper) — hva skal inn i neste års plan?
          </legend>
          {(
            [
              { v: 'budget' as const, label: `Budsjett fra ${budgetYear}` },
              { v: 'actual' as const, label: `Faktisk fra ${budgetYear} (per måned)` },
              { v: 'zero' as const, label: 'Nullstill beløp (linjer beholdes)' },
            ] as const
          ).map(({ v, label }) => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
              <input
                type="radio"
                name="expense-copy"
                checked={expenseCopySource === v}
                onChange={() => onExpenseCopySourceChange(v)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
            onClick={onConfirm}
          >
            Arkiver og gå til {budgetYear + 1}
          </button>
        </div>
      </div>
    </div>
  )
}
