'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
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

/** Over app-innhold og sticky header; i tråd med modaler (z-[200]). */
const LANDING_NAV_OVERLAY_Z = 200

export type DottirLandingHeaderVariant = 'default' | 'centerNav'

type MoreMenuPosition = {
  top: number
  right: number
}

/** Lenker som kun vises på store skjermer (gruppen skjules helt på mobil). */
function navAuthLinkClass() {
  return 'inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium touch-manipulation sm:px-4'
}

type Props = {
  variant?: DottirLandingHeaderVariant
  /** Lys tekst og gjennomsiktig bar — over fullskjerm hero-bilde. */
  overHero?: boolean
  /**
   * Fast header som henger litt ved scroll, deretter glir bort.
   * Brukes på v2-forside der header ikke skal følge hero-seksjonens sticky-grense.
   */
  fadeOnScroll?: boolean
}

/** Scroll før header begynner å skjule seg; deretter gradvis over `fadeRange` px. */
const SCROLL_FADE_START_PX = 56
const SCROLL_FADE_RANGE_PX = 200

export default function DottirLandingHeader({
  variant = 'default',
  overHero = false,
  fadeOnScroll = false,
}: Props) {
  const navMutedColor = overHero ? 'rgba(255,255,255,0.88)' : 'var(--text-muted)'
  const iconButtonStyle = overHero
    ? { color: '#fff', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.1)' }
    : { color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }
  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [moreMenuPos, setMoreMenuPos] = useState<MoreMenuPosition | null>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [scrollHideProgress, setScrollHideProgress] = useState(0)

  const closeDrawer = () => setDrawerOpen(false)
  const closeMore = () => setMoreOpen(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!fadeOnScroll) return

    const onScroll = () => {
      if (drawerOpen || moreOpen) {
        setScrollHideProgress(0)
        return
      }
      const y = window.scrollY
      const progress =
        y <= SCROLL_FADE_START_PX
          ? 0
          : Math.min(1, (y - SCROLL_FADE_START_PX) / SCROLL_FADE_RANGE_PX)
      setScrollHideProgress(progress)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [fadeOnScroll, drawerOpen, moreOpen])

  const syncMoreMenuPosition = useCallback(() => {
    const button = moreButtonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    setMoreMenuPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [])

  useEffect(() => {
    if (!drawerOpen && !moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (moreOpen) closeMore()
        else closeDrawer()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, moreOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!moreOpen) {
      setMoreMenuPos(null)
      return
    }
    syncMoreMenuPosition()
    window.addEventListener('resize', syncMoreMenuPosition)
    window.addEventListener('scroll', syncMoreMenuPosition, { passive: true })
    return () => {
      window.removeEventListener('resize', syncMoreMenuPosition)
      window.removeEventListener('scroll', syncMoreMenuPosition)
    }
  }, [moreOpen, syncMoreMenuPosition])

  const drawerRow =
    'flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium touch-manipulation'

  const mobileDrawer = drawerOpen ? (
      <div
        className="fixed inset-0 lg:hidden"
        id="dottir-landing-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjon"
        style={{ zIndex: LANDING_NAV_OVERLAY_Z }}
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
          className="absolute inset-y-0 left-0 z-10 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] shadow-xl"
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

  const desktopMoreMenu =
    moreOpen && moreMenuPos ? (
      <>
        <button
          type="button"
          className="fixed inset-0 hidden touch-manipulation bg-transparent lg:block"
          aria-label="Lukk flere lenker"
          style={{ zIndex: LANDING_NAV_OVERLAY_Z - 1 }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            e.preventDefault()
            closeMore()
          }}
        />
        <div
          id="dottir-landing-more"
          role="menu"
          aria-labelledby="dottir-landing-more-button"
          className="fixed hidden min-w-[12.5rem] rounded-xl border py-2 shadow-lg lg:block"
          style={{
            zIndex: LANDING_NAV_OVERLAY_Z,
            top: moreMenuPos.top,
            right: moreMenuPos.right,
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
      </>
    ) : null

  const produktDesktop = (
    <a href={LANDING_NAV_PRODUKT.href} className={navAuthLinkClass()} style={{ color: navMutedColor }}>
      {LANDING_NAV_PRODUKT.label}
    </a>
  )

  const loginDesktop = (
    <Link href={LOGIN_HREF} className={navAuthLinkClass()} style={{ color: navMutedColor }}>
      Logg inn
    </Link>
  )

  const mobileLoginLink = (
    <Link
      href={LOGIN_HREF}
      className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center justify-center whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm lg:hidden"
      style={{ color: navMutedColor }}
    >
      Logg inn
    </Link>
  )

  const omOssDesktop = (
    <Link href={DOTTIR_OM_OSS_HREF} className={navAuthLinkClass()} style={{ color: navMutedColor }}>
      Om oss
    </Link>
  )

  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setDrawerOpen((o) => !o)}
      className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90 lg:hidden"
      style={iconButtonStyle}
      aria-expanded={drawerOpen}
      aria-controls="dottir-landing-nav"
      aria-label={drawerOpen ? 'Lukk meny' : 'Åpne meny'}
    >
      {drawerOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  )

  const desktopMoreButton = (
    <div className="relative hidden lg:block">
      <button
        ref={moreButtonRef}
        type="button"
        id="dottir-landing-more-button"
        onClick={() => {
          if (!moreOpen) syncMoreMenuPosition()
          setMoreOpen((o) => !o)
        }}
        className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors hover:opacity-90"
        style={iconButtonStyle}
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        aria-controls="dottir-landing-more"
        aria-label={moreOpen ? 'Lukk flere lenker' : 'Åpne flere lenker'}
      >
        {moreOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
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
  const headerHidden = fadeOnScroll && scrollHideProgress >= 0.98
  const headerMotionStyle: CSSProperties | undefined = fadeOnScroll
    ? {
        transform: `translate3d(0, -${scrollHideProgress * 100}%, 0)`,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: scrollHideProgress > 0.85 ? 'none' : 'auto',
      }
    : undefined

  return (
    <>
      <header
        className={`${fadeOnScroll ? 'fixed left-0 right-0 top-0' : 'sticky top-0'} z-50 border-b backdrop-blur-md${overHero ? ' border-white/15' : ''}`}
        style={{
          ...(overHero
            ? { background: 'rgba(0,0,0,0.28)', borderColor: 'rgba(255,255,255,0.15)' }
            : {
                background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
                borderColor: 'var(--border)',
              }),
          ...headerMotionStyle,
        }}
        aria-hidden={headerHidden}
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
      {mounted && mobileDrawer ? createPortal(mobileDrawer, document.body) : null}
      {mounted && desktopMoreMenu ? createPortal(desktopMoreMenu, document.body) : null}
    </>
  )
}
