'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { formatNOK } from '@/lib/utils'
import { BarChart2, ListChecks, MapPin, TrendingUp, Wallet, Wrench } from 'lucide-react'
import { DEMO_RORLEGGER_PROJECTS } from './demoProjects'
import {
  aggregateByRegion,
  computeGlobalKpi,
  contractTypeCounts,
  projectUtilizationPercent,
  regionActualSeries,
} from './kpiUtils'
import { RorleggerRegionBarChart, RorleggerContractPieChart } from './RorleggerCharts'
import { CONTRACT_LABELS, REGION_LABELS, STATUS_LABELS, type RegionId } from './types'

const BASE = '/intern/rorlegger'

export default function RorleggerDashboardPage() {
  const projects = DEMO_RORLEGGER_PROJECTS
  const kpi = computeGlobalKpi(projects)
  const regions = aggregateByRegion(projects)
  const barData = regionActualSeries(regions)
  const pieData = contractTypeCounts(projects)

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Rørleggerprosjekter"
        subtitle="Internt demoområde — ikke del av husholdningens budsjett. Kun tilgjengelig via direkte lenke."
      />
      <div className="min-w-0 mx-auto max-w-5xl space-y-6 py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div
          className="rounded-2xl px-4 py-3 text-sm break-words"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <strong>Demo:</strong> Tall og dokumenter er fiktive. Modulen linkes ikke fra resten av appen — bokmerk
          stien hvis du skal hit igjen.
        </div>

        <div>
          <Link
            href={`${BASE}/alle`}
            className="mb-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
            style={{ background: 'var(--primary)' }}
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            Se alle prosjekter
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Aktive prosjekter"
            value={String(kpi.activeCount)}
            sub={`av ${kpi.projectCount} totalt (inkl. avsluttet)`}
            icon={Wrench}
            color="#4C6EF5"
            info="Antall med status «Pågående» i demodata."
          />
          <StatCard
            label="Samlet ramme (budsjett)"
            value={formatNOK(kpi.totalBudgetNok)}
            sub="Akkumulert for alle 8"
            icon={Wallet}
            color="#0CA678"
            valueNoWrap
            info="Summerte avtalte rammekostnader i NOK (demo)."
          />
          <StatCard
            label="Samlet faktisert"
            value={formatNOK(kpi.totalActualNok)}
            sub={
              kpi.avgUtilizationPercent != null
                ? `${kpi.avgUtilizationPercent.toFixed(1)} % av total ramme (snitt vektet)`
                : '—'
            }
            icon={BarChart2}
            color="#15AABF"
            valueNoWrap
          />
          <StatCard
            label="Avvik (faktisert − ramme)"
            value={formatNOK(kpi.varianceNok)}
            sub={kpi.varianceNok <= 0 ? 'Under eller på ramme' : 'Over ramme (demo)'}
            icon={TrendingUp}
            trend={kpi.varianceNok <= 0 ? 'up' : 'down'}
            color={kpi.varianceNok > 0 ? '#E03131' : '#40C057'}
            valueNoWrap
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RorleggerRegionBarChart data={barData} />
          <RorleggerContractPieChart data={pieData} />
        </div>

        <div className="space-y-8">
          {(Object.keys(REGION_LABELS) as RegionId[]).map((regionId) => {
            const r = regions.find((x) => x.region === regionId)
            if (!r) return null
            return (
              <section key={regionId} className="space-y-3">
                <h2
                  className="flex items-center gap-2 text-base font-bold sm:text-lg"
                  style={{ color: 'var(--text)' }}
                >
                  <MapPin className="h-5 w-5 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
                  {REGION_LABELS[regionId]}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatCard
                    label={`${r.label} — faktisert`}
                    value={formatNOK(r.totalActualNok)}
                    sub={`Ramme: ${formatNOK(r.totalBudgetNok)} · ${r.projectCount} prosjekt`}
                    icon={Wallet}
                    color="#4C6EF5"
                    valueNoWrap
                  />
                  <StatCard
                    label={`${r.label} — gjenstår (demo)`}
                    value={
                      r.totalBudgetNok >= r.totalActualNok
                        ? formatNOK(r.totalBudgetNok - r.totalActualNok)
                        : formatNOK(0)
                    }
                    sub="Ramme minus faktisert, ikke hensyntatt forpliktelser"
                    icon={TrendingUp}
                    color={r.totalActualNok > r.totalBudgetNok ? '#E03131' : '#0CA678'}
                    valueNoWrap
                  />
                </div>
                <ul className="space-y-2">
                  {r.projects.map((p) => {
                    const pct = projectUtilizationPercent(p)
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col gap-1 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                      >
                        <div className="min-w-0">
                          <p className="font-medium leading-snug" style={{ color: 'var(--text)' }}>
                            {p.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.customerOrSite} · {CONTRACT_LABELS[p.contractType]} ·{' '}
                            {STATUS_LABELS[p.status]}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {pct != null ? `${pct.toFixed(0)} % brukt` : '—'}
                          </span>
                          <Link
                            href={`${BASE}/${p.id}`}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-sm font-medium"
                            style={{ color: 'var(--primary)' }}
                          >
                            Åpne
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>

        <div
          className="rounded-2xl px-4 py-3 text-sm break-words"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="mb-1 font-medium" style={{ color: 'var(--text)' }}>
            Direkte lenker (bokmerk)
          </p>
          <p className="text-xs sm:text-sm">
            Dashboard: <code className="text-xs break-all" style={{ color: 'var(--text)' }}>{BASE}</code>
          </p>
          <p className="mt-1 text-xs sm:text-sm">
            Alle: <code className="text-xs break-all" style={{ color: 'var(--text)' }}>{BASE}/alle</code>
          </p>
        </div>
      </div>
    </div>
  )
}
