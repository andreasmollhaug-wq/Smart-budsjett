'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import { LANDING_NAV_MORE, LANDING_NAV_PRODUKT } from '@/components/marketing/dottirLandingData'
import {
  CTA_HREF,
  DOTTIR_HOME_HREF,
  DOTTIR_OM_OSS_HREF,
  LOGIN_HREF,
  landingHorizontalPadding,
} from '@/components/marketing/constants'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

export type DottirLandingHeaderVariant = 'default' | 'centerNav'

/** Lenker som kun vises på store skjermer (gruppen skjules helt på mobil). */
function navAuthLinkClass() {
  return 'inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium touch-manipulation sm:px-4'
}

export default function DottirLandingHeader({ variant = 'default' }: { variant?: DottirLandingHeaderVariant }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreWrapRef = useRef<HTMLDivElement>(null)

  const closeDrawer = () => setDrawerOpen(false)
  const closeMore = () => setMoreOpen(false)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMore()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [moreOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (moreWrapRef.current && !moreWrapRef.current.contains(e.target as Node)) closeMore()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [moreOpen])

  const drawerRow =
    'flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium touch-manipulation'

  const mobileDrawer =
    drawerOpen && typeof document !== 'undefined' ? (
      <div
        className="fixed inset-0 z-[60] lg:hidden"
        id="dottir-landing-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjon"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 touch-manipulation"
          aria-label="Lukk meny"
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            e.preventDefault()
            closeDrawer()
          }}
        />
        <aside
          className="absolute inset-y-0 left-0 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] shadow-xl"
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-3 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Meny
            </span>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
              aria-label="Lukk meny"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-1 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <a
              href={LANDING_NAV_PRODUKT.href}
              onClick={closeDrawer}
              className={drawerRow}
              style={{ color: 'var(--text-muted)' }}
            >
              {LANDING_NAV_PRODUKT.label}
            </a>
            <Link
              href={DOTTIR_OM_OSS_HREF}
              onClick={closeDrawer}
              className={drawerRow}
              style={{ color: 'var(--text-muted)' }}
            >
              Om oss
            </Link>
            <Link
              href={LOGIN_HREF}
              onClick={closeDrawer}
              className={drawerRow}
              style={{ color: 'var(--text-muted)' }}
            >
              Logg inn
            </Link>
            <div className="my-2 border-t" style={{ borderColor: 'var(--border)' }} />
            {LANDING_NAV_MORE.map((item) =>
              item.href.startsWith('/') ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={drawerRow}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={drawerRow}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.label}
                </a>
              ),
            )}
            <Link
              href={DOTTIR_HOME_HREF}
              onClick={closeDrawer}
              className={drawerRow}
              style={{ color: 'var(--text-muted)' }}
            >
              Hovedforside
            </Link>
            <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <Link
                href={CTA_HREF}
                onClick={closeDrawer}
                className="flex min-h-[44px] items-center justify-center rounded-xl px-3 text-sm font-semibold text-white touch-manipulation"
                style={{ background: 'var(--primary)' }}
              >
                Prøv gratis
              </Link>
            </div>
          </div>
        </aside>
      </div>
    ) : null

  const produktDesktop = (
    <a href={LANDING_NAV_PRODUKT.href} className={navAuthLinkClass()} style={{ color: 'var(--text-muted)' }}>
      {LANDING_NAV_PRODUKT.label}
    </a>
  )

  const loginDesktop = (
    <Link href={LOGIN_HREF} className={navAuthLinkClass()} style={{ color: 'var(--text-muted)' }}>
      Logg inn
    </Link>
  )

  const mobileLoginLink = (
    <Link
      href={LOGIN_HREF}
      className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center justify-center whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm lg:hidden"
      style={{ color: 'var(--text-muted)' }}
    >
      Logg inn
    </Link>
  )

  const omOssDesktop = (
    <Link href={DOTTIR_OM_OSS_HREF} className={navAuthLinkClass()} style={{ color: 'var(--text-muted)' }}>
      Om oss
    </Link>
  )

  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setDrawerOpen((o) => !o)}
      className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90 lg:hidden"
      style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
      aria-expanded={drawerOpen}
      aria-controls="dottir-landing-nav"
      aria-label={drawerOpen ? 'Lukk meny' : 'Åpne meny'}
    >
      {drawerOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  )

  const desktopMoreButton = (
    <div ref={moreWrapRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setMoreOpen((o) => !o)}
        className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90"
        style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        aria-controls="dottir-landing-more"
        aria-label={moreOpen ? 'Lukk flere lenker' : 'Åpne flere lenker'}
      >
        {moreOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {moreOpen ? (
        <div
          id="dottir-landing-more"
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[12.5rem] rounded-xl border py-2 shadow-lg"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {LANDING_NAV_MORE.map((item) =>
            item.href.startsWith('/') ? (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={closeMore}
                className="flex min-h-[44px] items-center px-4 py-2 text-sm font-medium touch-manipulation hover:opacity-90"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={closeMore}
                className="flex min-h-[44px] items-center px-4 py-2 text-sm font-medium touch-manipulation hover:opacity-90"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.label}
              </a>
            ),
          )}
        </div>
      ) : null}
    </div>
  )

  const ctaLink = (
    <Link
      href={CTA_HREF}
      className="hidden min-h-[44px] shrink-0 touch-manipulation items-center justify-center rounded-xl px-4 py-2 text-center text-sm font-semibold text-white whitespace-nowrap shadow-sm transition-opacity hover:opacity-95 lg:inline-flex"
      style={{ background: 'var(--primary)' }}
    >
      Start gratis prøveperiode
    </Link>
  )

  const logo = (
    <Link
      href={DOTTIR_HOME_HREF}
      aria-label={PRODUCT_DISPLAY_NAME}
      className="inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-0.5 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 touch-manipulation sm:px-1"
    >
      <BrandLogoMark size="xl" heightClass="h-11 sm:h-14" fetchPriority="high" alt="" />
    </Link>
  )

  const desktopPrimaryLinks = (
    <div className="hidden min-w-0 items-center gap-3 sm:gap-4 lg:flex lg:gap-5">
      {produktDesktop}
      {omOssDesktop}
      {loginDesktop}
    </div>
  )

  const trailing = (
    <>
      {desktopMoreButton}
      {ctaLink}
    </>
  )

  const maxW = variant === 'centerNav' ? 'max-w-7xl' : 'max-w-5xl'

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
          className={`mx-auto flex min-w-0 items-center justify-between gap-1.5 overflow-x-hidden py-3 sm:gap-3 sm:py-3 lg:gap-4 ${maxW} ${landingHorizontalPadding}`}
        >
          {logo}
          <nav
            className="relative flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1.5 sm:gap-2 lg:flex-wrap lg:gap-3 xl:gap-4"
            aria-label="Hovedmeny"
          >
            {mobileLoginLink}
            {mobileMenuButton}
            {desktopPrimaryLinks}
            {trailing}
          </nav>
        </div>
      </header>
      {mobileDrawer && typeof document !== 'undefined' ? createPortal(mobileDrawer, document.body) : null}
    </>
  )
}
