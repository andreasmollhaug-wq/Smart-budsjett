'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { smartvanePaths } from '@/features/smartvane/paths'

const LINKS = [
  { href: smartvanePaths.today, label: 'I dag', attachMonth: false },
  { href: smartvanePaths.month, label: 'Måned', attachMonth: true },
  { href: smartvanePaths.insights, label: 'Innsikt', attachMonth: true },
  { href: smartvanePaths.start, label: 'Start', attachMonth: false },
] as const

function normalizedPath(pathname: string): string {
  const base = pathname.split('?')[0] ?? pathname
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1)
  return base
}

function SmartvaneSubnavInner() {
  const pathname = normalizedPath(usePathname() ?? '')
  const sp = useSearchParams()

  const monthQuery = useMemo(() => {
    const cal = new Date()
    let y = cal.getFullYear()
    let m = cal.getMonth() + 1
    const monthAware =
      pathname === smartvanePaths.month ||
      pathname.startsWith(`${smartvanePaths.month}/`) ||
      pathname === smartvanePaths.insights ||
      pathname.startsWith(`${smartvanePaths.insights}/`)
    const qY = sp.get('y')
    const qM = sp.get('m')
    if (monthAware && qY != null && qY !== '' && qM != null && qM !== '') {
      const py = parseInt(qY, 10)
      const pm = parseInt(qM, 10)
      if (
        !Number.isNaN(py) &&
        py >= 2000 &&
        py <= 2100 &&
        !Number.isNaN(pm) &&
        pm >= 1 &&
        pm <= 12
      ) {
        y = py
        m = pm
      }
    }
    return `?y=${y}&m=${m}`
  }, [pathname, sp])

  const isTabActive = (href: string) => {
    const p = pathname
    if (href === smartvanePaths.today) {
      return p === smartvanePaths.today || p.endsWith('/i-dag')
    }
    if (href === smartvanePaths.start) {
      return p === smartvanePaths.start || p.endsWith('/start-her')
    }
    return p === href || p.startsWith(`${href}/`)
  }

  return (
    <nav
      data-sv-tour="smartvane-subnav"
      className="flex shrink-0 gap-0.5 overflow-x-auto border-b px-3 touch-manipulation sm:gap-1 sm:px-6 lg:px-8"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      aria-label="SmartVane"
    >
      {LINKS.map(({ href, label, attachMonth }) => {
        const dest = attachMonth ? `${href}${monthQuery}` : href
        const active = isTabActive(href)
        return (
          <Link
            key={href}
            href={dest}
            className="-mb-px inline-flex min-h-[44px] shrink-0 items-center rounded-t-xl border-b-2 px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm"
            style={{
              borderColor: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
              background: active ? 'var(--primary-pale)' : 'transparent',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function SmartvaneSubnavFallback() {
  return (
    <div
      className="min-h-[44px] shrink-0 border-b px-3 sm:px-6 lg:px-8"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      aria-hidden
    />
  )
}

export default function SmartvaneSubnav() {
  return (
    <Suspense fallback={<SmartvaneSubnavFallback />}>
      <SmartvaneSubnavInner />
    </Suspense>
  )
}
