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
    <header
      className="flex min-w-0 items-center justify-between gap-3 border-b py-4 sm:py-5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold sm:text-xl" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          {titleAddon != null ? <span className="shrink-0 flex items-center">{titleAddon}</span> : null}
        </div>
        <p
          className="mt-0.5 min-w-0 max-w-full text-xs sm:text-sm leading-snug break-words"
          style={{ color: 'var(--text-muted)' }}
        >
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
