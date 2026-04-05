'use client'

import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { formatNOK } from '@/lib/utils'
import { getEffectiveCurrentAmount, getGoalActivityRows } from '@/lib/savingsDerived'
import { X } from 'lucide-react'

export type SparingGoalEditForm = {
  name: string
  targetAmount: string
  targetDate: string
  linkedBudgetCategoryId: string
}

type SparingGoalDetailModalProps = {
  detailGoal: SavingsGoal
  onClose: () => void
  editInModal: boolean
  setEditInModal: (v: boolean) => void
  editForm: SparingGoalEditForm
  setEditForm: React.Dispatch<React.SetStateAction<SparingGoalEditForm>>
  spareCategories: BudgetCategory[]
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  activeProfileId: string
  onSaveEdit: () => void
}

export default function SparingGoalDetailModal({
  detailGoal,
  onClose,
  editInModal,
  setEditInModal,
  editForm,
  setEditForm,
  spareCategories,
  transactions,
  budgetCategories,
  activeProfileId,
  onSaveEdit,
}: SparingGoalDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sparing-detail-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 border-b p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id="sparing-detail-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {detailGoal.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 outline-none transition-colors hover:opacity-80"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
          {!editInModal ? (
            <>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Spart</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  {formatNOK(
                    getEffectiveCurrentAmount(detailGoal, transactions, budgetCategories, activeProfileId),
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditInModal(true)}
                className="text-sm font-medium"
                style={{ color: 'var(--primary)' }}
              >
                Rediger mål
              </button>

              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Aktivitet
                </h3>
                {getGoalActivityRows(detailGoal, transactions, budgetCategories, activeProfileId).length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ingen innskudd registrert ennå.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {getGoalActivityRows(detailGoal, transactions, budgetCategories, activeProfileId).map((row) =>
                      row.kind === 'transaction' ? (
                        <li
                          key={row.tx.id}
                          className="flex justify-between gap-2 text-sm rounded-lg px-3 py-2"
                          style={{ background: 'var(--bg)' }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            {row.tx.date} · {row.tx.description}
                          </span>
                          <span className="shrink-0 font-medium" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.tx.amount)}
                          </span>
                        </li>
                      ) : (
                        <li
                          key={row.id}
                          className="flex justify-between gap-2 text-sm rounded-lg px-3 py-2"
                          style={{ background: 'var(--bg)' }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            {row.date}
                            {row.note ? ` · ${row.note}` : ''}
                          </span>
                          <span className="shrink-0 font-medium" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.amount)}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <input
                placeholder="Navn"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                placeholder="Målbeløp"
                type="number"
                value={editForm.targetAmount}
                onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                type="date"
                value={editForm.targetDate}
                onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Koble til budsjettkategori
                </label>
                <select
                  value={editForm.linkedBudgetCategoryId}
                  onChange={(e) => setEditForm({ ...editForm, linkedBudgetCategoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="">Ingen kobling</option>
                  {spareCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  Lagre
                </button>
                <button
                  type="button"
                  onClick={() => setEditInModal(false)}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
