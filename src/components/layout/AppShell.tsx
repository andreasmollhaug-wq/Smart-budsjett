'use client'

import { useEffect, useState } from 'react'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useStore } from '@/lib/store'
import SidebarContent, { SidebarDrawerCloseButton } from '@/components/layout/SidebarContent'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { appReadOnly, loading: readOnlyLoading } = useSubscriptionReadOnly()
  const kontoSection = pathname.startsWith('/konto')
  const forumSection = pathname.startsWith('/forum')
  const mainReadOnly = !readOnlyLoading && appReadOnly && !kontoSection && !forumSection
  const [mobileOpen, setMobileOpen] = useState(false)
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const demoLogoRing = demoDataEnabled ? 'ring-2 ring-[#EA580C] ring-offset-2 ring-offset-[var(--surface)]' : ''

  const close = () => setMobileOpen(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <header
          className="relative grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-1 border-b px-2 py-2.5 lg:hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center justify-self-start rounded-xl transition-colors hover:opacity-90"
            style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-nav"
            aria-label="Åpne meny"
          >
            <Menu size={22} />
          </button>
          <Link
            href="/dashboard"
            aria-label={PRODUCT_DISPLAY_NAME}
            className={`flex min-w-0 justify-center justify-self-center rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${demoLogoRing}`.trim()}
          >
            <BrandLogoMark heightClass="h-14 w-auto" alt="" />
          </Link>
          <span className="w-11 shrink-0 justify-self-end" aria-hidden />
        </header>

        <aside
          className="hidden min-h-0 w-64 shrink-0 flex-col shadow-sm lg:flex"
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <SidebarContent />
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {mainReadOnly && (
            <div
              className="shrink-0 border-b px-3 py-2.5 text-sm lg:px-4"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <span className="font-medium">Skrivebeskyttet.</span>{' '}
              Du kan se appen og navigere, men ikke endre data uten aktivt abonnement eller prøveperiode.{' '}
              <Link href="/konto/betalinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
                Betalinger
              </Link>{' '}
              og øvrige valg under{' '}
              <Link href="/konto/innstillinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
                Min konto
              </Link>{' '}
              fungerer som vanlig.
            </div>
          )}
          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
              mainReadOnly ? 'pointer-events-none select-none opacity-[0.97]' : ''
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="app-mobile-nav" role="dialog" aria-modal="true" aria-label="Navigasjon">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Lukk meny"
            onClick={close}
          />
          <aside
            className="absolute inset-y-0 left-0 flex min-h-0 w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto shadow-xl pt-[max(0.25rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0px,env(safe-area-inset-left,0px))]"
            style={{ background: 'var(--surface)' }}
          >
            <SidebarContent
              onNavigate={close}
              endSlot={<SidebarDrawerCloseButton onClick={close} />}
            />
          </aside>
        </div>
      )}
    </>
  )
}
