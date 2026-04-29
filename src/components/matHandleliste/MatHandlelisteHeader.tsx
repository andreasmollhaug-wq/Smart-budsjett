'use client'

/**
 * Header kun for mat/handleliste: på smal skjerm prioriteres sidetittel; varsler og konto samles i én meny.
 * md og opp samsvarer med global Header.
 */
import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import AccountMenu from '@/components/layout/AccountMenu'
import NotificationBell from '@/components/layout/NotificationBell'
import { Menu, X } from 'lucide-react'

const ELEVATED_PANEL_Z = 'z-[200]'

interface MatHandlelisteHeaderProps {
  title: string
  subtitle?: string
  /** Ikon eller knapp ved siden av tittel (f.eks. hjelp/tur). */
  titleAddon?: ReactNode
}

export function MatHandlelisteHeader({ title, subtitle, titleAddon }: MatHandlelisteHeaderProps) {
  const now = new Date().toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileSheetTitleId = useId()
  const mobileSheetId = useId()

  return (
    <>
      <header
        className="flex min-w-0 items-start justify-between gap-3 border-b py-4 sm:py-5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] md:items-center"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="min-w-0 flex-1 md:pr-0">
          <h1
            className="min-w-0 text-xl font-bold leading-tight md:truncate md:text-xl touch-manipulation"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h1>
          <p
            className="mt-0.5 min-w-0 max-w-full text-xs leading-snug break-words sm:text-sm md:break-normal"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle ?? now}
          </p>
        </div>

        <button
          type="button"
          className="mt-0.5 flex min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-xl border md:hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          aria-expanded={mobileMenuOpen}
          aria-haspopup="dialog"
          aria-controls={mobileMenuOpen ? mobileSheetId : undefined}
          aria-label={mobileMenuOpen ? 'Lukk meny' : 'Åpne meny (varsler og konto)'}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>

        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
          {titleAddon != null ? <span className="shrink-0 flex items-center">{titleAddon}</span> : null}
          <NotificationBell />
          <AccountMenu />
        </div>
      </header>

      <MatHandlelisteHeaderMobileMenu
        id={mobileSheetId}
        titleId={mobileSheetTitleId}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        titleAddon={titleAddon}
      />
    </>
  )
}

function MatHandlelisteHeaderMobileMenu({
  id,
  titleId,
  open,
  onClose,
  titleAddon,
}: {
  id: string
  titleId: string
  open: boolean
  onClose: () => void
  titleAddon?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!mounted || !open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 isolate md:hidden" role="presentation" style={{ zIndex: 160 }}>
      <div
        className="absolute inset-0 bg-black/35"
        aria-hidden
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault()
          onClose()
        }}
      />
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] flex max-h-[min(85vh,calc(100dvh-1rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-y-auto rounded-xl shadow-lg touch-manipulation"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          zIndex: 1,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
          <span id={titleId} className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Meny
          </span>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Lukk meny"
            onClick={() => onClose()}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-3">
          {titleAddon != null ? (
            <div
              className="flex flex-col gap-2 [&>div]:flex [&>div]:flex-col [&>div]:items-stretch [&>div]:gap-2"
              style={{ color: 'var(--text)' }}
            >
              {titleAddon}
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Varsler
            </p>
            <NotificationBell panelZClass={ELEVATED_PANEL_Z} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Konto
            </p>
            <AccountMenu dropdownZClass={ELEVATED_PANEL_Z} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
