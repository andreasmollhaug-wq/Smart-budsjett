'use client'
import type { ReactNode } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import NotificationBell from '@/components/layout/NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
  /** Ikon eller knapp ved siden av tittel (f.eks. hjelpeikon). */
  titleAddon?: ReactNode
}

export default function Header({ title, subtitle, titleAddon }: HeaderProps) {
  const now = new Date().toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-4 sm:px-6 lg:px-8 sm:py-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold sm:text-xl" style={{ color: 'var(--text)' }}>{title}</h1>
          {titleAddon != null ? <span className="shrink-0 flex items-center">{titleAddon}</span> : null}
        </div>
        <p className="mt-0.5 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          {subtitle ?? now}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  )
}
