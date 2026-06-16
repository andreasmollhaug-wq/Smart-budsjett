'use client'

import { useEffect } from 'react'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import type { CreditorRegistryChecklistItem } from '@/lib/creditorRegistry/checklist'
import { CREDITOR_REGISTRY_CHECKLIST_STEP_COUNT } from '@/lib/creditorRegistry/checklist'
import { X } from 'lucide-react'

type Props = {
  item: CreditorRegistryChecklistItem | null
  readOnly: boolean
  unlocked: boolean
  onClose: () => void
  onCta: () => void
  onManualComplete?: () => void
}

export default function CreditorRegistryChecklistDetailModal({
  item,
  readOnly,
  unlocked,
  onClose,
  onCta,
  onManualComplete,
}: Props) {
  const backdropDismiss = useModalBackdropDismiss(onClose)

  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [item, onClose])

  if (!item) return null

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
        aria-labelledby="cr-checklist-detail-title"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Steg {item.stepNumber} av {CREDITOR_REGISTRY_CHECKLIST_STEP_COUNT}
            </p>
            <h2 id="cr-checklist-detail-title" className="font-semibold text-lg mt-0.5" style={{ color: 'var(--text)' }}>
              {item.title}
            </h2>
          </div>
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
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {item.detailText}
          </p>
          {item.done ? (
            <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {item.statusKind === 'override' ? 'Markert som ferdig.' : 'Fullført.'}
            </p>
          ) : !unlocked ? (
            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              Fullfør forrige steg først.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    onCta()
                    onClose()
                  }}
                  className="min-h-[44px] rounded-xl px-5 text-sm font-medium text-white touch-manipulation"
                  style={{ background: 'var(--primary)' }}
                >
                  {item.ctaLabel}
                </button>
              )}
              {item.allowManualComplete && !readOnly && onManualComplete && (
                <button
                  type="button"
                  onClick={() => {
                    onManualComplete()
                    onClose()
                  }}
                  className="min-h-[44px] rounded-xl px-4 text-sm font-medium border touch-manipulation"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Marker som ferdig
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
