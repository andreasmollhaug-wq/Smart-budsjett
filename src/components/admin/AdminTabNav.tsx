'use client'

import type { AdminTabId } from '@/lib/admin/adminTabs'
import { BarChart3, LayoutDashboard, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TAB_CONFIG: Record<AdminTabId, { label: string; icon: LucideIcon }> = {
  oversikt: { label: 'Oversikt', icon: LayoutDashboard },
  grafer: { label: 'Grafer', icon: BarChart3 },
  verktoy: { label: 'Verktøy', icon: Wrench },
}

export function adminPanelId(tab: AdminTabId) {
  return `admin-panel-${tab}`
}

export function adminTabButtonId(tab: AdminTabId) {
  return `admin-tab-${tab}`
}

export default function AdminTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: AdminTabId
  onTabChange: (tab: AdminTabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Admin-seksjoner"
      className="grid min-w-0 grid-cols-3 gap-2"
    >
      {(['oversikt', 'grafer', 'verktoy'] as const).map((tab) => {
        const { label, icon: Icon } = TAB_CONFIG[tab]
        const selected = activeTab === tab
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={adminTabButtonId(tab)}
            aria-selected={selected}
            aria-controls={`admin-panel-${tab}`}
            onClick={() => onTabChange(tab)}
            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium touch-manipulation transition-all sm:gap-2 sm:text-sm"
            style={{
              background: selected ? 'var(--primary-pale)' : 'var(--bg)',
              border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
              color: selected ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={16} strokeWidth={2.2} className="shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
