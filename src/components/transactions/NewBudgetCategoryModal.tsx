'use client'

import { useEffect, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory } from '@/lib/store'
import {
  buildZeroBudgetCategory,
  shouldRegisterCustomLabel,
} from '@/lib/createBudgetCategoryZero'
import { X } from 'lucide-react'

const EXPENSE_PARENTS: { id: ParentCategory; label: string }[] = [
  { id: 'regninger', label: 'Regninger' },
  { id: 'utgifter', label: 'Utgifter' },
  { id: 'gjeld', label: 'Gjeld' },
  { id: 'sparing', label: 'Sparing' },
]

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (payload: { name: string; id: string }) => void
  customBudgetLabels: Record<ParentCategory, string[]>
  budgetCategories: BudgetCategory[]
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  addBudgetCategory: (c: BudgetCategory) => void
  /** Når satt ved åpning: forhåndsvelg type / utgift-hovedgruppe (f.eks. fra transaksjonsskjema). */
  initialKind?: 'income' | 'expense'
  initialExpenseParent?: ParentCategory
}

export default function NewBudgetCategoryModal({
  open,
  onClose,
  onCreated,
  customBudgetLabels,
  budgetCategories,
  addCustomBudgetLabel,
  addBudgetCategory,
  initialKind,
  initialExpenseParent,
}: Props) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [expenseParent, setExpenseParent] = useState<ParentCategory>('utgifter')

  useEffect(() => {
    if (!open) return
    setName('')
    if (initialKind === 'income') {
      setKind('income')
      setExpenseParent('utgifter')
      return
    }
    if (initialKind === 'expense') {
      setKind('expense')
      const parent =
        initialExpenseParent && EXPENSE_PARENTS.some((e) => e.id === initialExpenseParent)
          ? initialExpenseParent
          : 'utgifter'
      setExpenseParent(parent)
      return
    }
    setKind('expense')
    setExpenseParent('utgifter')
  }, [open, initialKind, initialExpenseParent])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const backdropDismiss = useModalBackdropDismiss(onClose)

  if (!open) return null

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const parent: ParentCategory = kind === 'income' ? 'inntekter' : expenseParent
    const type = kind === 'income' ? 'income' : 'expense'
    if (shouldRegisterCustomLabel(parent, trimmed, customBudgetLabels)) {
      addCustomBudgetLabel(parent, trimmed)
    }
    const cat = buildZeroBudgetCategory(trimmed, parent, type, budgetCategories.length)
    addBudgetCategory(cat)
    onCreated({ name: trimmed, id: cat.id })
    onClose()
  }

  const inputClass =
    'w-full min-h-[44px] px-3 py-2 rounded-xl text-sm touch-manipulation'
  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--text-muted)' } as const

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      {...backdropDismiss}
      role="presentation"
    >
      <div
        className="w-full max-w-md min-w-0 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-cat-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <h3 id="new-cat-title" className="font-semibold text-lg min-w-0 pr-2" style={{ color: 'var(--text)' }}>
            Ny budsjettkategori
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg shrink-0 touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Opprettes med 0 kr budsjett for alle måneder. Du kan justere budsjettet under Budsjett.
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              Navn
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              placeholder="F.eks. Mat & dagligvarer"
            />
          </div>
          <div>
            <span className={labelClass} style={labelStyle}>
              Type
            </span>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label
                className="flex items-center gap-2 min-h-[44px] text-sm cursor-pointer touch-manipulation"
                style={{ color: 'var(--text)' }}
              >
                <input
                  type="radio"
                  name="newcat-kind"
                  checked={kind === 'expense'}
                  onChange={() => setKind('expense')}
                  className="shrink-0"
                />
                Utgift
              </label>
              <label
                className="flex items-center gap-2 min-h-[44px] text-sm cursor-pointer touch-manipulation"
                style={{ color: 'var(--text)' }}
              >
                <input
                  type="radio"
                  name="newcat-kind"
                  checked={kind === 'income'}
                  onChange={() => setKind('income')}
                  className="shrink-0"
                />
                Inntekt
              </label>
            </div>
          </div>
          {kind === 'expense' && (
            <div>
              <label className={labelClass} style={labelStyle}>
                Hovedgruppe
              </label>
              <select
                value={expenseParent}
                onChange={(e) => setExpenseParent(e.target.value as ParentCategory)}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {EXPENSE_PARENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white w-full sm:w-auto touch-manipulation"
            style={{ background: 'var(--primary)' }}
          >
            Opprett og velg
          </button>
        </div>
      </div>
    </div>
  )
}
