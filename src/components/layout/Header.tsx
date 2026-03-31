'use client'
import AccountMenu from '@/components/layout/AccountMenu'
import NotificationBell from '@/components/layout/NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const now = new Date().toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle ?? now}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  )
}
