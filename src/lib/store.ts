import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { generateId, type BudgetCategoryFrequency } from './utils'
import { PRODUCT_ANNOUNCEMENTS, isAnnouncementApplicable, type AnnouncementKind } from '@/lib/announcements'
import { ROADMAP_INVITE_NOTIFICATION_ID } from '@/lib/roadmapInvite'
import { applyCategoryRemap, type CategoryRemapErrorReason } from './categoryRemap'
import type { ParentCategory } from './budgetCategoryCatalog'
import { emptyLabelLists, type LabelLists } from './budgetCategoryCatalog'
import { computeInsightDeltas } from './insightNotifications'
import {
  buildBudgetCategoryForSubscription,
  budgetedTwelveFromMonthly,
  monthlyEquivalentNok,
  uniqueRegningerName,
} from './serviceSubscriptionHelpers'
import {
  applySubscriptionCancellationsToBudgetForYear,
  buildPlannedSubscriptionTransactions,
  transactionMatchesCancellationRemoval,
  zeroBudgetedFromCancellationMonth,
} from './subscriptionTransactions'
import {
  cloneBudgetCategories,
  sumTxForCategoryInYear,
  sumTxForCategoryInYearAllProfiles,
} from './budgetYearHelpers'
import { actualsPerMonthForCategory, type BudgetYearCopySource } from './budgetActualsToBudgeted'
import {
  createDefaultFormuebyggerPersistedState,
  normalizeFormuebyggerPersistedState,
  type FormuebyggerPersistedState,
} from '@/lib/formuebyggerPro/persistedState'
import {
  buildDemoTransactionsForNonZeroVariant,
  createDemoBasePersonDataForNonZeroVariant,
  getDemoVariantIndexForProfile,
} from './demoPersonVariants'

export type { BudgetYearCopySource } from './budgetActualsToBudgeted'
export type SwitchActiveBudgetYearResult =
  | { ok: true }
  | { ok: false; reason: 'not_in_archive' | 'missing_profile_snapshot' }

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
  /** Valgfri underkategori (butikk, detalj) — påvirker ikke budsjettsummering. */
  subcategory?: string
  type: 'income' | 'expense'
  /** Eierprofil (påkrevd for nye rader; migreres for eldre data). */
  profileId?: string
  /** App-genererte planlagte trekk fra tjenesteabonnement. */
  linkedServiceSubscriptionId?: string
}

export interface BudgetCategory {
  id: string
  name: string
  budgeted: number[] // [jan, feb, mar, apr, mai, jun, jul, aug, sep, okt, nov, des]
  spent: number
  type: 'income' | 'expense'
  color: string
  parentCategory: ParentCategory
  frequency: BudgetCategoryFrequency
}

export interface SavingsDeposit {
  id: string
  date: string
  amount: number
  note?: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  color: string
  /** Kobling til budsjettkategori (sparing). */
  linkedBudgetCategoryId?: string | null
  /** Ved koblet mål: saldo før transaksjonssum (unngår hopp ved kobling). */
  baselineAmount?: number
  /** Manuell historikk når målet ikke er koblet til transaksjoner. */
  deposits?: SavingsDeposit[]
  /** Satt kun i husholdningsaggregat – kildeprofil for målet. */
  sourceProfileId?: string
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
  /** Kun satt i husholdningsaggregat — kildeprofil. */
  sourceProfileId?: string
}

export interface Investment {
  id: string
  name: string
  type: 'stocks' | 'funds' | 'crypto' | 'bonds' | 'other'
  purchaseValue: number
  currentValue: number
  purchaseDate: string
  history?: InvestmentHistoryPoint[]
  /** Finnhub-symbol for kurskobling (f.eks. AAPL, EQNR.OSE) */
  quoteSymbol?: string
  /** Antall enheter (f.eks. aksjer) — brukes med quoteSymbol for live verdi i NOK */
  shares?: number
  /** Sist kjente valuta fra kurs (USD, NOK, …) */
  quoteCurrency?: string
  /** Kun satt i husholdningsaggregat — kildeprofil. */
  sourceProfileId?: string
}

export interface InvestmentHistoryPoint {
  id?: string
  date: string // yyyy-mm-dd
  value: number
}

/** Faste tjenesteabonnementer (streaming, programvare m.m.) — ikke Stripe-abonnement. */
export interface ServiceSubscription {
  id: string
  label: string
  amountNok: number
  billing: 'monthly' | 'yearly'
  active: boolean
  /** Når sann: oppretthold én budsjettlinje under Regninger (planbeløp). */
  syncToBudget: boolean
  linkedBudgetCategoryId?: string | null
  note?: string
  presetKey?: string
  /** Avsluttet fra og med denne måneden (år + måned 1–12). */
  cancelledFrom?: { year: number; month: number }
  /** Månedlig ekvivalent ved avslutning (for senere besparelsesanalyse). */
  monthlyEquivalentNokSnapshot?: number
  /** Kun satt i husholdningsaggregat for visning. */
  sourceProfileId?: string
}

/** Planlagte trekk i transaksjoner (samme form som ved nytt abonnement). */
export type ServiceSubscriptionPlannedTxInput = {
  startMonth1: number
  endMonth1: number
  dayOfMonth: number
  budgetYear: number
}

/** Input ved nytt tjenesteabonnement (planlagte transaksjoner er valgfritt). */
export type AddServiceSubscriptionInput = Omit<
  ServiceSubscription,
  'id' | 'sourceProfileId' | 'cancelledFrom' | 'monthlyEquivalentNokSnapshot'
> & {
  plannedTransactions?: ServiceSubscriptionPlannedTxInput | null
}

/** Ved oppdatering: `null` fjerner alle planlagte trekk for abonnementet. */
export type UpdateServiceSubscriptionPatch = Partial<
  Omit<ServiceSubscription, 'id' | 'sourceProfileId'>
> & {
  plannedTransactions?: ServiceSubscriptionPlannedTxInput | null
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
  serviceSubscriptions: ServiceSubscription[]
  /** Ekstra nedbetaling per måned (snøball), kr — per profil */
  snowballExtraMonthly?: number
  /** Rekkefølge for fokuslån; husholdningsaggregat setter ikke feltet */
  debtPayoffStrategy?: DebtPayoffStrategy
}

export type OnboardingStatus = 'pending' | 'completed' | 'skipped'

export interface OnboardingState {
  status: OnboardingStatus
  finishedAt?: string
}

/** Første inntektslinje i demo-budsjett — brukes i onboarding. */
export const ONBOARDING_MAIN_INCOME_CATEGORY_ID = 'demo-innt-1'

interface AppState {
  subscriptionPlan: SubscriptionPlan
  profiles: PersonProfile[]
  activeProfileId: string
  /** Når `household`: vist data er aggregert over alle profiler (kun meningsfullt for Familie med 2+ profiler). */
  financeScope: FinanceScope
  people: Record<string, PersonData>

  notifications: AppNotification[]
  deliveredAnnouncementIds: string[]
  /** Idempotente id-er for innsiktsvarsler (f.eks. per måned). */
  deliveredInsightIds: string[]
  /** Preset-nøkler der brukeren har skjult tipset «mulig å samle abonnement» (husholdning). */
  dismissedDuplicateSubscriptionPresetKeys: string[]
  dismissDuplicateSubscriptionHint: (presetKey: string) => void
  dismissAllDuplicateSubscriptionHints: (presetKeys: string[]) => void
  resetDismissedDuplicateSubscriptionHints: () => void
  /** Førstegangs- / gjenåpnet veiledning; persisteres. */
  onboarding: OnboardingState

  /** Formuebyggeren PRO — innstillinger og ekstra innskudd; persisteres. */
  formuebyggerPro: FormuebyggerPersistedState
  setFormuebyggerPro: (patch: Partial<{ input: Partial<FormuebyggerPersistedState['input']>; extraByMonth: FormuebyggerPersistedState['extraByMonth'] }>) => void

  /** Erstatter tidligere Zustand-persist + brukes ved innlasting fra Supabase. */
  hydrateFromPayload: (payload: unknown) => void
  syncProductAnnouncements: () => void
  syncInsightNotifications: () => void
  /** Én gang etter ~30 min synlig bruk; idempotent via deliveredAnnouncementIds. */
  deliverRoadmapInviteNotification: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  /** Bruker-/hendelsesvarsler (f.eks. ved import av data); id genereres automatisk. */
  addAppNotification: (payload: { title: string; body: string; kind?: AppNotificationKind }) => void

  setSubscriptionPlan: (plan: SubscriptionPlan) => { ok: true } | { ok: false; reason: 'solo_requires_one_profile' }
  setActiveProfileId: (id: string) => void
  setFinanceScope: (scope: FinanceScope) => void
  addProfile: (name: string) =>
    | { ok: true; id: string }
    | { ok: false; reason: 'solo_limit' | 'max_profiles' | 'invalid_name' }
  renameProfile: (id: string, name: string) => void

  addTransaction: (t: Transaction) => void
  addTransactions: (transactions: Transaction[]) => void
  removeTransaction: (id: string) => void
  updateTransaction: (
    id: string,
    patch: Partial<Pick<Transaction, 'date' | 'description' | 'amount' | 'category' | 'subcategory' | 'type'>>,
  ) => void
  recalcBudgetSpent: (categoryName: string) => void

  addBudgetCategory: (c: BudgetCategory) => void
  updateBudgetCategory: (id: string, data: Partial<BudgetCategory>) => void
  removeBudgetCategory: (id: string) => void

  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  removeCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  hideStandardBudgetLabel: (parent: ParentCategory, name: string) => void
  unhideStandardBudgetLabel: (parent: ParentCategory, name: string) => void
  remapBudgetCategoryName: (
    parent: ParentCategory,
    fromName: string,
    toName: string,
  ) => { ok: true } | { ok: false; reason: CategoryRemapErrorReason }

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

  addServiceSubscription: (
    input: AddServiceSubscriptionInput,
  ) => { ok: true; id: string } | { ok: false; reason: 'household_readonly' }
  updateServiceSubscription: (
    id: string,
    patch: UpdateServiceSubscriptionPatch,
  ) => { ok: true } | { ok: false; reason: 'household_readonly' | 'not_found' }
  removeServiceSubscription: (id: string) => { ok: true } | { ok: false; reason: 'household_readonly' | 'not_found' }
  markServiceSubscriptionCancelled: (
    id: string,
    cancelledFrom: { year: number; month: number },
  ) => { ok: true } | { ok: false; reason: 'household_readonly' | 'not_found' | 'invalid_date' }

  /** Felles kalenderår for alle profilers budsjett (12 kolonner). */
  budgetYear: number
  /** Arkiverte budsjett: år → profilId → kategorier */
  archivedBudgetsByYear: ArchivedBudgetsByYear
  startNewBudgetYear: (opts?: {
    copyPlan?: boolean
    income?: BudgetYearCopySource
    expenses?: BudgetYearCopySource
  }) => void
  switchActiveBudgetYear: (targetYear: number) => SwitchActiveBudgetYearResult

  /** Kun når `archivedBudgetsByYear` er tom (ny bruker / ingen arkiv). */
  setBudgetYear: (year: number) => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  openOnboardingAgain: () => void

  /** Eksempeldata på tvers av budsjett, transaksjoner, sparing, investeringer og lån; ekte data i `peopleBeforeDemo`. */
  demoDataEnabled: boolean
  peopleBeforeDemo: Record<string, PersonData> | null
  setDemoDataEnabled: (enabled: boolean) => void
}

/** Ytre nøkkel årstall som string, indre er profilId. */
export type ArchivedBudgetsByYear = Record<string, Record<string, BudgetCategory[]>>

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
  | 'deliveredInsightIds'
  | 'dismissedDuplicateSubscriptionPresetKeys'
  | 'budgetYear'
  | 'archivedBudgetsByYear'
  | 'onboarding'
  | 'formuebyggerPro'
  | 'demoDataEnabled'
  | 'peopleBeforeDemo'
>

/** Tidligere nøkkel for Zustand persist (brukes til engangsmigrering til Supabase). */
export const LEGACY_ZUSTAND_STORAGE_KEY = 'smart-budsjett-storage'

export function createDefaultPersistedSlice(options?: { seedDemoData?: boolean }): PersistedAppSlice {
  const seedDemo = options?.seedDemoData === true
  const person = seedDemo ? createInitialPersonData() : createEmptyPersonData()
  return {
    subscriptionPlan: 'solo',
    profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
    activeProfileId: DEFAULT_PROFILE_ID,
    financeScope: 'profile',
    people: { [DEFAULT_PROFILE_ID]: person },
    notifications: [],
    deliveredAnnouncementIds: [],
    budgetYear: new Date().getFullYear(),
    archivedBudgetsByYear: {},
    onboarding: { status: 'pending' },
    formuebyggerPro: createDefaultFormuebyggerPersistedState(),
    demoDataEnabled: false,
    peopleBeforeDemo: null,
    deliveredInsightIds: [],
    dismissedDuplicateSubscriptionPresetKeys: [],
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
    budgetYear: state.budgetYear,
    archivedBudgetsByYear: state.archivedBudgetsByYear,
    onboarding: state.onboarding,
    formuebyggerPro: state.formuebyggerPro,
    demoDataEnabled: state.demoDataEnabled,
    peopleBeforeDemo: state.peopleBeforeDemo,
    deliveredInsightIds: state.deliveredInsightIds,
    dismissedDuplicateSubscriptionPresetKeys: state.dismissedDuplicateSubscriptionPresetKeys,
  }
}

function migratePeopleTransactionsAndSync(people: Record<string, PersonData>): Record<string, PersonData> {
  const next: Record<string, PersonData> = { ...people }
  for (const pid of Object.keys(next)) {
    const person = next[pid]
    if (!person) continue
    const transactions = (person.transactions ?? []).map((t) =>
      t.profileId ? t : { ...t, profileId: pid },
    )
    next[pid] = syncLinkedSavingsGoalsCurrent({ ...person, transactions }, pid)
  }
  return next
}

function ensureTwelveBudgeted(budgeted: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => budgeted[i] ?? 0)
}

function recalcPersonBudgetSpentForYear(person: PersonData, profileId: string, year: number): PersonData {
  const budgetCategories = person.budgetCategories.map((c) => ({
    ...c,
    spent: sumTxForCategoryInYear(person.transactions, c.name, c.type, year, profileId),
  }))
  return syncLinkedSavingsGoalsCurrent({ ...person, budgetCategories }, profileId)
}

function normalizeOnboardingFromMerge(persisted: Partial<AppState> | undefined): OnboardingState {
  const o = persisted?.onboarding
  if (!o || typeof o !== 'object') return { status: 'completed' }
  const s = (o as OnboardingState).status
  if (s === 'pending' || s === 'completed' || s === 'skipped') {
    const finishedAt = (o as OnboardingState).finishedAt
    return {
      status: s,
      ...(typeof finishedAt === 'string' ? { finishedAt } : {}),
    }
  }
  return { status: 'completed' }
}

/** Om snapshot inneholder demo-budsjettkategorier (id prefiks demo-), skal det ikke brukes som «ekte» backup ved av. */
function peopleSnapshotContainsDemoMarkers(people: Record<string, PersonData>): boolean {
  for (const person of Object.values(people)) {
    if (person.budgetCategories.some((c) => typeof c.id === 'string' && c.id.startsWith('demo-'))) {
      return true
    }
  }
  return false
}

export function mergePersistedIntoFullState(persisted: unknown, current: AppState): AppState {
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
    const year = new Date().getFullYear()
    const peopleSynced = migratePeopleTransactionsAndSync(m.people)
    const peopleRec: Record<string, PersonData> = {}
    for (const pid of Object.keys(peopleSynced)) {
      peopleRec[pid] = recalcPersonBudgetSpentForYear(peopleSynced[pid]!, pid, year)
    }
    return {
      ...current,
      subscriptionPlan: m.subscriptionPlan,
      profiles: m.profiles,
      activeProfileId: m.activeProfileId,
      people: peopleRec,
      budgetYear: year,
      archivedBudgetsByYear: {},
      onboarding: { status: 'completed' },
      demoDataEnabled: false,
      peopleBeforeDemo: null,
    }
  }

  const base = { ...current, ...p } as AppState

  if (typeof base.budgetYear !== 'number' || !Number.isFinite(base.budgetYear)) {
    base.budgetYear = new Date().getFullYear()
  }
  if (!base.archivedBudgetsByYear || typeof base.archivedBudgetsByYear !== 'object') {
    base.archivedBudgetsByYear = {}
  }

  for (const pr of base.profiles) {
    if (!base.people[pr.id]) {
      base.people[pr.id] = createEmptyPersonData()
    }
    const person = base.people[pr.id]
    if (!person.customBudgetLabels) person.customBudgetLabels = emptyLabelLists().customBudgetLabels
    if (!person.hiddenBudgetLabels) person.hiddenBudgetLabels = emptyLabelLists().hiddenBudgetLabels
    if (!Array.isArray(person.serviceSubscriptions)) person.serviceSubscriptions = []
    person.transactions = (person.transactions ?? []).map((t) =>
      t.profileId ? t : { ...t, profileId: pr.id },
    )
    let synced = syncLinkedSavingsGoalsCurrent(person, pr.id)
    synced = applySubscriptionCancellationsToBudgetForYear(synced, base.budgetYear)
    base.people[pr.id] = recalcPersonBudgetSpentForYear(synced, pr.id, base.budgetYear)
  }

  if (!base.profiles.some((x) => x.id === base.activeProfileId)) {
    base.activeProfileId = base.profiles[0]?.id ?? DEFAULT_PROFILE_ID
  }

  if (!Array.isArray(base.notifications)) base.notifications = []
  if (!Array.isArray(base.deliveredAnnouncementIds)) base.deliveredAnnouncementIds = []
  if (!Array.isArray(base.deliveredInsightIds)) base.deliveredInsightIds = []
  if (!Array.isArray(base.dismissedDuplicateSubscriptionPresetKeys)) {
    base.dismissedDuplicateSubscriptionPresetKeys = []
  }

  base.onboarding = normalizeOnboardingFromMerge(p)

  const rawFp = (p as Partial<AppState>).formuebyggerPro
  base.formuebyggerPro = normalizeFormuebyggerPersistedState(rawFp)

  if (typeof base.demoDataEnabled !== 'boolean') base.demoDataEnabled = false
  if (base.peopleBeforeDemo === undefined) base.peopleBeforeDemo = null
  const pbd = base.peopleBeforeDemo
  if (pbd != null && (typeof pbd !== 'object' || Array.isArray(pbd))) base.peopleBeforeDemo = null

  /** Lagret inkonsistens: demo av men people inneholder fortsatt demo-kategorier (f.eks. gammel sync). */
  if (!base.demoDataEnabled && peopleSnapshotContainsDemoMarkers(base.people)) {
    for (const pr of base.profiles) {
      base.people[pr.id] = createEmptyPersonData()
    }
    base.peopleBeforeDemo = null
  }

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
    serviceSubscriptions: [],
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
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
  }
}

/** Månedlige demoutgifter — kategorinavn må matche `defaultCategories` i `createInitialPersonData`. */
const DEMO_MONTHLY_EXPENSES: [string, number][] = [
  ['Husleie', 12_000],
  ['Strøm', 1_000],
  ['Internett', 500],
  ['Mobilabonnement', 400],
  ['Innboforsikring', 250],
  ['TV / streaming', 350],
  ['Treningsabonnement', 400],
  ['Mat & dagligvarer', 8_800],
  ['Transport', 2_500],
  ['Restaurant & takeaway', 1_200],
  ['Klær & sko', 800],
  ['Apotek & helse', 400],
  ['Fritid & hobby', 1_000],
  ['Diverse', 1_100],
  ['Boliglån (avdrag)', 12_000],
  ['Studielån', 1_500],
  ['Kredittkort', 1_000],
  ['Fond', 1_500],
  ['Aksjer', 1_000],
  ['BSU', 800],
  ['Nødfond', 400],
]

function buildDemoTransactionsForYear(year: number, profileId: string): Transaction[] {
  const txs: Transaction[] = []
  for (let mi = 0; mi < 12; mi++) {
    const ym = `${year}-${String(mi + 1).padStart(2, '0')}`
    if (mi === 5) {
      txs.push({
        id: generateId(),
        date: `${ym}-12`,
        description: 'Feriepenger',
        amount: 80_000,
        category: 'Feriepenger',
        type: 'income',
        profileId,
      })
    } else {
      txs.push({
        id: generateId(),
        date: `${ym}-25`,
        description: 'Lønn',
        amount: 50_000,
        category: 'Lønn',
        type: 'income',
        profileId,
      })
    }
    for (let ei = 0; ei < DEMO_MONTHLY_EXPENSES.length; ei++) {
      const [name, amt] = DEMO_MONTHLY_EXPENSES[ei]!
      const day = Math.min(3 + ei, 28)
      txs.push({
        id: generateId(),
        date: `${ym}-${String(day).padStart(2, '0')}`,
        description: name,
        amount: amt,
        category: name,
        type: 'expense',
        profileId,
      })
    }
  }
  txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return txs
}

/** Full demoprofil (budsjett, transaksjoner, sparing, investeringer, lån) for én profil. `variantIndex` 0 = dagens standard; 1–4 brukes for andre medlemmer i familiehusholdning. */
export function createDemoPersonDataForProfile(
  profileId: string,
  budgetYear: number,
  variantIndex: number = 0,
): PersonData {
  const v = Math.min(Math.max(0, Math.floor(variantIndex)), 4)
  const base =
    v === 0
      ? createInitialPersonData()
      : createDemoBasePersonDataForNonZeroVariant(v as 1 | 2 | 3 | 4)
  const transactions =
    v === 0
      ? buildDemoTransactionsForYear(budgetYear, profileId)
      : buildDemoTransactionsForNonZeroVariant(budgetYear, profileId, v as 1 | 2 | 3 | 4)
  let person: PersonData = { ...base, transactions }
  person = recalcPersonBudgetSpentForYear(person, profileId, budgetYear)
  person = syncLinkedSavingsGoalsCurrent(person, profileId)
  return person
}

export { getDemoVariantIndexForProfile }

function sumMonthlyArrays(a: number[], b: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

/** Slår sammen budsjettkategorier fra arkiverte snapshots (samme nøkkel som husholdningsaggregat). */
export function mergeBudgetCategoriesFromSnapshots(
  snapshotsByProfile: Record<string, BudgetCategory[]>,
  profileIds: string[],
): BudgetCategory[] {
  const budgetKeyToCat = new Map<string, BudgetCategory>()

  for (const pid of profileIds) {
    const list = snapshotsByProfile[pid]
    if (!list) continue
    for (const c of list) {
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
  }
  return [...budgetKeyToCat.values()]
}

/** Slår sammen alle profilers data til én visningsflate (husholdning). */
export function aggregateHouseholdData(
  people: Record<string, PersonData>,
  profileIds: string[],
  budgetYear: number,
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

    txs.push(
      ...(p.transactions ?? []).map((t) => ({
        ...t,
        profileId: t.profileId ?? pid,
      })),
    )

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
  const serviceSubscriptions: ServiceSubscription[] = []
  let snowballExtraMonthly = 0

  for (const pid of profileIds) {
    const p = people[pid]
    if (!p) continue
    snowballExtraMonthly += p.snowballExtraMonthly ?? 0
  }

  for (const pid of profileIds) {
    const p = people[pid]
    if (!p) continue
    for (const sub of p.serviceSubscriptions ?? []) {
      serviceSubscriptions.push({
        ...sub,
        id: `hh-${pid}-${sub.id}`,
        sourceProfileId: pid,
      })
    }
    for (const g of p.savingsGoals ?? []) {
      savingsGoals.push({
        ...g,
        id: `hh-${pid}-${g.id}`,
        name: g.name,
        sourceProfileId: pid,
      })
    }
    for (const d of p.debts ?? []) {
      debts.push({ ...d, id: `hh-${pid}-${d.id}`, name: d.name, sourceProfileId: pid })
    }
    for (const inv of p.investments ?? []) {
      investments.push({
        ...inv,
        id: `hh-${pid}-${inv.id}`,
        name: inv.name,
        sourceProfileId: pid,
      })
    }
  }

  const mergedCats = [...budgetKeyToCat.values()].map((cat) => ({
    ...cat,
    spent: sumTxForCategoryInYearAllProfiles(txs, cat.name, cat.type, budgetYear),
  }))

  return {
    transactions: txs,
    budgetCategories: mergedCats,
    customBudgetLabels: labels.customBudgetLabels,
    hiddenBudgetLabels: labels.hiddenBudgetLabels,
    savingsGoals,
    debts,
    investments,
    serviceSubscriptions,
    snowballExtraMonthly,
  }
}

/** Oppdaterer `currentAmount` for koblede sparemål ut fra baseline + transaksjonssum. */
export function syncLinkedSavingsGoalsCurrent(person: PersonData, profileId: string): PersonData {
  const savingsGoals = person.savingsGoals.map((g) => {
    if (!g.linkedBudgetCategoryId) return g
    const cat = person.budgetCategories.find((c) => c.id === g.linkedBudgetCategoryId)
    if (!cat || cat.parentCategory !== 'sparing') {
      return { ...g, linkedBudgetCategoryId: undefined, baselineAmount: undefined }
    }
    const sum = person.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category === cat.name &&
          (t.profileId ?? profileId) === profileId,
      )
      .reduce((s, t) => s + t.amount, 0)
    const baseline = g.baselineAmount ?? 0
    return { ...g, currentAmount: baseline + sum }
  })
  return { ...person, savingsGoals }
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
  const rawTx = Array.isArray(p.transactions) ? p.transactions : []
  const person: PersonData = {
    transactions: rawTx.map((t: Transaction) => (t.profileId ? t : { ...t, profileId: DEFAULT_PROFILE_ID })),
    budgetCategories: Array.isArray(p.budgetCategories) && p.budgetCategories.length > 0 ? p.budgetCategories : [],
    customBudgetLabels: p.customBudgetLabels ?? labels.customBudgetLabels,
    hiddenBudgetLabels: p.hiddenBudgetLabels ?? labels.hiddenBudgetLabels,
    savingsGoals: Array.isArray(p.savingsGoals) && p.savingsGoals.length > 0 ? p.savingsGoals : [],
    debts: Array.isArray(p.debts) && p.debts.length > 0 ? p.debts : [],
    investments: Array.isArray(p.investments) && p.investments.length > 0 ? p.investments : [],
    serviceSubscriptions: Array.isArray((p as PersonData).serviceSubscriptions)
      ? (p as PersonData).serviceSubscriptions!
      : [],
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

function resolveTransactionOwnerProfileId(
  s: Pick<AppState, 'profiles' | 'people' | 'activeProfileId'>,
  profileId?: string,
): string {
  if (profileId && s.profiles.some((p) => p.id === profileId) && s.people[profileId]) {
    return profileId
  }
  return s.activeProfileId
}

export const useStore = create<AppState>()((set, get) => {
      const initialPeople = { [DEFAULT_PROFILE_ID]: createEmptyPersonData() }

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
        deliveredInsightIds: [] as string[],
        dismissedDuplicateSubscriptionPresetKeys: [] as string[],
        budgetYear: new Date().getFullYear(),
        archivedBudgetsByYear: {} as ArchivedBudgetsByYear,
        onboarding: { status: 'pending' } as OnboardingState,
        formuebyggerPro: createDefaultFormuebyggerPersistedState(),
        demoDataEnabled: false,
        peopleBeforeDemo: null as Record<string, PersonData> | null,

        setDemoDataEnabled: (enabled) => {
          set((s) => {
            if (enabled === s.demoDataEnabled) return s
            if (enabled) {
              let backup: Record<string, PersonData>
              try {
                backup = JSON.parse(JSON.stringify(s.people)) as Record<string, PersonData>
              } catch {
                return s
              }
              if (peopleSnapshotContainsDemoMarkers(backup)) {
                const emptyBackup: Record<string, PersonData> = {}
                for (const pr of s.profiles) {
                  emptyBackup[pr.id] = createEmptyPersonData()
                }
                backup = emptyBackup
              }
              const nextPeople: Record<string, PersonData> = {}
              for (let i = 0; i < s.profiles.length; i++) {
                const pr = s.profiles[i]!
                const vi = getDemoVariantIndexForProfile(s.subscriptionPlan, s.profiles.length, i)
                nextPeople[pr.id] = createDemoPersonDataForProfile(pr.id, s.budgetYear, vi)
              }
              return {
                demoDataEnabled: true,
                peopleBeforeDemo: backup,
                people: nextPeople,
              }
            }
            const restored = s.peopleBeforeDemo
            const restoredIsInvalidDemoCopy =
              restored != null && peopleSnapshotContainsDemoMarkers(restored)
            if (!restored || restoredIsInvalidDemoCopy) {
              const cleared: Record<string, PersonData> = {}
              for (const pr of s.profiles) {
                cleared[pr.id] = createEmptyPersonData()
              }
              return {
                demoDataEnabled: false,
                peopleBeforeDemo: null,
                people: cleared,
              }
            }
            return {
              demoDataEnabled: false,
              peopleBeforeDemo: null,
              people: restored,
            }
          })
        },

        setFormuebyggerPro: (patch) =>
          set((s) => {
            const prev = s.formuebyggerPro
            const nextInput = patch.input ? { ...prev.input, ...patch.input } : prev.input
            const nextExtra =
              patch.extraByMonth !== undefined
                ? { ...prev.extraByMonth, ...patch.extraByMonth }
                : prev.extraByMonth
            return { formuebyggerPro: { input: nextInput, extraByMonth: nextExtra } }
          }),

        hydrateFromPayload: (payload: unknown) => {
          set((current) => mergePersistedIntoFullState(payload, current))
        },

        dismissDuplicateSubscriptionHint: (presetKey) => {
          const k = presetKey.trim()
          if (!k) return
          set((s) => {
            if (s.dismissedDuplicateSubscriptionPresetKeys.includes(k)) return s
            return { dismissedDuplicateSubscriptionPresetKeys: [...s.dismissedDuplicateSubscriptionPresetKeys, k] }
          })
        },

        dismissAllDuplicateSubscriptionHints: (presetKeys) => {
          const trimmed = [...new Set(presetKeys.map((k) => k.trim()).filter(Boolean))]
          if (trimmed.length === 0) return
          set((s) => {
            const merged = new Set(s.dismissedDuplicateSubscriptionPresetKeys)
            let added = false
            for (const k of trimmed) {
              if (!merged.has(k)) {
                merged.add(k)
                added = true
              }
            }
            if (!added) return s
            return { dismissedDuplicateSubscriptionPresetKeys: [...merged] }
          })
        },

        resetDismissedDuplicateSubscriptionHints: () => {
          set((s) => {
            if (s.dismissedDuplicateSubscriptionPresetKeys.length === 0) return s
            return { dismissedDuplicateSubscriptionPresetKeys: [] }
          })
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

        syncInsightNotifications: () => {
          set((s) => {
            const existingIds = new Set(s.notifications.map((n) => n.id))
            const { toAdd, newDeliveredIds } = computeInsightDeltas({
              financeScope: s.financeScope,
              subscriptionPlan: s.subscriptionPlan,
              profiles: s.profiles,
              activeProfileId: s.activeProfileId,
              people: s.people,
              budgetYear: s.budgetYear,
              onboarding: s.onboarding,
              deliveredInsightIds: s.deliveredInsightIds ?? [],
              existingNotificationIds: existingIds,
            })
            if (toAdd.length === 0) return s
            return {
              notifications: [...toAdd, ...s.notifications],
              deliveredInsightIds: [...(s.deliveredInsightIds ?? []), ...newDeliveredIds],
            }
          })
        },

        deliverRoadmapInviteNotification: () => {
          set((s) => {
            if (s.deliveredAnnouncementIds.includes(ROADMAP_INVITE_NOTIFICATION_ID)) return s
            if (s.notifications.some((n) => n.id === ROADMAP_INVITE_NOTIFICATION_ID)) return s
            return {
              notifications: [
                {
                  id: ROADMAP_INVITE_NOTIFICATION_ID,
                  title: 'Har du et forslag?',
                  body:
                    'Du har brukt Smart Budsjett en stund. Gå til Min konto → Roadmap for å stemme på forbedringer og foreslå egne.',
                  kind: 'product' as const,
                  createdAt: new Date().toISOString(),
                  read: false,
                },
                ...s.notifications,
              ],
              deliveredAnnouncementIds: [...s.deliveredAnnouncementIds, ROADMAP_INVITE_NOTIFICATION_ID],
            }
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

        addAppNotification: (payload) => {
          const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
          set((s) => ({
            notifications: [
              {
                id,
                title: payload.title,
                body: payload.body,
                kind: payload.kind ?? 'budget',
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
          }))
        },

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
          const initialPerson =
            s.demoDataEnabled && s.subscriptionPlan === 'family'
              ? createDemoPersonDataForProfile(
                  id,
                  s.budgetYear,
                  getDemoVariantIndexForProfile(s.subscriptionPlan, s.profiles.length + 1, s.profiles.length),
                )
              : createEmptyPersonData()
          const nextPeople = { ...s.people, [id]: initialPerson }
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
          set((s) => {
            const pid = resolveTransactionOwnerProfileId(s, t.profileId)
            const person = s.people[pid]
            if (!person) return s
            const tx: Transaction = { ...t, profileId: pid }
            const next = syncLinkedSavingsGoalsCurrent(
              { ...person, transactions: [tx, ...person.transactions] },
              pid,
            )
            return {
              people: {
                ...s.people,
                [pid]: recalcPersonBudgetSpentForYear(next, pid, s.budgetYear),
              },
            }
          }),

        addTransactions: (incoming) =>
          set((s) => {
            if (!incoming.length) return s
            const groups = new Map<string, Transaction[]>()
            for (const t of incoming) {
              const pid = resolveTransactionOwnerProfileId(s, t.profileId)
              const tx: Transaction = { ...t, profileId: pid }
              const arr = groups.get(pid) ?? []
              arr.push(tx)
              groups.set(pid, arr)
            }
            let nextPeople = { ...s.people }
            for (const [pid, txs] of groups) {
              const person = nextPeople[pid]
              if (!person) continue
              const next = syncLinkedSavingsGoalsCurrent(
                { ...person, transactions: [...txs, ...person.transactions] },
                pid,
              )
              nextPeople = {
                ...nextPeople,
                [pid]: recalcPersonBudgetSpentForYear(next, pid, s.budgetYear),
              }
            }
            return { people: nextPeople }
          }),

        removeTransaction: (id) =>
          set((s) => {
            for (const pid of s.profiles.map((p) => p.id)) {
              const person = s.people[pid]
              if (!person?.transactions.some((t) => t.id === id)) continue
              const nextTx = person.transactions.filter((t) => t.id !== id)
              const merged = syncLinkedSavingsGoalsCurrent(
                { ...person, transactions: nextTx },
                pid,
              )
              return {
                people: {
                  ...s.people,
                  [pid]: recalcPersonBudgetSpentForYear(merged, pid, s.budgetYear),
                },
              }
            }
            return s
          }),

        updateTransaction: (id, patch) =>
          set((s) => {
            for (const pid of s.profiles.map((p) => p.id)) {
              const person = s.people[pid]
              if (!person?.transactions.some((t) => t.id === id)) continue
              const nextTx = person.transactions.map((t) => {
                if (t.id !== id) return t
                let merged: Transaction = {
                  ...t,
                  ...patch,
                  id: t.id,
                  profileId: t.profileId ?? pid,
                }
                if (patch.subcategory !== undefined) {
                  const s = patch.subcategory.trim()
                  if (s) merged = { ...merged, subcategory: s }
                  else {
                    const { subcategory: _removed, ...rest } = merged
                    merged = rest as Transaction
                  }
                }
                return merged
              })
              const merged = syncLinkedSavingsGoalsCurrent(
                { ...person, transactions: nextTx },
                pid,
              )
              return {
                people: {
                  ...s.people,
                  [pid]: recalcPersonBudgetSpentForYear(merged, pid, s.budgetYear),
                },
              }
            }
            return s
          }),

        recalcBudgetSpent: (categoryName) =>
          patchActive((d) => {
            const pid = get().activeProfileId
            const y = get().budgetYear
            const cat = d.budgetCategories.find((c) => c.name === categoryName)
            if (!cat) return d
            const spent = sumTxForCategoryInYear(d.transactions, categoryName, cat.type, y, pid)
            const next: PersonData = {
              ...d,
              budgetCategories: d.budgetCategories.map((c) =>
                c.name === categoryName ? { ...c, spent } : c,
              ),
            }
            return syncLinkedSavingsGoalsCurrent(next, pid)
          }),

        startNewBudgetYear: (opts) =>
          set((s) => {
            const y = s.budgetYear
            const byProfile: Record<string, BudgetCategory[]> = {}
            for (const pr of s.profiles) {
              const p = s.people[pr.id]
              if (!p) continue
              byProfile[pr.id] = cloneBudgetCategories(p.budgetCategories)
            }
            const nextArchive: ArchivedBudgetsByYear = {
              ...s.archivedBudgetsByYear,
              [String(y)]: byProfile,
            }
            const nextYear = y + 1
            const incomeSrc: BudgetYearCopySource =
              opts?.income !== undefined
                ? opts.income
                : opts?.copyPlan === false
                  ? 'zero'
                  : 'budget'
            const expenseSrc: BudgetYearCopySource =
              opts?.expenses !== undefined
                ? opts.expenses
                : opts?.copyPlan === false
                  ? 'zero'
                  : 'budget'

            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pr of s.profiles) {
              const p = nextPeople[pr.id]
              if (!p) continue
              const cloned = cloneBudgetCategories(p.budgetCategories)
              const newCats = cloned.map((c) => {
                const src = c.type === 'income' ? incomeSrc : expenseSrc
                let budgeted: number[]
                if (src === 'budget') {
                  budgeted = [...ensureTwelveBudgeted(c.budgeted)]
                } else if (src === 'zero') {
                  budgeted = Array(12).fill(0)
                } else {
                  budgeted = actualsPerMonthForCategory(p.transactions, pr.id, y, c.name, c.type)
                }
                return {
                  ...c,
                  budgeted,
                  spent: 0,
                }
              })
              nextPeople[pr.id] = recalcPersonBudgetSpentForYear(
                { ...p, budgetCategories: newCats },
                pr.id,
                nextYear,
              )
            }
            return {
              budgetYear: nextYear,
              archivedBudgetsByYear: nextArchive,
              people: nextPeople,
            }
          }),

        switchActiveBudgetYear: (targetYear) => {
          const s = get()
          if (targetYear === s.budgetYear) return { ok: true as const }
          const snap = s.archivedBudgetsByYear[String(targetYear)]
          if (!snap) return { ok: false as const, reason: 'not_in_archive' as const }
          for (const pr of s.profiles) {
            const list = snap[pr.id]
            if (!list || !Array.isArray(list)) {
              return { ok: false as const, reason: 'missing_profile_snapshot' as const }
            }
          }

          set(() => {
            const byProfile: Record<string, BudgetCategory[]> = {}
            for (const pr of s.profiles) {
              const p = s.people[pr.id]
              if (!p) continue
              byProfile[pr.id] = cloneBudgetCategories(p.budgetCategories)
            }
            const nextArchive: ArchivedBudgetsByYear = {
              ...s.archivedBudgetsByYear,
              [String(s.budgetYear)]: byProfile,
            }
            const { [String(targetYear)]: _, ...restArchive } = nextArchive

            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pr of s.profiles) {
              const restored = cloneBudgetCategories(snap[pr.id]!)
              const p = nextPeople[pr.id]!
              let mergedPerson = { ...p, budgetCategories: restored }
              mergedPerson = applySubscriptionCancellationsToBudgetForYear(mergedPerson, targetYear)
              nextPeople[pr.id] = recalcPersonBudgetSpentForYear(mergedPerson, pr.id, targetYear)
            }

            return {
              budgetYear: targetYear,
              archivedBudgetsByYear: restArchive,
              people: nextPeople,
            }
          })

          return { ok: true as const }
        },

        setBudgetYear: (year) => {
          const s = get()
          if (Object.keys(s.archivedBudgetsByYear).length > 0) return
          const y = Math.floor(year)
          const cy = new Date().getFullYear()
          if (y < cy - 2 || y > cy + 2) return
          set(() => {
            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pr of s.profiles) {
              const p = nextPeople[pr.id]
              if (!p) continue
              let next = syncLinkedSavingsGoalsCurrent(p, pr.id)
              next = applySubscriptionCancellationsToBudgetForYear(next, y)
              nextPeople[pr.id] = recalcPersonBudgetSpentForYear(next, pr.id, y)
            }
            return { budgetYear: y, people: nextPeople }
          })
        },

        completeOnboarding: () =>
          set({
            onboarding: { status: 'completed', finishedAt: new Date().toISOString() },
          }),

        skipOnboarding: () =>
          set({
            onboarding: { status: 'skipped', finishedAt: new Date().toISOString() },
          }),

        openOnboardingAgain: () =>
          set({
            onboarding: { status: 'pending' },
          }),

        addBudgetCategory: (c) => patchActive((d) => ({ ...d, budgetCategories: [...d.budgetCategories, c] })),

        updateBudgetCategory: (id, data) =>
          patchActive((d) => ({
            ...d,
            budgetCategories: d.budgetCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
          })),

        removeBudgetCategory: (id) =>
          patchActive((d) => {
            const pid = get().activeProfileId
            const nextCats = d.budgetCategories.filter((c) => c.id !== id)
            const nextGoals = d.savingsGoals.map((g) =>
              g.linkedBudgetCategoryId === id ? { ...g, linkedBudgetCategoryId: undefined, baselineAmount: undefined } : g,
            )
            const nextSubs = (d.serviceSubscriptions ?? []).map((s) =>
              s.linkedBudgetCategoryId === id ? { ...s, linkedBudgetCategoryId: null, syncToBudget: false } : s,
            )
            return syncLinkedSavingsGoalsCurrent(
              { ...d, budgetCategories: nextCats, savingsGoals: nextGoals, serviceSubscriptions: nextSubs },
              pid,
            )
          }),

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

        remapBudgetCategoryName: (parent, fromName, toName) => {
          const s = get()
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false, reason: 'empty_name' }
          const res = applyCategoryRemap(person, s.archivedBudgetsByYear, pid, parent, fromName, toName)
          if (!res.ok) return res
          let next = res.person
          next = applySubscriptionCancellationsToBudgetForYear(next, s.budgetYear)
          next = recalcPersonBudgetSpentForYear(next, pid, s.budgetYear)
          set({
            people: { ...s.people, [pid]: next },
            archivedBudgetsByYear: res.archivedBudgetsByYear,
          })
          return { ok: true }
        },

        addSavingsGoal: (g) =>
          patchActive((d) => {
            const pid = get().activeProfileId
            return syncLinkedSavingsGoalsCurrent({ ...d, savingsGoals: [...d.savingsGoals, g] }, pid)
          }),

        updateSavingsGoal: (id, data) =>
          patchActive((d) => {
            const pid = get().activeProfileId
            const savingsGoals = d.savingsGoals.map((g) => {
              if (g.id !== id) return g
              const merged: SavingsGoal = { ...g, ...data }
              if (merged.linkedBudgetCategoryId) {
                const cat = d.budgetCategories.find((c) => c.id === merged.linkedBudgetCategoryId)
                if (!cat || cat.parentCategory !== 'sparing' || cat.type !== 'expense') {
                  return { ...merged, linkedBudgetCategoryId: undefined, baselineAmount: undefined }
                }
              }
              return merged
            })
            return syncLinkedSavingsGoalsCurrent({ ...d, savingsGoals }, pid)
          }),

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

        addServiceSubscription: (input) => {
          const s = get()
          if (s.financeScope === 'household') return { ok: false as const, reason: 'household_readonly' }
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false as const, reason: 'household_readonly' }
          const id = generateId()
          const label = (input.label ?? '').trim() || 'Abonnement'
          const active = input.active !== false
          const syncToBudget = !!(input.syncToBudget && active)
          const baseSub: ServiceSubscription = {
            id,
            label,
            amountNok: Math.max(0, Number.isFinite(input.amountNok) ? input.amountNok : 0),
            billing: input.billing === 'yearly' ? 'yearly' : 'monthly',
            active,
            syncToBudget: false,
            linkedBudgetCategoryId: null,
            note: input.note?.trim() || undefined,
            presetKey: input.presetKey,
          }
          let sub: ServiceSubscription = { ...baseSub, syncToBudget }
          let budgetCategories = [...person.budgetCategories]
          let displayName: string | undefined
          if (syncToBudget) {
            const catId = generateId()
            displayName = uniqueRegningerName(label, budgetCategories.map((c) => c.name))
            const monthly = monthlyEquivalentNok(baseSub)
            const raw = buildBudgetCategoryForSubscription(catId, displayName, monthly)
            const spent = sumTxForCategoryInYear(
              person.transactions,
              displayName,
              'expense',
              s.budgetYear,
              pid,
            )
            budgetCategories = [...budgetCategories, { ...raw, spent }]
            sub = {
              ...baseSub,
              syncToBudget: true,
              linkedBudgetCategoryId: catId,
            }
          }

          const planned = input.plannedTransactions
          let extraTx: Transaction[] = []
          if (
            syncToBudget &&
            planned &&
            displayName &&
            sub.linkedBudgetCategoryId &&
            planned.budgetYear === s.budgetYear
          ) {
            extraTx = buildPlannedSubscriptionTransactions({
              subscriptionId: id,
              label,
              categoryName: displayName,
              profileId: pid,
              amountNok: baseSub.amountNok,
              billing: baseSub.billing,
              budgetYear: planned.budgetYear,
              startMonth1: planned.startMonth1,
              endMonth1: planned.endMonth1,
              dayOfMonth: planned.dayOfMonth,
            })
          }

          let nextPersonRaw: PersonData = {
            ...person,
            budgetCategories,
            serviceSubscriptions: [...(person.serviceSubscriptions ?? []), sub],
          }
          if (extraTx.length > 0) {
            nextPersonRaw = {
              ...nextPersonRaw,
              transactions: [...extraTx, ...nextPersonRaw.transactions],
            }
          }
          const nextPerson = recalcPersonBudgetSpentForYear(
            syncLinkedSavingsGoalsCurrent(nextPersonRaw, pid),
            pid,
            s.budgetYear,
          )
          set((state) => ({
            people: { ...state.people, [pid]: nextPerson },
          }))
          return { ok: true as const, id }
        },

        updateServiceSubscription: (id, patchIn) => {
          const { plannedTransactions: plannedPatch, ...patch } = patchIn
          const s = get()
          if (s.financeScope === 'household') return { ok: false as const, reason: 'household_readonly' }
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false as const, reason: 'not_found' }
          const list = person.serviceSubscriptions ?? []
          const idx = list.findIndex((x) => x.id === id)
          if (idx < 0) return { ok: false as const, reason: 'not_found' }
          const prev = list[idx]!
          const merged: ServiceSubscription = {
            ...prev,
            ...patch,
            id: prev.id,
            label: patch.label !== undefined ? patch.label.trim() || 'Abonnement' : prev.label,
            amountNok:
              patch.amountNok !== undefined
                ? Math.max(0, Number.isFinite(patch.amountNok) ? patch.amountNok : 0)
                : prev.amountNok,
            billing: patch.billing ?? prev.billing,
            active: patch.active !== undefined ? patch.active : prev.active,
            syncToBudget: patch.syncToBudget !== undefined ? patch.syncToBudget : prev.syncToBudget,
            note: patch.note !== undefined ? patch.note?.trim() || undefined : prev.note,
            presetKey: patch.presetKey !== undefined ? patch.presetKey : prev.presetKey,
            cancelledFrom: patch.cancelledFrom !== undefined ? patch.cancelledFrom : prev.cancelledFrom,
            monthlyEquivalentNokSnapshot:
              patch.monthlyEquivalentNokSnapshot !== undefined
                ? patch.monthlyEquivalentNokSnapshot
                : prev.monthlyEquivalentNokSnapshot,
          }
          /** Behold Regninger-linje ved avsluttet abonnement (nullstilte måneder). */
          const wantBudgetLine = !!(
            merged.syncToBudget &&
            (merged.active || merged.cancelledFrom != null)
          )
          let budgetCategories = [...person.budgetCategories]
          let nextSub: ServiceSubscription = { ...merged, syncToBudget: wantBudgetLine }

          if (!wantBudgetLine && prev.linkedBudgetCategoryId) {
            budgetCategories = budgetCategories.filter((c) => c.id !== prev.linkedBudgetCategoryId)
            nextSub = { ...nextSub, linkedBudgetCategoryId: null, syncToBudget: false }
          } else if (wantBudgetLine) {
            const monthly = monthlyEquivalentNok(nextSub)
            if (!prev.linkedBudgetCategoryId) {
              const catId = generateId()
              const displayName = uniqueRegningerName(
                nextSub.label,
                budgetCategories.map((c) => c.name),
              )
              const raw = buildBudgetCategoryForSubscription(catId, displayName, monthly)
              const spent = sumTxForCategoryInYear(
                person.transactions,
                displayName,
                'expense',
                s.budgetYear,
                pid,
              )
              budgetCategories = [...budgetCategories, { ...raw, spent }]
              nextSub = { ...nextSub, linkedBudgetCategoryId: catId, syncToBudget: true }
            } else {
              const catId = prev.linkedBudgetCategoryId
              budgetCategories = budgetCategories.map((c) => {
                if (c.id !== catId) return c
                const otherNames = budgetCategories.filter((x) => x.id !== catId).map((x) => x.name)
                const newName =
                  patch.label !== undefined
                    ? uniqueRegningerName(nextSub.label, otherNames)
                    : c.name
                let budgeted = budgetedTwelveFromMonthly(monthly)
                if (nextSub.cancelledFrom && nextSub.cancelledFrom.year === s.budgetYear) {
                  budgeted = zeroBudgetedFromCancellationMonth(budgeted, nextSub.cancelledFrom.month)
                }
                const spent = sumTxForCategoryInYear(
                  person.transactions,
                  newName,
                  'expense',
                  s.budgetYear,
                  pid,
                )
                return { ...c, name: newName, budgeted, spent }
              })
              nextSub = { ...nextSub, linkedBudgetCategoryId: catId, syncToBudget: true }
            }
          }

          const nextList = [...list]
          nextList[idx] = nextSub

          let nextTransactions = person.transactions
          if (plannedPatch !== undefined) {
            nextTransactions = person.transactions.filter((t) => t.linkedServiceSubscriptionId !== id)
            if (
              plannedPatch !== null &&
              nextSub.syncToBudget &&
              nextSub.linkedBudgetCategoryId &&
              plannedPatch.budgetYear === s.budgetYear
            ) {
              const displayName = budgetCategories.find((c) => c.id === nextSub.linkedBudgetCategoryId)?.name
              if (displayName) {
                const extraTx = buildPlannedSubscriptionTransactions({
                  subscriptionId: id,
                  label: nextSub.label,
                  categoryName: displayName,
                  profileId: pid,
                  amountNok: nextSub.amountNok,
                  billing: nextSub.billing,
                  budgetYear: plannedPatch.budgetYear,
                  startMonth1: plannedPatch.startMonth1,
                  endMonth1: plannedPatch.endMonth1,
                  dayOfMonth: plannedPatch.dayOfMonth,
                })
                nextTransactions = [...extraTx, ...nextTransactions]
              }
            }
          }

          const nextPersonRaw = {
            ...person,
            budgetCategories,
            serviceSubscriptions: nextList,
            transactions: plannedPatch !== undefined ? nextTransactions : person.transactions,
          }
          const nextPerson = recalcPersonBudgetSpentForYear(
            syncLinkedSavingsGoalsCurrent(nextPersonRaw, pid),
            pid,
            s.budgetYear,
          )
          set((state) => ({
            people: { ...state.people, [pid]: nextPerson },
          }))
          return { ok: true as const }
        },

        removeServiceSubscription: (id) => {
          const s = get()
          if (s.financeScope === 'household') return { ok: false as const, reason: 'household_readonly' }
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false as const, reason: 'not_found' }
          const list = person.serviceSubscriptions ?? []
          const idx = list.findIndex((x) => x.id === id)
          if (idx < 0) return { ok: false as const, reason: 'not_found' }
          const prev = list[idx]!
          let budgetCategories = person.budgetCategories
          if (prev.linkedBudgetCategoryId) {
            budgetCategories = budgetCategories.filter((c) => c.id !== prev.linkedBudgetCategoryId)
          }
          const txs = person.transactions.filter((t) => t.linkedServiceSubscriptionId !== id)
          const nextList = list.filter((x) => x.id !== id)
          const nextPersonRaw = {
            ...person,
            budgetCategories,
            serviceSubscriptions: nextList,
            transactions: txs,
          }
          const nextPerson = recalcPersonBudgetSpentForYear(
            syncLinkedSavingsGoalsCurrent(nextPersonRaw, pid),
            pid,
            s.budgetYear,
          )
          set((state) => ({
            people: { ...state.people, [pid]: nextPerson },
          }))
          return { ok: true as const }
        },

        markServiceSubscriptionCancelled: (id, cancelledFrom) => {
          const s = get()
          if (s.financeScope === 'household') return { ok: false as const, reason: 'household_readonly' }
          const y = cancelledFrom.year
          const m = Math.floor(cancelledFrom.month)
          if (!Number.isFinite(y) || m < 1 || m > 12) {
            return { ok: false as const, reason: 'invalid_date' }
          }
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false as const, reason: 'household_readonly' }
          const list = person.serviceSubscriptions ?? []
          const idx = list.findIndex((x) => x.id === id)
          if (idx < 0) return { ok: false as const, reason: 'not_found' }
          const prev = list[idx]!
          if (prev.cancelledFrom) return { ok: true as const }
          const snapshot = monthlyEquivalentNok(prev)
          const cy = cancelledFrom.year
          const cm = cancelledFrom.month
          const txs = person.transactions.filter(
            (t) => !transactionMatchesCancellationRemoval(t, id, cy, cm),
          )
          const nextSub: ServiceSubscription = {
            ...prev,
            active: false,
            cancelledFrom: { year: cy, month: cm },
            monthlyEquivalentNokSnapshot: snapshot,
            syncToBudget: !!prev.linkedBudgetCategoryId,
          }
          const nextList = [...list]
          nextList[idx] = nextSub
          let nextPersonRaw: PersonData = {
            ...person,
            transactions: txs,
            serviceSubscriptions: nextList,
          }
          nextPersonRaw = applySubscriptionCancellationsToBudgetForYear(nextPersonRaw, s.budgetYear)
          const nextPerson = recalcPersonBudgetSpentForYear(
            syncLinkedSavingsGoalsCurrent(nextPersonRaw, pid),
            pid,
            s.budgetYear,
          )
          set((state) => ({
            people: { ...state.people, [pid]: nextPerson },
          }))
          return { ok: true as const }
        },
      }
})

export function resetStoreForLogout() {
  const initialPeople = { [DEFAULT_PROFILE_ID]: createEmptyPersonData() }
  useStore.setState({
    subscriptionPlan: 'solo',
    profiles: [{ id: DEFAULT_PROFILE_ID, name: 'Meg' }],
    activeProfileId: DEFAULT_PROFILE_ID,
    financeScope: 'profile',
    people: initialPeople,
    notifications: [],
    deliveredAnnouncementIds: [],
    deliveredInsightIds: [],
    dismissedDuplicateSubscriptionPresetKeys: [],
    budgetYear: new Date().getFullYear(),
    archivedBudgetsByYear: {},
    onboarding: { status: 'pending' },
    formuebyggerPro: createDefaultFormuebyggerPersistedState(),
    demoDataEnabled: false,
    peopleBeforeDemo: null,
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
      budgetYear: s.budgetYear,
      archivedBudgetsByYear: s.archivedBudgetsByYear,
      startNewBudgetYear: s.startNewBudgetYear,
      switchActiveBudgetYear: s.switchActiveBudgetYear,
      addTransaction: s.addTransaction,
      addTransactions: s.addTransactions,
      removeTransaction: s.removeTransaction,
      updateTransaction: s.updateTransaction,
      recalcBudgetSpent: s.recalcBudgetSpent,
      addBudgetCategory: s.addBudgetCategory,
      updateBudgetCategory: s.updateBudgetCategory,
      removeBudgetCategory: s.removeBudgetCategory,
      addCustomBudgetLabel: s.addCustomBudgetLabel,
      removeCustomBudgetLabel: s.removeCustomBudgetLabel,
      hideStandardBudgetLabel: s.hideStandardBudgetLabel,
      unhideStandardBudgetLabel: s.unhideStandardBudgetLabel,
      remapBudgetCategoryName: s.remapBudgetCategoryName,
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
      addServiceSubscription: s.addServiceSubscription,
      updateServiceSubscription: s.updateServiceSubscription,
      removeServiceSubscription: s.removeServiceSubscription,
      markServiceSubscriptionCancelled: s.markServiceSubscriptionCancelled,
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
        state.budgetYear,
      )
    }
    return state.people[state.activeProfileId] ?? createEmptyPersonData()
  }, [householdMode, state.people, state.activeProfileId, state.profiles, state.budgetYear])

  return {
    transactions: person.transactions,
    budgetCategories: person.budgetCategories,
    customBudgetLabels: person.customBudgetLabels ?? EMPTY_LABEL_LISTS.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? EMPTY_LABEL_LISTS.hiddenBudgetLabels,
    savingsGoals: person.savingsGoals,
    debts: person.debts,
    investments: person.investments,
    serviceSubscriptions: person.serviceSubscriptions ?? [],
    snowballExtraMonthly: person.snowballExtraMonthly ?? 0,
    debtPayoffStrategy: person.debtPayoffStrategy ?? 'snowball',
    activeProfileId: state.activeProfileId,
    profiles: state.profiles,
    subscriptionPlan: state.subscriptionPlan,
    financeScope: state.financeScope,
    isHouseholdAggregate: householdMode,
    addTransaction: state.addTransaction,
    addTransactions: state.addTransactions,
    removeTransaction: state.removeTransaction,
    updateTransaction: state.updateTransaction,
    recalcBudgetSpent: state.recalcBudgetSpent,
    addBudgetCategory: state.addBudgetCategory,
    updateBudgetCategory: state.updateBudgetCategory,
    removeBudgetCategory: state.removeBudgetCategory,
    addCustomBudgetLabel: state.addCustomBudgetLabel,
    removeCustomBudgetLabel: state.removeCustomBudgetLabel,
    hideStandardBudgetLabel: state.hideStandardBudgetLabel,
    unhideStandardBudgetLabel: state.unhideStandardBudgetLabel,
    remapBudgetCategoryName: state.remapBudgetCategoryName,
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
    addServiceSubscription: state.addServiceSubscription,
    updateServiceSubscription: state.updateServiceSubscription,
    removeServiceSubscription: state.removeServiceSubscription,
    markServiceSubscriptionCancelled: state.markServiceSubscriptionCancelled,
    setActiveProfileId: state.setActiveProfileId,
    setFinanceScope: state.setFinanceScope,
    setSubscriptionPlan: state.setSubscriptionPlan,
    addProfile: state.addProfile,
    renameProfile: state.renameProfile,
    budgetYear: state.budgetYear,
    archivedBudgetsByYear: state.archivedBudgetsByYear,
    startNewBudgetYear: state.startNewBudgetYear,
    switchActiveBudgetYear: state.switchActiveBudgetYear,
  }
}
