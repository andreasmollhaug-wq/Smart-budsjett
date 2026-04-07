'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useStore } from '@/lib/store'
import SidebarContent, { SidebarDrawerCloseButton } from '@/components/layout/SidebarContent'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const logoBg = demoDataEnabled
    ? 'linear-gradient(135deg, #EA580C, #F97316)'
    : 'linear-gradient(135deg, #3B5BDB, #4C6EF5)'

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        <header
          className="flex shrink-0 items-center gap-3 border-b px-3 py-2.5 md:hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-90"
            style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-nav"
            aria-label="Åpne meny"
          >
            <Menu size={22} />
          </button>
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: logoBg }}
            >
              SB
            </div>
            <span className="truncate text-sm font-bold" style={{ color: 'var(--text)' }}>
              Smart Budsjett
            </span>
          </Link>
        </header>

        <aside
          className="hidden min-h-0 w-64 shrink-0 flex-col shadow-sm md:flex"
          style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        >
          <SidebarContent />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" id="app-mobile-nav" role="dialog" aria-modal="true" aria-label="Navigasjon">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Lukk meny"
            onClick={close}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(100vw-1rem,18rem)] max-w-[85vw] flex-col overflow-y-auto shadow-xl"
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
