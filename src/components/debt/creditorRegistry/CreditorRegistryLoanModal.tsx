'use client'

import { useEffect } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { CreditorRegistryLoan } from '@/lib/creditorRegistry/types'
import CreditorRegistryLoanForm, { type CreditorRegistryLoanFormPayload } from './CreditorRegistryLoanForm'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  mode: 'add' | 'edit'
  creditorName: string
  loan: CreditorRegistryLoan | null
  onClose: () => void
  onSave: (payload: CreditorRegistryLoanFormPayload) => void
  onDelete?: () => void
}

export default function CreditorRegistryLoanModal({
  open,
  mode,
  creditorName,
  loan,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const backdropDismiss = useModalBackdropDismiss(onClose)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const title = mode === 'add' ? `Nytt lån — ${creditorName}` : `Rediger lån — ${creditorName}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: 'rgba(15, 23, 42, 0.45)' }}
      role="presentation"
      {...backdropDismiss}
    >
      <div
        className="w-full max-w-lg min-w-0 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[min(92vh,900px)] flex flex-col overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr-loan-modal-title"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 id="cr-loan-modal-title" className="font-semibold text-base sm:text-lg min-w-0 pr-2" style={{ color: 'var(--text)' }}>
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
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
          <CreditorRegistryLoanForm
            key={loan?.id ?? 'new'}
            heading={mode === 'add' ? 'Legg til lån' : 'Oppdater lån'}
            submitLabel={mode === 'add' ? 'Legg til' : 'Lagre'}
            initialValues={loan ?? undefined}
            onSubmit={onSave}
            onCancel={onClose}
            onDelete={mode === 'edit' ? onDelete : undefined}
          />
        </div>
      </div>
    </div>
  )
}
