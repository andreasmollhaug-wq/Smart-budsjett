'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/abonnementer', label: 'Registrer abonnement', labelShort: 'Registrer' },
  { href: '/abonnementer/sammendrag', label: 'Sammendrag', labelShort: 'Samm.' },
  { href: '/abonnementer/avsluttet', label: 'Avsluttede', labelShort: 'Avsl.' },
] as const

export default function AbonnementerSubnav() {
  const pathname = usePathname()

  const isTabActive = (href: string) => {
    if (href === '/abonnementer/sammendrag') return pathname === '/abonnementer/sammendrag'
    if (href === '/abonnementer/avsluttet') return pathname === '/abonnementer/avsluttet'
    return pathname === '/abonnementer'
  }

  return (
    <div
      className="px-3 sm:px-6 lg:px-8 flex gap-0.5 sm:gap-1 border-b shrink-0 overflow-x-auto touch-manipulation"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      {tabs.map(({ href, label, labelShort }) => (
        <Link
          key={href}
          href={href}
          className="px-3 sm:px-4 min-h-[44px] inline-flex items-center text-xs sm:text-sm font-medium rounded-t-xl border-b-2 -mb-px transition-colors shrink-0"
          style={{
            borderColor: isTabActive(href) ? 'var(--primary)' : 'transparent',
            color: isTabActive(href) ? 'var(--primary)' : 'var(--text-muted)',
            background: isTabActive(href) ? 'var(--primary-pale)' : 'transparent',
          }}
        >
          <span className="sm:hidden">{labelShort}</span>
          <span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
    </div>
  )
}
