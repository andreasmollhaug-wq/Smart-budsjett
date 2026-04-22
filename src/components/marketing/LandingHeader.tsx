'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { CTA_HREF, LOGIN_HREF, landingHorizontalPadding } from './constants'

/** Synlige lenker på én linje (stor skjerm). */
const MAIN_NAV = [
  { href: '#produkt', label: 'Produkt' },
  { href: '#priser', label: 'Priser' },
  { href: '#faq', label: 'FAQ' },
] as const

/** Under «Mer»-nedtrekk (stor skjerm). */
const MORE_NAV = [
  { href: '#slik-fungerer', label: 'Slik det funker' },
  { href: '#funksjoner', label: 'Funksjoner' },
  { href: '/produktflyt', label: 'Produktflyt' },
  { href: '/guider', label: 'Guider' },
] as const

type NavEntry = { readonly href: string; readonly label: string }

function MobileNavLink({
  item,
  onNavigate,
  indent,
}: {
  item: NavEntry
  onNavigate: () => void
  indent?: boolean
}) {
  const cls = `flex min-h-[44px] touch-manipulation items-center rounded-lg px-3 text-sm font-medium ${indent ? 'pl-6' : ''}`
  return item.href.startsWith('#') ? (
    <a href={item.href} onClick={onNavigate} className={cls} style={{ color: 'var(--text-muted)' }}>
      {item.label}
    </a>
  ) : (
    <Link href={item.href} onClick={onNavigate} className={cls} style={{ color: 'var(--text-muted)' }}>
      {item.label}
    </Link>
  )
}

function MoreNavDropdown({ items }: { items: readonly NavEntry[] }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative hidden shrink-0 lg:block" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="landing-more-nav-menu"
        id="landing-more-nav-button"
        className="inline-flex min-h-[44px] items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:opacity-90"
        style={{ color: 'var(--text-muted)' }}
        onClick={() => setOpen((o) => !o)}
      >
        Mer
        <ChevronDown size={16} strokeWidth={2} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <div
          id="landing-more-nav-menu"
          role="menu"
          aria-labelledby="landing-more-nav-button"
          className="absolute right-0 top-full z-[70] mt-1 min-w-[12.5rem] rounded-xl border py-1 shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {items.map((item) =>
            item.href.startsWith('#') ? (
              <a
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex min-h-[44px] items-center whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="flex min-h-[44px] items-center whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const mobileNav =
    mobileOpen && typeof document !== 'undefined' ? (
      <div
        className="fixed inset-0 z-[60] lg:hidden"
        id="landing-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjon"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Lukk meny"
          onClick={close}
        />
        <aside
          className="absolute inset-y-0 left-0 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto shadow-xl"
          style={{
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
            paddingRight: '0.75rem',
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b py-3" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Meny
            </span>
            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:opacity-90"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-label="Lukk meny"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-1 p-3">
            {MAIN_NAV.map((item) => (
              <MobileNavLink key={item.href} item={item} onNavigate={close} />
            ))}
            <details
              className="group rounded-xl"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <summary
                className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold outline-none [&::-webkit-details-marker]:hidden"
                style={{ color: 'var(--text)' }}
              >
                <span>Mer</span>
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div
                className="flex flex-col gap-0.5 border-t px-1 py-2"
                style={{ borderColor: 'var(--border)' }}
              >
                {MORE_NAV.map((item) => (
                  <MobileNavLink key={item.href} item={item} onNavigate={close} indent />
                ))}
              </div>
            </details>
          </div>
        </aside>
      </div>
    ) : null

  const linkClass =
    'hidden whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:opacity-90 lg:inline-flex lg:min-h-[44px] lg:items-center'

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className={`mx-auto flex min-w-0 max-w-5xl flex-nowrap items-center gap-2 py-3 sm:gap-4 ${landingHorizontalPadding}`}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              SB
            </div>
            <div className="min-w-0 leading-tight">
              <p className="whitespace-nowrap text-sm font-bold" style={{ color: 'var(--text)' }}>
                Smart Budsjett
              </p>
              <p className="hidden text-xs sm:block" style={{ color: 'var(--text-muted)' }}>
                av EnkelExcel
              </p>
            </div>
          </Link>

          <nav className="ml-auto flex min-w-0 flex-nowrap items-center justify-end gap-0.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-90 lg:hidden"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-nav"
              aria-label={mobileOpen ? 'Lukk meny' : 'Åpne meny'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {MAIN_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={linkClass}
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </a>
            ))}

            <MoreNavDropdown items={MORE_NAV} />

            <Link
              href={LOGIN_HREF}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Logg inn
            </Link>
            <Link
              href={CTA_HREF}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-2.5 py-2 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-opacity hover:opacity-95 sm:px-4 sm:text-sm"
              style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
            >
              <span className="sm:hidden">Start gratis</span>
              <span className="hidden sm:inline">Start gratis prøveperiode</span>
            </Link>
          </nav>
        </div>
      </header>
      {mobileNav ? createPortal(mobileNav, document.body) : null}
    </>
  )
}
