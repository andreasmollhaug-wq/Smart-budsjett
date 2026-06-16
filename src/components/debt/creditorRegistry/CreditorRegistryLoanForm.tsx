'use client'

import { useState } from 'react'
import type { CreditorRegistryLoan, CreditorRegistryLoanType } from '@/lib/creditorRegistry/types'
import FormattedAmountInput from '@/components/debt/FormattedAmountInput'

export type CreditorRegistryLoanFormPayload = Omit<CreditorRegistryLoan, 'id'>

const inputClass = 'w-full px-3 py-2 rounded-xl text-sm min-h-[44px]'
const labelClass = 'block text-xs font-medium mb-1'
const labelStyle = { color: 'var(--text-muted)' } as const

type FormState = {
  name: string
  type: CreditorRegistryLoanType
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  note: string
}

function defaultFormState(initial?: Partial<CreditorRegistryLoanFormPayload>): FormState {
  return {
    name: initial?.name ?? '',
    type: initial?.type ?? 'loan',
    remainingAmount: initial?.remainingAmount ?? 0,
    interestRate: initial?.interestRate ?? 0,
    monthlyPayment: initial?.monthlyPayment ?? 0,
    note: initial?.note ?? '',
  }
}

type Props = {
  heading: string
  submitLabel?: string
  initialValues?: Partial<CreditorRegistryLoanFormPayload>
  onSubmit: (payload: CreditorRegistryLoanFormPayload) => void
  onCancel: () => void
  onDelete?: () => void
}

export default function CreditorRegistryLoanForm({
  heading,
  submitLabel = 'Lagre',
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [form, setForm] = useState<FormState>(() => defaultFormState(initialValues))

  const handleSubmit = () => {
    if (!form.name.trim() || form.remainingAmount <= 0) return
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      remainingAmount: form.remainingAmount,
      interestRate: form.interestRate,
      monthlyPayment: form.monthlyPayment,
      note: form.note.trim() || undefined,
    })
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
            placeholder="Navn på lånet"
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
            onChange={(e) => setForm({ ...form, type: e.target.value as CreditorRegistryLoanType })}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            Rente (%)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.interestRate || ''}
            onChange={(e) => setForm({ ...form, interestRate: parseFloat(e.target.value) || 0 })}
            className={inputClass}
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            placeholder="Nominell årsrente"
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>
            Notat (valgfritt)
          </label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            placeholder="Vilkår, kommentar …"
            className={`${inputClass} min-h-[72px] resize-y`}
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl px-4 text-sm font-medium border touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.name.trim() || form.remainingAmount <= 0}
            className="min-h-[44px] rounded-xl px-5 text-sm font-medium text-white touch-manipulation disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {submitLabel}
          </button>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[44px] rounded-xl px-4 text-sm font-medium touch-manipulation self-start"
            style={{ color: 'var(--danger)' }}
          >
            Slett lån
          </button>
        )}
      </div>
    </div>
  )
}
