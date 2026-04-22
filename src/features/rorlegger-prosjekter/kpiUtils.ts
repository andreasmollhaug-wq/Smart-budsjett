import { REGION_LABELS, type ContractType, type ProjectStatus, type RegionId, type RorleggerProject } from './types'

export interface GlobalKpi {
  projectCount: number
  activeCount: number
  totalBudgetNok: number
  totalActualNok: number
  varianceNok: number
  /** null hvis totalBudgetNok = 0 */
  avgUtilizationPercent: number | null
}

export function computeGlobalKpi(projects: RorleggerProject[]): GlobalKpi {
  const totalBudgetNok = projects.reduce((a, p) => a + p.budgetNok, 0)
  const totalActualNok = projects.reduce((a, p) => a + p.actualNok, 0)
  const activeCount = projects.filter((p) => p.status === 'paaGaende').length
  return {
    projectCount: projects.length,
    activeCount,
    totalBudgetNok,
    totalActualNok,
    varianceNok: totalActualNok - totalBudgetNok,
    avgUtilizationPercent:
      totalBudgetNok > 0 ? (totalActualNok / totalBudgetNok) * 100 : null,
  }
}

export interface RegionKpi {
  region: RegionId
  label: string
  projectCount: number
  totalBudgetNok: number
  totalActualNok: number
  projects: RorleggerProject[]
}

export function aggregateByRegion(projects: RorleggerProject[]): RegionKpi[] {
  const byRegion = new Map<RegionId, RorleggerProject[]>()
  for (const r of Object.keys(REGION_LABELS) as RegionId[]) {
    byRegion.set(r, [])
  }
  for (const p of projects) {
    byRegion.get(p.region)!.push(p)
  }
  return (Object.keys(REGION_LABELS) as RegionId[]).map((region) => {
    const list = byRegion.get(region) ?? []
    return {
      region,
      label: REGION_LABELS[region],
      projectCount: list.length,
      totalBudgetNok: list.reduce((a, p) => a + p.budgetNok, 0),
      totalActualNok: list.reduce((a, p) => a + p.actualNok, 0),
      projects: list,
    }
  })
}

function parseIso(s: string): number {
  return new Date(s + 'T12:00:00').getTime()
}

/**
 * Enkel demo-overlapp: prosjektets [start, end] krysser [filterFrom, filterTo].
 * Hvis `endDate` mangler, brukes filterTo som øvre grense for prosjektet (åpen slutt).
 */
export function projectOverlapsDateRange(
  p: RorleggerProject,
  filterFrom: string,
  filterTo: string,
): boolean {
  const f0 = parseIso(filterFrom)
  const f1 = parseIso(filterTo)
  const s = parseIso(p.startDate)
  const end = p.endDate ? parseIso(p.endDate) : f1
  return s <= f1 && end >= f0
}

export interface RorleggerListFilters {
  /** Tom = alle regioner */
  regions: RegionId[]
  dateFrom: string
  dateTo: string
  /** Tom = begge statuser */
  statuses: ProjectStatus[]
  /** Tom = begge avtaletyper */
  contractTypes: ContractType[]
}

export const EMPTY_FILTERS: RorleggerListFilters = {
  regions: [],
  dateFrom: '',
  dateTo: '',
  statuses: [],
  contractTypes: [],
}

export function filterRorleggerProjects(
  projects: RorleggerProject[],
  f: RorleggerListFilters,
): RorleggerProject[] {
  return projects.filter((p) => {
    if (f.regions.length > 0 && !f.regions.includes(p.region)) return false
    if (f.statuses.length > 0 && !f.statuses.includes(p.status)) return false
    if (f.contractTypes.length > 0 && !f.contractTypes.includes(p.contractType)) return false
    if (f.dateFrom && f.dateTo) {
      if (!projectOverlapsDateRange(p, f.dateFrom, f.dateTo)) return false
    }
    return true
  })
}

/** Til søyler/diagram: faktisert per region. */
export function regionActualSeries(regions: RegionKpi[]) {
  return regions.map((r) => ({ name: r.label, actualNok: r.totalActualNok, budgetNok: r.totalBudgetNok }))
}

export function contractTypeCounts(projects: RorleggerProject[]) {
  let fastpris = 0
  let lopende = 0
  for (const p of projects) {
    if (p.contractType === 'fastpris') fastpris += 1
    else lopende += 1
  }
  return [
    { name: 'Fastpris', value: fastpris, key: 'fastpris' as const },
    { name: 'Løpende regning', value: lopende, key: 'lopende' as const },
  ]
}

export function projectUtilizationPercent(p: RorleggerProject): number | null {
  if (p.budgetNok <= 0) return null
  return (p.actualNok / p.budgetNok) * 100
}
