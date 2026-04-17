'use client'
import { useEffect, useState } from 'react'
import type { Debt } from '@/lib/store'
import { useStore } from '@/lib/store'
import { defaultSyncBudgetFromMonth1ForBudgetYear } from '@/lib/debtBudgetSync'
import { BUDGET_MONTH_LABELS_NB } from '@/lib/utils'
import { effectiveIncludeInSnowball } from '@/lib/snowball'
import { debtTypeLabels, debtColors, debtIcons } from '@/lib/debtDisplay'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'
import DayOfMonthInput from '@/components/ui/DayOfMonthInput'
import { X, Trash2 } from 'lucide-react'

type Draft = {
  name: string
  type: Debt['type']
  totalAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  note: string
  repaymentPaused: boolean
  pauseEndDate: string
  includeInSnowball: boolean
  syncToBudget: boolean
  syncPlannedTransactions: boolean
  plannedPaymentDayOfMonth: number
  syncBudgetFromMonth1: number
}

function debtToDraft(d: Debt, budgetYear: number): Draft {
  return {
    name: d.name,
    type: d.type,
    totalAmount: d.totalAmount,
    remainingAmount: d.remainingAmount,
    interestRate: d.interestRate,
    monthlyPayment: d.monthlyPayment,
    note: d.note ?? '',
    repaymentPaused: d.repaymentPaused ?? false,
    pauseEndDate: d.pauseEndDate ?? '',
    includeInSnowball: effectiveIncludeInSnowball(d),
    syncToBudget: d.syncToBudget === true,
    syncPlannedTransactions: d.syncPlannedTransactions === true,
    plannedPaymentDayOfMonth: d.plannedPaymentDayOfMonth ?? 1,
    syncBudgetFromMonth1: d.syncBudgetFromMonth1 ?? defaultSyncBudgetFromMonth1ForBudgetYear(budgetYear),
  }
}

type Props = {
  debt: Debt | null
  open: boolean
  onClose: () => void
  readOnly: boolean
  householdHint?: boolean
  onSave: (id: string, data: Partial<Debt>) => void
  onDelete: (id: string) => void
}

export default function DebtDetailModal({
  debt,
  open,
  onClose,
  readOnly,
  householdHint,
  onSave,
  onDelete,
}: Props) {
  const budgetYear = useStore((s) => s.budgetYear)
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (open && debt) setDraft(debtToDraft(debt, budgetYear))
  }, [open, debt?.id, debt, budgetYear])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !debt || !draft) return null

  const Icon = debtIcons[draft.type]
  const color = debtColors[draft.type]

  const handleSave = () => {
    if (readOnly) return
    onSave(debt.id, {
      name: draft.name.trim() || debt.name,
      type: draft.type,
      totalAmount: draft.totalAmount,
      remainingAmount: draft.remainingAmount,
      interestRate: draft.interestRate,
      monthlyPayment: draft.monthlyPayment,
      note: draft.note.trim() || undefined,
      repaymentPaused: draft.repaymentPaused,
      pauseEndDate: draft.pauseEndDate || undefined,
      includeInSnowball: draft.includeInSnowball,
      syncToBudget: draft.syncToBudget,
      syncPlannedTransactions: draft.syncToBudget && draft.syncPlannedTransactions,
      plannedPaymentDayOfMonth:
        draft.syncToBudget && draft.syncPlannedTransactions ? draft.plannedPaymentDayOfMonth : undefined,
      syncBudgetFromMonth1: draft.syncToBudget ? draft.syncBudgetFromMonth1 : undefined,
    })
    onClose()
  }

  const handleDelete = () => {
    if (readOnly) return
    if (typeof window !== 'undefined' && !window.confirm('Slette denne gjelden?')) return
    onDelete(debt.id)
    onClose()
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl text-sm'
  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--text-muted)' } as const

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget && e.button === 0) onClose()
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg min-w-0 rounded-2xl p-6 pt-6 shadow-xl max-h-[90vh] overflow-x-hidden overflow-y-auto pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom)))]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-detail-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color + '20' }}
            >
              <Icon size={20} style={{ color }} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="debt-detail-title" className="font-semibold text-lg truncate" style={{ color: 'var(--text)' }}>
                {debt.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {debtTypeLabels[draft.type]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation"
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
            Du ser aggregert husholdning. Bytt til én profil for å redigere gjeld.
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              Navn
            </label>
            <input
              type="text"
              value={draft.name}
              disabled={readOnly}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Type
            </label>
            <select
              value={draft.type}
              disabled={readOnly}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as Debt['type'] })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            >
              <option value="mortgage">Boliglån</option>
              <option value="loan">Lån</option>
              <option value="consumer_loan">Forbrukslån</option>
              <option value="refinancing">Refinansiering</option>
              <option value="student_loan">Studielån</option>
              <option value="credit_card">Kredittkort</option>
              <option value="other">Annet</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.includeInSnowball}
              disabled={readOnly}
              onChange={(e) => setDraft({ ...draft, includeInSnowball: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              Ta med i snøball
            </span>
          </label>

          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Budsjett og transaksjoner
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.syncToBudget}
                disabled={readOnly}
                onChange={(e) => {
                  const on = e.target.checked
                  setDraft({
                    ...draft,
                    syncToBudget: on,
                    syncPlannedTransactions: on ? draft.syncPlannedTransactions : false,
                    syncBudgetFromMonth1: on
                      ? draft.syncBudgetFromMonth1 || defaultSyncBudgetFromMonth1ForBudgetYear(budgetYear)
                      : draft.syncBudgetFromMonth1,
                  })
                }}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                Legg inn i budsjett under Gjeld
              </span>
            </label>
            {draft.syncToBudget && (
              <div>
                <label className={labelClass} style={labelStyle}>
                  Gjelder fra og med måned (budsjettår {budgetYear})
                </label>
                <select
                  value={draft.syncBudgetFromMonth1}
                  disabled={readOnly}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      syncBudgetFromMonth1: Math.min(12, Math.max(1, Number(e.target.value))),
                    })
                  }
                  className={inputClass}
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  {BUDGET_MONTH_LABELS_NB.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.syncPlannedTransactions}
                disabled={readOnly || !draft.syncToBudget}
                onChange={(e) => setDraft({ ...draft, syncPlannedTransactions: e.target.checked })}
                className="rounded"
              />
              <span
                className="text-sm"
                style={{ color: draft.syncToBudget ? 'var(--text)' : 'var(--text-muted)' }}
              >
                Planlagte månedlige betalinger som transaksjoner (dette budsjettåret)
              </span>
            </label>
            {draft.syncToBudget && draft.syncPlannedTransactions && (
              <div>
                <label className={labelClass} style={labelStyle}>
                  Dag i måneden (1–31)
                </label>
                <DayOfMonthInput
                  value={draft.plannedPaymentDayOfMonth}
                  disabled={readOnly}
                  onCommit={(n) => setDraft({ ...draft, plannedPaymentDayOfMonth: n })}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>
                Opprinnelig beløp
              </label>
              <FormattedAmountInput
                value={draft.totalAmount}
                disabled={readOnly}
                onChange={(n) => setDraft({ ...draft, totalAmount: n })}
                className={inputClass}
                aria-label="Opprinnelig beløp"
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Restgjeld
              </label>
              <FormattedAmountInput
                value={draft.remainingAmount}
                disabled={readOnly}
                onChange={(n) => setDraft({ ...draft, remainingAmount: n })}
                className={inputClass}
                aria-label="Restgjeld"
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Rente (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={readOnly}
                value={draft.interestRate || ''}
                onChange={(e) =>
                  setDraft({ ...draft, interestRate: e.target.value === '' ? 0 : Number(e.target.value) })
                }
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Månedlig avdrag
              </label>
              <FormattedAmountInput
                value={draft.monthlyPayment}
                disabled={readOnly}
                onChange={(n) => setDraft({ ...draft, monthlyPayment: n })}
                className={inputClass}
                aria-label="Månedlig avdrag"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Notat
            </label>
            <textarea
              value={draft.note}
              disabled={readOnly}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              rows={3}
              placeholder="Vilkår, bank, egen kommentar …"
              className={`${inputClass} resize-y min-h-[4rem]`}
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Nedbetalingspause
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Synket budsjett og planlagte trekk følger måned for måned: måneder før gjenopptak (dagen etter
              «pause til») vises som 0 kr. Måneder der avdrag kan starte igjen bruker avtalt månedlig beløp,
              sammen med «synk fra måned».
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.repaymentPaused}
                disabled={readOnly}
                onChange={(e) => setDraft({ ...draft, repaymentPaused: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                Avdrag pauset
              </span>
            </label>
            <div>
              <label className={labelClass} style={labelStyle}>
                Pause til (dato)
              </label>
              <input
                type="date"
                value={draft.pauseEndDate}
                disabled={readOnly}
                onChange={(e) => setDraft({ ...draft, pauseEndDate: e.target.value })}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center touch-manipulation px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Lagre
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 touch-manipulation px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--danger)', border: '1px solid var(--border)' }}
              >
                <Trash2 size={16} />
                Slett
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center touch-manipulation px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {readOnly ? 'Lukk' : 'Avbryt'}
          </button>
        </div>
      </div>
    </div>
  )
}
