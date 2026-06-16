'use client'

import { useEffect, useState } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  initialName?: string
  title: string
  submitLabel: string
  onSubmit: (name: string) => void
  onClose: () => void
  addLoanLabel?: string
  onSubmitAndAddLoan?: (name: string) => void
}

export default function CreditorGroupNameModal({
  open,
  initialName = '',
  title,
  submitLabel,
  onSubmit,
  onClose,
  addLoanLabel,
  onSubmitAndAddLoan,
}: Props) {
  const [name, setName] = useState(initialName)
  const backdropDismiss = useModalBackdropDismiss(onClose)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

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
    onSubmit(trimmed)
  }

  const handleSubmitAndAddLoan = () => {
    const trimmed = name.trim()
    if (!trimmed || !onSubmitAndAddLoan) return
    onSubmitAndAddLoan(trimmed)
  }

  const showAddLoanAction = Boolean(addLoanLabel && onSubmitAndAddLoan)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      role="presentation"
      {...backdropDismiss}
    >
      <div
        className="w-full max-w-md min-w-0 rounded-t-2xl sm:rounded-2xl shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr-group-modal-title"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 id="cr-group-modal-title" className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl touch-manipulation shrink-0"
            aria-label="Lukk"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Kreditornavn
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="f.eks. SVEA, DNB, Bank Norwegian"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (showAddLoanAction) handleSubmitAndAddLoan()
                  else handleSubmit()
                }
              }}
            />
            {showAddLoanAction && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Du kan lagre kreditor alene, eller legge til første lån med én gang.
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl px-4 text-sm font-medium border touch-manipulation"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Avbryt
            </button>
            {showAddLoanAction && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="min-h-[44px] rounded-xl px-4 text-sm font-medium border touch-manipulation disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {submitLabel}
              </button>
            )}
            <button
              type="button"
              onClick={showAddLoanAction ? handleSubmitAndAddLoan : handleSubmit}
              disabled={!name.trim()}
              className="min-h-[44px] rounded-xl px-5 text-sm font-medium text-white touch-manipulation disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {showAddLoanAction ? addLoanLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
