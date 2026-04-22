'use client'

import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { formatIsoDateDdMmYyyy, formatNOK } from '@/lib/utils'
import { ArrowLeft, Filter } from 'lucide-react'
import { DEMO_RORLEGGER_PROJECTS } from './demoProjects'
import {
  EMPTY_FILTERS,
  filterRorleggerProjects,
  type RorleggerListFilters,
} from './kpiUtils'
import {
  CONTRACT_LABELS,
  REGION_LABELS,
  STATUS_LABELS,
  type ContractType,
  type ProjectStatus,
  type RegionId,
} from './types'
import { projectUtilizationPercent } from './kpiUtils'

const BASE = '/intern/rorlegger'

const ALL_REGIONS = Object.keys(REGION_LABELS) as RegionId[]

/** Markør på venstre side per region (tabellskanning). */
const REGION_ROW_ACCENT: Record<RegionId, string> = {
  ost: 'var(--primary)',
  sor: '#15AABF',
  vest: '#40C057',
  midtNord: '#E67700',
}

function parseListParam(s: string | null): string[] {
  if (!s || !s.trim()) return []
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

/** Tom `regions` = alle regioner. Tom `statuses` / `contractTypes` = alle typer. */
function filtersFromSearchParams(sp: URLSearchParams): RorleggerListFilters {
  const regions = parseListParam(sp.get('region')).filter((r): r is RegionId => r in REGION_LABELS)
  const statuses = parseListParam(sp.get('status')).filter(
    (r): r is ProjectStatus => r === 'paaGaende' || r === 'avsluttet',
  )
  const contractTypes = parseListParam(sp.get('avtale')).filter(
    (r): r is ContractType => r === 'fastpris' || r === 'lopende',
  )
  return {
    regions: regions as RegionId[],
    dateFrom: sp.get('fra')?.trim() ?? '',
    dateTo: sp.get('til')?.trim() ?? '',
    statuses: statuses as ProjectStatus[],
    contractTypes: contractTypes as ContractType[],
  }
}

function buildQuery(f: RorleggerListFilters): string {
  const p = new URLSearchParams()
  if (f.regions.length > 0) p.set('region', f.regions.join(','))
  if (f.statuses.length > 0) p.set('status', f.statuses.join(','))
  if (f.contractTypes.length > 0) p.set('avtale', f.contractTypes.join(','))
  if (f.dateFrom) p.set('fra', f.dateFrom)
  if (f.dateTo) p.set('til', f.dateTo)
  const q = p.toString()
  return q ? `?${q}` : ''
}

export default function RorleggerAllePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])

  const setFilters = useCallback(
    (next: RorleggerListFilters) => {
      router.replace(`${pathname}${buildQuery(next)}`, { scroll: false })
    },
    [router, pathname],
  )

  const projects = useMemo(
    () => filterRorleggerProjects(DEMO_RORLEGGER_PROJECTS, filters),
    [filters],
  )

  const reset = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS })
  }, [setFilters])

  return (
    <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Alle rørleggerprosjekter"
        subtitle="Filter og listen — demodata. Ingen kobling til husholdningsbudsjettet."
      />
      <div className="min-w-0 mx-auto max-w-6xl space-y-6 py-4 sm:py-6 md:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={BASE}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Tilbake til dashboard
          </Link>
        </div>

        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2
            className="mb-4 flex min-h-[44px] items-center gap-2 text-sm font-semibold sm:text-base"
            style={{ color: 'var(--text)' }}
          >
            <Filter className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
            Filtre
          </h2>
          <p className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Tomme avkryssinger = vis alle. Periode: når både fra- og til-dato er satt, vises prosjekter som har
            overlapp med intervallet (enkel demo — basert på start/slutt for prosjektet).
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <fieldset>
              <legend className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Region (velg én eller flere — tom valg = alle)
              </legend>
              <select
                multiple
                className="min-h-[120px] w-full max-w-sm rounded-xl border px-2 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={filters.regions}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (o) => o.value as RegionId)
                  setFilters({ ...filters, regions: selected })
                }}
                aria-label="Filter regioner"
              >
                {ALL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {REGION_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Tips: bruk Cmd/Ctrl-klikk for flere, eller stå tom = alle.
              </p>
            </fieldset>

            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Periode (overlap)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="date"
                  className="min-h-[44px] w-full rounded-xl border px-2 text-sm sm:max-w-[11rem]"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  aria-label="Fra dato"
                />
                <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  —
                </span>
                <input
                  type="date"
                  className="min-h-[44px] w-full rounded-xl border px-2 text-sm sm:max-w-[11rem]"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  aria-label="Til dato"
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Status
              </legend>
              <select
                multiple
                className="min-h-[80px] w-full max-w-sm rounded-xl border px-2 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={filters.statuses}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (o) => o.value as ProjectStatus,
                  )
                  setFilters({ ...filters, statuses: selected })
                }}
                aria-label="Filter status"
              >
                <option value="paaGaende">Pågående</option>
                <option value="avsluttet">Avsluttet</option>
              </select>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Avtaleform
              </legend>
              <select
                multiple
                className="min-h-[80px] w-full max-w-sm rounded-xl border px-2 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={filters.contractTypes}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (o) => o.value as ContractType,
                  )
                  setFilters({ ...filters, contractTypes: selected })
                }}
                aria-label="Filter avtaleform"
              >
                <option value="fastpris">Fastpris</option>
                <option value="lopende">Løpende regning</option>
              </select>
            </fieldset>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Nullstill filtre
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
            Ingen treff med disse filtrene.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-3 py-3 font-medium sm:px-4" style={{ color: 'var(--text-muted)' }}>
                    Prosjekt
                  </th>
                  <th className="px-2 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Region
                  </th>
                  <th className="px-2 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Periode
                  </th>
                  <th className="px-2 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th className="px-2 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>
                    Avtale
                  </th>
                  <th className="px-2 py-3 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    Ramme
                  </th>
                  <th className="px-2 py-3 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    Faktisert
                  </th>
                  <th className="px-2 py-3 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    %
                  </th>
                  <th className="px-3 py-3 sm:px-4" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const pct = projectUtilizationPercent(p)
                  const stripe = i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--bg)]'
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-[var(--border)] transition-colors duration-150 hover:!bg-[var(--primary-pale)] ${stripe}`}
                      style={{
                        borderLeft: `3px solid ${REGION_ROW_ACCENT[p.region]}`,
                      }}
                    >
                      <td className="max-w-[240px] px-3 py-3 sm:px-4">
                        <p className="font-medium leading-snug" style={{ color: 'var(--text)' }}>
                          {p.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {p.customerOrSite}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3" style={{ color: 'var(--text)' }}>
                        {REGION_LABELS[p.region]}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatIsoDateDdMmYyyy(p.startDate)} –{p.endDate ? ` ${formatIsoDateDdMmYyyy(p.endDate)}` : ' —'}
                      </td>
                      <td className="px-2 py-3" style={{ color: 'var(--text)' }}>
                        {STATUS_LABELS[p.status]}
                      </td>
                      <td className="px-2 py-3" style={{ color: 'var(--text)' }}>
                        {CONTRACT_LABELS[p.contractType]}
                      </td>
                      <td className="px-2 py-3 text-right font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatNOK(p.budgetNok)}
                      </td>
                      <td className="px-2 py-3 text-right font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatNOK(p.actualNok)}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {pct != null ? `${pct.toFixed(0)} %` : '—'}
                      </td>
                      <td className="px-2 py-3 sm:px-4">
                        <Link
                          href={`${BASE}/${p.id}`}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm font-medium"
                          style={{ color: 'var(--primary)' }}
                        >
                          Åpne
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
