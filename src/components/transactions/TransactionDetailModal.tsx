'use client'

import { useEffect, useState } from 'react'
import type { BudgetCategory, Transaction } from '@/lib/store'
import { formatIntegerNbNo, parseIntegerNbNo } from '@/lib/utils'
import { X, Trash2 } from 'lucide-react'

type Draft = {
  date: string
  description: string
  amount: string
  category: string
}

function txToDraft(tx: Transaction): Draft {
  return {
    date: tx.date,
    description: tx.description,
    amount: formatIntegerNbNo(tx.amount),
    category: tx.category,
  }
}

export type TransactionSavePatch = Partial<
  Pick<Transaction, 'date' | 'description' | 'amount' | 'category' | 'type'>
>

type Props = {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
  expenseCategories: BudgetCategory[]
  incomeCategories: BudgetCategory[]
  onSave: (id: string, patch: TransactionSavePatch) => void
  onDelete: (id: string) => void
  readOnly?: boolean
  householdHint?: boolean
}

export default function TransactionDetailModal({
  transaction,
  open,
  onClose,
  expenseCategories,
  incomeCategories,
  onSave,
  onDelete,
  readOnly = false,
  householdHint = false,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allCats = [...expenseCategories, ...incomeCategories]

  useEffect(() => {
    if (open && transaction) {
      setDraft(txToDraft(transaction))
      setError(null)
    }
  }, [open, transaction?.id, transaction])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !transaction || !draft) return null

  const selectedCat = allCats.find((c) => c.name === draft.category)
  const txType = selectedCat?.type ?? transaction.type

  const handleSave = () => {
    if (readOnly) return
    const desc = draft.description.trim()
    if (!desc) {
      setError('Beskrivelse kan ikke være tom.')
      return
    }
    if (!draft.category) {
      setError('Velg en kategori.')
      return
    }
    const amountNum = parseIntegerNbNo(draft.amount)
    if (!Number.isFinite(amountNum)) {
      setError('Beløp må være et positivt tall.')
      return
    }
    if (!selectedCat) {
      setError('Ugyldig kategori.')
      return
    }
    setError(null)
    onSave(transaction.id, {
      date: draft.date,
      description: desc,
      amount: amountNum,
      category: draft.category,
      type: selectedCat.type,
    })
    onClose()
  }

  const handleDelete = () => {
    if (readOnly) return
    if (typeof window !== 'undefined' && !window.confirm('Slette denne transaksjonen?')) return
    onDelete(transaction.id)
    onClose()
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl text-sm'
  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--text-muted)' } as const

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-lg min-w-0 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detail-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 id="tx-detail-title" className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            Rediger transaksjon
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

        {householdHint && (
          <p
            className="text-xs rounded-lg px-3 py-2 mb-4"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Du ser aggregert husholdning. Redigering oppdaterer den profilen transaksjonen tilhører.
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              Dato
            </label>
            <input
              type="date"
              disabled={readOnly}
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              Beskrivelse
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              Beløp (NOK)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={readOnly}
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              onBlur={() => {
                if (readOnly) return
                setDraft((prev) => {
                  if (!prev) return prev
                  const n = parseIntegerNbNo(prev.amount)
                  if (!Number.isFinite(n)) return prev
                  return { ...prev, amount: formatIntegerNbNo(n) }
                })
              }}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              Kategori
            </label>
            <select
              disabled={readOnly}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              <option value="">Velg kategori</option>
              {allCats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Type: {txType === 'income' ? 'Inntekt' : 'Utgift'}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm mt-3" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Lagre
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--danger)', border: '1px solid var(--border)' }}
              >
                <Trash2 size={16} aria-hidden />
                Slett
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {readOnly ? 'Lukk' : 'Avbryt'}
          </button>
        </div>
      </div>
    </div>
  )
}
