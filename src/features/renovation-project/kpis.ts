import type { RenovationProject } from './types'

export interface LineKpiRow {
  lineId: string
  label: string
  budgetedNok: number
  actualNok: number
  varianceNok: number
  variancePercentOfLine: number | null
}

export interface ProjectKpis {
  totalBudgetedNok: number
  totalActualNok: number
  varianceNok: number
  variancePercentOfBudget: number | null
  uncategorizedActualNok: number
  lineRows: LineKpiRow[]
  checklistDone: number
  checklistTotal: number
  checklistPercent: number | null
}

function sumExpensesForLine(project: RenovationProject, lineId: string): number {
  let s = 0
  for (const e of project.expenses) {
    if (e.budgetLineId === lineId) s += e.amountNok
  }
  return s
}

export function computeProjectKpis(project: RenovationProject): ProjectKpis {
  const totalBudgetedNok = project.budgetLines.reduce((a, l) => a + Math.max(0, l.budgetedNok), 0)
  const totalActualNok = project.expenses.reduce((a, e) => a + Math.max(0, e.amountNok), 0)

  let uncategorizedActualNok = 0
  for (const e of project.expenses) {
    if (!e.budgetLineId) uncategorizedActualNok += Math.max(0, e.amountNok)
  }

  const lineRows: LineKpiRow[] = project.budgetLines.map((line) => {
    const actualNok = sumExpensesForLine(project, line.id)
    const budgetedNok = Math.max(0, line.budgetedNok)
    const varianceNok = actualNok - budgetedNok
    const variancePercentOfLine =
      budgetedNok === 0 ? null : (varianceNok / budgetedNok) * 100
    return {
      lineId: line.id,
      label: line.label,
      budgetedNok,
      actualNok,
      varianceNok,
      variancePercentOfLine,
    }
  })

  const varianceNok = totalActualNok - totalBudgetedNok
  const variancePercentOfBudget =
    totalBudgetedNok === 0 ? null : (varianceNok / totalBudgetedNok) * 100

  const checklistTotal = project.checklist.length
  const checklistDone = project.checklist.filter((c) => c.done).length
  const checklistPercent =
    checklistTotal === 0 ? null : (checklistDone / checklistTotal) * 100

  return {
    totalBudgetedNok,
    totalActualNok,
    varianceNok,
    variancePercentOfBudget,
    uncategorizedActualNok,
    lineRows,
    checklistDone,
    checklistTotal,
    checklistPercent,
  }
}

/** Aggregerte KPI-er for aktive prosjekter (samme filter som prosjektlisten). */
export interface PortfolioKpis {
  activeProjectCount: number
  totalBudgetedNok: number
  totalActualNok: number
  remainingNok: number
  varianceNok: number
  variancePercentOfBudget: number | null
  /** Andel av samlet budsjett som er brukt (kan overstige 100 % ved overskridelse). */
  budgetUtilizationPercent: number | null
  checklistDone: number
  checklistTotal: number
  checklistPercent: number | null
}

export function computePortfolioKpisForProjects(projects: RenovationProject[]): PortfolioKpis {
  const active = projects.filter((p) => p.status === 'active')
  const activeProjectCount = active.length

  let totalBudgetedNok = 0
  let totalActualNok = 0
  let checklistDone = 0
  let checklistTotal = 0

  for (const p of active) {
    const k = computeProjectKpis(p)
    totalBudgetedNok += k.totalBudgetedNok
    totalActualNok += k.totalActualNok
    checklistDone += k.checklistDone
    checklistTotal += k.checklistTotal
  }

  const varianceNok = totalActualNok - totalBudgetedNok
  const remainingNok = totalBudgetedNok - totalActualNok
  const variancePercentOfBudget =
    totalBudgetedNok === 0 ? null : (varianceNok / totalBudgetedNok) * 100
  const budgetUtilizationPercent =
    totalBudgetedNok === 0 ? null : (totalActualNok / totalBudgetedNok) * 100
  const checklistPercent =
    checklistTotal === 0 ? null : (checklistDone / checklistTotal) * 100

  return {
    activeProjectCount,
    totalBudgetedNok,
    totalActualNok,
    remainingNok,
    varianceNok,
    variancePercentOfBudget,
    budgetUtilizationPercent,
    checklistDone,
    checklistTotal,
    checklistPercent,
  }
}
