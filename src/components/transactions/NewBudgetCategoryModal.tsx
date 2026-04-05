'use client'

import { useEffect, useState } from 'react'
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
  onCreated: (categoryName: string) => void
  customBudgetLabels: Record<ParentCategory, string[]>
  budgetCategories: BudgetCategory[]
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  addBudgetCategory: (c: BudgetCategory) => void
}

export default function NewBudgetCategoryModal({
  open,
  onClose,
  onCreated,
  customBudgetLabels,
  budgetCategories,
  addCustomBudgetLabel,
  addBudgetCategory,
}: Props) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [expenseParent, setExpenseParent] = useState<ParentCategory>('utgifter')

  useEffect(() => {
    if (open) {
      setName('')
      setKind('expense')
      setExpenseParent('utgifter')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
    onCreated(trimmed)
    onClose()
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl text-sm'
  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--text-muted)' } as const

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-cat-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 id="new-cat-title" className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            Ny budsjettkategori
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg shrink-0"
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
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
                <input
                  type="radio"
                  name="newcat-kind"
                  checked={kind === 'expense'}
                  onChange={() => setKind('expense')}
                />
                Utgift
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
                <input
                  type="radio"
                  name="newcat-kind"
                  checked={kind === 'income'}
                  onChange={() => setKind('income')}
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
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            Opprett og velg
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}
