'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ForumNewThreadForm from '@/components/forum/ForumNewThreadForm'
import type { ForumCategoryOption } from '@/components/forum/ForumNewThreadForm'

export type ForumCategoryOptionSerializable = ForumCategoryOption

/** Dialog + skjema for kategorisiden (én instans — åpnes med `ForumNewThreadModalOpenButton`). */
export function ForumNewThreadDialogHost({
  dialogId,
  categories,
  defaultCategoryId,
  autoOpenNy,
  cleanupNavigateHref,
}: {
  dialogId: string
  categories: ForumCategoryOption[]
  defaultCategoryId: string
  /** Når URL har `ny=1` (tidligere `/ny`-rute) — åpne modal ved første rendering */
  autoOpenNy?: boolean
  /** Ved lukking: navigér hit for å fjerne `ny=` fra URL (fra serverfeltet). */
  cleanupNavigateHref: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const router = useRouter()

  const closeDialog = () => {
    ref.current?.close()
  }

  useEffect(() => {
    if (autoOpenNy) ref.current?.showModal()
  }, [autoOpenNy])

  return (
    <dialog
      id={dialogId}
      ref={ref}
      className={
        'fixed inset-0 left-1/2 top-[min(50dvh,max(47dvh,calc(env(safe-area-inset-top,0)+45dvh)))] z-50 ' +
        'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,12px)-1.25rem))] w-[min(32rem,calc(100vw-1.5rem))] ' +
        '-translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border p-0 [max-width:100vw] ' +
        'bg-[var(--surface)] text-[var(--text)] shadow-xl open:flex open:flex-col ' +
        '[&::backdrop]:bg-[color-mix(in_srgb,var(--text)_48%,transparent)]'
      }
      style={{ borderColor: 'var(--border)' }}
      aria-labelledby={`${dialogId}-title`}
      onClose={() => {
        router.replace(cleanupNavigateHref, { scroll: false })
      }}
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id={`${dialogId}-title`} className="text-lg font-bold leading-tight tracking-tight">
            Ny tråd
          </h2>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-xl border text-lg font-semibold leading-none outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-muted)',
            }}
            aria-label="Lukk"
            onPointerDown={() => closeDialog()}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 overscroll-contain touch-pan-y">
          <ForumNewThreadForm
            categories={categories}
            defaultCategoryId={defaultCategoryId}
            layout="modal"
            onCancel={closeDialog}
            onPublished={closeDialog}
          />
        </div>
      </div>
    </dialog>
  )
}

/** Åpner dialogen registrert med `ForumNewThreadDialogHost` samme `dialogId`. */
export function ForumNewThreadModalOpenButton({
  dialogId,
  label,
  variant,
  className,
}: {
  dialogId: string
  label: string
  variant: 'button' | 'link'
  className?: string
}) {
  const open = () => {
    ;(typeof document !== 'undefined'
      ? (document.getElementById(dialogId) as HTMLDialogElement | null)
      : null
    )?.showModal()
  }

  const baseBtn =
    'inline-flex touch-manipulation items-center justify-center rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2'
  const linkCls = `${baseBtn} min-h-[44px] px-1 text-sm font-semibold underline underline-offset-2 decoration-[var(--primary)]`
  const buttonCls =
    `${baseBtn} min-h-[44px] shrink-0 border px-4 text-sm font-semibold ` +
    'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--surface),var(--primary-pale)_70%)] ' +
    'shadow-[0_1px_0_color-mix(in_srgb,var(--text)_5%,transparent)]'

  return (
    <button
      type="button"
      className={[variant === 'link' ? linkCls : buttonCls, className].filter(Boolean).join(' ')}
      style={variant === 'link' ? { color: 'var(--primary)' } : undefined}
      onPointerDown={(e) => {
        e.preventDefault()
        open()
      }}
    >
      {label}
    </button>
  )
}

const HOME_DIALOG_TITLE_ID = 'forum-new-thread-modal-home-title'

/** Selvstendig knapp + dialog for forum-forsiden. */
export function ForumNewThreadHomeButton({
  categories,
  defaultCategoryId,
  label,
}: {
  categories: ForumCategoryOption[]
  defaultCategoryId: string
  label?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  const open = () => ref.current?.showModal()
  const close = () => ref.current?.close()

  return (
    <>
      <button
        type="button"
        className={
          'inline-flex min-h-[44px] min-w-0 shrink-0 touch-manipulation items-center justify-center rounded-xl border px-4 ' +
          'text-sm font-semibold shadow-[0_1px_0_color-mix(in_srgb,var(--text)_5%,transparent)] outline-none ' +
          'transition-[background-color,box-shadow] duration-150 hover:bg-[color-mix(in_srgb,var(--surface),var(--primary-pale)_85%)] ' +
          'focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 motion-reduce:transition-none'
        }
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
        onPointerDown={() => open()}
      >
        {label ?? 'Opprett innlegg'}
      </button>

      <dialog
        ref={ref}
        className={
          'fixed inset-0 left-1/2 top-[min(50dvh,max(47dvh,calc(env(safe-area-inset-top,0)+45dvh)))] z-50 ' +
          'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,12px)-1.25rem))] w-[min(32rem,calc(100vw-1.5rem))] ' +
          '-translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border p-0 [max-width:100vw] ' +
          'bg-[var(--surface)] text-[var(--text)] shadow-xl open:flex open:flex-col ' +
          '[&::backdrop]:bg-[color-mix(in_srgb,var(--text)_48%,transparent)]'
        }
        style={{ borderColor: 'var(--border)' }}
        aria-labelledby={HOME_DIALOG_TITLE_ID}
      >
        <div className="flex max-h-[inherit] flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 id={HOME_DIALOG_TITLE_ID} className="text-lg font-bold leading-tight tracking-tight">
              Ny tråd
            </h2>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-xl border text-lg font-semibold leading-none outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
              }}
              aria-label="Lukk"
              onPointerDown={() => close()}
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 overscroll-contain touch-pan-y">
            <ForumNewThreadForm
              categories={categories}
              defaultCategoryId={defaultCategoryId}
              layout="modal"
              onCancel={close}
              onPublished={close}
            />
          </div>
        </div>
      </dialog>
    </>
  )
}
