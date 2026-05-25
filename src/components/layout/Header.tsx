'use client'
import type { ReactNode } from 'react'
import AccountMenu from '@/components/layout/AccountMenu'
import NotificationBell from '@/components/layout/NotificationBell'
import DottirAiHeaderButton from '@/components/enkelexcel-ai/DottirAiHeaderButton'

interface HeaderProps {
  title: string
  subtitle?: ReactNode
  /** Ikon eller knapp ved siden av tittel (f.eks. hjelpeikon). */
  titleAddon?: ReactNode
}

export default function Header({ title, subtitle, titleAddon }: HeaderProps) {
  const now = new Date().toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hasAddon = titleAddon != null
  const horizontalPad =
    'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]'

  return (
    <header
      className={
        hasAddon
          ? `flex min-w-0 flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-5 ${horizontalPad}`
          : `flex min-w-0 items-center justify-between gap-3 border-b py-4 sm:py-5 ${horizontalPad}`
      }
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className={hasAddon ? 'min-w-0 w-full flex-1 sm:w-auto' : 'min-w-0 flex-1'}>
        <h1 className="min-w-0 truncate text-lg font-bold sm:text-xl" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        <div
          className="mt-0.5 min-w-0 max-w-full text-xs sm:text-sm leading-snug break-words"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle != null ? subtitle : now}
        </div>
      </div>
      <div
        className={
          hasAddon
            ? 'flex min-w-0 w-full shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:w-auto sm:gap-x-3 sm:gap-y-2'
            : 'flex shrink-0 items-center gap-2 sm:gap-3'
        }
      >
        {titleAddon != null ? (
          <span className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2">{titleAddon}</span>
        ) : null}
        <DottirAiHeaderButton className="hidden md:block" />
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  )
}
