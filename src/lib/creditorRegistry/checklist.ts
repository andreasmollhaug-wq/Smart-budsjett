import { computeRegistryOverview } from './aggregate'
import { normalizeCreditorRegistryPrefs } from './prefs'
import type {
  CreditorRegistryChecklistStepId,
  CreditorRegistryGroup,
  CreditorRegistryPrefs,
  CreditorRegistryState,
} from './types'

export type CreditorRegistryChecklistCtaKind =
  | 'add_creditor'
  | 'add_loan'
  | 'expand_creditor'
  | 'scroll_accordion'
  | 'acknowledge_info'

export type CreditorRegistryChecklistStatusKind = 'auto' | 'override' | 'open'

export type CreditorRegistryChecklistItem = {
  id: CreditorRegistryChecklistStepId
  stepNumber: number
  title: string
  recommendation: string
  detailText: string
  done: boolean
  autoDone: boolean
  overriddenDone: boolean
  statusKind: CreditorRegistryChecklistStatusKind
  ctaLabel: string
  ctaKind: CreditorRegistryChecklistCtaKind
  allowManualComplete?: boolean
}

export const CREDITOR_REGISTRY_CHECKLIST_STEP_COUNT = 5

const STEP_DEFS: Omit<
  CreditorRegistryChecklistItem,
  'done' | 'autoDone' | 'overriddenDone' | 'statusKind'
>[] = [
  {
    id: 'first_creditor_and_loan',
    stepNumber: 1,
    title: 'Legg til kreditor og første lån',
    recommendation:
      'Opprett en kreditor (f.eks. SVEA eller banken din) og registrer det første lånet med restgjeld.',
    detailText:
      'Start med én kreditor og minst ett lån under den. Du kan legge til flere lån og kreditorer senere.',
    ctaLabel: 'Legg til kreditor',
    ctaKind: 'add_creditor',
  },
  {
    id: 'complete_loan_fields',
    stepNumber: 2,
    title: 'Fyll inn rente og avdrag',
    recommendation: 'Fyll inn månedlig avdrag og rente på lånene — da blir subtotalene mer nyttige.',
    detailText:
      'For hvert lån: legg inn månedlig avdrag og/eller rente. Da kan du sammenligne kostnader og se mer meningsfulle subtotaler per kreditor.',
    ctaLabel: 'Gå til lån',
    ctaKind: 'expand_creditor',
    allowManualComplete: true,
  },
  {
    id: 'all_creditors',
    stepNumber: 3,
    title: 'Legg inn alle kreditorer',
    recommendation: 'Har du gjeld flere steder? Legg til neste kreditor.',
    detailText:
      'Gå gjennom hvor du har gjeld — bank, kredittkort, forbrukslån, studielån osv. Legg inn én kreditor per sted, eller marker som ferdig hvis du kun har én.',
    ctaLabel: 'Legg til kreditor',
    ctaKind: 'add_creditor',
    allowManualComplete: true,
  },
  {
    id: 'review_subtotals',
    stepNumber: 4,
    title: 'Sjekk subtotalene',
    recommendation: 'Trykk på en kreditor for å se enkelte lån og subtotal. Stemmer tallene?',
    detailText:
      'Utvid kreditorradene og sammenlign subtotal restgjeld og månedlig avdrag med det du forventer. Juster enkelte lån om noe ser feil ut.',
    ctaLabel: 'Vis kreditorer',
    ctaKind: 'scroll_accordion',
    allowManualComplete: true,
  },
  {
    id: 'understand_standalone',
    stepNumber: 5,
    title: 'Forstå at modulen er egen',
    recommendation:
      'Denne oversikten er ikke koblet til Gjeld → Oversikt, Snøball eller budsjett ennå.',
    detailText:
      'Oversikt gjeld er et eget verktøy per profil. Tall du legger inn her påvirker ikke andre moduler i appen før vi kobler dem sammen i en senere versjon.',
    ctaLabel: 'Jeg forstår',
    ctaKind: 'acknowledge_info',
  },
]

export function allLoansHaveMeaningfulFields(creditors: CreditorRegistryGroup[]): boolean {
  const loans = creditors.flatMap((c) => c.loans)
  if (loans.length === 0) return false
  return loans.every(
    (l) => l.remainingAmount > 0 && (l.monthlyPayment > 0 || l.interestRate > 0),
  )
}

function computeStatusKind(
  done: boolean,
  autoDone: boolean,
  overriddenDone: boolean,
): CreditorRegistryChecklistStatusKind {
  if (!done) return 'open'
  if (autoDone) return 'auto'
  if (overriddenDone) return 'override'
  return 'open'
}

function isStepAutoDone(
  id: CreditorRegistryChecklistStepId,
  creditors: CreditorRegistryGroup[],
  prefs: ReturnType<typeof normalizeCreditorRegistryPrefs>,
): boolean {
  const overview = computeRegistryOverview(creditors)
  switch (id) {
    case 'first_creditor_and_loan':
      return overview.loanCount >= 1
    case 'complete_loan_fields':
      return allLoansHaveMeaningfulFields(creditors)
    case 'all_creditors':
      return overview.creditorCount >= 2
    case 'review_subtotals':
      return prefs.hasReviewedSubtotals === true
    case 'understand_standalone':
      return prefs.standaloneInfoAcknowledged === true
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function buildCreditorRegistryChecklist(state: CreditorRegistryState): CreditorRegistryChecklistItem[] {
  const prefs = normalizeCreditorRegistryPrefs(state.prefs)
  const overrides = state.checklistOverrides ?? {}
  const creditors = state.creditors

  const overview = computeRegistryOverview(creditors)

  return STEP_DEFS.map((def) => {
    const autoDone = isStepAutoDone(def.id, creditors, prefs)
    const overriddenDone = overrides[def.id] === true
    const done = autoDone || overriddenDone
    let item: CreditorRegistryChecklistItem = {
      ...def,
      done,
      autoDone,
      overriddenDone,
      statusKind: computeStatusKind(done, autoDone, overriddenDone),
    }
    if (def.id === 'first_creditor_and_loan' && !done && overview.creditorCount >= 1) {
      item = { ...item, ctaKind: 'add_loan', ctaLabel: 'Legg til lån' }
    }
    return item
  })
}

export function getNextCreditorRegistryChecklistStep(
  items: CreditorRegistryChecklistItem[],
): CreditorRegistryChecklistItem | null {
  return items.find((i) => !i.done) ?? null
}

export function isCreditorRegistryChecklistComplete(items: CreditorRegistryChecklistItem[]): boolean {
  return items.length > 0 && items.every((i) => i.done)
}

export function countSequentialChecklistProgress(items: CreditorRegistryChecklistItem[]): number {
  let count = 0
  for (const item of items) {
    if (!item.done) break
    count++
  }
  return count
}

export function isChecklistStepEffectivelyDone(
  items: CreditorRegistryChecklistItem[],
  stepId: CreditorRegistryChecklistStepId,
): boolean {
  const idx = items.findIndex((i) => i.id === stepId)
  if (idx < 0) return false
  const item = items[idx]
  if (!item?.done) return false
  return items.slice(0, idx).every((i) => i.done)
}

export function isChecklistStepUnlocked(
  items: CreditorRegistryChecklistItem[],
  stepId: CreditorRegistryChecklistStepId,
): boolean {
  const idx = items.findIndex((i) => i.id === stepId)
  if (idx <= 0) return true
  return items.slice(0, idx).every((i) => i.done)
}

const ALL_CHECKLIST_STEP_IDS: CreditorRegistryChecklistStepId[] = [
  'first_creditor_and_loan',
  'complete_loan_fields',
  'all_creditors',
  'review_subtotals',
  'understand_standalone',
]

export type CreditorRegistryChecklistReconcileReason = 'creditor_removed' | 'loan_removed'

/** Rydder utdaterte overrides ved lesing — uten å nullstille skjul/minimer-valg. */
export function sanitizeCreditorRegistryChecklistState(
  state: CreditorRegistryState,
): CreditorRegistryState {
  const overview = computeRegistryOverview(state.creditors)
  let prefs = normalizeCreditorRegistryPrefs(state.prefs)
  const prefsPatch: Partial<CreditorRegistryPrefs> = {}

  if (overview.creditorCount === 0) {
    prefsPatch.hasReviewedSubtotals = false
    prefsPatch.standaloneInfoAcknowledged = false
  }

  if (overview.loanCount === 0) {
    prefsPatch.hasReviewedSubtotals = false
    prefsPatch.standaloneInfoAcknowledged = false
  }

  if (Object.keys(prefsPatch).length > 0) {
    prefs = normalizeCreditorRegistryPrefs({ ...prefs, ...prefsPatch })
  }

  const overrides = { ...(state.checklistOverrides ?? {}) }
  let overridesChanged = false

  for (const id of ALL_CHECKLIST_STEP_IDS) {
    if (!isStepAutoDone(id, state.creditors, prefs) && overrides[id] === true) {
      delete overrides[id]
      overridesChanged = true
    }
  }

  if (prefsPatch.hasReviewedSubtotals === false && overrides.review_subtotals === true) {
    delete overrides.review_subtotals
    overridesChanged = true
  }

  return {
    ...state,
    prefs,
    checklistOverrides: overridesChanged
      ? Object.keys(overrides).length > 0
        ? overrides
        : undefined
      : state.checklistOverrides,
  }
}

/** Synkroniserer overrides og prefs med faktisk registry etter sletting. */
export function reconcileCreditorRegistryChecklist(
  state: CreditorRegistryState,
  reason: CreditorRegistryChecklistReconcileReason,
): CreditorRegistryState {
  const overview = computeRegistryOverview(state.creditors)
  let prefs = normalizeCreditorRegistryPrefs(state.prefs)
  const prefsPatch: Partial<CreditorRegistryPrefs> = {}

  if (overview.creditorCount === 0) {
    prefsPatch.hasReviewedSubtotals = false
    prefsPatch.standaloneInfoAcknowledged = false
    prefsPatch.checklistDismissed = false
    prefsPatch.checklistCollapsed = false
  } else if (reason === 'creditor_removed') {
    prefsPatch.hasReviewedSubtotals = false
    prefsPatch.checklistDismissed = false
    prefsPatch.checklistCollapsed = false
  }

  if (overview.loanCount === 0) {
    prefsPatch.hasReviewedSubtotals = false
    prefsPatch.checklistDismissed = false
    prefsPatch.checklistCollapsed = false
    prefsPatch.standaloneInfoAcknowledged = false
  }

  if (Object.keys(prefsPatch).length > 0) {
    prefs = normalizeCreditorRegistryPrefs({ ...prefs, ...prefsPatch })
  }

  const overrides = { ...(state.checklistOverrides ?? {}) }
  let overridesChanged = false

  for (const id of ALL_CHECKLIST_STEP_IDS) {
    if (!isStepAutoDone(id, state.creditors, prefs) && overrides[id] === true) {
      delete overrides[id]
      overridesChanged = true
    }
  }

  if (prefsPatch.hasReviewedSubtotals === false && overrides.review_subtotals === true) {
    delete overrides.review_subtotals
    overridesChanged = true
  }

  const next: CreditorRegistryState = {
    ...state,
    prefs,
    checklistOverrides: overridesChanged
      ? Object.keys(overrides).length > 0
        ? overrides
        : undefined
      : state.checklistOverrides,
  }

  return next
}
