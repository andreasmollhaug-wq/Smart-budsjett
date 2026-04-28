import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { budgetedMonthsFromFrequency, generateId, type BudgetCategoryFrequency } from './utils'
import { PRODUCT_ANNOUNCEMENTS, isAnnouncementApplicable, type AnnouncementKind } from '@/lib/announcements'
import { ROADMAP_INVITE_NOTIFICATION_ID } from '@/lib/roadmapInvite'
import { applyCategoryRemap, type CategoryRemapErrorReason } from './categoryRemap'
import type { ParentCategory } from './budgetCategoryCatalog'
import { reorderBudgetCategoriesForParent } from './budgetYearHelpers'
import { emptyLabelLists, type LabelLists } from './budgetCategoryCatalog'
import { computeInsightDeltas } from './insightNotifications'
import { formatNokCurrencyDisplay } from '@/lib/money/nokDisplayFormat'
import {
  PLANNED_OVERDUE_NOTIFICATION_ID,
  buildPlannedOverdueNotification,
  plannedOverdueContentSignature,
} from './plannedTransactions'
import {
  buildBudgetCategoryForSubscription,
  monthlyEquivalentNok,
  uniqueRegningerName,
} from './serviceSubscriptionHelpers'
import {
  applySubscriptionBudgetRebuildsForCategoryIds,
  clampSubscriptionBudgetMonthWindow,
  clampYearlyChargeMonth1,
} from './subscriptionBudgetRebuild'
import {
  applySubscriptionCancellationsToBudgetForYear,
  buildPlannedSubscriptionTransactions,
  transactionMatchesCancellationRemoval,
} from './subscriptionTransactions'
import {
  appendDebtPlannedTransactionsForBudgetYear,
  buildBudgetCategoryForDebt,
  buildDebtLinkedBudgetedTwelve,
  buildSyncedDebtPlannedTransactionsForYear,
  clampSyncBudgetFromMonth1,
  debtColorForType,
  defaultSyncBudgetFromMonth1ForBudgetYear,
  normalizeDebtLinkedBudgetCategoriesToFullYear,
  stripAllLinkedDebtTransactions,
  stripLinkedDebtTransactionsForYear,
  uniqueGjeldName,
} from './debtBudgetSync'
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
import { createEmptyHjemFlytState, normalizeHjemFlytState } from '@/features/hjemflyt/normalize'
import { normalizeHjemflytProfileMeta } from '@/features/hjemflyt/profileMeta'
import { canAdministerHjemflyt } from '@/features/hjemflyt/hjemflytPermissions'
import { effectiveHjemflytProfileIds } from '@/features/hjemflyt/hjemflytParticipants'
import {
  canProfileActOnTask,
  nextRoundRobinIndex,
  periodKeyForRecurrence,
  poolForTask,
} from '@/features/hjemflyt/hjemflytLogic'
import { LEDGER_IMPORT_HISTORY_MAX } from '@/lib/ledgerImport/ledgerImport.constants'
import {
  applyLedgerBudgetAdjustmentToCategories,
  mergeBudgetCategoriesWithAdjustmentBackfill,
  subtractLedgerBudgetAdjustmentFromCategories,
} from '@/lib/ledgerImport/ledgerImportBudgetAdjust'
import { normalizeLedgerAccountCode } from '@/lib/ledgerImport/parseLedgerCsv'
import type {
  LedgerAccountMappingRule,
  LedgerAccountMappingsState,
  LedgerImportRun,
  LedgerSourceId,
} from '@/lib/ledgerImport/types'
import type {
  HjemflytAssignMode,
  HjemflytRecurrence,
  HjemFlytState,
  HjemflytProfileMeta,
  HjemflytSettings,
} from '@/features/hjemflyt/types'
import { pushMatActivity } from '@/features/matHandleliste/activity'
import {
  appendIngredientsToShoppingList,
  appendManualItemToShoppingList,
  mealIngredientToLines,
  portionFactorForMeal,
} from '@/features/matHandleliste/mergeIngredients'
import {
  clampMealSlotTags,
  createEmptyMatHandlelisteState,
  normalizeMatHandlelisteState,
  normalizePlanVisibleSlots,
  normalizePlanWeekLayout,
} from '@/features/matHandleliste/normalize'
import { collectIngredientLinesFromPlanRange, listDateKeysInRange } from '@/features/matHandleliste/planHelpers'
import { clampShoppingListQuantity } from '@/features/matHandleliste/ingredientUnitOptions'
import {
  MEAL_SLOT_ORDER,
  type IngredientUnit,
  type Meal,
  type MealIngredient,
  type MealSlotId,
  type MatHandlelisteState,
  type PlannedSlot,
  type PlanWeekLayout,
  type ShoppingListItem,
} from '@/features/matHandleliste/types'
import {
  buildDemoServiceSubscriptions,
  buildDemoSubscriptionPlannedTransactionsForYear,
  demoExpenseIndexIsSubscription,
} from './demoServiceSubscriptions'
import {
  buildDemoTransactionsForNonZeroVariant,
  createDemoBasePersonDataForNonZeroVariant,
  getDemoSubscriptionMonthlyAmountsForVariant,
  getDemoVariantIndexForProfile,
} from './demoPersonVariants'
import {
  createDemoMatHandlelisteState,
  isMatHandlelisteShellEmpty,
  matSnapshotContainsDemoMarkers,
} from './demoMatHandleliste'
import { effectiveBudgetedIncomeMonth, normalizeIncomeWithholdingRule } from '@/lib/incomeWithholding'
import {
  ensureIncomeSprintPlanId,
  reconcileIncomeSprintPlan,
  type IncomeSprintPlan,
} from './incomeSprint'
import {
  impliedNewMonthTotal,
  type HouseholdSplitMeta,
  type HouseholdSplitMode,
  pickHouseholdSplitForAggregate,
  splitTotalBudgetBetweenParticipants,
  validateHouseholdSplitMeta,
} from './householdBudgetSplit'

export type { BudgetYearCopySource } from './budgetActualsToBudgeted'
export type { HouseholdSplitMeta, HouseholdSplitMode } from './householdBudgetSplit'

/** Oppretting av felles husholdningslinje (utgift) — fordeles over valgte profiler. */
export type AddSharedHouseholdBudgetLineInput = {
  name: string
  parentCategory: ParentCategory
  frequency: BudgetCategoryFrequency
  onceMonthIndex?: number
  amount: number
  color: string
  participantProfileIds: string[]
  mode: HouseholdSplitMode
  percentWeights?: number[]
  amountReferenceByProfileId?: Record<string, number>
}
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
  /** Stabil sammenligningsnøkkel for innhold (f.eks. innsikt «Kommende») når kroppen kan endre form uavhengig av data. */
  contentSignature?: string
  /** Valgfri primærhandling (f.eks. lenke til «Kommende»). */
  actionHref?: string
  actionLabel?: string
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
  /** Inntekt: beløpet er netto utbetalt (standard / bank). `false` = brutto med forenklet trekk. */
  incomeIsNet?: boolean
  /** Inntekt, når `incomeIsNet === false`: valgfri prosent (ellers profilens standard). */
  incomeWithholdingPercent?: number
  /** Eierprofil (påkrevd for nye rader; migreres for eldre data). */
  profileId?: string
  /** App-genererte planlagte trekk fra tjenesteabonnement. */
  linkedServiceSubscriptionId?: string
  /** App-genererte planlagte avdrag fra gjeld (synk til budsjett). */
  linkedDebtId?: string
  /** ISO-tidspunkt når brukeren markerte transaksjonen som gjennomgått. */
  reviewedAt?: string
  /** ISO-tidspunkt når utgift ble markert som betalt (planlagt trekk bekreftet). */
  paidAt?: string
  /**
   * Bruker har registrert som planlagt oppfølging (typisk fremtidig dato ved opprettelse).
   * Synkede trekk bruker linkedDebtId / linkedServiceSubscriptionId i stedet.
   */
  plannedFollowUp?: boolean
  /** Knytning til rad i `ledgerImportHistory` (regnskapsimport) for detaljvisning i historikk. */
  ledgerImportRunId?: string
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
  /** Kun for `frequency === 'once'`: måned (0 = jan … 11 = des) der beløpet plasseres. */
  onceMonthIndex?: number
  /** Abonnement-synk: `aggregated` = flere abo på samme linje; `single` = én auto-linje. */
  subscriptionBudgetManaged?: 'off' | 'single' | 'aggregated'
  /**
   * Inntektslinje: når `apply`, er `budgeted` brutto og summeringer bruker netto etter `percent`.
   */
  incomeWithholding?: { apply: boolean; percent: number }
  /** Felles husholdningsfordeling (utgift) — identisk kopi per deltakerrad, samme `groupId`. */
  householdSplit?: HouseholdSplitMeta
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
  type:
    | 'loan'
    | 'consumer_loan'
    | 'refinancing'
    | 'credit_card'
    | 'mortgage'
    | 'student_loan'
    | 'other'
  /** Fritekst: vilkår, bank, egen kommentar */
  note?: string
  /** Eksplisitt «avdrag pauset» */
  repaymentPaused?: boolean
  /** Når pausen slutter (yyyy-mm-dd) */
  pauseEndDate?: string
  /** Ta med i snøball-rekkefølge (manglende: boliglån nei, ellers ja — se `snowball.ts`) */
  includeInSnowball?: boolean
  /** Koblet budsjettlinje under Gjeld (opprettes ved synk). */
  linkedBudgetCategoryId?: string | null
  /** Når sann: månedlig avdrag speiles til budsjett (opt-in). */
  syncToBudget?: boolean
  /** Når sann: planlagte månedlige transaksjoner for aktivt budsjettår (krever syncToBudget). */
  syncPlannedTransactions?: boolean
  /** Dag i måneden for planlagte trekk (1–28). */
  plannedPaymentDayOfMonth?: number
  /** Første måned (1–12) som avdrag tas med i budsjett og planlagte trekk for aktivt budsjettår. */
  syncBudgetFromMonth1?: number
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
  /** Egen linje per abo (standard) eller felles eksisterende Regninger-linje. */
  budgetLinkMode?: 'dedicated' | 'shared'
  /** Når `billing === 'yearly'`: måned 1–12 for årlig trekk (mangler = jevn fordeling som før). */
  yearlyChargeMonth1?: number
  /** Kun `billing === 'monthly'` + synk til budsjett: hvilke måneder (1–12) som får planbeløp. Mangler = hele året. */
  budgetStartMonth1?: number
  budgetEndMonth1?: number
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
  /** Ved `budgetLinkMode: 'shared'`: ID til eksisterende Regninger-linje. */
  existingBudgetCategoryId?: string
}

/** Ved oppdatering: `null` fjerner alle planlagte trekk for abonnementet. */
export type UpdateServiceSubscriptionPatch = Partial<
  Omit<ServiceSubscription, 'id' | 'sourceProfileId'>
> & {
  plannedTransactions?: ServiceSubscriptionPlannedTxInput | null
  /** Ved bytte til delt linje: ID til eksisterende Regninger-kategori. */
  existingBudgetCategoryId?: string | null
}

export interface PersonProfile {
  id: string
  name: string
  /** HjemFlyt: barn vs voksen, valgfri emoji for barne-profiler. */
  hjemflyt?: HjemflytProfileMeta
}

/** Snøball: minste restgjeld først. Avalanche: høyeste rente først. */
export type DebtPayoffStrategy = 'snowball' | 'avalanche'

/** Økonomidata per person i husholdningen. */
export interface PersonData {
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  hiddenBudgetLabels: Record<ParentCategory, string[]>
  /** Bruker-overstyring for «budsjett-oppsett»-sjekkliste: år → gruppe → ferdig. */
  budgetSetupOverridesByYear?: Record<string, Partial<Record<ParentCategory, boolean>>>
  savingsGoals: SavingsGoal[]
  debts: Debt[]
  investments: Investment[]
  serviceSubscriptions: ServiceSubscription[]
  /** Ekstra nedbetaling per måned (snøball), kr — per profil */
  snowballExtraMonthly?: number
  /** Rekkefølge for fokuslån; husholdningsaggregat setter ikke feltet */
  debtPayoffStrategy?: DebtPayoffStrategy
  /** smartSpare-planer: inntekt per måned mot mål (per profil). */
  incomeSprintPlans?: IncomeSprintPlan[]
  /** Standard for nye inntektslinjer og fallback for brutto-transaksjoner uten egen prosent. */
  defaultIncomeWithholding?: { apply: boolean; percent: number }
}

export type OnboardingStatus = 'pending' | 'completed' | 'skipped'

export interface OnboardingState {
  status: OnboardingStatus
  finishedAt?: string
}

/** Første inntektslinje i demo-budsjett — brukes i onboarding. */
export const ONBOARDING_MAIN_INCOME_CATEGORY_ID = 'demo-innt-1'

export type LedgerImportRemovalMode = 'full' | 'historyOnly'

export type RemoveLedgerImportRunResult =
  | { ok: false; reason: 'not_found' }
  | { ok: true; mode: 'historyOnly' }
  | {
      ok: true
      mode: 'full'
      transactionsRemoved: number
      removedBudgetAdjustment: boolean
      /** Full sletting fjernet kun historikk (ingen tilknyttede transaksjoner eller budsjett-justering å reversere). */
      orphanFullRemoval: boolean
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
  addProfile: (
    name: string,
    options?: { hjemflyt?: { kind: 'adult' | 'child'; childEmoji?: string | null } },
  ) => { ok: true; id: string } | { ok: false; reason: 'solo_limit' | 'max_profiles' | 'invalid_name' }
  renameProfile: (id: string, name: string) => void
  removeProfile: (id: string) =>
    | { ok: true }
    | { ok: false; reason: 'last_profile' | 'unknown_profile' | 'primary_locked' }

  addTransaction: (t: Transaction) => void
  addTransactions: (transactions: Transaction[]) => void
  removeTransaction: (id: string) => void
  updateTransaction: (
    id: string,
    patch: Partial<
      Pick<
        Transaction,
        | 'date'
        | 'description'
        | 'amount'
        | 'category'
        | 'subcategory'
        | 'type'
        | 'reviewedAt'
        | 'paidAt'
        | 'plannedFollowUp'
        | 'incomeIsNet'
        | 'incomeWithholdingPercent'
      >
    >,
  ) => void
  recalcBudgetSpent: (categoryName: string) => void

  addBudgetCategory: (c: BudgetCategory) => void
  addSharedHouseholdBudgetLine: (
    input: AddSharedHouseholdBudgetLineInput,
  ) => { ok: true } | { ok: false; reason: 'not_family' | 'household_readonly' | 'validation' | 'name_conflict' }
  resplitSharedHouseholdGroupFromTotals: (
    groupId: string,
    total: number[],
    meta: HouseholdSplitMeta,
  ) => { ok: true } | { ok: false; reason: 'not_family' | 'not_found' | 'validation' }
  applySharedHouseholdMonthCellEdit: (categoryId: string, monthIndex: number, newPart: number) => { ok: true } | { ok: false; reason: 'not_family' | 'not_found' | 'not_shared' | 'invalid' }
  removeSharedHouseholdBudgetLineByGroupId: (groupId: string) => void
  updateBudgetCategory: (id: string, data: Partial<BudgetCategory>) => void
  removeBudgetCategory: (id: string) => void
  reorderBudgetCategory: (parent: ParentCategory, id: string, direction: 'up' | 'down') => void

  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  removeCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  hideStandardBudgetLabel: (parent: ParentCategory, name: string) => void
  unhideStandardBudgetLabel: (parent: ParentCategory, name: string) => void
  remapBudgetCategoryName: (
    parent: ParentCategory,
    fromName: string,
    toName: string,
  ) => { ok: true } | { ok: false; reason: CategoryRemapErrorReason }
  /** Felles husholdningslinje: bytt navn på linjen hos alle deltakere (samme groupId). */
  remapSharedHouseholdBudgetLineName: (
    groupId: string,
    parent: ParentCategory,
    toName: string,
  ) => { ok: true } | { ok: false; reason: CategoryRemapErrorReason }

  addSavingsGoal: (g: SavingsGoal) => void
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void
  removeSavingsGoal: (id: string) => void
  updateSavingsGoalForProfile: (profileId: string, goalId: string, data: Partial<SavingsGoal>) => void
  removeSavingsGoalForProfile: (profileId: string, goalId: string) => void
  setIncomeSprintPlans: (plans: IncomeSprintPlan[]) => void
  upsertIncomeSprintPlan: (plan: IncomeSprintPlan) => void
  removeIncomeSprintPlan: (id: string) => void

  addDebt: (d: Debt) => void
  updateDebt: (id: string, data: Partial<Debt>) => void
  removeDebt: (id: string) => void
  setSnowballExtraMonthly: (amount: number) => void
  setDefaultIncomeWithholding: (rule: { apply: boolean; percent: number }) => void
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
  ) =>
    | { ok: true; id: string }
    | { ok: false; reason: 'household_readonly' | 'invalid_budget_category' }
  updateServiceSubscription: (
    id: string,
    patch: UpdateServiceSubscriptionPatch,
  ) => { ok: true } | { ok: false; reason: 'household_readonly' | 'not_found' | 'invalid_budget_category' }
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
  setBudgetSetupOverride: (year: number, group: ParentCategory, done: boolean) => void
  clearBudgetSetupOverrides: (year: number) => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  openOnboardingAgain: () => void

  /** HjemFlyt: husholdningsoppgaver; ingen kobling til transaksjoner. */
  hjemflyt: HjemFlytState
  setHjemflytSettings: (
    patch: Partial<
      Pick<HjemflytSettings, 'showRewardForChildren' | 'weeklyGoalPoints' | 'participantProfileIds'>
    >,
  ) => { ok: true } | { ok: false; reason: 'forbidden' }
  setProfileHjemflytMeta: (
    profileId: string,
    meta: { kind: 'adult' | 'child'; childEmoji?: string | null } | null,
  ) => { ok: true } | { ok: false; reason: 'forbidden' | 'invalid' }
  hjemflytAddTask: (input: {
    title: string
    rewardPoints: number | null
    recurrence: HjemflytRecurrence
    assignMode: HjemflytAssignMode
    assigneeProfileIds: string[]
  }) => { ok: true; id: string } | { ok: false; reason: 'forbidden' | 'invalid' }
  hjemflytUpdateTask: (
    id: string,
    patch: Partial<{
      title: string
      rewardPoints: number | null
      recurrence: HjemflytRecurrence
      assignMode: HjemflytAssignMode
      assigneeProfileIds: string[]
    }>,
  ) => { ok: true } | { ok: false; reason: 'forbidden' | 'not_found' }
  hjemflytRemoveTask: (id: string) => { ok: true } | { ok: false; reason: 'forbidden' | 'not_found' }
  hjemflytCompleteTask: (taskId: string) =>
    | { ok: true }
    | { ok: false; reason: 'forbidden' | 'not_found' | 'not_assigned' | 'already_done' | 'duplicate_pending' }
  hjemflytApproveCompletion: (completionId: string) =>
    | { ok: true }
    | { ok: false; reason: 'forbidden' | 'not_found' | 'bad_status' }
  hjemflytRejectCompletion: (completionId: string) =>
    | { ok: true }
    | { ok: false; reason: 'forbidden' | 'not_found' | 'bad_status' }

  /** Mat og handleliste (intern modul) */
  matHandleliste: MatHandlelisteState
  mhAddMeal: (input: {
    title: string
    description?: string
    defaultServings: number
    ingredients: Omit<MealIngredient, 'id'>[]
    tags?: MealSlotId[]
  }) => { ok: true; id: string } | { ok: false; reason: 'invalid' }
  mhUpdateMeal: (
    id: string,
    patch: Partial<{
      title: string
      description: string | null
      defaultServings: number
      ingredients: MealIngredient[]
      tags: MealSlotId[] | null
    }>,
  ) => { ok: true } | { ok: false; reason: 'not_found' }
  mhRemoveMeal: (id: string) => { ok: true } | { ok: false; reason: 'not_found' }
  mhDuplicateMeal: (id: string) => { ok: true; id: string } | { ok: false; reason: 'not_found' }
  mhSetPlanSlot: (dateKey: string, slot: MealSlotId, planned: PlannedSlot | null) => void
  mhAddManualListItem: (input: {
    name: string
    categoryId?: string
    note?: string
    unitPriceNok?: number | null
    quantity?: number | null
    unit?: IngredientUnit
    unitLabel?: string | null
  }) => void
  mhToggleListItem: (id: string) => void
  mhUpdateListItemCategory: (id: string, categoryId: string) => void
  mhUpdateListItemNote: (id: string, note: string | null) => void
  mhPatchListItem: (
    id: string,
    patch: {
      unitPriceNok?: number | null
      note?: string | null
      categoryId?: string
      quantity?: number | null
      unit?: IngredientUnit
      unitLabel?: string | null
    },
  ) => void
  mhRemoveListItem: (id: string) => void
  mhReorderShoppingCategories: (categoryOrder: string[]) => void
  mhSetStaplesNormalizedKeys: (keys: string[]) => void
  mhAppendMealToList: (input: {
    mealId: string
    effectiveServings: number
    excludeIngredientIds: string[]
  }) => { ok: true } | { ok: false; reason: 'not_found' }
  mhAppendDateRangeToList: (input: {
    fromKey: string
    toKey: string
    excludeNormalizedKeys: string[]
  }) => { ok: true; count: number } | { ok: false; reason: 'invalid_range' }
  mhClearCheckedListItems: () => void
  mhSetGroceryBudgetCategoryName: (name: string | null) => void
  mhSetPlanVisibleSlots: (slots: MealSlotId[]) => void
  mhSetPlanWeekLayout: (mode: PlanWeekLayout) => void

  /** Eksempeldata på tvers av budsjett, transaksjoner, sparing, investeringer og lån; ekte data i `peopleBeforeDemo`. */
  demoDataEnabled: boolean
  peopleBeforeDemo: Record<string, PersonData> | null
  /** Ekte mat/handleliste før demodata (samme mønster som `peopleBeforeDemo`). */
  matHandlelisteBeforeDemo: MatHandlelisteState | null
  setDemoDataEnabled: (enabled: boolean) => void
  /**
   * Vis NOK-beløp med inntil 2 desimaler (øre) i lister, KPI, diagrammer, osv.
   * Påvirker ikke inntasting; standard er av (hele kroner i visning).
   */
  showAmountDecimals: boolean
  setShowAmountDecimals: (show: boolean) => void

  /** Regnskap CSV: lagrede konto → budsjettkategori per kilde (conta, tripletex, …). */
  ledgerAccountMappings: LedgerAccountMappingsState
  /** Siste import-kjøringer (metadata). */
  ledgerImportHistory: LedgerImportRun[]
  setLedgerAccountMapping: (
    sourceId: LedgerSourceId,
    accountCode: string,
    rule: LedgerAccountMappingRule | null,
  ) => void
  appendLedgerImportRun: (run: LedgerImportRun) => void
  /** Én atomisk kjøring: valgfritt budsjett-tillegg, deretter transaksjoner og historikk. */
  addLedgerImportRunWithTransactions: (run: LedgerImportRun, transactions: Transaction[]) => void
  /**
   * `full`: fjern historikk + transaksjoner med ledgerImportRunId + eventuelt budsjett-justering.
   * `historyOnly`: fjern kun historikkposten; transaksjoner og budsjett belastes ikke herfra.
   */
  removeLedgerImportRun: (runId: string, mode: LedgerImportRemovalMode) => RemoveLedgerImportRunResult
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
  | 'hjemflyt'
  | 'matHandleliste'
  | 'demoDataEnabled'
  | 'peopleBeforeDemo'
  | 'matHandlelisteBeforeDemo'
  | 'showAmountDecimals'
  | 'ledgerAccountMappings'
  | 'ledgerImportHistory'
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
    hjemflyt: createEmptyHjemFlytState(),
    matHandleliste: createEmptyMatHandlelisteState(),
    demoDataEnabled: false,
    peopleBeforeDemo: null,
    matHandlelisteBeforeDemo: null,
    showAmountDecimals: false,
    deliveredInsightIds: [],
    dismissedDuplicateSubscriptionPresetKeys: [],
    ledgerAccountMappings: {},
    ledgerImportHistory: [],
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
    hjemflyt: state.hjemflyt,
    matHandleliste: state.matHandleliste,
    demoDataEnabled: state.demoDataEnabled,
    peopleBeforeDemo: state.peopleBeforeDemo,
    matHandlelisteBeforeDemo: state.matHandlelisteBeforeDemo,
    showAmountDecimals: state.showAmountDecimals,
    deliveredInsightIds: state.deliveredInsightIds,
    dismissedDuplicateSubscriptionPresetKeys: state.dismissedDuplicateSubscriptionPresetKeys,
    ledgerAccountMappings: state.ledgerAccountMappings,
    ledgerImportHistory: state.ledgerImportHistory,
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
  const def = person.defaultIncomeWithholding
  const budgetCategories = person.budgetCategories.map((c) => ({
    ...c,
    spent: sumTxForCategoryInYear(person.transactions, c.name, c.type, year, profileId, def),
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
    const person = normalizePersonIncomeSprintPlans(base.people[pr.id]!)
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

  /**
   * Inkonsistent lagring (eldre klient / manuell JSON): flere profiler krever Familie-modus i appen.
   * Uten dette mangler «Husholdning», og enkelte sider (f.eks. /konto/profiler) oppfører seg feil.
   */
  if (base.profiles.length >= 2 && base.subscriptionPlan === 'solo') {
    base.subscriptionPlan = 'family'
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

  const rawHf = (p as Partial<AppState>).hjemflyt
  base.hjemflyt = rawHf != null ? normalizeHjemFlytState(rawHf) : createEmptyHjemFlytState()

  const rawMh = (p as Partial<AppState>).matHandleliste
  base.matHandleliste =
    rawMh != null ? normalizeMatHandlelisteState(rawMh) : createEmptyMatHandlelisteState()

  if (base.matHandlelisteBeforeDemo === undefined) base.matHandlelisteBeforeDemo = null
  const rawMhBd = (p as Partial<AppState>).matHandlelisteBeforeDemo
  if (rawMhBd != null && typeof rawMhBd === 'object' && !Array.isArray(rawMhBd)) {
    base.matHandlelisteBeforeDemo = normalizeMatHandlelisteState(rawMhBd)
  } else if (rawMhBd != null) {
    base.matHandlelisteBeforeDemo = null
  }

  base.profiles = base.profiles.map((pr) => {
    const h = normalizeHjemflytProfileMeta(pr.id, pr.hjemflyt)
    if (h) return { ...pr, hjemflyt: h }
    const { hjemflyt: _drop, ...rest } = pr
    return { ...rest }
  })

  if (typeof base.demoDataEnabled !== 'boolean') base.demoDataEnabled = false
  if (typeof base.showAmountDecimals !== 'boolean') base.showAmountDecimals = false
  if (!base.ledgerAccountMappings || typeof base.ledgerAccountMappings !== 'object') {
    base.ledgerAccountMappings = {}
  }
  if (!Array.isArray(base.ledgerImportHistory)) base.ledgerImportHistory = []
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

  if (!base.demoDataEnabled && matSnapshotContainsDemoMarkers(base.matHandleliste)) {
    base.matHandleliste = createEmptyMatHandlelisteState()
    base.matHandlelisteBeforeDemo = null
  }

  /**
   * Demodata var ofte slått på før «mat og handleliste» ble persistert — da ligger matHandleliste tom i lagringen.
   * Fyll eksempel innhold når demo er aktiv og brukeren ikke har noe i modulen ennå.
   */
  if (
    base.demoDataEnabled &&
    !matSnapshotContainsDemoMarkers(base.matHandleliste) &&
    isMatHandlelisteShellEmpty(base.matHandleliste)
  ) {
    base.matHandleliste = createDemoMatHandlelisteState(base.activeProfileId, new Date())
  }

  delete (base as unknown as Record<string, unknown>).earlyStepsChecklist

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
    budgetSetupOverridesByYear: {},
    savingsGoals: defaultGoals,
    debts: defaultDebts,
    investments: defaultInvestments,
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
    incomeSprintPlans: [],
  }
}

export function createEmptyPersonData(): PersonData {
  return {
    transactions: [],
    budgetCategories: [],
    ...emptyLabelLists(),
    budgetSetupOverridesByYear: {},
    savingsGoals: [],
    debts: [],
    investments: [],
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
    incomeSprintPlans: [],
  }
}

/** Migrerer `incomeSprintPlan` → `incomeSprintPlans` og sikrer id per plan. */
function normalizePersonIncomeSprintPlans(person: PersonData): PersonData {
  const anyP = person as PersonData & { incomeSprintPlan?: IncomeSprintPlan | null }
  const legacy = anyP.incomeSprintPlan
  let plans = Array.isArray(anyP.incomeSprintPlans) ? [...anyP.incomeSprintPlans] : []
  if (legacy != null && plans.length === 0) {
    plans = [reconcileIncomeSprintPlan(ensureIncomeSprintPlanId(legacy as IncomeSprintPlan))]
  }
  plans = plans.map((p) => reconcileIncomeSprintPlan(ensureIncomeSprintPlanId(p)))
  const { incomeSprintPlan: _drop, ...rest } = anyP
  return { ...rest, incomeSprintPlans: plans }
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
      if (demoExpenseIndexIsSubscription(ei)) continue
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
  const subAmounts = getDemoSubscriptionMonthlyAmountsForVariant(0)
  txs.push(...buildDemoSubscriptionPlannedTransactionsForYear(year, profileId, subAmounts))
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
  const subAmounts = getDemoSubscriptionMonthlyAmountsForVariant(v)
  let person: PersonData = {
    ...base,
    transactions,
    serviceSubscriptions: buildDemoServiceSubscriptions(subAmounts),
  }
  person = recalcPersonBudgetSpentForYear(person, profileId, budgetYear)
  person = syncLinkedSavingsGoalsCurrent(person, profileId)
  return person
}

export { getDemoVariantIndexForProfile }

function sumMonthlyArrays(a: number[], b: number[]): number[] {
  return Array.from({ length: 12 }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

function syntheticHouseholdCategoryId(key: string): string {
  return `hh-${key.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g, '-')}`
}

/** Inntektslinjer: `budgeted` på aggregat er sum av effektiv netto per profil; trekk-metadata fjernes. */
function mergeBudgetCategoryAggregatePair(
  existing: BudgetCategory | undefined,
  incoming: BudgetCategory,
  key: string,
): BudgetCategory {
  const isIncomeLine = incoming.parentCategory === 'inntekter' && incoming.type === 'income'
  const hid = syntheticHouseholdCategoryId(key)

  if (!existing) {
    if (isIncomeLine) {
      return {
        ...incoming,
        id: hid,
        spent: incoming.spent,
        budgeted: Array.from({ length: 12 }, (_, i) => effectiveBudgetedIncomeMonth(incoming, i)),
        incomeWithholding: undefined,
      }
    }
    return {
      ...incoming,
      id: hid,
      spent: incoming.spent,
      budgeted: [...incoming.budgeted],
      householdSplit: incoming.householdSplit,
    }
  }

  if (isIncomeLine) {
    return {
      ...existing,
      id: hid,
      spent: existing.spent + incoming.spent,
      budgeted: Array.from({ length: 12 }, (_, i) => {
        return (existing.budgeted[i] ?? 0) + effectiveBudgetedIncomeMonth(incoming, i)
      }),
      incomeWithholding: undefined,
    }
  }

  return {
    ...existing,
    id: hid,
    spent: existing.spent + incoming.spent,
    budgeted: sumMonthlyArrays(existing.budgeted, incoming.budgeted),
    householdSplit: pickHouseholdSplitForAggregate(existing.householdSplit, incoming.householdSplit),
  }
}

/** Fjerner én budsjettlinje fra en persons data (koblinger, gjeld, trekk). */
export function removeBudgetCategoryFromPersonData(
  d: PersonData,
  categoryId: string,
  profileId: string,
): PersonData {
  const nextCats = d.budgetCategories.filter((c) => c.id !== categoryId)
  const nextGoals = d.savingsGoals.map((g) =>
    g.linkedBudgetCategoryId === categoryId ? { ...g, linkedBudgetCategoryId: undefined, baselineAmount: undefined } : g,
  )
  const nextSubs = (d.serviceSubscriptions ?? []).map((s) =>
    s.linkedBudgetCategoryId === categoryId
      ? { ...s, linkedBudgetCategoryId: null, syncToBudget: false, budgetLinkMode: undefined }
      : s,
  )
  let nextDebts = d.debts
  let nextTx = d.transactions
  for (const debt of d.debts) {
    if (debt.linkedBudgetCategoryId !== categoryId) continue
    nextDebts = nextDebts.map((x) =>
      x.id === debt.id
        ? {
            ...x,
            linkedBudgetCategoryId: null,
            syncToBudget: false,
            syncPlannedTransactions: false,
          }
        : x,
    )
    nextTx = stripAllLinkedDebtTransactions(nextTx, debt.id)
  }
  return syncLinkedSavingsGoalsCurrent(
    {
      ...d,
      budgetCategories: nextCats,
      savingsGoals: nextGoals,
      serviceSubscriptions: nextSubs,
      debts: nextDebts,
      transactions: nextTx,
    },
    profileId,
  )
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
      budgetKeyToCat.set(key, mergeBudgetCategoryAggregatePair(existing, c, key))
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
      budgetKeyToCat.set(key, mergeBudgetCategoryAggregatePair(existing, c, key))
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
    spent: sumTxForCategoryInYearAllProfiles(txs, cat.name, cat.type, budgetYear, people),
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
    incomeSprintPlans: [],
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

function collectSharedGroupTotals(people: Record<string, PersonData>, groupId: string): {
  meta: HouseholdSplitMeta
  total: number[]
} | null {
  const m0 = (() => {
    for (const pid of Object.keys(people)) {
      const c = people[pid]?.budgetCategories.find((x) => x.householdSplit?.groupId === groupId)
      if (c?.householdSplit) return c
    }
    return null
  })()
  if (!m0?.householdSplit) return null
  const meta = m0.householdSplit
  const total: number[] = Array(12).fill(0)
  for (let m = 0; m < 12; m++) {
    for (const pid of meta.participantProfileIds) {
      const c = people[pid]?.budgetCategories.find((x) => x.householdSplit?.groupId === groupId)
      if (c) total[m]! += c.budgeted[m] ?? 0
    }
  }
  return { meta, total }
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
        hjemflyt: createEmptyHjemFlytState(),
        matHandleliste: createEmptyMatHandlelisteState(),
        demoDataEnabled: false,
        peopleBeforeDemo: null as Record<string, PersonData> | null,
        matHandlelisteBeforeDemo: null as MatHandlelisteState | null,
        showAmountDecimals: false,
        ledgerAccountMappings: {} as LedgerAccountMappingsState,
        ledgerImportHistory: [] as LedgerImportRun[],

        setLedgerAccountMapping: (sourceId, accountCode, rule) => {
          const code = normalizeLedgerAccountCode(accountCode)
          if (!code) return
          set((s) => {
            const next: LedgerAccountMappingsState = { ...s.ledgerAccountMappings }
            const inner = { ...(next[sourceId] ?? {}) }
            if (rule == null) {
              delete inner[code]
            } else {
              const n = rule.categoryName.trim()
              if (!n) {
                delete inner[code]
              } else {
                inner[code] = { categoryName: n }
              }
            }
            if (Object.keys(inner).length === 0) {
              delete next[sourceId]
            } else {
              next[sourceId] = inner
            }
            return { ledgerAccountMappings: next }
          })
        },

        appendLedgerImportRun: (run) => {
          set((s) => ({
            ledgerImportHistory: [run, ...s.ledgerImportHistory].slice(0, LEDGER_IMPORT_HISTORY_MAX),
          }))
        },

        addLedgerImportRunWithTransactions: (run, incoming) => {
          set((s) => {
            const historySlice = [run, ...s.ledgerImportHistory].slice(0, LEDGER_IMPORT_HISTORY_MAX)

            let nextPeople = { ...s.people }
            const adj = run.budgetAdjustment
            if (adj?.entries?.length && adj.profileId === run.profileId) {
              const person = nextPeople[run.profileId]
              if (person) {
                const mergedForApply = mergeBudgetCategoriesWithAdjustmentBackfill(
                  person.budgetCategories,
                  adj.entries,
                  adj.backfillCategories,
                )
                nextPeople = {
                  ...nextPeople,
                  [run.profileId]: {
                    ...person,
                    budgetCategories: applyLedgerBudgetAdjustmentToCategories(mergedForApply, adj.entries),
                  },
                }
              }
            }

            if (!incoming.length) {
              return { people: nextPeople, ledgerImportHistory: historySlice }
            }

            const groups = new Map<string, Transaction[]>()
            for (const t of incoming) {
              const pid = resolveTransactionOwnerProfileId(s, t.profileId)
              const tx: Transaction = { ...t, profileId: pid }
              const arr = groups.get(pid) ?? []
              arr.push(tx)
              groups.set(pid, arr)
            }
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
            return { people: nextPeople, ledgerImportHistory: historySlice }
          })
          get().syncInsightNotifications()
        },

        removeLedgerImportRun: (runId, mode) => {
          let result: RemoveLedgerImportRunResult = { ok: false, reason: 'not_found' }
          set((s) => {
            const run = s.ledgerImportHistory.find((r) => r.id === runId)
            if (!run) return s

            const nextHistory = s.ledgerImportHistory.filter((r) => r.id !== runId)

            if (mode === 'historyOnly') {
              result = { ok: true, mode: 'historyOnly' }
              return { ledgerImportHistory: nextHistory }
            }

            const person = s.people[run.profileId]
            if (!person) {
              result = {
                ok: true,
                mode: 'full',
                transactionsRemoved: 0,
                removedBudgetAdjustment: false,
                orphanFullRemoval: true,
              }
              return { ledgerImportHistory: nextHistory }
            }

            let cats = person.budgetCategories
            const adj = run.budgetAdjustment
            if (adj?.entries?.length && adj.profileId === run.profileId) {
              cats = subtractLedgerBudgetAdjustmentFromCategories(cats, adj.entries)
            }

            let merged: PersonData = { ...person, budgetCategories: cats }
            const nextTx = merged.transactions.filter((t) => t.ledgerImportRunId !== runId)
            const txsChanged = nextTx.length !== merged.transactions.length
            const budgetChanged = !!(adj?.entries?.length && adj.profileId === run.profileId)
            const txsRemoved = merged.transactions.length - nextTx.length

            if (!txsChanged && !budgetChanged) {
              result = {
                ok: true,
                mode: 'full',
                transactionsRemoved: 0,
                removedBudgetAdjustment: false,
                orphanFullRemoval: true,
              }
              return { ledgerImportHistory: nextHistory }
            }

            merged = syncLinkedSavingsGoalsCurrent({ ...merged, transactions: nextTx }, run.profileId)
            merged = recalcPersonBudgetSpentForYear(merged, run.profileId, s.budgetYear)
            result = {
              ok: true,
              mode: 'full',
              transactionsRemoved: txsRemoved,
              removedBudgetAdjustment: budgetChanged,
              orphanFullRemoval: false,
            }
            return {
              people: {
                ...s.people,
                [run.profileId]: merged,
              },
              ledgerImportHistory: nextHistory,
            }
          })
          get().syncInsightNotifications()
          return result
        },

        setShowAmountDecimals: (show) => {
          set((s) => (show === s.showAmountDecimals ? s : { showAmountDecimals: show }))
        },

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
              let mhBackup: MatHandlelisteState
              try {
                mhBackup = JSON.parse(JSON.stringify(s.matHandleliste)) as MatHandlelisteState
              } catch {
                return s
              }
              if (matSnapshotContainsDemoMarkers(mhBackup)) {
                mhBackup = createEmptyMatHandlelisteState()
              }
              const nextPeople: Record<string, PersonData> = {}
              for (let i = 0; i < s.profiles.length; i++) {
                const pr = s.profiles[i]!
                const vi = getDemoVariantIndexForProfile(s.subscriptionPlan, s.profiles.length, i)
                nextPeople[pr.id] = createDemoPersonDataForProfile(pr.id, s.budgetYear, vi)
              }
              const nextMat = createDemoMatHandlelisteState(s.activeProfileId, new Date())
              return {
                demoDataEnabled: true,
                peopleBeforeDemo: backup,
                people: nextPeople,
                matHandlelisteBeforeDemo: normalizeMatHandlelisteState(mhBackup),
                matHandleliste: nextMat,
              }
            }
            const restored = s.peopleBeforeDemo
            const restoredIsInvalidDemoCopy =
              restored != null && peopleSnapshotContainsDemoMarkers(restored)
            const restoredMat = s.matHandlelisteBeforeDemo
            const restoredMatIsInvalid =
              restoredMat != null && matSnapshotContainsDemoMarkers(restoredMat)
            if (!restored || restoredIsInvalidDemoCopy) {
              const cleared: Record<string, PersonData> = {}
              for (const pr of s.profiles) {
                cleared[pr.id] = createEmptyPersonData()
              }
              return {
                demoDataEnabled: false,
                peopleBeforeDemo: null,
                people: cleared,
                matHandlelisteBeforeDemo: null,
                matHandleliste:
                  !restoredMat || restoredMatIsInvalid
                    ? createEmptyMatHandlelisteState()
                    : normalizeMatHandlelisteState(restoredMat),
              }
            }
            return {
              demoDataEnabled: false,
              peopleBeforeDemo: null,
              people: restored,
              matHandlelisteBeforeDemo: null,
              matHandleliste:
                !restoredMat || restoredMatIsInvalid
                  ? createEmptyMatHandlelisteState()
                  : normalizeMatHandlelisteState(restoredMat),
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
            const base = s.notifications.filter((n) => n.id !== PLANNED_OVERDUE_NOTIFICATION_ID)
            const existingIds = new Set(base.map((n) => n.id))
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

            const householdBlocked =
              s.financeScope === 'household' &&
              s.subscriptionPlan === 'family' &&
              s.profiles.length >= 2
            const person = s.people[s.activeProfileId]
            const txList = person?.transactions ?? []
            const showDec = s.showAmountDecimals
            const formatNok = (n: number) => formatNokCurrencyDisplay(n, showDec)
            const overdueContent =
              !householdBlocked && person ? buildPlannedOverdueNotification(txList, undefined, formatNok) : null
            const overdueSig = !householdBlocked && person ? plannedOverdueContentSignature(txList) : 'none'
            const prevPlanned = s.notifications.find((n) => n.id === PLANNED_OVERDUE_NOTIFICATION_ID)

            let merged: AppNotification[] = [...toAdd, ...base]
            if (overdueContent) {
              const signatureMatch =
                prevPlanned != null &&
                prevPlanned.contentSignature != null &&
                prevPlanned.contentSignature === overdueSig
              const legacyBodyMatch =
                prevPlanned != null &&
                prevPlanned.contentSignature == null &&
                prevPlanned.body === overdueContent.body
              const unchanged =
                prevPlanned != null &&
                prevPlanned.title === overdueContent.title &&
                (signatureMatch || legacyBodyMatch)
              merged = [
                {
                  id: PLANNED_OVERDUE_NOTIFICATION_ID,
                  title: overdueContent.title,
                  body: overdueContent.body,
                  kind: 'insight',
                  createdAt: prevPlanned?.createdAt ?? new Date().toISOString(),
                  read: unchanged && prevPlanned ? prevPlanned.read : false,
                  contentSignature: overdueSig,
                  actionHref: '/transaksjoner/kommende',
                  actionLabel: 'Åpne Kommende',
                },
                ...merged,
              ]
            }

            if (
              toAdd.length === 0 &&
              newDeliveredIds.length === 0 &&
              !overdueContent &&
              !prevPlanned
            ) {
              return s
            }

            return {
              notifications: merged,
              deliveredInsightIds:
                newDeliveredIds.length > 0
                  ? [...(s.deliveredInsightIds ?? []), ...newDeliveredIds]
                  : (s.deliveredInsightIds ?? []),
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
          let people = s.people
          if (!s.people[id]) {
            people = { ...s.people, [id]: createEmptyPersonData() }
          }
          set({ activeProfileId: id, financeScope: 'profile', people })
        },

        setFinanceScope: (scope) => {
          const s = get()
          if (scope === 'household') {
            if (s.subscriptionPlan !== 'family' || s.profiles.length < 2) return
          }
          set({ financeScope: scope })
        },

        addProfile: (name, options) => {
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
          let nextRow: PersonProfile = { id, name: trimmed }
          if (options?.hjemflyt) {
            const m = normalizeHjemflytProfileMeta(id, {
              kind: options.hjemflyt.kind,
              childEmoji: options.hjemflyt.childEmoji ?? undefined,
            })
            if (m) nextRow = { ...nextRow, hjemflyt: m }
          }
          const nextProfiles = [...s.profiles, nextRow]
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

        removeProfile: (id) => {
          const s = get()
          if (id === DEFAULT_PROFILE_ID) return { ok: false as const, reason: 'primary_locked' }
          if (!s.profiles.some((p) => p.id === id)) return { ok: false as const, reason: 'unknown_profile' }
          if (s.profiles.length <= 1) return { ok: false as const, reason: 'last_profile' }

          const nextProfiles = s.profiles.filter((p) => p.id !== id)
          const { [id]: _removed, ...restPeople } = s.people

          let nextArchive: ArchivedBudgetsByYear = { ...s.archivedBudgetsByYear }
          for (const yearKey of Object.keys(nextArchive)) {
            const inner = nextArchive[yearKey]
            if (!inner || typeof inner !== 'object' || !Object.prototype.hasOwnProperty.call(inner, id)) continue
            const { [id]: _a, ...restInner } = inner as Record<string, BudgetCategory[]>
            nextArchive = { ...nextArchive, [yearKey]: restInner }
          }

          let nextPeopleBeforeDemo: Record<string, PersonData> | null = s.peopleBeforeDemo
          if (nextPeopleBeforeDemo && typeof nextPeopleBeforeDemo === 'object' && id in nextPeopleBeforeDemo) {
            const { [id]: _b, ...restPbd } = nextPeopleBeforeDemo
            nextPeopleBeforeDemo = Object.keys(restPbd).length > 0 ? restPbd : null
          }

          let activeProfileId = s.activeProfileId
          if (activeProfileId === id) {
            activeProfileId = nextProfiles[0]?.id ?? DEFAULT_PROFILE_ID
          }

          let financeScope: FinanceScope = s.financeScope
          if (financeScope === 'household' && nextProfiles.length < 2) {
            financeScope = 'profile'
          }

          const h = s.hjemflyt
          const hfPointBalances = { ...h.pointBalances }
          delete hfPointBalances[id]
          const hfTasks = h.tasks.map((t) => ({
            ...t,
            assigneeProfileIds: t.assigneeProfileIds.filter((x) => x !== id),
          }))

          set({
            profiles: nextProfiles,
            people: restPeople,
            archivedBudgetsByYear: nextArchive,
            peopleBeforeDemo: nextPeopleBeforeDemo,
            activeProfileId,
            financeScope,
            hjemflyt: { ...h, pointBalances: hfPointBalances, tasks: hfTasks },
          })
          return { ok: true as const }
        },

        setHjemflytSettings: (patch) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) {
            return { ok: false as const, reason: 'forbidden' as const }
          }
          set((st) => ({
            hjemflyt: {
              ...st.hjemflyt,
              settings: { ...st.hjemflyt.settings, ...patch },
            },
          }))
          return { ok: true as const }
        },

        setProfileHjemflytMeta: (profileId, meta) => {
          const s = get()
          if (s.activeProfileId !== DEFAULT_PROFILE_ID) return { ok: false as const, reason: 'forbidden' }
          if (profileId === DEFAULT_PROFILE_ID) {
            return { ok: true as const }
          }
          if (meta === null) {
            set((st) => ({
              profiles: st.profiles.map((p) =>
                p.id === profileId
                  ? (() => {
                      const { hjemflyt: _h, ...rest } = p
                      return { ...rest }
                    })()
                  : p,
              ),
            }))
            return { ok: true as const }
          }
          const m = normalizeHjemflytProfileMeta(profileId, { kind: meta.kind, childEmoji: meta.childEmoji ?? undefined })
          if (!m) return { ok: false as const, reason: 'invalid' }
          set((st) => ({
            profiles: st.profiles.map((p) => (p.id === profileId ? { ...p, hjemflyt: m } : p)),
          }))
          return { ok: true as const }
        },

        hjemflytAddTask: (input) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) return { ok: false as const, reason: 'forbidden' }
          const t = input.title.trim()
          if (!t) return { ok: false as const, reason: 'invalid' }
          const id = generateId()
          const now = new Date().toISOString()
          let reward: number | null = null
          if (input.rewardPoints != null) {
            const v = input.rewardPoints
            if (Number.isFinite(v) && v > 0) reward = Math.min(1_000_000, Math.max(0, Math.round(v)))
            else if (v === 0) reward = 0
            else reward = null
          }
          const allIds = s.profiles.map((p) => p.id)
          const hfIds = effectiveHjemflytProfileIds(allIds, s.hjemflyt.settings.participantProfileIds)
          const assigneeProfileIds = input.assigneeProfileIds.filter((x) => allIds.includes(x) && hfIds.includes(x))
          const task: import('@/features/hjemflyt/types').HjemflytTask = {
            id,
            title: t.slice(0, 200),
            rewardPoints: reward,
            recurrence: input.recurrence,
            assignMode: input.assignMode,
            assigneeProfileIds,
            roundRobinIndex: 0,
            lastCompletedAt: null,
            lastCompletedPeriodKey: null,
            createdAt: now,
            createdByProfileId: s.activeProfileId,
          }
          set((st) => ({ hjemflyt: { ...st.hjemflyt, tasks: [...st.hjemflyt.tasks, task] } }))
          return { ok: true as const, id }
        },

        hjemflytUpdateTask: (taskId, patch) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) return { ok: false as const, reason: 'forbidden' }
          const i = s.hjemflyt.tasks.findIndex((x) => x.id === taskId)
          if (i < 0) return { ok: false as const, reason: 'not_found' }
          set((st) => {
            const allIds = st.profiles.map((p) => p.id)
            const hfIds = effectiveHjemflytProfileIds(allIds, st.hjemflyt.settings.participantProfileIds)
            const list = st.hjemflyt.tasks
            const prev = list[i]!
            const next: typeof prev = { ...prev }
            if (patch.title != null) {
              const x = patch.title.trim()
              if (x) next.title = x.slice(0, 200)
            }
            if (patch.rewardPoints !== undefined) {
              if (patch.rewardPoints == null) next.rewardPoints = null
              else {
                const v = patch.rewardPoints
                if (Number.isFinite(v) && v > 0) next.rewardPoints = Math.min(1_000_000, Math.round(v))
                else if (v === 0) next.rewardPoints = 0
                else next.rewardPoints = null
              }
            }
            if (patch.recurrence != null) next.recurrence = patch.recurrence
            if (patch.assignMode != null) next.assignMode = patch.assignMode
            if (patch.assigneeProfileIds != null) {
              next.assigneeProfileIds = patch.assigneeProfileIds.filter((x) => allIds.includes(x) && hfIds.includes(x))
            }
            const nextList = [...list]
            nextList[i] = next
            return { hjemflyt: { ...st.hjemflyt, tasks: nextList } }
          })
          return { ok: true as const }
        },

        hjemflytRemoveTask: (taskId) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) return { ok: false as const, reason: 'forbidden' }
          if (!s.hjemflyt.tasks.some((t) => t.id === taskId)) return { ok: false as const, reason: 'not_found' }
          set((st) => ({
            hjemflyt: {
              ...st.hjemflyt,
              tasks: st.hjemflyt.tasks.filter((t) => t.id !== taskId),
              completions: st.hjemflyt.completions.filter((c) => c.taskId !== taskId),
            },
          }))
          return { ok: true as const }
        },

        hjemflytCompleteTask: (taskId) => {
          const s = get()
          const h = s.hjemflyt
          const task = h.tasks.find((t) => t.id === taskId)
          if (!task) return { ok: false as const, reason: 'not_found' }
          const allIds = s.profiles.map((p) => p.id)
          const hfIds = effectiveHjemflytProfileIds(allIds, h.settings.participantProfileIds)
          if (!canProfileActOnTask(task, s.activeProfileId, hfIds)) {
            return { ok: false as const, reason: 'not_assigned' }
          }
          if (task.recurrence.type === 'none' && task.lastCompletedAt != null) {
            return { ok: false as const, reason: 'already_done' }
          }
          const at = new Date()
          const periodKey = periodKeyForRecurrence(task.recurrence, at, task.id)
          if (h.completions.some((c) => c.taskId === taskId && c.status === 'pending_approval')) {
            return { ok: false as const, reason: 'duplicate_pending' }
          }
          if (
            h.completions.some(
              (c) =>
                c.taskId === taskId &&
                c.periodKey === periodKey &&
                (c.status === 'approved' || c.status === 'done'),
            )
          ) {
            return { ok: false as const, reason: 'already_done' }
          }
          const rewardPoints = task.rewardPoints
          const hasReward = rewardPoints != null && rewardPoints > 0
          const completionId = generateId()
          if (hasReward) {
            const completion: import('@/features/hjemflyt/types').HjemflytCompletion = {
              id: completionId,
              taskId,
              completedAt: at.toISOString(),
              completedByProfileId: s.activeProfileId,
              status: 'pending_approval',
              periodKey,
              rewardPointsSnapshot: rewardPoints,
            }
            set((st) => ({
              hjemflyt: { ...st.hjemflyt, completions: [...st.hjemflyt.completions, completion] },
            }))
            return { ok: true as const }
          }
          const completion: import('@/features/hjemflyt/types').HjemflytCompletion = {
            id: completionId,
            taskId,
            completedAt: at.toISOString(),
            completedByProfileId: s.activeProfileId,
            status: 'approved',
            periodKey,
            rewardPointsSnapshot: null,
          }
          set((st) => {
            const th = st.hjemflyt
            const ti = th.tasks.findIndex((x) => x.id === taskId)
            if (ti < 0) return st
            const t = th.tasks[ti]!
            const effIds = effectiveHjemflytProfileIds(
              st.profiles.map((p) => p.id),
              th.settings.participantProfileIds,
            )
            const pl = poolForTask(t, effIds)
            let roundRobinIndex = t.roundRobinIndex
            if (t.assignMode === 'round_robin' && pl.length > 0) {
              roundRobinIndex = nextRoundRobinIndex(t, pl)
            }
            const nextTask: typeof t = {
              ...t,
              lastCompletedAt: at.toISOString(),
              lastCompletedPeriodKey: periodKey,
              roundRobinIndex,
            }
            const ntasks = [...th.tasks]
            ntasks[ti] = nextTask
            return {
              hjemflyt: {
                ...th,
                tasks: ntasks,
                completions: [...th.completions, { ...completion, status: 'done' as const }],
              },
            }
          })
          return { ok: true as const }
        },

        hjemflytApproveCompletion: (completionId) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) return { ok: false as const, reason: 'forbidden' }
          const c = s.hjemflyt.completions.find((x) => x.id === completionId)
          if (!c) return { ok: false as const, reason: 'not_found' }
          if (c.status !== 'pending_approval') return { ok: false as const, reason: 'bad_status' }
          const at = new Date()
          set((st) => {
            const h = st.hjemflyt
            const effIds = effectiveHjemflytProfileIds(
              st.profiles.map((p) => p.id),
              h.settings.participantProfileIds,
            )
            const comp = h.completions.map((x) =>
              x.id === completionId
                ? { ...x, status: 'approved' as const, completedAt: at.toISOString() }
                : x,
            )
            const task = h.tasks.find((t) => t.id === c.taskId)
            if (!task) return { hjemflyt: { ...h, completions: comp } }
            const ti = h.tasks.findIndex((x) => x.id === c.taskId)
            const pl = poolForTask(task, effIds)
            let roundRobinIndex = task.roundRobinIndex
            if (task.assignMode === 'round_robin' && pl.length > 0) {
              roundRobinIndex = nextRoundRobinIndex(task, pl)
            }
            const periodKey = c.periodKey
            const nextTask = {
              ...task,
              lastCompletedAt: at.toISOString(),
              lastCompletedPeriodKey: periodKey,
              roundRobinIndex,
            }
            const ntasks = [...h.tasks]
            ntasks[ti] = nextTask
            const reward = c.rewardPointsSnapshot ?? 0
            const pointBalances = { ...h.pointBalances }
            if (reward > 0) {
              const pid = c.completedByProfileId
              pointBalances[pid] = (pointBalances[pid] ?? 0) + reward
            }
            return { hjemflyt: { ...h, tasks: ntasks, completions: comp, pointBalances } }
          })
          return { ok: true as const }
        },

        hjemflytRejectCompletion: (completionId) => {
          const s = get()
          if (!canAdministerHjemflyt(s.activeProfileId, s.profiles)) return { ok: false as const, reason: 'forbidden' }
          const c = s.hjemflyt.completions.find((x) => x.id === completionId)
          if (!c) return { ok: false as const, reason: 'not_found' }
          if (c.status !== 'pending_approval') return { ok: false as const, reason: 'bad_status' }
          set((st) => ({
            hjemflyt: {
              ...st.hjemflyt,
              completions: st.hjemflyt.completions.map((x) =>
                x.id === completionId ? { ...x, status: 'rejected' as const } : x,
              ),
            },
          }))
          return { ok: true as const }
        },

        addTransaction: (t) => {
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
          })
          get().syncInsightNotifications()
        },

        addTransactions: (incoming) => {
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
          })
          get().syncInsightNotifications()
        },

        removeTransaction: (id) => {
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
          })
          get().syncInsightNotifications()
        },

        updateTransaction: (id, patch) => {
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
                  const sub = patch.subcategory.trim()
                  if (sub) merged = { ...merged, subcategory: sub }
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
          })
          get().syncInsightNotifications()
        },

        recalcBudgetSpent: (categoryName) =>
          patchActive((d) => {
            const pid = get().activeProfileId
            const y = get().budgetYear
            const cat = d.budgetCategories.find((c) => c.name === categoryName)
            if (!cat) return d
            const spent = sumTxForCategoryInYear(
              d.transactions,
              categoryName,
              cat.type,
              y,
              pid,
              d.defaultIncomeWithholding,
            )
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
              let merged: PersonData = { ...p, budgetCategories: newCats }
              merged = normalizeDebtLinkedBudgetCategoriesToFullYear(merged, nextYear)
              merged = appendDebtPlannedTransactionsForBudgetYear(merged, nextYear, pr.id)
              nextPeople[pr.id] = recalcPersonBudgetSpentForYear(
                syncLinkedSavingsGoalsCurrent(merged, pr.id),
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

        setBudgetSetupOverride: (year, group, done) => {
          const y = String(Math.floor(year))
          patchActive((d) => {
            const prev = d.budgetSetupOverridesByYear ?? {}
            const prevForYear = prev[y] ?? {}
            const nextForYear: Partial<Record<ParentCategory, boolean>> = { ...prevForYear, [group]: done }
            return {
              ...d,
              budgetSetupOverridesByYear: {
                ...prev,
                [y]: nextForYear,
              },
            }
          })
        },

        clearBudgetSetupOverrides: (year) => {
          const y = String(Math.floor(year))
          patchActive((d) => {
            const prev = d.budgetSetupOverridesByYear ?? {}
            if (!prev[y]) return d
            const { [y]: _, ...rest } = prev
            return { ...d, budgetSetupOverridesByYear: rest }
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

        addSharedHouseholdBudgetLine: (input) => {
          const s0 = get()
          if (s0.financeScope === 'household') {
            return { ok: false, reason: 'household_readonly' } as const
          }
          if (s0.subscriptionPlan !== 'family' || s0.profiles.length < 2) {
            return { ok: false, reason: 'not_family' } as const
          }
          if (input.parentCategory === 'inntekter') {
            return { ok: false, reason: 'validation' } as const
          }
          const name = input.name.trim()
          if (!name) {
            return { ok: false, reason: 'validation' } as const
          }
          const pids = [...new Set(input.participantProfileIds)]
          pids.sort()
          if (pids.length < 2) {
            return { ok: false, reason: 'validation' } as const
          }
          for (const id of pids) {
            if (!s0.profiles.some((p) => p.id === id)) {
              return { ok: false, reason: 'validation' } as const
            }
          }
          const groupId = generateId()
          const meta: HouseholdSplitMeta = {
            groupId,
            mode: input.mode,
            participantProfileIds: pids,
            percentWeights: input.mode === 'percent' ? input.percentWeights : undefined,
            amountReferenceByProfileId: input.mode === 'amount' ? input.amountReferenceByProfileId : undefined,
          }
          const v = validateHouseholdSplitMeta(meta, {
            lineAmountNok: input.mode === 'amount' ? input.amount : undefined,
          })
          if (!v.ok) {
            return { ok: false, reason: 'validation' } as const
          }
          const total = budgetedMonthsFromFrequency(
            input.amount,
            input.frequency,
            input.frequency === 'once' ? input.onceMonthIndex : undefined,
          )
          const sh = splitTotalBudgetBetweenParticipants(total, meta)
          if (!sh.ok) {
            return { ok: false, reason: 'validation' } as const
          }
          for (const pid of pids) {
            const p = s0.people[pid]
            if (!p) {
              return { ok: false, reason: 'validation' } as const
            }
            const clash = p.budgetCategories.find(
              (c) => c.parentCategory === input.parentCategory && c.name === name,
            )
            if (clash) {
              return { ok: false, reason: 'name_conflict' } as const
            }
          }
          set((s) => {
            const y = s.budgetYear
            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pid of pids) {
              const p = nextPeople[pid]!
              const newCat: BudgetCategory = {
                id: generateId(),
                name,
                budgeted: sh.byProfileId[pid]!,
                spent: 0,
                type: 'expense',
                color: input.color,
                parentCategory: input.parentCategory,
                frequency: input.frequency,
                ...(input.frequency === 'once' ? { onceMonthIndex: input.onceMonthIndex } : {}),
                householdSplit: meta,
              }
              const merged: PersonData = { ...p, budgetCategories: [...p.budgetCategories, newCat] }
              nextPeople[pid] = recalcPersonBudgetSpentForYear(merged, pid, y)
            }
            return { people: nextPeople }
          })
          return { ok: true } as const
        },

        resplitSharedHouseholdGroupFromTotals: (groupId, total, meta) => {
          const s0 = get()
          if (s0.financeScope === 'household') {
            return { ok: false, reason: 'validation' } as const
          }
          if (s0.subscriptionPlan !== 'family' || s0.profiles.length < 2) {
            return { ok: false, reason: 'not_family' } as const
          }
          if (meta.groupId !== groupId) {
            return { ok: false, reason: 'not_found' } as const
          }
          const v = validateHouseholdSplitMeta(meta)
          if (!v.ok) {
            return { ok: false, reason: 'validation' } as const
          }
          const sh = splitTotalBudgetBetweenParticipants(total, meta)
          if (!sh.ok) {
            return { ok: false, reason: 'validation' } as const
          }
          let found = false
          for (const p of s0.profiles) {
            if (s0.people[p.id]?.budgetCategories.some((c) => c.householdSplit?.groupId === groupId)) {
              found = true
              break
            }
          }
          if (!found) {
            return { ok: false, reason: 'not_found' } as const
          }
          set((s) => {
            const y = s.budgetYear
            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pid of meta.participantProfileIds) {
              const p = nextPeople[pid]
              if (!p) return s
              const newCats = p.budgetCategories.map((c) => {
                if (c.householdSplit?.groupId !== groupId) return c
                const nextBudgeted = sh.byProfileId[pid] ?? c.budgeted
                const onceIdx =
                  c.frequency === 'once'
                    ? (() => {
                        for (let i = 0; i < 12; i++) {
                          if (total[i] > 0) return i
                        }
                        return c.onceMonthIndex
                      })()
                    : c.onceMonthIndex
                return {
                  ...c,
                  budgeted: nextBudgeted,
                  householdSplit: meta,
                  ...(c.frequency === 'once' && onceIdx != null && onceIdx >= 0 && onceIdx <= 11
                    ? { onceMonthIndex: onceIdx }
                    : {}),
                }
              })
              nextPeople[pid] = recalcPersonBudgetSpentForYear(
                { ...p, budgetCategories: newCats },
                pid,
                y,
              )
            }
            return { people: nextPeople }
          })
          return { ok: true } as const
        },

        applySharedHouseholdMonthCellEdit: (categoryId, monthIndex, newPart) => {
          const s0 = get()
          if (s0.financeScope === 'household') {
            return { ok: false, reason: 'not_family' } as const
          }
          if (s0.subscriptionPlan !== 'family' || s0.profiles.length < 2) {
            return { ok: false, reason: 'not_family' } as const
          }
          const ap = s0.activeProfileId
          const person = s0.people[ap]
          const cat = person?.budgetCategories.find((c) => c.id === categoryId)
          if (!cat?.householdSplit) {
            return { ok: false, reason: 'not_shared' } as const
          }
          const meta = cat.householdSplit
          const newT = impliedNewMonthTotal(
            meta.mode,
            meta.participantProfileIds,
            ap,
            newPart,
            meta.percentWeights,
            meta.amountReferenceByProfileId,
          )
          if (newT == null) {
            return { ok: false, reason: 'invalid' } as const
          }
          const g = collectSharedGroupTotals(s0.people, meta.groupId)
          if (!g) {
            return { ok: false, reason: 'not_found' } as const
          }
          g.total[monthIndex] = newT
          const v = validateHouseholdSplitMeta(meta)
          if (!v.ok) {
            return { ok: false, reason: 'invalid' } as const
          }
          const sh = splitTotalBudgetBetweenParticipants(g.total, meta)
          if (!sh.ok) {
            return { ok: false, reason: 'invalid' } as const
          }
          set((s) => {
            const y = s.budgetYear
            const nextPeople: Record<string, PersonData> = { ...s.people }
            for (const pid of meta.participantProfileIds) {
              const p = nextPeople[pid]
              if (!p) return s
              const newCats = p.budgetCategories.map((c) => {
                if (c.householdSplit?.groupId !== meta.groupId) return c
                return { ...c, budgeted: sh.byProfileId[pid] ?? c.budgeted, householdSplit: meta }
              })
              nextPeople[pid] = recalcPersonBudgetSpentForYear(
                { ...p, budgetCategories: newCats },
                pid,
                y,
              )
            }
            return { people: nextPeople }
          })
          return { ok: true } as const
        },

        removeSharedHouseholdBudgetLineByGroupId: (groupId) => {
          set((s) => {
            const y = s.budgetYear
            const people: Record<string, PersonData> = { ...s.people }
            const meta: HouseholdSplitMeta | undefined = (() => {
              for (const p of s.profiles) {
                const c = people[p.id]?.budgetCategories.find(
                  (x) => x.householdSplit?.groupId === groupId,
                )
                if (c?.householdSplit) return c.householdSplit
              }
              return undefined
            })()
            if (!meta) return s
            for (const pid of meta.participantProfileIds) {
              const person = people[pid]
              if (!person) continue
              const c = person.budgetCategories.find((x) => x.householdSplit?.groupId === groupId)
              if (!c) continue
              people[pid] = recalcPersonBudgetSpentForYear(
                removeBudgetCategoryFromPersonData(person, c.id, pid),
                pid,
                y,
              )
            }
            return { people }
          })
        },

        updateBudgetCategory: (id, data) =>
          patchActive((d) => ({
            ...d,
            budgetCategories: d.budgetCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
          })),

        reorderBudgetCategory: (parent, id, direction) =>
          patchActive((d) => {
            const hit = d.budgetCategories.find((c) => c.id === id)
            if (hit?.householdSplit) return d
            return {
              ...d,
              budgetCategories: reorderBudgetCategoriesForParent(d.budgetCategories, parent, id, direction),
            }
          }),

        removeBudgetCategory: (id) => {
          const s = get()
          const ap = s.activeProfileId
          const cat = s.people[ap]?.budgetCategories.find((c) => c.id === id)
          if (cat?.householdSplit?.groupId) {
            get().removeSharedHouseholdBudgetLineByGroupId(cat.householdSplit.groupId)
            return
          }
          patchActive((d) => {
            const pid = get().activeProfileId
            const nextCats = d.budgetCategories.filter((c) => c.id !== id)
            const nextGoals = d.savingsGoals.map((g) =>
              g.linkedBudgetCategoryId === id ? { ...g, linkedBudgetCategoryId: undefined, baselineAmount: undefined } : g,
            )
            const nextSubs = (d.serviceSubscriptions ?? []).map((s) =>
              s.linkedBudgetCategoryId === id
                ? { ...s, linkedBudgetCategoryId: null, syncToBudget: false, budgetLinkMode: undefined }
                : s,
            )
            let nextDebts = d.debts
            let nextTx = d.transactions
            for (const debt of d.debts) {
              if (debt.linkedBudgetCategoryId !== id) continue
              nextDebts = nextDebts.map((x) =>
                x.id === debt.id
                  ? {
                      ...x,
                      linkedBudgetCategoryId: null,
                      syncToBudget: false,
                      syncPlannedTransactions: false,
                    }
                  : x,
              )
              nextTx = stripAllLinkedDebtTransactions(nextTx, debt.id)
            }
            return syncLinkedSavingsGoalsCurrent(
              {
                ...d,
                budgetCategories: nextCats,
                savingsGoals: nextGoals,
                serviceSubscriptions: nextSubs,
                debts: nextDebts,
                transactions: nextTx,
              },
              pid,
            )
          })
        },

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

        remapSharedHouseholdBudgetLineName: (groupId, parent, toName) => {
          const t = toName.trim()
          if (!t) {
            return { ok: false, reason: 'empty_name' } as const
          }
          const s0 = get()
          if (s0.financeScope === 'household') {
            return { ok: false, reason: 'from_unused' } as const
          }
          let fromName: string | undefined
          let meta: HouseholdSplitMeta | undefined
          for (const p of s0.profiles) {
            const c = s0.people[p.id]?.budgetCategories.find((x) => x.householdSplit?.groupId === groupId)
            if (c?.householdSplit) {
              fromName = c.name
              meta = c.householdSplit
              break
            }
          }
          if (!fromName || !meta) {
            return { ok: false, reason: 'from_unused' } as const
          }
          if (fromName === t) {
            return { ok: true } as const
          }
          const people: Record<string, PersonData> = { ...s0.people }
          let archived = s0.archivedBudgetsByYear
          const y = s0.budgetYear
          for (const pid of meta.participantProfileIds) {
            const person = people[pid]
            if (!person) {
              return { ok: false, reason: 'from_unused' } as const
            }
            const res = applyCategoryRemap(person, archived, pid, parent, fromName, t)
            if (!res.ok) {
              return res
            }
            let next = res.person
            next = applySubscriptionCancellationsToBudgetForYear(next, y)
            next = recalcPersonBudgetSpentForYear(next, pid, y)
            people[pid] = next
            archived = res.archivedBudgetsByYear
          }
          set({ people, archivedBudgetsByYear: archived })
          return { ok: true } as const
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

        updateSavingsGoalForProfile: (profileId, goalId, data) =>
          set((s) => {
            const person = s.people[profileId]
            if (!person) return s
            const savingsGoals = person.savingsGoals.map((g) => {
              if (g.id !== goalId) return g
              const merged: SavingsGoal = { ...g, ...data }
              if (merged.linkedBudgetCategoryId) {
                const cat = person.budgetCategories.find((c) => c.id === merged.linkedBudgetCategoryId)
                if (!cat || cat.parentCategory !== 'sparing' || cat.type !== 'expense') {
                  return { ...merged, linkedBudgetCategoryId: undefined, baselineAmount: undefined }
                }
              }
              return merged
            })
            const next = syncLinkedSavingsGoalsCurrent({ ...person, savingsGoals }, profileId)
            return { people: { ...s.people, [profileId]: next } }
          }),

        removeSavingsGoalForProfile: (profileId, goalId) =>
          set((s) => {
            const person = s.people[profileId]
            if (!person) return s
            return {
              people: {
                ...s.people,
                [profileId]: {
                  ...person,
                  savingsGoals: person.savingsGoals.filter((g) => g.id !== goalId),
                },
              },
            }
          }),

        setIncomeSprintPlans: (plans) => {
          set((s) => {
            const householdReadonly =
              s.financeScope === 'household' && s.subscriptionPlan === 'family' && s.profiles.length >= 2
            if (householdReadonly) return s
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const normalized = plans.map((p) => reconcileIncomeSprintPlan(ensureIncomeSprintPlanId(p)))
            return {
              people: {
                ...s.people,
                [pid]: { ...person, incomeSprintPlans: normalized },
              },
            }
          })
        },

        upsertIncomeSprintPlan: (plan) => {
          set((s) => {
            const householdReadonly =
              s.financeScope === 'household' && s.subscriptionPlan === 'family' && s.profiles.length >= 2
            if (householdReadonly) return s
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const next = reconcileIncomeSprintPlan(ensureIncomeSprintPlanId(plan))
            const prev = person.incomeSprintPlans ?? []
            const idx = prev.findIndex((p) => p.id === next.id)
            const merged =
              idx >= 0 ? [...prev.slice(0, idx), next, ...prev.slice(idx + 1)] : [...prev, next]
            return {
              people: {
                ...s.people,
                [pid]: { ...person, incomeSprintPlans: merged },
              },
            }
          })
        },

        removeIncomeSprintPlan: (id) => {
          set((s) => {
            const householdReadonly =
              s.financeScope === 'household' && s.subscriptionPlan === 'family' && s.profiles.length >= 2
            if (householdReadonly) return s
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const merged = (person.incomeSprintPlans ?? []).filter((p) => p.id !== id)
            return {
              people: {
                ...s.people,
                [pid]: { ...person, incomeSprintPlans: merged },
              },
            }
          })
        },

        addDebt: (debtIn) => {
          set((s) => {
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const budgetYear = s.budgetYear
            let budgetCategories = [...person.budgetCategories]
            let transactions = [...person.transactions]
            let nextDebt: Debt = { ...debtIn }
            const wantBudget = nextDebt.syncToBudget === true
            const wantPlanned = nextDebt.syncPlannedTransactions === true && wantBudget
            if (!wantBudget) {
              nextDebt = {
                ...nextDebt,
                linkedBudgetCategoryId: null,
                syncToBudget: false,
                syncPlannedTransactions: false,
                syncBudgetFromMonth1: undefined,
              }
            } else {
              const startM = clampSyncBudgetFromMonth1(
                nextDebt.syncBudgetFromMonth1 ?? defaultSyncBudgetFromMonth1ForBudgetYear(budgetYear),
              )
              const catId = generateId()
              const displayName = uniqueGjeldName(nextDebt.name, budgetCategories.map((c) => c.name))
              const budgetedTwelve = buildDebtLinkedBudgetedTwelve(nextDebt, budgetYear, startM)
              const raw = buildBudgetCategoryForDebt(
                catId,
                displayName,
                debtColorForType(nextDebt.type),
                budgetedTwelve,
              )
              const spent = sumTxForCategoryInYear(
                person.transactions,
                displayName,
                'expense',
                budgetYear,
                pid,
              )
              budgetCategories = [...budgetCategories, { ...raw, spent }]
              nextDebt = {
                ...nextDebt,
                linkedBudgetCategoryId: catId,
                syncToBudget: true,
                syncPlannedTransactions: wantPlanned,
                syncBudgetFromMonth1: startM,
              }
              if (wantPlanned) {
                const extra = buildSyncedDebtPlannedTransactionsForYear(nextDebt, displayName, pid, budgetYear)
                transactions = [...extra, ...transactions]
              }
            }
            const nextPersonRaw = syncLinkedSavingsGoalsCurrent(
              {
                ...person,
                debts: [...person.debts, nextDebt],
                budgetCategories,
                transactions,
              },
              pid,
            )
            const nextPerson = recalcPersonBudgetSpentForYear(nextPersonRaw, pid, budgetYear)
            return { people: { ...s.people, [pid]: nextPerson } }
          })
        },

        updateDebt: (id, data) => {
          set((s) => {
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const prev = person.debts.find((x) => x.id === id)
            if (!prev) return s
            const budgetYear = s.budgetYear
            const merged: Debt = { ...prev, ...data, id }
            let budgetCategories = [...person.budgetCategories]
            let transactions = [...person.transactions]
            let nextDebt = merged

            const wantBudget = merged.syncToBudget === true
            const wantPlanned = merged.syncPlannedTransactions === true && wantBudget

            if (!wantBudget) {
              if (prev.linkedBudgetCategoryId) {
                budgetCategories = budgetCategories.filter((c) => c.id !== prev.linkedBudgetCategoryId)
              }
              transactions = stripAllLinkedDebtTransactions(transactions, id)
              nextDebt = {
                ...merged,
                linkedBudgetCategoryId: null,
                syncToBudget: false,
                syncPlannedTransactions: false,
                syncBudgetFromMonth1: undefined,
              }
            } else {
              const startM = clampSyncBudgetFromMonth1(
                merged.syncBudgetFromMonth1 ??
                  prev.syncBudgetFromMonth1 ??
                  defaultSyncBudgetFromMonth1ForBudgetYear(budgetYear),
              )
              const budgetedTwelve = buildDebtLinkedBudgetedTwelve(merged, budgetYear, startM)
              nextDebt = {
                ...merged,
                syncToBudget: true,
                syncPlannedTransactions: wantPlanned,
                syncBudgetFromMonth1: startM,
              }
              if (!prev.linkedBudgetCategoryId) {
                const catId = generateId()
                const displayName = uniqueGjeldName(merged.name, budgetCategories.map((c) => c.name))
                const raw = buildBudgetCategoryForDebt(
                  catId,
                  displayName,
                  debtColorForType(merged.type),
                  budgetedTwelve,
                )
                const spent = sumTxForCategoryInYear(
                  transactions,
                  displayName,
                  'expense',
                  budgetYear,
                  pid,
                )
                budgetCategories = [...budgetCategories, { ...raw, spent }]
                nextDebt = { ...nextDebt, linkedBudgetCategoryId: catId }
              } else {
                transactions = stripLinkedDebtTransactionsForYear(transactions, id, budgetYear)
                const catId = prev.linkedBudgetCategoryId
                const prevCat = budgetCategories.find((c) => c.id === catId)
                const otherNames = budgetCategories.filter((x) => x.id !== catId).map((x) => x.name)
                const newName =
                  merged.name !== prev.name
                    ? uniqueGjeldName(merged.name, otherNames)
                    : (prevCat?.name ?? merged.name)
                const spent = sumTxForCategoryInYear(transactions, newName, 'expense', budgetYear, pid)
                budgetCategories = budgetCategories.map((c) =>
                  c.id === catId ? { ...c, name: newName, budgeted: budgetedTwelve, spent } : c,
                )
                nextDebt = { ...nextDebt, linkedBudgetCategoryId: catId }
              }

              const cat = budgetCategories.find((c) => c.id === nextDebt.linkedBudgetCategoryId)
              if (wantPlanned && cat) {
                const extra = buildSyncedDebtPlannedTransactionsForYear(nextDebt, cat.name, pid, budgetYear)
                transactions = [...extra, ...transactions]
              }
            }

            const nextPersonRaw = syncLinkedSavingsGoalsCurrent(
              {
                ...person,
                debts: person.debts.map((x) => (x.id === id ? nextDebt : x)),
                budgetCategories,
                transactions,
              },
              pid,
            )
            const nextPerson = recalcPersonBudgetSpentForYear(nextPersonRaw, pid, budgetYear)
            return { people: { ...s.people, [pid]: nextPerson } }
          })
        },

        removeDebt: (id) => {
          set((s) => {
            const pid = s.activeProfileId
            const person = s.people[pid]
            if (!person) return s
            const prev = person.debts.find((x) => x.id === id)
            if (!prev) return s
            let budgetCategories = person.budgetCategories
            if (prev.linkedBudgetCategoryId) {
              budgetCategories = budgetCategories.filter((c) => c.id !== prev.linkedBudgetCategoryId)
            }
            const transactions = stripAllLinkedDebtTransactions(person.transactions, id)
            const budgetYear = s.budgetYear
            const nextPersonRaw = syncLinkedSavingsGoalsCurrent(
              {
                ...person,
                debts: person.debts.filter((x) => x.id !== id),
                budgetCategories,
                transactions,
              },
              pid,
            )
            const nextPerson = recalcPersonBudgetSpentForYear(nextPersonRaw, pid, budgetYear)
            return { people: { ...s.people, [pid]: nextPerson } }
          })
        },

        setSnowballExtraMonthly: (amount) =>
          patchActive((d) => ({
            ...d,
            snowballExtraMonthly: Number.isFinite(amount) ? Math.max(0, amount) : 0,
          })),

        setDefaultIncomeWithholding: (rule) =>
          patchActive((d) => ({
            ...d,
            defaultIncomeWithholding: normalizeIncomeWithholdingRule(rule),
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
          const billing = input.billing === 'yearly' ? 'yearly' : 'monthly'
          const yearlyChargeMonth1 = billing === 'yearly' ? clampYearlyChargeMonth1(input.yearlyChargeMonth1) : undefined
          const budgetMonthWindow =
            billing === 'monthly' && syncToBudget
              ? clampSubscriptionBudgetMonthWindow(input.budgetStartMonth1, input.budgetEndMonth1)
              : { budgetStartMonth1: undefined as number | undefined, budgetEndMonth1: undefined as number | undefined }

          const baseSub: ServiceSubscription = {
            id,
            label,
            amountNok: Math.max(0, Number.isFinite(input.amountNok) ? input.amountNok : 0),
            billing,
            active,
            syncToBudget: false,
            linkedBudgetCategoryId: null,
            yearlyChargeMonth1,
            budgetStartMonth1: budgetMonthWindow.budgetStartMonth1,
            budgetEndMonth1: budgetMonthWindow.budgetEndMonth1,
            note: input.note?.trim() || undefined,
            presetKey: input.presetKey,
          }

          const wantShared =
            syncToBudget &&
            input.budgetLinkMode === 'shared' &&
            typeof input.existingBudgetCategoryId === 'string' &&
            input.existingBudgetCategoryId.trim().length > 0

          let sub: ServiceSubscription = { ...baseSub, syncToBudget }
          let budgetCategories = [...person.budgetCategories]
          let displayName: string | undefined
          const rebuildIds: string[] = []

          if (syncToBudget) {
            if (wantShared) {
              const exId = input.existingBudgetCategoryId!.trim()
              const existing = budgetCategories.find((c) => c.id === exId)
              if (!existing || existing.parentCategory !== 'regninger') {
                return { ok: false as const, reason: 'invalid_budget_category' }
              }
              budgetCategories = budgetCategories.map((c) =>
                c.id === exId ? { ...c, subscriptionBudgetManaged: 'aggregated' as const } : c,
              )
              sub = {
                ...baseSub,
                syncToBudget: true,
                linkedBudgetCategoryId: exId,
                budgetLinkMode: 'shared',
              }
              displayName = existing.name
              rebuildIds.push(exId)
            } else {
              const catId = generateId()
              displayName = uniqueRegningerName(label, budgetCategories.map((c) => c.name))
              const monthly = monthlyEquivalentNok(baseSub)
              const raw = buildBudgetCategoryForSubscription(catId, displayName, monthly, 'single')
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
                budgetLinkMode: 'dedicated',
              }
              rebuildIds.push(catId)
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
              yearlyChargeMonth1: baseSub.billing === 'yearly' ? yearlyChargeMonth1 : undefined,
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
          if (rebuildIds.length > 0) {
            nextPersonRaw = applySubscriptionBudgetRebuildsForCategoryIds(nextPersonRaw, s.budgetYear, rebuildIds)
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
          const { plannedTransactions: plannedPatch, existingBudgetCategoryId: patchExistingCatId, ...patch } =
            patchIn
          const s = get()
          if (s.financeScope === 'household') return { ok: false as const, reason: 'household_readonly' }
          const pid = s.activeProfileId
          const person = s.people[pid]
          if (!person) return { ok: false as const, reason: 'not_found' }
          const list = person.serviceSubscriptions ?? []
          const idx = list.findIndex((x) => x.id === id)
          if (idx < 0) return { ok: false as const, reason: 'not_found' }
          const prev = list[idx]!
          const effectiveBilling = patch.billing ?? prev.billing
          const merged: ServiceSubscription = {
            ...prev,
            ...patch,
            id: prev.id,
            label: patch.label !== undefined ? patch.label.trim() || 'Abonnement' : prev.label,
            amountNok:
              patch.amountNok !== undefined
                ? Math.max(0, Number.isFinite(patch.amountNok) ? patch.amountNok : 0)
                : prev.amountNok,
            billing: effectiveBilling,
            active: patch.active !== undefined ? patch.active : prev.active,
            syncToBudget: patch.syncToBudget !== undefined ? patch.syncToBudget : prev.syncToBudget,
            note: patch.note !== undefined ? patch.note?.trim() || undefined : prev.note,
            presetKey: patch.presetKey !== undefined ? patch.presetKey : prev.presetKey,
            cancelledFrom: patch.cancelledFrom !== undefined ? patch.cancelledFrom : prev.cancelledFrom,
            monthlyEquivalentNokSnapshot:
              patch.monthlyEquivalentNokSnapshot !== undefined
                ? patch.monthlyEquivalentNokSnapshot
                : prev.monthlyEquivalentNokSnapshot,
            budgetLinkMode: patch.budgetLinkMode !== undefined ? patch.budgetLinkMode : prev.budgetLinkMode,
            yearlyChargeMonth1:
              effectiveBilling === 'yearly'
                ? patch.yearlyChargeMonth1 !== undefined
                  ? clampYearlyChargeMonth1(patch.yearlyChargeMonth1)
                  : prev.yearlyChargeMonth1
                : undefined,
          }
          /** Behold Regninger-linje ved avsluttet abonnement (nullstilte måneder). */
          const wantBudgetLine = !!(
            merged.syncToBudget &&
            (merged.active || merged.cancelledFrom != null)
          )
          let budgetCategories = [...person.budgetCategories]
          let nextSub: ServiceSubscription = { ...merged, syncToBudget: wantBudgetLine }
          const affectedCatIds = new Set<string>()
          if (prev.linkedBudgetCategoryId) affectedCatIds.add(prev.linkedBudgetCategoryId)

          if (!wantBudgetLine && prev.linkedBudgetCategoryId) {
            const catId = prev.linkedBudgetCategoryId
            const others = list.filter((x) => x.id !== id && x.linkedBudgetCategoryId === catId).length
            const isShared = prev.budgetLinkMode === 'shared'
            if (others === 0 && !isShared) {
              budgetCategories = budgetCategories.filter((c) => c.id !== catId)
            }
            nextSub = {
              ...nextSub,
              linkedBudgetCategoryId: null,
              syncToBudget: false,
              budgetLinkMode: undefined,
            }
          } else if (wantBudgetLine) {
            const linkMode =
              patch.budgetLinkMode !== undefined
                ? patch.budgetLinkMode
                : prev.budgetLinkMode ?? 'dedicated'
            const wantsShared =
              linkMode === 'shared' &&
              ((typeof patchExistingCatId === 'string' && patchExistingCatId.trim().length > 0) ||
                prev.budgetLinkMode === 'shared')

            if (wantsShared) {
              const exId =
                typeof patchExistingCatId === 'string' && patchExistingCatId.trim().length > 0
                  ? patchExistingCatId.trim()
                  : prev.linkedBudgetCategoryId
              if (!exId) {
                return { ok: false as const, reason: 'invalid_budget_category' }
              }
              const existing = budgetCategories.find((c) => c.id === exId)
              if (!existing || existing.parentCategory !== 'regninger') {
                return { ok: false as const, reason: 'invalid_budget_category' }
              }
              if (prev.linkedBudgetCategoryId && prev.linkedBudgetCategoryId !== exId) {
                const oldId = prev.linkedBudgetCategoryId
                const othersOld = list.filter((x) => x.id !== id && x.linkedBudgetCategoryId === oldId).length
                if (othersOld === 0 && prev.budgetLinkMode !== 'shared') {
                  budgetCategories = budgetCategories.filter((c) => c.id !== oldId)
                } else {
                  affectedCatIds.add(oldId)
                }
              }
              budgetCategories = budgetCategories.map((c) =>
                c.id === exId ? { ...c, subscriptionBudgetManaged: 'aggregated' as const } : c,
              )
              nextSub = {
                ...nextSub,
                syncToBudget: true,
                linkedBudgetCategoryId: exId,
                budgetLinkMode: 'shared',
              }
              affectedCatIds.add(exId)
            } else if (!prev.linkedBudgetCategoryId) {
              const catId = generateId()
              const displayName = uniqueRegningerName(
                nextSub.label,
                budgetCategories.map((c) => c.name),
              )
              const monthly = monthlyEquivalentNok(nextSub)
              const raw = buildBudgetCategoryForSubscription(catId, displayName, monthly, 'single')
              const spent = sumTxForCategoryInYear(
                person.transactions,
                displayName,
                'expense',
                s.budgetYear,
                pid,
              )
              budgetCategories = [...budgetCategories, { ...raw, spent }]
              nextSub = {
                ...nextSub,
                linkedBudgetCategoryId: catId,
                syncToBudget: true,
                budgetLinkMode: 'dedicated',
              }
              affectedCatIds.add(catId)
            } else if (prev.budgetLinkMode === 'shared' && linkMode === 'dedicated') {
              const oldId = prev.linkedBudgetCategoryId!
              affectedCatIds.add(oldId)
              const catId = generateId()
              const displayName = uniqueRegningerName(
                nextSub.label,
                budgetCategories.map((c) => c.name),
              )
              const monthly = monthlyEquivalentNok(nextSub)
              const raw = buildBudgetCategoryForSubscription(catId, displayName, monthly, 'single')
              const spent = sumTxForCategoryInYear(
                person.transactions,
                displayName,
                'expense',
                s.budgetYear,
                pid,
              )
              budgetCategories = [...budgetCategories, { ...raw, spent }]
              nextSub = {
                ...nextSub,
                linkedBudgetCategoryId: catId,
                syncToBudget: true,
                budgetLinkMode: 'dedicated',
              }
              affectedCatIds.add(catId)
            } else {
              const catId = prev.linkedBudgetCategoryId!
              const mode = nextSub.budgetLinkMode ?? prev.budgetLinkMode ?? 'dedicated'
              if (mode === 'dedicated' && patch.label !== undefined) {
                budgetCategories = budgetCategories.map((c) => {
                  if (c.id !== catId) return c
                  const otherNames = budgetCategories.filter((x) => x.id !== catId).map((x) => x.name)
                  const newName = uniqueRegningerName(nextSub.label, otherNames)
                  const spent = sumTxForCategoryInYear(
                    person.transactions,
                    newName,
                    'expense',
                    s.budgetYear,
                    pid,
                  )
                  return { ...c, name: newName, spent }
                })
              }
              nextSub = { ...nextSub, linkedBudgetCategoryId: catId, syncToBudget: true }
              affectedCatIds.add(catId)
            }
          }

          if (nextSub.billing === 'monthly' && nextSub.syncToBudget) {
            nextSub = {
              ...nextSub,
              ...clampSubscriptionBudgetMonthWindow(
                patch.budgetStartMonth1 !== undefined ? patch.budgetStartMonth1 : prev.budgetStartMonth1,
                patch.budgetEndMonth1 !== undefined ? patch.budgetEndMonth1 : prev.budgetEndMonth1,
              ),
            }
          } else {
            nextSub = { ...nextSub, budgetStartMonth1: undefined, budgetEndMonth1: undefined }
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
                const ycm =
                  nextSub.billing === 'yearly'
                    ? clampYearlyChargeMonth1(nextSub.yearlyChargeMonth1)
                    : undefined
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
                  yearlyChargeMonth1: ycm,
                })
                nextTransactions = [...extraTx, ...nextTransactions]
              }
            }
          }

          let nextPersonRaw: PersonData = {
            ...person,
            budgetCategories,
            serviceSubscriptions: nextList,
            transactions: plannedPatch !== undefined ? nextTransactions : person.transactions,
          }
          if (affectedCatIds.size > 0) {
            nextPersonRaw = applySubscriptionBudgetRebuildsForCategoryIds(
              nextPersonRaw,
              s.budgetYear,
              affectedCatIds,
            )
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
          const catId = prev.linkedBudgetCategoryId
          if (catId) {
            const others = list.filter((x) => x.id !== id && x.linkedBudgetCategoryId === catId).length
            const isShared = prev.budgetLinkMode === 'shared'
            if (others === 0 && !isShared) {
              budgetCategories = budgetCategories.filter((c) => c.id !== catId)
            }
          }
          const txs = person.transactions.filter((t) => t.linkedServiceSubscriptionId !== id)
          const nextList = list.filter((x) => x.id !== id)
          let nextPersonRaw: PersonData = {
            ...person,
            budgetCategories,
            serviceSubscriptions: nextList,
            transactions: txs,
          }
          if (catId && budgetCategories.some((c) => c.id === catId)) {
            nextPersonRaw = applySubscriptionBudgetRebuildsForCategoryIds(nextPersonRaw, s.budgetYear, [catId])
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

        mhAddMeal: (input) => {
          const title = input.title.trim()
          if (!title) return { ok: false as const, reason: 'invalid' as const }
          let ds = input.defaultServings
          if (!Number.isFinite(ds) || ds <= 0) ds = 4
          ds = Math.min(50, Math.max(1, Math.round(ds)))
          const now = new Date().toISOString()
          const id = generateId()
          const ingredients: MealIngredient[] = input.ingredients
            .map((ing) => {
              const name = ing.name.trim()
              if (!name) return null
              return {
                id: generateId(),
                name: name.slice(0, 200),
                quantity: ing.quantity,
                unit: ing.unit,
                ...(ing.unitLabel ? { unitLabel: ing.unitLabel } : {}),
                ...(ing.note ? { note: ing.note } : {}),
                ...(ing.section ? { section: ing.section } : {}),
                ...(ing.isStaple ? { isStaple: true } : {}),
              } satisfies MealIngredient
            })
            .filter(Boolean) as MealIngredient[]
          const tagsIn = clampMealSlotTags(input.tags)
          const meal: Meal = {
            id,
            title: title.slice(0, 200),
            ...(input.description?.trim()
              ? { description: input.description.trim().slice(0, 500) }
              : {}),
            defaultServings: ds,
            ingredients,
            ...(tagsIn?.length ? { tags: tagsIn } : {}),
            createdByProfileId: get().activeProfileId,
            createdAt: now,
            updatedAt: now,
          }
          set((s) => {
            let mh = s.matHandleliste
            mh = pushMatActivity(mh, s.activeProfileId, 'meal_created', `La til måltid: ${meal.title}`)
            return { matHandleliste: { ...mh, meals: [...mh.meals, meal] } }
          })
          return { ok: true as const, id }
        },

        mhUpdateMeal: (mealId, patch) => {
          let found = false
          set((s) => {
            const i = s.matHandleliste.meals.findIndex((m) => m.id === mealId)
            if (i < 0) return s
            found = true
            const prev = s.matHandleliste.meals[i]!
            const now = new Date().toISOString()
            let nextMeal: Meal = { ...prev, updatedAt: now }
            if (patch.title != null) nextMeal = { ...nextMeal, title: patch.title.trim().slice(0, 200) }
            if (patch.description !== undefined) {
              if (patch.description === null || !patch.description.trim()) {
                const { description: _d, ...rest } = nextMeal
                nextMeal = rest as Meal
              } else {
                nextMeal = { ...nextMeal, description: patch.description.trim().slice(0, 500) }
              }
            }
            if (
              patch.defaultServings != null &&
              Number.isFinite(patch.defaultServings) &&
              patch.defaultServings > 0
            ) {
              nextMeal = {
                ...nextMeal,
                defaultServings: Math.min(50, Math.max(1, Math.round(patch.defaultServings))),
              }
            }
            if (patch.ingredients != null) nextMeal = { ...nextMeal, ingredients: patch.ingredients }
            if (patch.tags !== undefined) {
              const t = clampMealSlotTags(patch.tags ?? undefined)
              if (t?.length) nextMeal = { ...nextMeal, tags: t }
              else {
                const { tags: _omit, ...rest } = nextMeal
                nextMeal = rest as Meal
              }
            }
            const list = [...s.matHandleliste.meals]
            list[i] = nextMeal
            let mh = { ...s.matHandleliste, meals: list }
            mh = pushMatActivity(mh, s.activeProfileId, 'plan_changed', `Oppdaterte måltid: ${nextMeal.title}`)
            return { matHandleliste: mh }
          })
          return found ? { ok: true as const } : { ok: false as const, reason: 'not_found' as const }
        },

        mhRemoveMeal: (mealId) => {
          let found = false
          set((s) => {
            if (!s.matHandleliste.meals.some((m) => m.id === mealId)) return s
            found = true
            const planByDate = { ...s.matHandleliste.planByDate }
            for (const key of Object.keys(planByDate)) {
              const day = planByDate[key]
              if (!day?.slots) continue
              const slots = { ...day.slots }
              let touched = false
              for (const sl of MEAL_SLOT_ORDER) {
                if (slots[sl]?.mealId === mealId) {
                  delete slots[sl]
                  touched = true
                }
              }
              if (touched) {
                if (Object.keys(slots).length === 0) delete planByDate[key]
                else planByDate[key] = { slots }
              }
            }
            let mh: MatHandlelisteState = {
              ...s.matHandleliste,
              meals: s.matHandleliste.meals.filter((m) => m.id !== mealId),
              planByDate,
            }
            mh = pushMatActivity(mh, s.activeProfileId, 'plan_changed', 'Fjernet et måltid')
            return { matHandleliste: mh }
          })
          return found ? { ok: true as const } : { ok: false as const, reason: 'not_found' as const }
        },

        mhDuplicateMeal: (mealId) => {
          const s = get()
          const src = s.matHandleliste.meals.find((m) => m.id === mealId)
          if (!src) return { ok: false as const, reason: 'not_found' as const }
          const now = new Date().toISOString()
          const id = generateId()
          const meal: Meal = {
            ...src,
            id,
            title: `${src.title} (kopi)`.slice(0, 200),
            ingredients: src.ingredients.map((ing) => ({
              ...ing,
              id: generateId(),
            })),
            createdByProfileId: s.activeProfileId,
            createdAt: now,
            updatedAt: now,
          }
          set((st) => {
            let mh = { ...st.matHandleliste, meals: [...st.matHandleliste.meals, meal] }
            mh = pushMatActivity(mh, st.activeProfileId, 'meal_created', `Dupliserte måltid: ${meal.title}`)
            return { matHandleliste: mh }
          })
          return { ok: true as const, id }
        },

        mhSetPlanSlot: (dateKey, slot, planned) => {
          set((s) => {
            const mh0 = s.matHandleliste
            const planByDate = { ...mh0.planByDate }
            const prev = planByDate[dateKey] ?? { slots: {} }
            const slots = { ...prev.slots }
            if (planned == null) delete slots[slot]
            else slots[slot] = planned
            if (Object.keys(slots).length === 0) delete planByDate[dateKey]
            else planByDate[dateKey] = { slots }
            let mh: MatHandlelisteState = { ...mh0, planByDate }
            mh = pushMatActivity(mh, s.activeProfileId, 'plan_changed', 'Oppdaterte plan for en dag')
            return { matHandleliste: mh }
          })
        },

        mhAddManualListItem: (input) => {
          const name = input.name.trim()
          if (!name) return
          const now = new Date().toISOString()
          set((s) => {
            const list = appendManualItemToShoppingList(
              s.matHandleliste.list,
              name,
              s.activeProfileId,
              now,
              input.categoryId,
              input.note,
              input.unitPriceNok,
              {
                quantity: input.quantity,
                unit: input.unit,
                unitLabel: input.unitLabel,
              },
            )
            let mh = { ...s.matHandleliste, list }
            mh = pushMatActivity(mh, s.activeProfileId, 'item_added', `La til: ${name}`)
            return { matHandleliste: mh }
          })
        },

        mhToggleListItem: (itemId) => {
          const now = new Date().toISOString()
          set((s) => {
            const it0 = s.matHandleliste.list.find((x) => x.id === itemId)
            const list = s.matHandleliste.list.map((it) => {
              if (it.id !== itemId) return it
              const checked = !it.checked
              return { ...it, checked, updatedAt: now }
            })
            let mh = { ...s.matHandleliste, list }
            if (it0) {
              const checked = !it0.checked
              const msg = checked ? `Krysset av: ${it0.displayName}` : `Angret avkrysning: ${it0.displayName}`
              mh = pushMatActivity(
                mh,
                s.activeProfileId,
                checked ? 'item_checked' : 'item_unchecked',
                msg,
              )
            }
            return { matHandleliste: mh }
          })
        },

        mhUpdateListItemCategory: (itemId, categoryId) => {
          const now = new Date().toISOString()
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              list: s.matHandleliste.list.map((it) =>
                it.id === itemId ? { ...it, categoryId: categoryId.slice(0, 32), updatedAt: now } : it,
              ),
            },
          }))
        },

        mhUpdateListItemNote: (itemId, note) => {
          const now = new Date().toISOString()
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              list: s.matHandleliste.list.map((it) => {
                if (it.id !== itemId) return it
                const n = note?.trim() ?? ''
                if (n) return { ...it, note: n.slice(0, 200), updatedAt: now }
                const { note: _rm, ...rest } = it
                return { ...rest, updatedAt: now }
              }),
            },
          }))
        },

        mhPatchListItem: (itemId, patch) => {
          const now = new Date().toISOString()
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              list: s.matHandleliste.list.map((it) => {
                if (it.id !== itemId) return it
                let next: ShoppingListItem = { ...it, updatedAt: now }
                if (patch.categoryId !== undefined) {
                  next = { ...next, categoryId: patch.categoryId.slice(0, 32) }
                }
                if (patch.note !== undefined) {
                  const n = patch.note?.trim() ?? ''
                  if (n) next = { ...next, note: n.slice(0, 200) }
                  else {
                    const { note: _drop, ...rest } = next
                    next = rest as ShoppingListItem
                  }
                }
                if (patch.unitPriceNok !== undefined) {
                  if (patch.unitPriceNok === null) {
                    next = { ...next, unitPriceNok: null }
                  } else {
                    const p = Math.max(0, Math.min(50_000, Math.round(patch.unitPriceNok)))
                    next = { ...next, unitPriceNok: p }
                  }
                }
                if (patch.quantity !== undefined) {
                  if (patch.quantity === null) {
                    next = { ...next, quantity: null }
                  } else {
                    next = { ...next, quantity: clampShoppingListQuantity(patch.quantity) }
                  }
                }
                if (patch.unit !== undefined) {
                  next = { ...next, unit: patch.unit }
                  if (patch.unit !== 'other') {
                    const { unitLabel: _u, ...rest } = next
                    next = rest as ShoppingListItem
                  }
                }
                if (patch.unitLabel !== undefined && next.unit === 'other') {
                  const lab = patch.unitLabel?.trim() ?? ''
                  if (lab) next = { ...next, unitLabel: lab.slice(0, 64) }
                  else {
                    const { unitLabel: _u, ...rest } = next
                    next = rest as ShoppingListItem
                  }
                }
                return next
              }),
            },
          }))
        },

        mhRemoveListItem: (itemId) => {
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              list: s.matHandleliste.list.filter((it) => it.id !== itemId),
            },
          }))
        },

        mhReorderShoppingCategories: (categoryOrder) => {
          set((s) => ({
            matHandleliste: { ...s.matHandleliste, categoryOrder: [...categoryOrder] },
          }))
        },

        mhSetStaplesNormalizedKeys: (keys) => {
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              staples: [...new Set(keys.map((k) => k.trim().toLowerCase()).filter(Boolean))].slice(0, 200),
            },
          }))
        },

        mhAppendMealToList: (input) => {
          const s = get()
          const meal = s.matHandleliste.meals.find((m) => m.id === input.mealId)
          if (!meal) return { ok: false as const, reason: 'not_found' as const }
          const factor = portionFactorForMeal(meal.defaultServings, input.effectiveServings)
          const filtered = meal.ingredients.filter((ing) => !input.excludeIngredientIds.includes(ing.id))
          const now = new Date().toISOString()
          const source = { mealId: meal.id, mealTitle: meal.title }
          const lines = mealIngredientToLines(filtered, factor, source)
          set((st) => {
            const list = appendIngredientsToShoppingList(st.matHandleliste.list, lines, st.activeProfileId, now)
            let mh = { ...st.matHandleliste, list }
            mh = pushMatActivity(mh, st.activeProfileId, 'item_added', `La til ingredienser fra ${meal.title}`)
            return { matHandleliste: mh }
          })
          return { ok: true as const }
        },

        mhAppendDateRangeToList: (input) => {
          const keys = listDateKeysInRange(input.fromKey, input.toKey)
          if (keys.length === 0) return { ok: false as const, reason: 'invalid_range' as const }
          const s = get()
          const mealMap = new Map(s.matHandleliste.meals.map((m) => [m.id, m]))
          let lines = collectIngredientLinesFromPlanRange(s.matHandleliste, keys, mealMap, {
            slots: s.matHandleliste.settings.planVisibleSlots,
          })
          const ex = new Set(input.excludeNormalizedKeys.map((k) => k.trim().toLowerCase()))
          lines = lines.filter((l) => !ex.has(l.normalizedKey))
          const now = new Date().toISOString()
          set((st) => {
            const list = appendIngredientsToShoppingList(st.matHandleliste.list, lines, st.activeProfileId, now)
            let mh = { ...st.matHandleliste, list }
            mh = pushMatActivity(
              mh,
              st.activeProfileId,
              'item_added',
              `La til varer fra plan (${input.fromKey}–${input.toKey})`,
            )
            return { matHandleliste: mh }
          })
          return { ok: true as const, count: lines.length }
        },

        mhClearCheckedListItems: () => {
          set((s) => {
            const list = s.matHandleliste.list.filter((it) => !it.checked)
            let mh = { ...s.matHandleliste, list }
            mh = pushMatActivity(mh, s.activeProfileId, 'cleared_checked', 'Fjernet avkryssede varer fra listen')
            return { matHandleliste: mh }
          })
        },

        mhSetGroceryBudgetCategoryName: (name) => {
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              settings: {
                ...s.matHandleliste.settings,
                groceryBudgetCategoryName: name?.trim() ? name.trim().slice(0, 120) : null,
              },
            },
          }))
        },

        mhSetPlanVisibleSlots: (slots) => {
          set((s) => {
            const planVisibleSlots = normalizePlanVisibleSlots(slots)
            let mh: MatHandlelisteState = {
              ...s.matHandleliste,
              settings: { ...s.matHandleliste.settings, planVisibleSlots },
            }
            mh = pushMatActivity(mh, s.activeProfileId, 'plan_changed', 'Oppdaterte hvilke tidsrom som vises i plan')
            return { matHandleliste: mh }
          })
        },

        mhSetPlanWeekLayout: (mode) => {
          set((s) => ({
            matHandleliste: {
              ...s.matHandleliste,
              settings: { ...s.matHandleliste.settings, planWeekLayout: normalizePlanWeekLayout(mode) },
            },
          }))
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
    hjemflyt: createEmptyHjemFlytState(),
    matHandleliste: createEmptyMatHandlelisteState(),
    demoDataEnabled: false,
    peopleBeforeDemo: null,
    matHandlelisteBeforeDemo: null,
    showAmountDecimals: false,
    ledgerAccountMappings: {},
    ledgerImportHistory: [],
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
      addSharedHouseholdBudgetLine: s.addSharedHouseholdBudgetLine,
      resplitSharedHouseholdGroupFromTotals: s.resplitSharedHouseholdGroupFromTotals,
      applySharedHouseholdMonthCellEdit: s.applySharedHouseholdMonthCellEdit,
      removeSharedHouseholdBudgetLineByGroupId: s.removeSharedHouseholdBudgetLineByGroupId,
      updateBudgetCategory: s.updateBudgetCategory,
      removeBudgetCategory: s.removeBudgetCategory,
      reorderBudgetCategory: s.reorderBudgetCategory,
      addCustomBudgetLabel: s.addCustomBudgetLabel,
      removeCustomBudgetLabel: s.removeCustomBudgetLabel,
      hideStandardBudgetLabel: s.hideStandardBudgetLabel,
      unhideStandardBudgetLabel: s.unhideStandardBudgetLabel,
      remapBudgetCategoryName: s.remapBudgetCategoryName,
      remapSharedHouseholdBudgetLineName: s.remapSharedHouseholdBudgetLineName,
      addSavingsGoal: s.addSavingsGoal,
      updateSavingsGoal: s.updateSavingsGoal,
      removeSavingsGoal: s.removeSavingsGoal,
      updateSavingsGoalForProfile: s.updateSavingsGoalForProfile,
      removeSavingsGoalForProfile: s.removeSavingsGoalForProfile,
      setIncomeSprintPlans: s.setIncomeSprintPlans,
      upsertIncomeSprintPlan: s.upsertIncomeSprintPlan,
      removeIncomeSprintPlan: s.removeIncomeSprintPlan,
      addDebt: s.addDebt,
      updateDebt: s.updateDebt,
      removeDebt: s.removeDebt,
      setSnowballExtraMonthly: s.setSnowballExtraMonthly,
      setDefaultIncomeWithholding: s.setDefaultIncomeWithholding,
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
      removeProfile: s.removeProfile,
      hjemflyt: s.hjemflyt,
      setHjemflytSettings: s.setHjemflytSettings,
      setProfileHjemflytMeta: s.setProfileHjemflytMeta,
      hjemflytAddTask: s.hjemflytAddTask,
      hjemflytUpdateTask: s.hjemflytUpdateTask,
      hjemflytRemoveTask: s.hjemflytRemoveTask,
      hjemflytCompleteTask: s.hjemflytCompleteTask,
      hjemflytApproveCompletion: s.hjemflytApproveCompletion,
      hjemflytRejectCompletion: s.hjemflytRejectCompletion,
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

  const incomeSprintPlans = state.people[state.activeProfileId]?.incomeSprintPlans ?? []

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
    incomeSprintPlans,
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
    addSharedHouseholdBudgetLine: state.addSharedHouseholdBudgetLine,
    resplitSharedHouseholdGroupFromTotals: state.resplitSharedHouseholdGroupFromTotals,
    applySharedHouseholdMonthCellEdit: state.applySharedHouseholdMonthCellEdit,
    removeSharedHouseholdBudgetLineByGroupId: state.removeSharedHouseholdBudgetLineByGroupId,
    updateBudgetCategory: state.updateBudgetCategory,
    removeBudgetCategory: state.removeBudgetCategory,
    reorderBudgetCategory: state.reorderBudgetCategory,
    addCustomBudgetLabel: state.addCustomBudgetLabel,
    removeCustomBudgetLabel: state.removeCustomBudgetLabel,
    hideStandardBudgetLabel: state.hideStandardBudgetLabel,
    unhideStandardBudgetLabel: state.unhideStandardBudgetLabel,
    remapBudgetCategoryName: state.remapBudgetCategoryName,
    remapSharedHouseholdBudgetLineName: state.remapSharedHouseholdBudgetLineName,
    addSavingsGoal: state.addSavingsGoal,
    updateSavingsGoal: state.updateSavingsGoal,
    removeSavingsGoal: state.removeSavingsGoal,
    updateSavingsGoalForProfile: state.updateSavingsGoalForProfile,
    removeSavingsGoalForProfile: state.removeSavingsGoalForProfile,
    setIncomeSprintPlans: state.setIncomeSprintPlans,
    upsertIncomeSprintPlan: state.upsertIncomeSprintPlan,
    removeIncomeSprintPlan: state.removeIncomeSprintPlan,
    addDebt: state.addDebt,
    updateDebt: state.updateDebt,
    removeDebt: state.removeDebt,
    setSnowballExtraMonthly: state.setSnowballExtraMonthly,
    setDefaultIncomeWithholding: state.setDefaultIncomeWithholding,
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
    removeProfile: state.removeProfile,
    hjemflyt: state.hjemflyt,
    setHjemflytSettings: state.setHjemflytSettings,
    setProfileHjemflytMeta: state.setProfileHjemflytMeta,
    hjemflytAddTask: state.hjemflytAddTask,
    hjemflytUpdateTask: state.hjemflytUpdateTask,
    hjemflytRemoveTask: state.hjemflytRemoveTask,
    hjemflytCompleteTask: state.hjemflytCompleteTask,
    hjemflytApproveCompletion: state.hjemflytApproveCompletion,
    hjemflytRejectCompletion: state.hjemflytRejectCompletion,
    budgetYear: state.budgetYear,
    archivedBudgetsByYear: state.archivedBudgetsByYear,
    startNewBudgetYear: state.startNewBudgetYear,
    switchActiveBudgetYear: state.switchActiveBudgetYear,
  }
}
