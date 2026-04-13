'use client'

import { useState, useCallback } from 'react'
import type { Debt } from '@/lib/store'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'

export type AddDebtFormPayload = Omit<Debt, 'id' | 'sourceProfileId'>

const inputClass = 'w-full px-3 py-2 rounded-xl text-sm'
const labelClass = 'block text-xs font-medium mb-1'
const labelStyle = { color: 'var(--text-muted)' } as const

type FormState = {
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
}

function defaultFormState(): FormState {
  return {
    name: '',
    type: 'loan',
    totalAmount: 0,
    remainingAmount: 0,
    interestRate: 0,
    monthlyPayment: 0,
    note: '',
    repaymentPaused: false,
    pauseEndDate: '',
    includeInSnowball: true,
  }
}

type Props = {
  heading: string
  submitLabel?: string
  onSubmit: (payload: AddDebtFormPayload) => void
  onCancel: () => void
}

export default function AddDebtForm({ heading, submitLabel = 'Legg til', onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(defaultFormState)

  const reset = useCallback(() => {
    setForm(defaultFormState())
  }, [])

  const handleSubmit = () => {
    if (!form.name.trim() || form.remainingAmount <= 0) return
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      totalAmount: form.totalAmount,
      remainingAmount: form.remainingAmount,
      interestRate: form.interestRate,
      monthlyPayment: form.monthlyPayment,
      note: form.note.trim() || undefined,
      repaymentPaused: form.repaymentPaused,
      pauseEndDate: form.pauseEndDate || undefined,
      includeInSnowball: form.includeInSnowball,
    })
    reset()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
        {heading}
      </h3>
      <div className="space-y-3">
        <div>
          <label className={labelClass} style={labelStyle}>
            Navn
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Navn"
            className={inputClass}
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as Debt['type']
              setForm({ ...form, type, includeInSnowball: type !== 'mortgage' })
            }}
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
            checked={form.includeInSnowball}
            onChange={(e) => setForm({ ...form, includeInSnowball: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Ta med i snøball
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              Opprinnelig beløp
            </label>
            <FormattedAmountInput
              value={form.totalAmount}
              onChange={(n) => setForm({ ...form, totalAmount: n })}
              className={inputClass}
              placeholder="Opprinnelig beløp"
              aria-label="Opprinnelig beløp"
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              Restgjeld
            </label>
            <FormattedAmountInput
              value={form.remainingAmount}
              onChange={(n) => setForm({ ...form, remainingAmount: n })}
              className={inputClass}
              placeholder="Restgjeld"
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
              value={form.interestRate || ''}
              onChange={(e) =>
                setForm({ ...form, interestRate: e.target.value === '' ? 0 : Number(e.target.value) })
              }
              className={inputClass}
              placeholder="Rente (%)"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              Månedlig avdrag
            </label>
            <FormattedAmountInput
              value={form.monthlyPayment}
              onChange={(n) => setForm({ ...form, monthlyPayment: n })}
              className={inputClass}
              placeholder="Månedlig avdrag"
              aria-label="Månedlig avdrag"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>
            Notat
          </label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
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
            For egen oversikt (f.eks. studielån eller avdragsfri periode). Påvirker ikke beregninger automatisk.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.repaymentPaused}
              onChange={(e) => setForm({ ...form, repaymentPaused: e.target.checked })}
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
              value={form.pauseEndDate}
              onChange={(e) => setForm({ ...form, pauseEndDate: e.target.value })}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
