'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/budsjett', label: 'Budsjett', labelShort: 'Budsjett' },
  { href: '/budsjett/dashboard', label: 'Budsjett dashboard', labelShort: 'Dashboard' },
] as const

export default function BudsjettSubnav() {
  const pathname = usePathname()

  return (
    <div
      className="px-3 sm:px-6 lg:px-8 flex gap-0.5 sm:gap-1 border-b shrink-0 overflow-x-auto touch-manipulation"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      {tabs.map(({ href, label, labelShort }) => {
        const isActive = href === '/budsjett' ? pathname === '/budsjett' : pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="px-3 sm:px-4 min-h-[44px] inline-flex items-center text-xs sm:text-sm font-medium rounded-t-xl border-b-2 -mb-px transition-colors shrink-0"
            style={{
              borderColor: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-pale)' : 'transparent',
            }}
          >
            <span className="sm:hidden">{labelShort}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
