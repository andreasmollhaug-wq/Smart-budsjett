'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import PersonSwitcher from '@/components/account/PersonSwitcher'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { ChevronRight, X } from 'lucide-react'
import { SIDEBAR_NAV, isSidebarNavActive } from '@/lib/sidebarNav'

function SubscriptionFooter() {
  const { subscriptionPlan } = useActivePersonFinance()
  const title = subscriptionPlan === 'solo' ? 'Solo' : 'Familie'
  const subtitle =
    subscriptionPlan === 'solo' ? 'Én bruker i husholdningen' : 'Opp til fem brukere i husholdningen'

  return (
    <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <Link
        href="/konto/betalinger"
        className="block mx-1 p-3 rounded-xl transition-colors hover:opacity-90"
        style={{ background: 'var(--primary-pale)' }}
      >
        <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        <p className="text-xs mt-2 font-medium" style={{ color: 'var(--primary)' }}>
          Administrer abonnement
        </p>
      </Link>
    </div>
  )
}

type Props = {
  /** Kall etter navigasjon (f.eks. lukk mobilmeny). */
  onNavigate?: () => void
  /** Vises i logo-raden (f.eks. lukkeknapp i drawer). */
  endSlot?: ReactNode
}

export default function SidebarContent({ onNavigate, endSlot }: Props) {
  const pathname = usePathname()
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const logoBg = demoDataEnabled ? 'linear-gradient(135deg, #EA580C, #F97316)' : 'var(--cta-gradient)'

  return (
    <>
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            <div
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: logoBg }}
            >
              SB
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Smart Budsjett</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>by EnkelExcel</p>
            </div>
          </Link>
          {endSlot}
        </div>
      </div>

      <PersonSwitcher />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {SIDEBAR_NAV.map(({ href, label, icon: Icon }) => {
          const active = isSidebarNavActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--primary-pale)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} style={{ color: 'var(--primary)' }} />}
            </Link>
          )
        })}
      </nav>

      <SubscriptionFooter />
    </>
  )
}

export function SidebarDrawerCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-90"
      style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg)' }}
      aria-label="Lukk meny"
    >
      <X size={22} />
    </button>
  )
}
