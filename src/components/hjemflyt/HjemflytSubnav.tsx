'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/hjemflyt', label: 'Oversikt', labelShort: 'Oversikt' },
  { href: '/hjemflyt/barn', label: 'Barnevisning', labelShort: 'Barn' },
] as const

export default function HjemflytSubnav() {
  const pathname = usePathname()

  return (
    <div
      className="flex shrink-0 gap-0.5 overflow-x-auto border-b touch-manipulation sm:gap-1 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      {tabs.map(({ href, label, labelShort }) => {
        const isActive = pathname === href
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
