'use client'

import type { BudgetCategory, SavingsGoal, Transaction } from '@/lib/store'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { calcProgress, formatThousands, parseThousands } from '@/lib/utils'
import {
  buildSavingsGoalPaceSummary,
  getEffectiveCurrentAmount,
  getGoalActivityRows,
} from '@/lib/savingsDerived'
import { SPARING_LINK_NEW_DEDICATED } from '@/lib/savingsBudgetLink'
import { useFormattedThousandsInput } from '@/lib/useFormattedThousandsInput'
import { Calendar, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type SparingGoalEditForm = {
  name: string
  targetAmount: string
  targetDate: string
  linkedBudgetCategoryId: string
}

type ActivityEdit = { kind: 'transaction'; id: string } | { kind: 'deposit'; id: string }

type SparingGoalDetailModalProps = {
  detailGoal: SavingsGoal
  onClose: () => void
  editInModal: boolean
  setEditInModal: (v: boolean) => void
  editForm: SparingGoalEditForm
  setEditForm: React.Dispatch<React.SetStateAction<SparingGoalEditForm>>
  onEditTargetAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  spareCategories: BudgetCategory[]
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  activeProfileId: string
  onSaveEdit: () => void
  onDeposit: (goal: SavingsGoal, amount: number, note: string, dateIso: string) => void
  updateTransaction: (id: string, patch: Partial<Pick<Transaction, 'date' | 'description' | 'amount'>>) => void
  removeTransaction: (id: string) => void
  onEditUnlinkedDeposit: (
    goal: SavingsGoal,
    depositId: string,
    next: { amount: number; date: string; note?: string },
  ) => void
  onDeleteUnlinkedDeposit: (goal: SavingsGoal, depositId: string) => void
}

export default function SparingGoalDetailModal({
  detailGoal,
  onClose,
  editInModal,
  setEditInModal,
  editForm,
  setEditForm,
  onEditTargetAmountChange,
  spareCategories,
  transactions,
  budgetCategories,
  activeProfileId,
  onSaveEdit,
  onDeposit,
  updateTransaction,
  removeTransaction,
  onEditUnlinkedDeposit,
  onDeleteUnlinkedDeposit,
}: SparingGoalDetailModalProps) {
  const { formatNOK } = useNokDisplayFormatters()
  const [newDepAmount, setNewDepAmount] = useState('')
  const { onChange: onNewDepAmountChange } = useFormattedThousandsInput(newDepAmount, setNewDepAmount)
  const [newDepNote, setNewDepNote] = useState('')
  const [newDepDate, setNewDepDate] = useState(() => new Date().toISOString().split('T')[0]!)

  const [activityEdit, setActivityEdit] = useState<ActivityEdit | null>(null)
  const [editAmountStr, setEditAmountStr] = useState('')
  const { onChange: onEditAmountChange } = useFormattedThousandsInput(editAmountStr, setEditAmountStr)
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    setNewDepAmount('')
    setNewDepNote('')
    setNewDepDate(new Date().toISOString().split('T')[0]!)
    setActivityEdit(null)
  }, [detailGoal.id])

  useEffect(() => {
    if (!activityEdit) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivityEdit(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activityEdit])

  const rows = getGoalActivityRows(detailGoal, transactions, budgetCategories, activeProfileId)

  const { effectiveSaved, progressPct, pace } = useMemo(() => {
    const effectiveSaved = getEffectiveCurrentAmount(
      detailGoal,
      transactions,
      budgetCategories,
      activeProfileId,
    )
    const progressPct = Math.round(calcProgress(effectiveSaved, detailGoal.targetAmount))
    const remainingToTarget = detailGoal.targetAmount - effectiveSaved
    const pace = buildSavingsGoalPaceSummary(remainingToTarget, detailGoal.targetDate)
    return { effectiveSaved, progressPct, pace }
  }, [detailGoal, transactions, budgetCategories, activeProfileId])

  const startEditRow = (row: (typeof rows)[number]) => {
    if (row.kind === 'transaction') {
      setActivityEdit({ kind: 'transaction', id: row.tx.id })
      setEditAmountStr(row.tx.amount > 0 ? formatThousands(String(row.tx.amount)) : '')
      setEditDate(row.tx.date)
      setEditNote(row.tx.description)
    } else {
      setActivityEdit({ kind: 'deposit', id: row.id })
      setEditAmountStr(row.amount > 0 ? formatThousands(String(row.amount)) : '')
      setEditDate(row.date)
      setEditNote(row.note ?? '')
    }
  }

  const saveActivityEdit = () => {
    if (!activityEdit) return
    const amt = parseThousands(editAmountStr)
    if (amt <= 0) return
    if (activityEdit.kind === 'transaction') {
      updateTransaction(activityEdit.id, {
        amount: amt,
        date: editDate,
        description: editNote.trim() || 'Innskudd sparing',
      })
    } else {
      onEditUnlinkedDeposit(detailGoal, activityEdit.id, {
        amount: amt,
        date: editDate,
        note: editNote.trim() || undefined,
      })
    }
    setActivityEdit(null)
  }

  const deleteActivityRow = (row: (typeof rows)[number]) => {
    if (row.kind === 'transaction') {
      if (!window.confirm('Slette denne transaksjonen?')) return
      removeTransaction(row.tx.id)
    } else {
      onDeleteUnlinkedDeposit(detailGoal, row.id)
    }
    setActivityEdit(null)
  }

  const submitNewDeposit = () => {
    const amt = parseThousands(newDepAmount)
    if (amt <= 0 || !newDepDate) return
    onDeposit(detailGoal, amt, newDepNote, newDepDate)
    setNewDepAmount('')
    setNewDepNote('')
    setNewDepDate(new Date().toISOString().split('T')[0]!)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]"
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
          className="flex items-start justify-between gap-3 border-b p-4 sm:p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            id="sparing-detail-title"
            className="min-w-0 flex-1 break-words text-lg font-semibold pr-2"
            style={{ color: 'var(--text)' }}
          >
            {detailGoal.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5">
          {!editInModal ? (
            <>
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl p-4"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Mål
                  </p>
                  <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                    {formatNOK(detailGoal.targetAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Spart
                  </p>
                  <p className="text-base font-semibold" style={{ color: 'var(--primary)' }}>
                    {formatNOK(effectiveSaved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Ferdig
                  </p>
                  <p className="text-base font-semibold" style={{ color: 'var(--success)' }}>
                    {progressPct}%
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 space-y-2 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                {pace.status === 'no_date' && (
                  <>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Sett en måldato under «Rediger mål» for å se anbefalt sparing per uke eller måned.
                    </p>
                    {pace.remainingNok > 0 && (
                      <p style={{ color: 'var(--text)' }}>
                        Gjenstår: <strong>{formatNOK(pace.remainingNok)}</strong>
                      </p>
                    )}
                  </>
                )}
                {pace.status === 'goal_met' && (
                  <p style={{ color: 'var(--success)' }}>Gratulerer — målet er nådd.</p>
                )}
                {pace.status === 'past_date' && (
                  <>
                    <p style={{ color: 'var(--text)' }}>Måldato er passert.</p>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Gjenstår: <strong style={{ color: 'var(--text)' }}>{formatNOK(pace.remainingNok)}</strong>
                    </p>
                  </>
                )}
                {pace.status === 'ok' && pace.daysLeft !== null && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} aria-hidden />
                      <span style={{ color: 'var(--text)' }}>
                        {pace.daysLeft} {pace.daysLeft === 1 ? 'dag' : 'dager'} igjen
                      </span>
                    </div>
                    {pace.weeklyNok !== null && pace.monthlyNok !== null && (
                      <>
                        <p style={{ color: 'var(--text)' }}>
                          Ca. <strong>{formatNOK(pace.weeklyNok)}</strong> per uke eller{' '}
                          <strong>{formatNOK(pace.monthlyNok)}</strong> per måned for å nå målet.
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Omtrentlig, jevnt fordelt over tiden som gjenstår.
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setEditInModal(true)}
                className="-mx-1 min-h-[44px] rounded-lg px-2 text-left text-sm font-medium touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                style={{ color: 'var(--primary)' }}
              >
                Rediger mål
              </button>

              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Nytt innskudd
                </h3>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Beløp"
                  value={newDepAmount}
                  onChange={onNewDepAmountChange}
                  aria-label="Beløp for nytt innskudd"
                  className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
                <input
                  type="date"
                  value={newDepDate}
                  onChange={(e) => setNewDepDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
                <input
                  placeholder="Kommentar (valgfritt)"
                  value={newDepNote}
                  onChange={(e) => setNewDepNote(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
                <button
                  type="button"
                  onClick={submitNewDeposit}
                  className="min-h-[44px] w-full touch-manipulation rounded-xl py-2.5 text-base font-medium text-white sm:text-sm"
                  style={{ background: 'var(--primary)' }}
                >
                  Registrer innskudd
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Aktivitet
                </h3>
                {rows.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ingen innskudd registrert ennå.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {rows.map((row) => {
                      const key = row.kind === 'transaction' ? row.tx.id : row.id
                      const isEditing =
                        activityEdit &&
                        ((activityEdit.kind === 'transaction' &&
                          row.kind === 'transaction' &&
                          activityEdit.id === row.tx.id) ||
                          (activityEdit.kind === 'deposit' &&
                            row.kind === 'deposit' &&
                            activityEdit.id === row.id))

                      if (isEditing) {
                        return (
                          <li
                            key={key}
                            className="rounded-lg px-3 py-3 space-y-2"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editAmountStr}
                              onChange={onEditAmountChange}
                              aria-label="Beløp"
                              className="min-h-[44px] w-full rounded-lg px-3 py-2.5 text-base sm:text-sm"
                              style={{
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)',
                              }}
                            />
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="min-h-[44px] w-full rounded-lg px-3 py-2.5 text-base sm:text-sm"
                              style={{
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)',
                              }}
                            />
                            <input
                              placeholder="Beskrivelse / notat"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              className="min-h-[44px] w-full rounded-lg px-3 py-2.5 text-base sm:text-sm"
                              style={{
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                color: 'var(--text)',
                              }}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={saveActivityEdit}
                                className="min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium text-white touch-manipulation sm:flex-initial"
                                style={{ background: 'var(--primary)' }}
                              >
                                Lagre
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivityEdit(null)}
                                className="min-h-[44px] rounded-lg border px-4 text-sm touch-manipulation sm:min-w-[5rem]"
                                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                              >
                                Avbryt
                              </button>
                            </div>
                          </li>
                        )
                      }

                      return (
                        <li
                          key={key}
                          className="flex min-w-0 items-center gap-1 text-sm rounded-lg px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2"
                          style={{ background: 'var(--bg)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <span style={{ color: 'var(--text-muted)' }}>
                              {row.kind === 'transaction' ? (
                                <>
                                  {row.tx.date} · {row.tx.description}
                                </>
                              ) : (
                                <>
                                  {row.date}
                                  {row.note ? ` · ${row.note}` : ''}
                                </>
                              )}
                            </span>
                          </div>
                          <span className="shrink-0 font-medium" style={{ color: 'var(--text)' }}>
                            {row.kind === 'transaction' ? formatNOK(row.tx.amount) : formatNOK(row.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditRow(row)}
                            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
                            aria-label="Rediger linje"
                          >
                            <Pencil size={18} style={{ color: 'var(--text-muted)' }} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteActivityRow(row)}
                            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation"
                            aria-label="Slett linje"
                          >
                            <Trash2 size={18} style={{ color: 'var(--text-muted)' }} aria-hidden />
                          </button>
                        </li>
                      )
                    })}
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
                className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                placeholder="Målbeløp"
                type="text"
                inputMode="numeric"
                value={editForm.targetAmount}
                onChange={onEditTargetAmountChange}
                className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                type="date"
                value={editForm.targetDate}
                onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Koble til budsjettkategori
                </label>
                <select
                  value={editForm.linkedBudgetCategoryId}
                  onChange={(e) => setEditForm({ ...editForm, linkedBudgetCategoryId: e.target.value })}
                  className="min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2.5 text-base sm:text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  <option value={SPARING_LINK_NEW_DEDICATED}>
                    Egen budsjettlinje for dette målet
                  </option>
                  <option value="">Ingen kobling</option>
                  {spareCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  «Egen linje» oppretter en ny post under Sparing med samme navn som målet (eller bruker
                  eksisterende linje med det navnet). Innbetalinger her blir transaksjoner på den linjen.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="min-h-[44px] w-full rounded-xl px-4 text-base font-medium text-white touch-manipulation sm:w-auto sm:text-sm"
                  style={{ background: 'var(--primary)' }}
                >
                  Lagre
                </button>
                <button
                  type="button"
                  onClick={() => setEditInModal(false)}
                  className="min-h-[44px] w-full rounded-xl border px-4 text-base touch-manipulation sm:w-auto sm:text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
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
