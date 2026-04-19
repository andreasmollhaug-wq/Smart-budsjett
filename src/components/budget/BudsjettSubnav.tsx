'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActivePersonFinance } from '@/lib/store'
import { useMemo } from 'react'

const baseTabs = [
  { href: '/budsjett', label: 'Budsjett', labelShort: 'Budsjett' },
  { href: '/budsjett/dashboard', label: 'Budsjett dashboard', labelShort: 'Dashboard' },
  { href: '/budsjett/arsvisning', label: 'Årsoversikt', labelShort: 'År' },
] as const

const householdTab = {
  href: '/budsjett/husholdning',
  label: 'Husholdning',
  labelShort: 'Hush.',
} as const

export default function BudsjettSubnav() {
  const pathname = usePathname()
  const { isHouseholdAggregate } = useActivePersonFinance()

  const tabs = useMemo(() => {
    if (!isHouseholdAggregate) return [...baseTabs]
    return [...baseTabs, householdTab]
  }, [isHouseholdAggregate])

  const isTabActive = (href: string) => {
    if (href === '/budsjett') return pathname === '/budsjett'
    return pathname === href
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
