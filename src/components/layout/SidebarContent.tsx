'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PersonSwitcher from '@/components/account/PersonSwitcher'
import BrandLogoMark from '@/components/brand/BrandLogoMark'
import { useActivePersonFinance, useStore } from '@/lib/store'
import { ChevronRight, X } from 'lucide-react'
import { PRODUCT_DISPLAY_NAME } from '@/lib/productBranding'
import {
  SIDEBAR_NAV_DETAILED,
  SIDEBAR_GROUPS_SIMPLE,
  isSidebarNavActive,
  isSidebarGroupActive,
  type SidebarNavGroup,
  type SidebarNavItem,
} from '@/lib/sidebarNav'

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

function navLinkBase(active: boolean) {
  return [
    'flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all touch-manipulation',
    active ? '' : 'hover:opacity-95',
  ].join(' ')
}

function SidebarDetailedLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {SIDEBAR_NAV_DETAILED.map(({ href, label, icon: Icon }) => {
        const active = isSidebarNavActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={navLinkBase(active)}
            style={{
              background: active ? 'var(--primary-pale)' : 'transparent',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={18} className="shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{label}</span>
            {active && <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />}
          </Link>
        )
      })}
    </>
  )
}

function SidebarSimpleGroups({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  /** Eksplisitte toggles; ved pathname-bytte nullstilles slik at aktiv gruppe igjen får standard åpen. */
  const [openById, setOpenById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenById({})
  }, [pathname])

  const toggle = (id: string) => {
    const group = SIDEBAR_GROUPS_SIMPLE.find((g) => g.id === id)
    if (!group) return
    const routeActive = isSidebarGroupActive(pathname, group)
    const currentExpanded = openById[id] ?? routeActive
    setOpenById((prev) => ({ ...prev, [id]: !currentExpanded }))
  }

  return (
    <>
      {SIDEBAR_GROUPS_SIMPLE.map((group: SidebarNavGroup) => {
        const groupActive = isSidebarGroupActive(pathname, group)
        const expanded = openById[group.id] ?? groupActive
        const panelId = `sidebar-nav-group-${group.id}`
        const GroupIcon = group.icon

        return (
          <div key={group.id} className="space-y-1">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => toggle(group.id)}
              className="flex w-full min-h-[44px] min-w-0 touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              style={{
                background: groupActive && !expanded ? 'var(--primary-pale)' : 'transparent',
                color: groupActive ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <ChevronRight
                size={18}
                className="shrink-0 transition-transform duration-200"
                style={{
                  transform: expanded ? 'rotate(90deg)' : undefined,
                  color: 'var(--text-muted)',
                }}
                aria-hidden
              />
              <GroupIcon size={18} className="shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">{group.label}</span>
            </button>
            {expanded ? (
              <div id={panelId} className="space-y-1 border-l border-[var(--border)] ml-4 pl-2">
                {group.items.map((item: SidebarNavItem) => {
                  const { href, label, icon: Icon } = item
                  const active = isSidebarNavActive(pathname, href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={navLinkBase(active)}
                      style={{
                        background: active ? 'var(--primary-pale)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon size={18} className="shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">{label}</span>
                      {active && (
                        <ChevronRight size={14} className="shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export default function SidebarContent({ onNavigate, endSlot }: Props) {
  const pathname = usePathname()
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const sidebarNavMode = useStore((s) => s.sidebarNavMode)
  const demoLogoRing = demoDataEnabled ? 'ring-2 ring-[#EA580C] ring-offset-2 ring-offset-[var(--surface)]' : ''

  return (
    <>
      <div className="border-b px-6 py-6" style={{ borderColor: 'var(--border)' }}>
        {endSlot ? (
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-x-1">
            <span className="block w-11 shrink-0" aria-hidden />
            <Link
              href="/dashboard"
              onClick={onNavigate}
              aria-label={PRODUCT_DISPLAY_NAME}
              className={`flex min-w-0 justify-center justify-self-center rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${demoLogoRing}`.trim()}
            >
              <BrandLogoMark heightClass="h-14 w-auto" alt="" />
            </Link>
            <div className="flex justify-end">{endSlot}</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              aria-label={PRODUCT_DISPLAY_NAME}
              className={`inline-flex rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${demoLogoRing}`.trim()}
            >
              <BrandLogoMark heightClass="h-14 w-auto" alt="" />
            </Link>
          </div>
        )}
      </div>

      <PersonSwitcher />

      <nav className="flex-1 space-y-1 px-3 py-4 min-w-0">
        {sidebarNavMode === 'detailed' ? (
          <SidebarDetailedLinks pathname={pathname} onNavigate={onNavigate} />
        ) : (
          <SidebarSimpleGroups pathname={pathname} onNavigate={onNavigate} />
        )}
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
