'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/sparing', label: 'Sparing', labelShort: 'Sparing' },
  { href: '/sparing/smartspare', label: 'SmartSpare', labelShort: 'SmartSpare' },
  { href: '/sparing/analyse', label: 'Analyse', labelShort: 'Analyse' },
  { href: '/sparing/formuebygger', label: 'Formuebygger', labelShort: 'Formue' },
] as const

export default function SparingSubnav() {
  const pathname = usePathname()

  const isTabActive = (href: string) => {
    if (href === '/sparing') return pathname === '/sparing'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div
      className="flex shrink-0 gap-0.5 overflow-x-auto border-b touch-manipulation sm:gap-1 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]"
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
          <span className="sm:hidden" style={{ textTransform: 'none' }}>
            {labelShort}
          </span>
          <span className="hidden sm:inline" style={{ textTransform: 'none' }}>
            {label}
          </span>
        </Link>
      ))}
    </div>
  )
}
