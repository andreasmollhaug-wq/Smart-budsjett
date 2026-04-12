'use client'

import Link from 'next/link'
import type { DashboardCheckItem } from '@/lib/dashboardOverviewHelpers'
import { AlertCircle } from 'lucide-react'

type Props = {
  items: DashboardCheckItem[]
}

export default function DashboardChecksCard({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Dette bør du sjekke
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Korte hint basert på valgt periode
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 items-start">
            <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--warning, #F08C00)' }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                {item.text}
              </p>
              {item.href && (
                <Link
                  href={item.href}
                  className="text-sm font-medium mt-1 inline-block outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                  style={{ color: 'var(--primary)' }}
                >
                  Åpne
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
