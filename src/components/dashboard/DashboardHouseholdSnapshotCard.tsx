'use client'

import Link from 'next/link'
import HouseholdActualsTable from '@/components/budget/household/HouseholdActualsTable'
import type { HouseholdMemberPeriodTotals } from '@/lib/householdDashboardData'
import { ChevronRight } from 'lucide-react'

type Props = {
  members: HouseholdMemberPeriodTotals[]
  periodLabel: string
}

export default function DashboardHouseholdSnapshotCard({ members, periodLabel }: Props) {
  return (
    <div
      className="min-w-0 w-full max-w-[min(100%,22.5rem)] rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Fordeling i husholdningen
      </h2>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Faktisk inntekt og utgift per person · {periodLabel}
      </p>
      <HouseholdActualsTable members={members} compact />
      <Link
        href="/budsjett/husholdning"
        className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
        style={{ color: 'var(--primary)' }}
      >
        Mer i Budsjett → Husholdning
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}
