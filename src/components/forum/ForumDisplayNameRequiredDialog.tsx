'use client'

import { useEffect, useId, useRef } from 'react'
import ForumDisplayNameQuickForm from '@/components/forum/ForumDisplayNameQuickForm'

const displayNameDialogClassName =
  'fixed inset-0 left-1/2 top-[min(50dvh,max(47dvh,calc(env(safe-area-inset-top,0)+45dvh)))] z-[60] ' +
  'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,12px)-1.25rem))] w-[min(26rem,calc(100vw-1.5rem))] ' +
  '-translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border p-0 [max-width:100vw] ' +
  'bg-[var(--surface)] text-[var(--text)] shadow-xl open:flex open:flex-col ' +
  '[&::backdrop]:bg-[color-mix(in_srgb,var(--text)_48%,transparent)]'

/** Samme suffiks som ForumNewThreadDialogHost bruker for native `<dialog id>`. */
export function forumDisplayNameGateDialogId(mainDialogId: string): string {
  return `${mainDialogId}-forum-display-name-gate`
}

/** Åpnes med `document.getElementById(nativeId)?.showModal()` fra søsken-knapper. */
export function ForumDisplayNameRequiredNativeDialog({
  nativeId,
  initialDisplayName = '',
  onAfterProfileSaved,
}: {
  nativeId: string
  /** Eksisterende råverdi fra forum_profile (kan være tomt eller for kort). */
  initialDisplayName?: string
  /** Etter vellykket lagring: f.eks. åpne «Ny tråd»-dialog. */
  onAfterProfileSaved?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const close = () => ref.current?.close()

  const handleSaved = () => {
    close()
    queueMicrotask(() => {
      onAfterProfileSaved?.()
    })
  }

  return (
    <dialog
      ref={ref}
      id={nativeId}
      className={displayNameDialogClassName}
      style={{ borderColor: 'var(--border)' }}
      aria-labelledby={titleId}
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] overscroll-contain touch-pan-y">
          <div>
            <h2 id={titleId} className="text-base font-bold leading-snug">
              Velg forumnavn før du deltar
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Skriv inn navnet du vil bruke her — så slipper du å gå via forumprofilen og tilbake igjen.
            </p>
          </div>
          <ForumDisplayNameQuickForm
            key={nativeId}
            initialDisplayName={initialDisplayName}
            onSaved={handleSaved}
            onCancel={close}
            submitLabel="Lagre og fortsett"
          />
        </div>
      </div>
    </dialog>
  )
}

export default function ForumDisplayNameRequiredDialog({
  open,
  onClose,
  initialDisplayName = '',
}: {
  open: boolean
  onClose: () => void
  initialDisplayName?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) d.showModal()
    else d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={displayNameDialogClassName}
      style={{ borderColor: 'var(--border)' }}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] overscroll-contain touch-pan-y">
          <div>
            <h2 id={titleId} className="text-base font-bold leading-snug">
              Velg forumnavn før du deltar
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Skriv inn navnet du vil bruke her — så kan du fortsette i forumet med en gang.
            </p>
          </div>
          <ForumDisplayNameQuickForm
            key={open ? 'open' : 'closed'}
            initialDisplayName={initialDisplayName}
            onSaved={onClose}
            onCancel={onClose}
            submitLabel="Lagre og fortsett"
          />
        </div>
      </div>
    </dialog>
  )
}
