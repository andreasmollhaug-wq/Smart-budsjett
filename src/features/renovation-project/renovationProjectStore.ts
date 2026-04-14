import { create } from 'zustand'
import type {
  RenovationBudgetLine,
  RenovationChecklistItem,
  RenovationModulePersistedState,
  RenovationProject,
  RenovationProjectExpense,
  RenovationProjectStatus,
  RenovationTemplateKey,
} from './types'
import { createEmptyRenovationModuleState, normalizeOptionalIsoDateString } from './types'
import { generateId } from '@/lib/utils'

export interface RenovationProjectStoreState extends RenovationModulePersistedState {
  /** Satt etter hydrate fra server */
  _hydrated: boolean
}

type Store = RenovationProjectStoreState & {
  hydrate: (state: RenovationModulePersistedState) => void
  reset: () => void

  addProject: (project: RenovationProject) => void
  updateProjectMeta: (
    projectId: string,
    patch: {
      name?: string
      status?: RenovationProjectStatus
      notes?: string
      startDate?: string
      endDate?: string
      location?: string
    },
  ) => void
  removeProject: (projectId: string) => void

  addBudgetLine: (projectId: string, line: RenovationBudgetLine) => void
  updateBudgetLine: (
    projectId: string,
    lineId: string,
    patch: Partial<Pick<RenovationBudgetLine, 'label' | 'budgetedNok'>>,
  ) => void
  removeBudgetLine: (projectId: string, lineId: string) => void

  addExpense: (projectId: string, expense: RenovationProjectExpense) => void
  updateExpense: (
    projectId: string,
    expenseId: string,
    patch: Partial<
      Pick<RenovationProjectExpense, 'date' | 'amountNok' | 'description' | 'budgetLineId'>
    >,
  ) => void
  removeExpense: (projectId: string, expenseId: string) => void

  setChecklistItemDone: (projectId: string, itemId: string, done: boolean) => void
  addChecklistItem: (projectId: string, label: string) => void
  removeChecklistItem: (projectId: string, itemId: string) => void

  getPersistedSlice: () => RenovationModulePersistedState
}

function patchProject(
  projects: RenovationProject[],
  projectId: string,
  fn: (p: RenovationProject) => RenovationProject,
): RenovationProject[] {
  return projects.map((p) => (p.id === projectId ? fn(p) : p))
}

export const useRenovationProjectStore = create<Store>((set, get) => ({
  version: 1,
  projects: [],
  _hydrated: false,

  hydrate: (state) => {
    set({
      version: state.version,
      projects: state.projects,
      _hydrated: true,
    })
  },

  reset: () => {
    set({ ...createEmptyRenovationModuleState(), _hydrated: true })
  },

  addProject: (project) => {
    set((s) => ({ projects: [...s.projects, project] }))
  },

  updateProjectMeta: (projectId, patch) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => {
        let next: RenovationProject = { ...p }
        if (patch.name !== undefined) next = { ...next, name: patch.name }
        if (patch.status !== undefined) next = { ...next, status: patch.status }
        if (patch.notes !== undefined) {
          const t = patch.notes.trim()
          if (t === '') {
            const { notes: _n, ...rest } = next
            next = rest as RenovationProject
          } else {
            next = { ...next, notes: t }
          }
        }
        if (patch.location !== undefined) {
          const t = patch.location.trim()
          if (t === '') {
            const { location: _l, ...rest } = next
            next = rest as RenovationProject
          } else {
            next = { ...next, location: t }
          }
        }
        if (patch.startDate !== undefined) {
          const t = patch.startDate.trim()
          if (t === '') {
            const { startDate: _s, ...rest } = next
            next = rest as RenovationProject
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
            next = { ...next, startDate: t }
          }
        }
        if (patch.endDate !== undefined) {
          const t = patch.endDate.trim()
          if (t === '') {
            const { endDate: _e, ...rest } = next
            next = rest as RenovationProject
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
            next = { ...next, endDate: t }
          }
        }
        return next
      }),
    }))
  },

  removeProject: (projectId) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }))
  },

  addBudgetLine: (projectId, line) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        budgetLines: [...p.budgetLines, line],
      })),
    }))
  },

  updateBudgetLine: (projectId, lineId, patch) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        budgetLines: p.budgetLines.map((l) =>
          l.id === lineId ? { ...l, ...patch } : l,
        ),
      })),
    }))
  },

  removeBudgetLine: (projectId, lineId) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        budgetLines: p.budgetLines.filter((l) => l.id !== lineId),
        expenses: p.expenses.map((e) =>
          e.budgetLineId === lineId ? { ...e, budgetLineId: null } : e,
        ),
      })),
    }))
  },

  addExpense: (projectId, expense) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        expenses: [...p.expenses, expense],
      })),
    }))
  },

  updateExpense: (projectId, expenseId, patch) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)),
      })),
    }))
  },

  removeExpense: (projectId, expenseId) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        expenses: p.expenses.filter((e) => e.id !== expenseId),
      })),
    }))
  },

  setChecklistItemDone: (projectId, itemId, done) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        checklist: p.checklist.map((c) => (c.id === itemId ? { ...c, done } : c)),
      })),
    }))
  },

  addChecklistItem: (projectId, label) => {
    const trimmed = label.trim()
    if (!trimmed) return
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => {
        const order = p.checklist.length
        const item: RenovationChecklistItem = {
          id: generateId(),
          label: trimmed,
          done: false,
          order,
        }
        return { ...p, checklist: [...p.checklist, item] }
      }),
    }))
  },

  removeChecklistItem: (projectId, itemId) => {
    set((s) => ({
      projects: patchProject(s.projects, projectId, (p) => ({
        ...p,
        checklist: p.checklist
          .filter((c) => c.id !== itemId)
          .map((c, i) => ({ ...c, order: i })),
      })),
    }))
  },

  getPersistedSlice: () => {
    const st = get()
    return {
      version: st.version,
      projects: st.projects,
    }
  },
}))

export function buildNewProjectFromTemplate(input: {
  name: string
  templateKey: RenovationTemplateKey
  checklist: RenovationChecklistItem[]
  location?: string
  startDate?: string
  endDate?: string
  notes?: string
}): RenovationProject {
  const id = generateId()
  const createdAt = new Date().toISOString()
  const location =
    input.location !== undefined && input.location.trim() !== '' ? input.location.trim() : undefined
  const notes =
    input.notes !== undefined && input.notes.trim() !== '' ? input.notes.trim() : undefined
  const startDate = normalizeOptionalIsoDateString(input.startDate)
  const endDate = normalizeOptionalIsoDateString(input.endDate)
  return {
    id,
    name: input.name.trim() || 'Uten navn',
    ...(location ? { location } : {}),
    ...(notes ? { notes } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    templateKey: input.templateKey,
    createdAt,
    status: 'active',
    budgetLines: [],
    expenses: [],
    checklist: input.checklist,
  }
}
