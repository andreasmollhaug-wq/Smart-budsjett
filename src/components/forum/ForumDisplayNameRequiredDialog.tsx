'use client'

import Link from 'next/link'
import { useEffect, useId, useRef } from 'react'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

const profilHref = `${FORUM_BASE_PATH}/profil`

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
export function ForumDisplayNameRequiredNativeDialog({ nativeId }: { nativeId: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const close = () => ref.current?.close()

  return (
    <dialog
      ref={ref}
      id={nativeId}
      className={displayNameDialogClassName}
      style={{ borderColor: 'var(--border)' }}
      aria-labelledby={titleId}
    >
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h2 id={titleId} className="text-base font-bold leading-snug">
          Forumnavn kreves
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Velg et visningsnavn på forumprofilen din før du kan gi tommel opp eller skrive i forumet.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onPointerDown={close}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={profilHref}
            onPointerDown={close}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--cta-gradient)' }}
          >
            Gå til forumprofil
          </Link>
        </div>
      </div>
    </dialog>
  )
}

export default function ForumDisplayNameRequiredDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
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
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h2 id={titleId} className="text-base font-bold leading-snug">
          Forumnavn kreves
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Velg et visningsnavn på forumprofilen din før du kan gi tommel opp eller skrive i forumet.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onPointerDown={() => onClose()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 text-sm font-medium touch-manipulation"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            Lukk
          </button>
          <Link
            href={profilHref}
            onPointerDown={() => onClose()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-white touch-manipulation"
            style={{ background: 'var(--cta-gradient)' }}
          >
            Gå til forumprofil
          </Link>
        </div>
      </div>
    </dialog>
  )
}
