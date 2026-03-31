import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { generateId } from './utils'
import { PRODUCT_ANNOUNCEMENTS, isAnnouncementApplicable, type AnnouncementKind } from '@/lib/announcements'
import type { ParentCategory } from './budgetCategoryCatalog'
import { emptyLabelLists, type LabelLists } from './budgetCategoryCatalog'

export type { LabelLists }
export type { ParentCategory } from './budgetCategoryCatalog'

/** Felles fallback når persisted PersonData mangler label-felt (unngår krasj ved SSR / husholdning). */
const EMPTY_LABEL_LISTS = emptyLabelLists()

export type SubscriptionPlan = 'solo' | 'family'

/** Individuell profil vs. samlet husholdning (sum av alle profiler). */
export type FinanceScope = 'profile' | 'household'

export const MAX_FAMILY_PROFILES = 5

export const DEFAULT_PROFILE_ID = 'default'

export type AppNotificationKind = AnnouncementKind

export interface AppNotification {
  id: string
  title: string
  body: string
  kind: AppNotificationKind
  createdAt: string
  read: boolean
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

export interface BudgetCategory {
  id: string
  name: string
  budgeted: number[] // [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]
  spent: number
  type: 'income' | 'expense'
  color: string
  parentCategory: ParentCategory
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'once'
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  color: string
}

export interface Debt {
  id: string
  name: string
  totalAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  type: 'loan' | 'credit_card' | 'mortgage' | 'student_loan' | 'other'
  /** Fritekst: vilkår, bank, egen kommentar */
  note?: string
  /** Eksplisitt «avdrag pauset» */
  repaymentPaused?: boolean
  /** Når pausen slutter (yyyy-mm-dd) */
  pauseEndDate?: string
  /** Ta med i snøball-rekkefølge (manglende: boliglån nei, ellers ja — se `snowball.ts`) */
  includeInSnowball?: boolean
}

export interface Investment {
  id: string
  name: string
  type: 'stocks' | 'funds' | 'crypto' | 'bonds' | 'other'
  purchaseValue: number
  currentValue: number
  purchaseDate: string
  history?: InvestmentHistoryPoint[]
}

export interface InvestmentHistoryPoint {
  id?: string
  date: string // yyyy-mm-dd
  value: number
}

export interface PersonProfile {
  id: string
  name: string
}

/** Snøball: minste restgjeld først. Avalanche: høyeste rente først. */
export type DebtPayoffStrategy = 'snowball' | 'avalanche'

/** Økonomidata per person i husholdningen. */
export interface PersonData {
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  hiddenBudgetLabels: Record<ParentCategory, string[]>
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  investments: Investment[]
  /** Ekstra nedbetaling per måned (snøball), kr — per profil */
  snowballExtraMonthly?: number
  /** Rekkefølge for fokuslån; husholdningsaggregat setter ikke feltet */
  debtPayoffStrategy?: DebtPayoffStrategy
}

interface AppState {
  subscriptionPlan: SubscriptionPlan
  profiles: PersonProfile[]
  activeProfileId: string
  /** Når `household`: vist data er aggregert over alle profiler (kun meningsfullt for Familie med 2+ profiler). */
  financeScope: FinanceScope
  people: Record<string, PersonData>

  notifications: AppNotification[]
  deliveredAnnouncementIds: string[]

  /** Erstatter tidligere Zustand-persist + brukes ved innlasting fra Supabase. */
  hydrateFromPayload: (payload: unknown) => void
  syncProductAnnouncements: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  setSubscriptionPlan: (plan: SubscriptionPlan) => { ok: true } | { ok: false; reason: 'solo_requires_one_profile' }
  setActiveProfileId: (id: string) => void
  setFinanceScope: (scope: FinanceScope) => void
  addProfile: (name: string) =>
    | { ok: true; id: string }
    | { ok: false; reason: 'solo_limit' | 'max_profiles' | 'invalid_name' }
  renameProfile: (id: string, name: string) => void

  addTransaction: (t: Transaction) => void
  removeTransaction: (id: string) => void
  recalcBudgetSpent: (categoryName: string) => void

  addBudgetCategory: (c: BudgetCategory) => void
  updateBudgetCategory: (id: string, data: Partial<BudgetCategory>) => void
  removeBudgetCategory: (id: string) => void

  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  removeCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  hideStandardBudgetLabel: (parent: ParentCategory, name: string) => void
  unhideStandardBudgetLabel: (parent: ParentCategory, name: string) => void

  addSavingsGoal: (g: SavingsGoal) => void
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void
  removeSavingsGoal: (id: string) => void

  addDebt: (d: Debt) => void
  updateDebt: (id: string, data: Partial<Debt>) => void
  removeDebt: (id: string) => void
  setSnowballExtraMonthly: (amount: number) => void
  setDebtPayoffStrategy: (strategy: DebtPayoffStrategy) => void

  addInvestment: (i: Investment) => void
  updateInvestment: (id: string, data: Partial<Investment>) => void
  removeInvestment: (id: string) => void

  addInvestmentHistoryValue: (investmentId: string, point: { date: string; value: number }) => void

  removeInvestmentHistoryValue: (
    investmentId: string,
    point: { id?: string; date: string; value: number },
  ) => void
}

/** Felter som lagres i Supabase `user_app_state.state` (jsonb). */
export type PersistedAppSlice = Pick<
  AppState,
  | 'subscriptionPlan'
  | 'profiles'
  | 'activeProfileId'
  | 'financeScope'
  | 'people'
  | 'notifications'
  | 'deliveredAnnouncementIds'
>

/** Tidligere nøkkel for Zustand persist (brukes til engangsmigrering til Supabase). */
export const LEGACY_ZUSTAND_STORAGE_KEY = 'smart-budsjett-storage'

export function createDefaultPersistedSlice(): PersistedAppSlice {
  return {
    subscriptionPlan: 'solo',
    profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
    activeProfileId: DEFAULT_PROFILE_ID,
    financeScope: 'profile',
    people: { [DEFAULT_PROFILE_ID]: createInitialPersonData() },
    notifications: [],
    deliveredAnnouncementIds: [],
  }
}

export function pickPersistedSlice(state: AppState): PersistedAppSlice {
  return {
    subscriptionPlan: state.subscriptionPlan,
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
    financeScope: state.financeScope,
    people: state.people,
    notifications: state.notifications,
    deliveredAnnouncementIds: state.deliveredAnnouncementIds,
  }
}

function mergePersistedIntoFullState(persisted: unknown, current: AppState): AppState {
  const p = persisted as (Partial<AppState> & LegacyPersistedState) | undefined
  if (!p) return current

  const hasNewShape =
    p.people &&
    Object.keys(p.people).length > 0 &&
    p.activeProfileId &&
    p.profiles &&
    p.profiles.length > 0

  if (!hasNewShape) {
    const m = migrateFromLegacy(p)
    return {
      ...current,
      subscriptionPlan: m.subscriptionPlan,
      profiles: m.profiles,
      activeProfileId: m.activeProfileId,
      people: m.people,
    }
  }

  const base = { ...current, ...p } as AppState

  for (const pr of base.profiles) {
    if (!base.people[pr.id]) {
      base.people[pr.id] = createEmptyPersonData()
    }
    const person = base.people[pr.id]
    if (!person.customBudgetLabels) person.customBudgetLabels = emptyLabelLists().customBudgetLabels
    if (!person.hiddenBudgetLabels) person.hiddenBudgetLabels = emptyLabelLists().hiddenBudgetLabels
  }

  if (!base.profiles.some((x) => x.id === base.activeProfileId)) {
    base.activeProfileId = base.profiles[0]?.id ?? DEFAULT_PROFILE_ID
  }

  if (!Array.isArray(base.notifications)) base.notifications = []
  if (!Array.isArray(base.deliveredAnnouncementIds)) base.deliveredAnnouncementIds = []

  return base
}

/** Leser rå legacy persist (Zustand) fra localStorage — returnerer inner `state` om tilgjengelig. */
export function tryReadLegacyLocalStorage(): unknown | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LEGACY_ZUSTAND_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && 'state' in parsed) {
      return (parsed as { state: unknown }).state
    }
    return parsed
  } catch {
    return null
  }
}

export function clearLegacyLocalStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LEGACY_ZUSTAND_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Demo-budsjett for nye brukere (persist overskriver ved eksisterende data).
 * Inntekt: 50 000 kr/mnd i alle måneder unntatt juni (kun feriepenger 80 000 kr).
 * Årlig inntekt 630 000 kr, årlige budsjetterte utgifter 600 000 kr (50k/mnd) → overskudd ~30 000 kr/år (20–40k).
 */
const lønnBudgeted: number[] = Array.from({ length: 12 }, (_, i) => (i === 5 ? 0 : 50_000))
const feriepengerBudgeted: number[] = Array.from({ length: 12 }, (_, i) => (i === 5 ? 80_000 : 0))

const defaultCategories: BudgetCategory[] = [
  { id: 'demo-innt-1', name: 'Lønn', budgeted: lønnBudgeted, spent: 50_000, type: 'income', color: '#0CA678', parentCategory: 'inntekter', frequency: 'monthly' },
  { id: 'demo-innt-2', name: 'Feriepenger', budgeted: feriepengerBudgeted, spent: 0, type: 'income', color: '#3B5BDB', parentCategory: 'inntekter', frequency: 'monthly' },
  { id: 'demo-reg-1', name: 'Husleie', budgeted: Array(12).fill(12_000), spent: 12_000, type: 'expense', color: '#3B5BDB', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-2', name: 'Strøm', budgeted: Array(12).fill(1_000), spent: 1_000, type: 'expense', color: '#4C6EF5', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-3', name: 'Internett', budgeted: Array(12).fill(500), spent: 500, type: 'expense', color: '#4C6EF5', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-4', name: 'Mobilabonnement', budgeted: Array(12).fill(400), spent: 400, type: 'expense', color: '#AE3EC9', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-5', name: 'Innboforsikring', budgeted: Array(12).fill(250), spent: 250, type: 'expense', color: '#7048E8', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-6', name: 'TV / streaming', budgeted: Array(12).fill(350), spent: 350, type: 'expense', color: '#E03131', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-reg-7', name: 'Treningsabonnement', budgeted: Array(12).fill(400), spent: 400, type: 'expense', color: '#F08C00', parentCategory: 'regninger', frequency: 'monthly' },
  { id: 'demo-utg-1', name: 'Mat & dagligvarer', budgeted: Array(12).fill(8_800), spent: 8_800, type: 'expense', color: '#7048E8', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-2', name: 'Transport', budgeted: Array(12).fill(2_500), spent: 2_500, type: 'expense', color: '#4C6EF5', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-3', name: 'Restaurant & takeaway', budgeted: Array(12).fill(1_200), spent: 1_200, type: 'expense', color: '#E03131', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-4', name: 'Klær & sko', budgeted: Array(12).fill(800), spent: 800, type: 'expense', color: '#AE3EC9', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-5', name: 'Apotek & helse', budgeted: Array(12).fill(400), spent: 400, type: 'expense', color: '#0B7285', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-6', name: 'Fritid & hobby', budgeted: Array(12).fill(1_000), spent: 1_000, type: 'expense', color: '#3B5BDB', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-utg-7', name: 'Diverse', budgeted: Array(12).fill(1_100), spent: 1_100, type: 'expense', color: '#0CA678', parentCategory: 'utgifter', frequency: 'monthly' },
  { id: 'demo-gjeld-1', name: 'Boliglån (avdrag)', budgeted: Array(12).fill(12_000), spent: 12_000, type: 'expense', color: '#3B5BDB', parentCategory: 'gjeld', frequency: 'monthly' },
  { id: 'demo-gjeld-2', name: 'Studielån', budgeted: Array(12).fill(1_500), spent: 1_500, type: 'expense', color: '#4C6EF5', parentCategory: 'gjeld', frequency: 'monthly' },
  { id: 'demo-gjeld-3', name: 'Kredittkort', budgeted: Array(12).fill(1_000), spent: 1_000, type: 'expense', color: '#E03131', parentCategory: 'gjeld', frequency: 'monthly' },
  { id: 'demo-spar-1', name: 'Fond', budgeted: Array(12).fill(1_500), spent: 1_500, type: 'expense', color: '#0CA678', parentCategory: 'sparing', frequency: 'monthly' },
  { id: 'demo-spar-2', name: 'Aksjer', budgeted: Array(12).fill(1_000), spent: 1_000, type: 'expense', color: '#3B5BDB', parentCategory: 'sparing', frequency: 'monthly' },
  { id: 'demo-spar-3', name: 'BSU', budgeted: Array(12).fill(800), spent: 800, type: 'expense', color: '#7048E8', parentCategory: 'sparing', frequency: 'monthly' },
  { id: 'demo-spar-4', name: 'Nødfond', budgeted: Array(12).fill(400), spent: 400, type: 'expense', color: '#F08C00', parentCategory: 'sparing', frequency: 'monthly' },
]

const defaultGoals: SavingsGoal[] = [
  { id: '1', name: 'Feriefond', targetAmount: 30000, currentAmount: 12000, targetDate: '2026-07-01', color: '#3B5BDB' },
  { id: '2', name: 'Nødfond', targetAmount: 100000, currentAmount: 45000, targetDate: '2026-12-01', color: '#0CA678' },
  { id: '3', name: 'Ny bil', targetAmount: 250000, currentAmount: 80000, targetDate: '2027-06-01', color: '#F08C00' },
]

const defaultDebts: Debt[] = [
  {
    id: '1',
    name: 'Boliglån',
    totalAmount: 2500000,
    remainingAmount: 2200000,
    interestRate: 5.4,
    monthlyPayment: 12000,
    type: 'mortgage',
    includeInSnowball: false,
  },
  {
    id: '2',
    name: 'Studielån',
    totalAmount: 180000,
    remainingAmount: 95000,
    interestRate: 4.5,
    monthlyPayment: 1500,
    type: 'student_loan',
    includeInSnowball: true,
  },
  {
    id: '3',
    name: 'Kredittkort',
    totalAmount: 50000,
    remainingAmount: 15000,
    interestRate: 21.9,
    monthlyPayment: 1000,
    type: 'credit_card',
    includeInSnowball: true,
  },
]

const defaultInvestments: Investment[] = [
  {
    id: '1',
    name: 'DNB Global Indeks',
    type: 'funds',
    purchaseValue: 110000,
    currentValue: 117250,
    purchaseDate: '2026-02-16',
    history: [
      { date: '2026-02-23', value: 112500 },
      { date: '2026-03-02', value: 115000 },
      { date: '2026-03-09', value: 117250 },
    ],
  },
  {
    id: '2',
    name: 'Vår Energi',
    type: 'stocks',
    purchaseValue: 60000,
    currentValue: 65800,
    purchaseDate: '2026-02-16',
    history: [
      { date: '2026-02-23', value: 61000 },
      { date: '2026-03-02', value: 62500 },
      { date: '2026-03-09', value: 61500 },
      { date: '2026-03-16', value: 63500 },
      { date: '2026-03-23', value: 62800 },
      { date: '2026-03-30', value: 64200 },
      { date: '2026-04-06', value: 65100 },
      { date: '2026-04-13', value: 64600 },
      { date: '2026-04-20', value: 65500 },
      { date: '2026-04-27', value: 65800 },
    ],
  },
  {
    id: '3',
    name: 'Bitcoin',
    type: 'crypto',
    purchaseValue: 25000,
    currentValue: 29000,
    purchaseDate: '2026-02-16',
    history: [
      { date: '2026-02-23', value: 27000 },
      { date: '2026-03-02', value: 26500 },
      { date: '2026-03-09', value: 29000 },
    ],
  },
  {
    id: '4',
    name: 'S&P 500 Indeksfond',
    type: 'funds',
    purchaseValue: 80000,
    currentValue: 84000,
    purchaseDate: '2026-02-16',
    history: [
      { date: '2026-02-23', value: 82000 },
      { date: '2026-03-02', value: 81000 },
      { date: '2026-03-09', value: 84000 },
    ],
  },
  {
    id: '5',
    name: 'Norske Statsobligasjoner',
    type: 'bonds',
    purchaseValue: 40000,
    currentValue: 42000,
    purchaseDate: '2026-02-16',
    history: [
      { date: '2026-02-23', value: 41000 },
      { date: '2026-03-02', value: 40500 },
      { date: '2026-03-09', value: 42000 },
    ],
  },
]

export function createInitialPersonData(): PersonData {
  return {
    transactions: [],
    budgetCategories: defaultCategories,
    ...emptyLabelLists(),
    savingsGoals: defaultGoals,
    debts: defaultDebts,
    investments: defaultInvestments,
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
  }
}

export function createEmptyPersonData(): PersonData {
  return {
    transactions: [],
    budgetCategories: [],
    ...emptyLabelLists(),
    savingsGoals: [],
    debts: [],
    investments: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
  }
}

function sumMonthlyArrays(a: number[], b: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

/** Slår sammen alle profilers data til én visningsflate (husholdning). */
export function aggregateHouseholdData(
  people: Record<string, PersonData>,
  profileIds: string[],
): PersonData {
  const labels = emptyLabelLists()
  const txs: Transaction[] = []
  const budgetKeyToCat = new Map<string, BudgetCategory>()

  const mergeLabels = (target: Record<ParentCategory, string[]>, source: Record<ParentCategory, string[]> | undefined) => {
    if (!source) return
    for (const parent of Object.keys(source) as ParentCategory[]) {
      const set = new Set([...(target[parent] ?? []), ...(source[parent] ?? [])])
      target[parent] = [...set]
    }
  }

  for (const pid of profileIds) {
    const p = people[pid]
    if (!p) continue

    txs.push(...(p.transactions ?? []))

    for (const c of p.budgetCategories ?? []) {
      const key = `${c.parentCategory}::${c.name}`
      const existing = budgetKeyToCat.get(key)
      if (!existing) {
        budgetKeyToCat.set(key, {
          ...c,
          id: `hh-${key.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '-')}`,
          spent: c.spent,
          budgeted: [...c.budgeted],
        })
      } else {
        budgetKeyToCat.set(key, {
          ...existing,
          spent: existing.spent + c.spent,
          budgeted: sumMonthlyArrays(existing.budgeted, c.budgeted),
        })
      }
    }

    mergeLabels(labels.customBudgetLabels, p.customBudgetLabels)
    mergeLabels(labels.hiddenBudgetLabels, p.hiddenBudgetLabels)
  }

  txs.sort((a, b) => {
    const at = new Date(a.date).getTime()
    const bt = new Date(b.date).getTime()
    return bt - at
  })

  const savingsGoals: SavingsGoal[] = []
  const debts: Debt[] = []
  const investments: Investment[] = []
  let snowballExtraMonthly = 0

  for (const pid of profileIds) {
    const p = people[pid]
    if (!p) continue
    snowballExtraMonthly += p.snowballExtraMonthly ?? 0
  }

  for (const pid of profileIds) {
    const p = people[pid]
    if (!p) continue
    for (const g of p.savingsGoals ?? []) {
      savingsGoals.push({ ...g, id: `hh-${pid}-${g.id}`, name: g.name })
    }
    for (const d of p.debts ?? []) {
      debts.push({ ...d, id: `hh-${pid}-${d.id}`, name: d.name })
    }
    for (const inv of p.investments ?? []) {
      investments.push({
        ...inv,
        id: `hh-${pid}-${inv.id}`,
        name: inv.name,
      })
    }
  }

  return {
    transactions: txs,
    budgetCategories: [...budgetKeyToCat.values()],
    customBudgetLabels: labels.customBudgetLabels,
    hiddenBudgetLabels: labels.hiddenBudgetLabels,
    savingsGoals,
    debts,
    investments,
    snowballExtraMonthly,
  }
}

/** Gammelt persist-format (flate felter på rot). */
type LegacyPersistedState = Partial<PersonData> & {
  subscriptionPlan?: SubscriptionPlan
  profiles?: PersonProfile[]
  activeProfileId?: string
  people?: Record<string, PersonData>
}

function migrateFromLegacy(p: LegacyPersistedState): Pick<AppState, 'subscriptionPlan' | 'profiles' | 'activeProfileId' | 'people'> {
  const hasNewShape = p.people && p.activeProfileId && p.profiles?.length
  if (hasNewShape) {
    return {
      subscriptionPlan: p.subscriptionPlan ?? 'solo',
      profiles: p.profiles!,
      activeProfileId: p.activeProfileId!,
      people: p.people!,
    }
  }

  const labels = emptyLabelLists()
  const person: PersonData = {
    transactions: Array.isArray(p.transactions) ? p.transactions : [],
    budgetCategories: Array.isArray(p.budgetCategories) && p.budgetCategories.length > 0 ? p.budgetCategories : defaultCategories,
    customBudgetLabels: p.customBudgetLabels ?? labels.customBudgetLabels,
    hiddenBudgetLabels: p.hiddenBudgetLabels ?? labels.hiddenBudgetLabels,
    savingsGoals: Array.isArray(p.savingsGoals) && p.savingsGoals.length > 0 ? p.savingsGoals : defaultGoals,
    debts: Array.isArray(p.debts) && p.debts.length > 0 ? p.debts : defaultDebts,
    investments: Array.isArray(p.investments) && p.investments.length > 0 ? p.investments : defaultInvestments,
    snowballExtraMonthly: typeof p.snowballExtraMonthly === 'number' ? p.snowballExtraMonthly : 0,
    debtPayoffStrategy: p.debtPayoffStrategy === 'avalanche' ? 'avalanche' : 'snowball',
  }

  return {
    subscriptionPlan: 'solo',
    profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
    activeProfileId: DEFAULT_PROFILE_ID,
    people: { [DEFAULT_PROFILE_ID]: person },
  }
}

export const useStore = create<AppState>()((set, get) => {
      const initialPeople = { [DEFAULT_PROFILE_ID]: createInitialPersonData() }

      const patchPerson = (profileId: string, updater: (d: PersonData) => PersonData) => {
        set((s) => {
          const cur = s.people[profileId]
          if (!cur) return s
          return { people: { ...s.people, [profileId]: updater(cur) } }
        })
      }

      const patchActive = (updater: (d: PersonData) => PersonData) => {
        const id = get().activeProfileId
        patchPerson(id, updater)
      }

      return {
        subscriptionPlan: 'solo' as SubscriptionPlan,
        profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
        activeProfileId: DEFAULT_PROFILE_ID,
        financeScope: 'profile' as FinanceScope,
        people: initialPeople,
        notifications: [] as AppNotification[],
        deliveredAnnouncementIds: [] as string[],

        hydrateFromPayload: (payload: unknown) => {
          set((current) => mergePersistedIntoFullState(payload, current))
        },

        syncProductAnnouncements: () => {
          set((s) => {
            const delivered = new Set(s.deliveredAnnouncementIds)
            const existingIds = new Set(s.notifications.map((n) => n.id))
            const next = [...s.notifications]
            const newDelivered = [...s.deliveredAnnouncementIds]

            for (const a of PRODUCT_ANNOUNCEMENTS) {
              if (!isAnnouncementApplicable(a)) continue
              if (delivered.has(a.id)) continue
              if (existingIds.has(a.id)) {
                newDelivered.push(a.id)
                continue
              }
              next.unshift({
                id: a.id,
                title: a.title,
                body: a.body,
                kind: a.kind,
                createdAt: new Date().toISOString(),
                read: false,
              })
              existingIds.add(a.id)
              newDelivered.push(a.id)
            }
            return { notifications: next, deliveredAnnouncementIds: newDelivered }
          })
        },

        markNotificationRead: (id) =>
          set((s) => ({
            notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          })),

        markAllNotificationsRead: () =>
          set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          })),

        setSubscriptionPlan: (plan) => {
          const s = get()
          if (plan === 'solo' && s.profiles.length > 1) {
            return { ok: false as const, reason: 'solo_requires_one_profile' }
          }
          set({ subscriptionPlan: plan, financeScope: 'profile' })
          return { ok: true as const }
        },

        setActiveProfileId: (id) => {
          const s = get()
          if (!s.profiles.some((p) => p.id === id)) return
          if (!s.people[id]) return
          set({ activeProfileId: id, financeScope: 'profile' })
        },

        setFinanceScope: (scope) => {
          const s = get()
          if (scope === 'household') {
            if (s.subscriptionPlan !== 'family' || s.profiles.length < 2) return
          }
          set({ financeScope: scope })
        },

        addProfile: (name) => {
          const s = get()
          const trimmed = name.trim()
          if (!trimmed) return { ok: false as const, reason: 'invalid_name' }

          if (s.subscriptionPlan === 'solo' && s.profiles.length >= 1) {
            return { ok: false as const, reason: 'solo_limit' }
          }
          if (s.profiles.length >= MAX_FAMILY_PROFILES) {
            return { ok: false as const, reason: 'max_profiles' }
          }

          const id = generateId()
          const nextPeople = { ...s.people, [id]: createEmptyPersonData() }
          const nextProfiles = [...s.profiles, { id, name: trimmed }]
          set({
            people: nextPeople,
            profiles: nextProfiles,
            activeProfileId: id,
            financeScope: 'profile',
          })
          return { ok: true as const, id }
        },

        renameProfile: (id, name) => {
          const n = name.trim()
          if (!n) return
          set((s) => ({
            profiles: s.profiles.map((p) => (p.id === id ? { ...p, name: n } : p)),
          }))
        },

        addTransaction: (t) =>
          patchActive((d) => ({ ...d, transactions: [t, ...d.transactions] })),

        removeTransaction: (id) =>
          set((s) => {
            for (const pid of s.profiles.map((p) => p.id)) {
              const person = s.people[pid]
              if (!person?.transactions.some((t) => t.id === id)) continue
              const tx = person.transactions.find((t) => t.id === id)!
              const nextTx = person.transactions.filter((t) => t.id !== id)
              const categoryName = tx.category
              const spent = nextTx
                .filter((t) => t.category === categoryName && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
              const budgetCategories = person.budgetCategories.map((c) =>
                c.name === categoryName ? { ...c, spent } : c,
              )
              return {
                people: {
                  ...s.people,
                  [pid]: { ...person, transactions: nextTx, budgetCategories },
                },
              }
            }
            return s
          }),

        recalcBudgetSpent: (categoryName) =>
          patchActive((d) => {
            const spent = d.transactions
              .filter((t) => t.category === categoryName && t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0)
            return {
              ...d,
              budgetCategories: d.budgetCategories.map((c) =>
                c.name === categoryName ? { ...c, spent } : c,
              ),
            }
          }),

        addBudgetCategory: (c) => patchActive((d) => ({ ...d, budgetCategories: [...d.budgetCategories, c] })),

        updateBudgetCategory: (id, data) =>
          patchActive((d) => ({
            ...d,
            budgetCategories: d.budgetCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
          })),

        removeBudgetCategory: (id) =>
          patchActive((d) => ({ ...d, budgetCategories: d.budgetCategories.filter((c) => c.id !== id) })),

        addCustomBudgetLabel: (parent, name) =>
          patchActive((d) => {
            const n = name.trim()
            if (!n) return d
            const cur = d.customBudgetLabels[parent] ?? []
            if (cur.includes(n)) return d
            return {
              ...d,
              customBudgetLabels: { ...d.customBudgetLabels, [parent]: [...cur, n] },
            }
          }),

        removeCustomBudgetLabel: (parent, name) =>
          patchActive((d) => ({
            ...d,
            customBudgetLabels: {
              ...d.customBudgetLabels,
              [parent]: (d.customBudgetLabels[parent] ?? []).filter((x) => x !== name),
            },
          })),

        hideStandardBudgetLabel: (parent, name) =>
          patchActive((d) => {
            const cur = d.hiddenBudgetLabels[parent] ?? []
            if (cur.includes(name)) return d
            return {
              ...d,
              hiddenBudgetLabels: { ...d.hiddenBudgetLabels, [parent]: [...cur, name] },
            }
          }),

        unhideStandardBudgetLabel: (parent, name) =>
          patchActive((d) => ({
            ...d,
            hiddenBudgetLabels: {
              ...d.hiddenBudgetLabels,
              [parent]: (d.hiddenBudgetLabels[parent] ?? []).filter((x) => x !== name),
            },
          })),

        addSavingsGoal: (g) => patchActive((d) => ({ ...d, savingsGoals: [...d.savingsGoals, g] })),

        updateSavingsGoal: (id, data) =>
          patchActive((d) => ({
            ...d,
            savingsGoals: d.savingsGoals.map((g) => (g.id === id ? { ...g, ...data } : g)),
          })),

        removeSavingsGoal: (id) =>
          patchActive((d) => ({ ...d, savingsGoals: d.savingsGoals.filter((g) => g.id !== id) })),

        addDebt: (debt) => patchActive((d) => ({ ...d, debts: [...d.debts, debt] })),

        updateDebt: (id, data) =>
          patchActive((d) => ({
            ...d,
            debts: d.debts.map((x) => (x.id === id ? { ...x, ...data } : x)),
          })),

        removeDebt: (id) => patchActive((d) => ({ ...d, debts: d.debts.filter((x) => x.id !== id) })),

        setSnowballExtraMonthly: (amount) =>
          patchActive((d) => ({
            ...d,
            snowballExtraMonthly: Number.isFinite(amount) ? Math.max(0, amount) : 0,
          })),

        setDebtPayoffStrategy: (strategy) =>
          patchActive((d) => ({
            ...d,
            debtPayoffStrategy: strategy === 'avalanche' ? 'avalanche' : 'snowball',
          })),

        addInvestment: (i) => patchActive((d) => ({ ...d, investments: [...d.investments, i] })),

        updateInvestment: (id, data) =>
          patchActive((d) => ({
            ...d,
            investments: d.investments.map((i) => (i.id === id ? { ...i, ...data } : i)),
          })),

        removeInvestment: (id) =>
          patchActive((d) => ({ ...d, investments: d.investments.filter((i) => i.id !== id) })),

        addInvestmentHistoryValue: (investmentId, point) =>
          patchActive((d) => ({
            ...d,
            investments: d.investments.map((inv) => {
              if (inv.id !== investmentId) return inv

              const history = inv.history ? [...inv.history] : []
              const idx = history.findIndex((p) => p.date === point.date)

              const nextPoint: InvestmentHistoryPoint = {
                id: generateId(),
                date: point.date,
                value: point.value,
              }

              if (idx >= 0) history[idx] = nextPoint
              else history.push(nextPoint)

              history.sort((a, b) => {
                const at = new Date(a.date).getTime()
                const bt = new Date(b.date).getTime()
                return at - bt
              })

              return { ...inv, history, currentValue: point.value }
            }),
          })),

        removeInvestmentHistoryValue: (investmentId, point) =>
          patchActive((d) => ({
            ...d,
            investments: d.investments.map((inv) => {
              if (inv.id !== investmentId) return inv

              const history = inv.history ? inv.history.slice() : []

              const idx =
                point.id
                  ? history.findIndex((p) => p.id === point.id)
                  : history.findIndex((p) => p.date === point.date && p.value === point.value)

              if (idx < 0) return inv

              history.splice(idx, 1)

              history.sort((a, b) => {
                const at = new Date(a.date).getTime()
                const bt = new Date(b.date).getTime()
                return at - bt
              })

              const currentValue =
                history.length > 0 ? history[history.length - 1].value : inv.purchaseValue

              return { ...inv, history: history.length > 0 ? history : undefined, currentValue }
            }),
          })),
      }
})

export function resetStoreForLogout() {
  const initialPeople = { [DEFAULT_PROFILE_ID]: createInitialPersonData() }
  useStore.setState({
    subscriptionPlan: 'solo',
    profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
    activeProfileId: DEFAULT_PROFILE_ID,
    financeScope: 'profile',
    people: initialPeople,
    notifications: [],
    deliveredAnnouncementIds: [],
  })
  clearLegacyLocalStorage()
}

/** Aktiv persons økonomidata + alle actions (for sider som før brukte useStore direkte). */
export function useActivePersonFinance() {
  const state = useStore(
    useShallow((s) => ({
      activeProfileId: s.activeProfileId,
      people: s.people,
      profiles: s.profiles,
      subscriptionPlan: s.subscriptionPlan,
      financeScope: s.financeScope,
      addTransaction: s.addTransaction,
      removeTransaction: s.removeTransaction,
      recalcBudgetSpent: s.recalcBudgetSpent,
      addBudgetCategory: s.addBudgetCategory,
      updateBudgetCategory: s.updateBudgetCategory,
      removeBudgetCategory: s.removeBudgetCategory,
      addCustomBudgetLabel: s.addCustomBudgetLabel,
      removeCustomBudgetLabel: s.removeCustomBudgetLabel,
      hideStandardBudgetLabel: s.hideStandardBudgetLabel,
      unhideStandardBudgetLabel: s.unhideStandardBudgetLabel,
      addSavingsGoal: s.addSavingsGoal,
      updateSavingsGoal: s.updateSavingsGoal,
      removeSavingsGoal: s.removeSavingsGoal,
      addDebt: s.addDebt,
      updateDebt: s.updateDebt,
      removeDebt: s.removeDebt,
      setSnowballExtraMonthly: s.setSnowballExtraMonthly,
      setDebtPayoffStrategy: s.setDebtPayoffStrategy,
      addInvestment: s.addInvestment,
      updateInvestment: s.updateInvestment,
      removeInvestment: s.removeInvestment,
      addInvestmentHistoryValue: s.addInvestmentHistoryValue,
      removeInvestmentHistoryValue: s.removeInvestmentHistoryValue,
      setActiveProfileId: s.setActiveProfileId,
      setFinanceScope: s.setFinanceScope,
      setSubscriptionPlan: s.setSubscriptionPlan,
      addProfile: s.addProfile,
      renameProfile: s.renameProfile,
    })),
  )

  const householdMode =
    state.financeScope === 'household' && state.subscriptionPlan === 'family' && state.profiles.length >= 2

  const person = useMemo(() => {
    if (householdMode) {
      return aggregateHouseholdData(
        state.people,
        state.profiles.map((p) => p.id),
      )
    }
    return state.people[state.activeProfileId] ?? createEmptyPersonData()
  }, [householdMode, state.people, state.activeProfileId, state.profiles])

  return {
    transactions: person.transactions,
    budgetCategories: person.budgetCategories,
    customBudgetLabels: person.customBudgetLabels ?? EMPTY_LABEL_LISTS.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? EMPTY_LABEL_LISTS.hiddenBudgetLabels,
    savingsGoals: person.savingsGoals,
    debts: person.debts,
    investments: person.investments,
    snowballExtraMonthly: person.snowballExtraMonthly ?? 0,
    debtPayoffStrategy: person.debtPayoffStrategy ?? 'snowball',
    activeProfileId: state.activeProfileId,
    profiles: state.profiles,
    subscriptionPlan: state.subscriptionPlan,
    financeScope: state.financeScope,
    isHouseholdAggregate: householdMode,
    addTransaction: state.addTransaction,
    removeTransaction: state.removeTransaction,
    recalcBudgetSpent: state.recalcBudgetSpent,
    addBudgetCategory: state.addBudgetCategory,
    updateBudgetCategory: state.updateBudgetCategory,
    removeBudgetCategory: state.removeBudgetCategory,
    addCustomBudgetLabel: state.addCustomBudgetLabel,
    removeCustomBudgetLabel: state.removeCustomBudgetLabel,
    hideStandardBudgetLabel: state.hideStandardBudgetLabel,
    unhideStandardBudgetLabel: state.unhideStandardBudgetLabel,
    addSavingsGoal: state.addSavingsGoal,
    updateSavingsGoal: state.updateSavingsGoal,
    removeSavingsGoal: state.removeSavingsGoal,
    addDebt: state.addDebt,
    updateDebt: state.updateDebt,
    removeDebt: state.removeDebt,
    setSnowballExtraMonthly: state.setSnowballExtraMonthly,
    setDebtPayoffStrategy: state.setDebtPayoffStrategy,
    addInvestment: state.addInvestment,
    updateInvestment: state.updateInvestment,
    removeInvestment: state.removeInvestment,
    addInvestmentHistoryValue: state.addInvestmentHistoryValue,
    removeInvestmentHistoryValue: state.removeInvestmentHistoryValue,
    setActiveProfileId: state.setActiveProfileId,
    setFinanceScope: state.setFinanceScope,
    setSubscriptionPlan: state.setSubscriptionPlan,
    addProfile: state.addProfile,
    renameProfile: state.renameProfile,
  }
}
