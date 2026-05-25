'use client'

import { useMemo, useState } from 'react'
import AddDebtForm, { type AddDebtFormPayload } from '@/components/debt/AddDebtForm'
import type { Debt } from '@/lib/store'
import { useActivePersonFinance } from '@/lib/store'
import { generateId } from '@/lib/utils'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  initial: {
    name: string
    remainingAmount: number
    interestRate: number
    monthlyPayment: number
  }
  existingStudentLoans: Debt[]
}

export default function StudielanSaveToDebtModal({
  open,
  onClose,
  initial,
  existingStudentLoans,
}: Props) {
  const { addDebt, updateDebt, isHouseholdAggregate } = useActivePersonFinance()
  const [mode, setMode] = useState<'new' | 'update'>(existingStudentLoans.length > 0 ? 'update' : 'new')
  const [selectedDebtId, setSelectedDebtId] = useState(existingStudentLoans[0]?.id ?? '')

  const formInitial = useMemo(
    (): Partial<AddDebtFormPayload> => ({
      name: initial.name,
      type: 'student_loan',
      totalAmount: initial.remainingAmount,
      remainingAmount: initial.remainingAmount,
      interestRate: initial.interestRate,
      monthlyPayment: initial.monthlyPayment,
      includeInSnowball: true,
    }),
    [initial],
  )

  if (!open || isHouseholdAggregate) return null

  const handleSubmit = (payload: AddDebtFormPayload) => {
    if (mode === 'update' && selectedDebtId) {
      updateDebt(selectedDebtId, {
        ...payload,
        type: 'student_loan',
      })
    } else {
      addDebt({
        id: generateId(),
        ...payload,
        type: 'student_loan',
      })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="studielan-save-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="studielan-save-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Lagre til gjeld
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl touch-manipulation"
            aria-label="Lukk"
          >
            <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {existingStudentLoans.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode('new')}
                className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium touch-manipulation border"
                style={{
                  borderColor: mode === 'new' ? 'var(--primary)' : 'var(--border)',
                  background: mode === 'new' ? 'var(--primary-pale)' : 'var(--surface)',
                  color: mode === 'new' ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                Nytt studielån
              </button>
              <button
                type="button"
                onClick={() => setMode('update')}
                className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium touch-manipulation border"
                style={{
                  borderColor: mode === 'update' ? 'var(--primary)' : 'var(--border)',
                  background: mode === 'update' ? 'var(--primary-pale)' : 'var(--surface)',
                  color: mode === 'update' ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                Oppdater eksisterende
              </button>
            </div>
            {mode === 'update' && (
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {existingStudentLoans.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.remainingAmount.toLocaleString('nb-NO')} kr)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <AddDebtForm
          heading=""
          submitLabel={mode === 'update' ? 'Oppdater lån' : 'Legg til lån'}
          initialValues={formInitial}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
