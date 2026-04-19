'use client'

import { useEffect, useState } from 'react'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory, Transaction } from '@/lib/store'
import { REPORT_GROUP_LABELS } from '@/lib/bankReportData'
import { transactionRequiresPlanFollowUp } from '@/lib/plannedTransactions'
import { formatIntegerNbNo, formatIntegerNbNoWhileTyping, parseIntegerNbNo } from '@/lib/utils'
import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import NewBudgetCategoryModal from '@/components/transactions/NewBudgetCategoryModal'
import { X, Trash2 } from 'lucide-react'

type Draft = {
  date: string
  description: string
  amount: string
  category: string
  subcategory: string
}

function txToDraft(tx: Transaction): Draft {
  return {
    date: tx.date,
    description: tx.description,
    amount: formatIntegerNbNo(tx.amount),
    category: tx.category,
    subcategory: tx.subcategory ?? '',
  }
}

export type TransactionSavePatch = Partial<
  Pick<
    Transaction,
    'date' | 'description' | 'amount' | 'category' | 'subcategory' | 'type' | 'plannedFollowUp'
  >
>

type CreateCategoryProps = {
  customBudgetLabels: Record<ParentCategory, string[]>
  budgetCategories: BudgetCategory[]
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  addBudgetCategory: (c: BudgetCategory) => void
}

type Props = {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
  expenseCategories: BudgetCategory[]
  incomeCategories: BudgetCategory[]
  onSave: (id: string, patch: TransactionSavePatch) => void
  onDelete: (id: string) => void
  /** Rask oppdatering av gjennomgang/betalt uten å lukke modal. */
  onPatchTransaction?: (id: string, patch: Partial<Pick<Transaction, 'reviewedAt' | 'paidAt'>>) => void
  readOnly?: boolean
  householdHint?: boolean
  /** Når satt og ikke readOnly: «Ny kategori» ved kategorivalg (ikke i husholdningsaggregat). */
  createCategory?: CreateCategoryProps
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
  createCategory,
  onPatchTransaction,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newCatOpen, setNewCatOpen] = useState(false)

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

  const selectedCat =
    allCats.find((c) => c.name === draft.category && c.type === transaction.type) ??
    allCats.find((c) => c.name === draft.category)
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
      subcategory: draft.subcategory.trim(),
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

  const canCreateCategory = Boolean(createCategory) && !readOnly
  const planFollow = transaction ? transactionRequiresPlanFollowUp(transaction) : false

  return (
    <>
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
                onChange={(e) =>
                  setDraft({ ...draft, amount: formatIntegerNbNoWhileTyping(e.target.value) })
                }
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
              <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
                <div className="flex-1 min-w-0">
                  <BudgetCategoryPicker
                    value={draft.category}
                    onChange={(name) => setDraft({ ...draft, category: name })}
                    categories={allCats}
                    disabled={readOnly}
                    variant="pick"
                  />
                </div>
                {canCreateCategory && (
                  <button
                    type="button"
                    onClick={() => setNewCatOpen(true)}
                    className="px-3 py-2 rounded-xl text-sm font-medium shrink-0 whitespace-nowrap"
                    style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                  >
                    Ny kategori
                  </button>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Type: {txType === 'income' ? 'Inntekt' : 'Utgift'}
                {selectedCat ? ` · ${REPORT_GROUP_LABELS[selectedCat.parentCategory]}` : null}
              </p>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Underkategori (valgfritt)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={draft.subcategory}
                onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                placeholder="F.eks. butikk eller detalj"
              />
            </div>

            {planFollow && onPatchTransaction && !readOnly && (
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Planlagt oppfølging
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {!transaction.reviewedAt ? (
                    <button
                      type="button"
                      onClick={() =>
                        onPatchTransaction(transaction.id, { reviewedAt: new Date().toISOString() })
                      }
                      className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white w-full sm:w-auto"
                      style={{ background: 'var(--primary)' }}
                    >
                      Marker som gjennomgått
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center min-h-[44px] px-3 rounded-xl text-sm"
                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                    >
                      Gjennomgått
                    </span>
                  )}
                  {transaction.type === 'expense' && !transaction.paidAt ? (
                    <button
                      type="button"
                      onClick={() => onPatchTransaction(transaction.id, { paidAt: new Date().toISOString() })}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium w-full sm:w-auto"
                      style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                      Marker som betalt
                    </button>
                  ) : transaction.type === 'expense' && transaction.paidAt ? (
                    <span className="text-xs self-center" style={{ color: 'var(--text-muted)' }}>
                      Betalt registrert
                    </span>
                  ) : null}
                </div>
              </div>
            )}
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
      {createCategory && (
        <NewBudgetCategoryModal
          open={newCatOpen}
          onClose={() => setNewCatOpen(false)}
          onCreated={({ name }) => setDraft((d) => (d ? { ...d, category: name } : d))}
          customBudgetLabels={createCategory.customBudgetLabels}
          budgetCategories={createCategory.budgetCategories}
          addCustomBudgetLabel={createCategory.addCustomBudgetLabel}
          addBudgetCategory={createCategory.addBudgetCategory}
        />
      )}
    </>
  )
}
