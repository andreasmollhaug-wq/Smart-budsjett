'use client'

import type { BudgetCategory } from '@/lib/store'
import { SPARING_LINK_NEW_DEDICATED } from '@/lib/savingsBudgetLink'
import { parseThousands } from '@/lib/utils'
import { useFormattedThousandsInput } from '@/lib/useFormattedThousandsInput'
import { Target, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type NewSavingsGoalPayload = {
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  linkMode: 'none' | 'existing' | 'new_dedicated'
  /** Kun når linkMode === 'existing' */
  linkedBudgetCategoryId?: string
}

const emptyForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
  /** '' = ingen, SPARING_LINK_NEW_DEDICATED, eller eksisterende kategori-id */
  linkedBudgetCategoryId: '' as string,
}

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (payload: NewSavingsGoalPayload) => void
  spareCategories: BudgetCategory[]
}

export default function SparingNewGoalModal({ open, onClose, onCreate, spareCategories }: Props) {
  const [form, setForm] = useState(emptyForm)

  const { onChange: onTargetAmountChange } = useFormattedThousandsInput(form.targetAmount, (v) =>
    setForm((prev) => ({ ...prev, targetAmount: v })),
  )
  const { onChange: onCurrentAmountChange } = useFormattedThousandsInput(form.currentAmount, (v) =>
    setForm((prev) => ({ ...prev, currentAmount: v })),
  )

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const submit = () => {
    const targetParsed = parseThousands(form.targetAmount)
    if (!form.name.trim() || targetParsed <= 0) return
    const start = Math.max(0, parseThousands(form.currentAmount))
    const rawLink = form.linkedBudgetCategoryId
    let linkMode: NewSavingsGoalPayload['linkMode'] = 'none'
    let linkedBudgetCategoryId: string | undefined
    if (rawLink === SPARING_LINK_NEW_DEDICATED) {
      linkMode = 'new_dedicated'
    } else if (rawLink) {
      linkMode = 'existing'
      linkedBudgetCategoryId = rawLink
    }
    onCreate({
      name: form.name.trim(),
      targetAmount: targetParsed,
      currentAmount: start,
      targetDate: form.targetDate,
      linkMode,
      linkedBudgetCategoryId,
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sparing-new-goal-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b p-4 sm:p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            id="sparing-new-goal-title"
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: 'var(--text)' }}
          >
            <Target size={18} style={{ color: 'var(--primary)' }} />
            Nytt sparemål
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

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <input
              placeholder="Navn på mål"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              placeholder="Målbeløp (NOK)"
              type="text"
              inputMode="numeric"
              value={form.targetAmount}
              onChange={onTargetAmountChange}
              className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              placeholder="Startet med (NOK)"
              type="text"
              inputMode="numeric"
              value={form.currentAmount}
              onChange={onCurrentAmountChange}
              className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
              className="min-h-[44px] w-full rounded-xl px-3 py-2.5 text-base sm:text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <div className="col-span-2">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                Koble til budsjettkategori (valgfritt)
              </label>
              <select
                value={form.linkedBudgetCategoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, linkedBudgetCategoryId: e.target.value }))
                }
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
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={submit}
              className="min-h-[44px] w-full rounded-xl px-4 text-base font-medium text-white touch-manipulation sm:w-auto sm:text-sm"
              style={{ background: 'var(--primary)' }}
            >
              Opprett mål
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full rounded-xl border px-4 text-base font-medium touch-manipulation sm:w-auto sm:text-sm"
              style={{
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border)',
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
