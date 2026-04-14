export const RENOVATION_MODULE_STATE_VERSION = 1 as const

export type RenovationTemplateKey = 'bathroom' | 'kitchen' | 'custom'

export type RenovationProjectStatus = 'active' | 'archived'

export interface RenovationBudgetLine {
  id: string
  label: string
  budgetedNok: number
}

export interface RenovationProjectExpense {
  id: string
  date: string
  amountNok: number
  description: string
  budgetLineId?: string | null
  createdAt: string
}

export interface RenovationChecklistItem {
  id: string
  label: string
  done: boolean
  order: number
}

export interface RenovationProject {
  id: string
  name: string
  /** Fritekst: adresse, kontakter, leverandører, ting å huske … */
  notes?: string
  /** yyyy-mm-dd */
  startDate?: string
  /** yyyy-mm-dd */
  endDate?: string
  /** F.eks. rom, garasje, «hjemme» */
  location?: string
  templateKey?: RenovationTemplateKey
  createdAt: string
  status: RenovationProjectStatus
  budgetLines: RenovationBudgetLine[]
  expenses: RenovationProjectExpense[]
  checklist: RenovationChecklistItem[]
}

export interface RenovationModulePersistedState {
  version: typeof RENOVATION_MODULE_STATE_VERSION
  projects: RenovationProject[]
}

export function createEmptyRenovationModuleState(): RenovationModulePersistedState {
  return { version: RENOVATION_MODULE_STATE_VERSION, projects: [] }
}

export function normalizeRenovationModuleState(raw: unknown): RenovationModulePersistedState {
  const empty = createEmptyRenovationModuleState()
  if (!raw || typeof raw !== 'object') return empty
  const o = raw as Record<string, unknown>
  if (o.version !== RENOVATION_MODULE_STATE_VERSION) return empty
  if (!Array.isArray(o.projects)) return empty
  const projects: RenovationProject[] = []
  for (const p of o.projects) {
    if (!p || typeof p !== 'object') continue
    const pr = p as Record<string, unknown>
    if (typeof pr.id !== 'string' || typeof pr.name !== 'string') continue
    const status = pr.status === 'archived' ? 'archived' : 'active'
    const createdAt = typeof pr.createdAt === 'string' ? pr.createdAt : new Date().toISOString()
    const templateKey =
      pr.templateKey === 'bathroom' || pr.templateKey === 'kitchen' || pr.templateKey === 'custom'
        ? pr.templateKey
        : undefined
    const budgetLines: RenovationBudgetLine[] = Array.isArray(pr.budgetLines)
      ? pr.budgetLines.filter(
          (b): b is RenovationBudgetLine =>
            !!b &&
            typeof b === 'object' &&
            typeof (b as RenovationBudgetLine).id === 'string' &&
            typeof (b as RenovationBudgetLine).label === 'string' &&
            typeof (b as RenovationBudgetLine).budgetedNok === 'number',
        )
      : []
    const expenses: RenovationProjectExpense[] = Array.isArray(pr.expenses)
      ? pr.expenses.filter(
          (e): e is RenovationProjectExpense =>
            !!e &&
            typeof e === 'object' &&
            typeof (e as RenovationProjectExpense).id === 'string' &&
            typeof (e as RenovationProjectExpense).date === 'string' &&
            typeof (e as RenovationProjectExpense).amountNok === 'number' &&
            typeof (e as RenovationProjectExpense).description === 'string' &&
            typeof (e as RenovationProjectExpense).createdAt === 'string',
        )
      : []
    const checklist: RenovationChecklistItem[] = Array.isArray(pr.checklist)
      ? pr.checklist.filter(
          (c): c is RenovationChecklistItem =>
            !!c &&
            typeof c === 'object' &&
            typeof (c as RenovationChecklistItem).id === 'string' &&
            typeof (c as RenovationChecklistItem).label === 'string' &&
            typeof (c as RenovationChecklistItem).done === 'boolean' &&
            typeof (c as RenovationChecklistItem).order === 'number',
        )
      : []
    const notes =
      typeof pr.notes === 'string' ? pr.notes.trim() === '' ? undefined : pr.notes.trim() : undefined
    const startDate = normalizeOptionalIsoDateString(pr.startDate)
    const endDate = normalizeOptionalIsoDateString(pr.endDate)
    const location =
      typeof pr.location === 'string' && pr.location.trim() !== '' ? pr.location.trim() : undefined
    projects.push({
      id: pr.id,
      name: pr.name,
      ...(notes !== undefined ? { notes } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(location ? { location } : {}),
      templateKey,
      createdAt,
      status,
      budgetLines,
      expenses,
      checklist,
    })
  }
  return { version: RENOVATION_MODULE_STATE_VERSION, projects }
}

/** Leser lagret verdi til yyyy-mm-dd eller undefined (ukjente format droppes). */
export function normalizeOptionalIsoDateString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  if (!s) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  return s
}
