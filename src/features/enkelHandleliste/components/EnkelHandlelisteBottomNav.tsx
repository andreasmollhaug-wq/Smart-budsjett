'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Bookmark, ListChecks } from 'lucide-react'
import { useEnkelHandlelisteStore } from '../enkelHandlelisteStore'
import type { EhLastTab } from '../types'

const tabs: { href: string; label: string; tab: EhLastTab; icon: typeof ListChecks }[] = [
  { href: '/intern/enkel-handleliste', label: 'Lister', tab: 'lists', icon: ListChecks },
  { href: '/intern/enkel-handleliste/maler', label: 'Maler', tab: 'templates', icon: Bookmark },
  { href: '/intern/enkel-handleliste/analyse', label: 'Innsikt', tab: 'analysis', icon: BarChart3 },
]

export function EnkelHandlelisteBottomNav() {
  const pathname = usePathname()
  const ehPatchSettings = useEnkelHandlelisteStore((s) => s.ehPatchSettings)

  if (pathname.includes('/liste/')) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="pointer-events-auto flex w-full max-w-xs items-center gap-1 rounded-full border p-1.5"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(13,18,38,0.16)',
        }}
        aria-label="Handleliste"
      >
        {tabs.map(({ href, label, tab, icon: Icon }) => {
          const active =
            tab === 'lists'
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold transition-colors touch-manipulation"
              style={{
                color: active ? '#fff' : 'var(--text-muted)',
                background: active ? 'var(--cta-gradient)' : 'transparent',
              }}
              onClick={() => ehPatchSettings({ lastTab: tab })}
            >
              <Icon size={19} aria-hidden />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
