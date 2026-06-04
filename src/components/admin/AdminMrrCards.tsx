'use client'

import AdminPlanMrrCard from '@/components/admin/AdminPlanMrrCard'
import { formatAdminNok, scalePlanMrrToAnnual } from '@/lib/admin/adminPlanMrr'
import type { AdminMetricsPayload } from '@/lib/admin/types'
import { CalendarRange, ChevronDown, CreditCard, TrendingUp } from 'lucide-react'

export default function AdminMrrCards({
  trialPotentialMrr,
  activeMrr,
}: {
  trialPotentialMrr: AdminMetricsPayload['trialPotentialMrr']
  activeMrr: AdminMetricsPayload['activeMrr']
}) {
  const activeArr = scalePlanMrrToAnnual(activeMrr)
  const trialArr = scalePlanMrrToAnnual(trialPotentialMrr)

  return (
    <div className="mt-4 space-y-4 sm:mt-5">
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <AdminPlanMrrCard
          title="MRR (aktive)"
          description="Månedlig inntekt fra abonnement med status active (89 / 139 kr per plan)"
          emptyDescription="Ingen aktive abonnement med kjent plan akkurat nå"
          mrr={activeMrr}
          countNoun="aktive"
          icon={CreditCard}
          iconColor="#099268"
        />
        <AdminPlanMrrCard
          title="Potensiell MRR (prøve)"
          description="Hvis alle i prøveperiode konverterer til full pris når prøven utløper"
          emptyDescription="Ingen i prøveperiode akkurat nå"
          mrr={trialPotentialMrr}
          countNoun="i prøve"
          icon={TrendingUp}
          iconColor="#3B5BDB"
        />
      </div>

      <details className="min-w-0 group">
        <summary
          className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 touch-manipulation sm:px-4 [&::-webkit-details-marker]:hidden"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="min-w-0 text-left text-sm font-medium" style={{ color: 'var(--text)' }}>
            <span className="group-open:hidden">
              Vis årlig inntekt (MRR × 12)
              <span className="mt-0.5 block text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                Aktive {formatAdminNok(activeArr.totalNok)} · Prøve {formatAdminNok(trialArr.totalNok)}
              </span>
            </span>
            <span className="hidden group-open:inline">Skjul årlig inntekt</span>
          </span>
          <ChevronDown
            size={18}
            className="shrink-0 transition-transform duration-200 group-open:rotate-180"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden
          />
        </summary>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <AdminPlanMrrCard
            title="Årlig inntekt (aktive)"
            description="MRR for aktive × 12 — samme forutsetninger som månedskortet over"
            emptyDescription="Ingen aktive abonnement med kjent plan akkurat nå"
            mrr={activeArr}
            countNoun="aktive"
            icon={CalendarRange}
            iconColor="#099268"
            period="year"
          />
          <AdminPlanMrrCard
            title="Potensiell årlig (prøve)"
            description="Potensiell MRR i prøve × 12 hvis alle konverterer"
            emptyDescription="Ingen i prøveperiode akkurat nå"
            mrr={trialArr}
            countNoun="i prøve"
            icon={CalendarRange}
            iconColor="#3B5BDB"
            period="year"
          />
        </div>
      </details>
    </div>
  )
}
