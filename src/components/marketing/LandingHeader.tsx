'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { CTA_HREF, LOGIN_HREF } from './constants'

const NAV_ITEMS = [
  { href: '#funksjoner', label: 'Funksjoner' },
  { href: '#priser', label: 'Priser' },
  { href: '#faq', label: 'FAQ' },
  { href: '/guider', label: 'Guider' },
] as const

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
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
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
            {NAV_ITEMS.map((item) =>
              item.href.startsWith('#') ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </aside>
      </div>
    ) : null

  return (
    <>
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 max-w-[min(100%,12rem)] shrink items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:max-w-none sm:gap-3"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            SB
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
              Smart Budsjett
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              by EnkelExcel
            </p>
          </div>
        </Link>

        <nav className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
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

          {NAV_ITEMS.map((item) =>
            item.href.startsWith('#') ? (
              <a
                key={item.href}
                href={item.href}
                className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-flex lg:items-center"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hidden rounded-lg px-2 py-2 text-sm font-medium lg:inline-flex lg:items-center"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </Link>
            ),
          )}
          <Link
            href={LOGIN_HREF}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Logg inn
          </Link>
          <Link
            href={CTA_HREF}
            className="inline-flex min-h-[44px] max-w-[11rem] flex-col items-center justify-center rounded-xl px-3 py-2 text-center text-xs font-semibold leading-tight text-white shadow-sm transition-opacity hover:opacity-95 sm:max-w-none sm:px-4 sm:text-sm"
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
