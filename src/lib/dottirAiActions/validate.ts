import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { resolveCategoryGroupAndType } from '@/lib/budgetCategoryCatalog'
import {
  findBudgetCategoryByName,
  resolveCanonicalCategoryName,
} from '@/lib/dottirAiActions/categoryMatch'
import {
  formatAmountLabel,
  formatBudgetPeriodLabel,
  formatIsoDateNb,
} from '@/lib/dottirAiActions/periodLabels'
import {
  PARENT_CATEGORY_LABELS,
  type BlockedAction,
  type BudgetPeriod,
  type ProposedAction,
  type ProposedBudgetAction,
  type ProposedTransactionAction,
  type ValidatedAction,
  type ValidatedBudgetAction,
  type ValidatedTransactionAction,
} from '@/lib/dottirAiActions/types'
import { normalizeCategoryNameForMatch } from '@/lib/regningerCategoryPicker'

export type {
  ValidatedAction,
  ValidatedBudgetAction,
  ValidatedTransactionAction,
  BlockedAction,
} from '@/lib/dottirAiActions/types'

import type { PersistedAppSlice } from '@/lib/store'
import { createDefaultPersistedSlice } from '@/lib/store'
import { isPersistedAppSlice } from '@/lib/aiUserContext'

function isHouseholdAggregate(slice: PersistedAppSlice): boolean {
  return (
    slice.financeScope === 'household' &&
    slice.subscriptionPlan === 'family' &&
    slice.profiles.length >= 2
  )
}

function block(reason: BlockedAction['reason'], message: string): BlockedAction {
  return { blocked: true, reason, message }
}

function parseBudgetPeriod(raw: unknown): BudgetPeriod | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  const mode = p.mode
  if (mode === 'monthly_all') return { mode: 'monthly_all' }
  if (mode === 'single_month' && typeof p.month === 'number') {
    return { mode: 'single_month', month: p.month }
  }
  if (mode === 'month_range' && typeof p.from === 'number' && typeof p.to === 'number') {
    return { mode: 'month_range', from: p.from, to: p.to }
  }
  if (mode === 'months' && Array.isArray(p.months)) {
    const months = p.months.filter((m): m is number => typeof m === 'number')
    return { mode: 'months', months }
  }
  return null
}

function parseParentCategory(raw: unknown): ParentCategory | null {
  if (raw === 'inntekter' || raw === 'regninger' || raw === 'utgifter' || raw === 'gjeld' || raw === 'sparing') {
    return raw
  }
  return null
}

export function parseRawProposedAction(raw: unknown): ProposedAction | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const kind = o.kind

  if (kind === 'budget') {
    const parentCategory = parseParentCategory(o.parentCategory)
    const period = parseBudgetPeriod(o.period)
    const categoryName = typeof o.categoryName === 'string' ? o.categoryName.trim() : ''
    const amountNok = typeof o.amountNok === 'number' ? o.amountNok : NaN
    const budgetYear = typeof o.budgetYear === 'number' ? Math.floor(o.budgetYear) : NaN
    if (!parentCategory || !period || !categoryName || !Number.isFinite(amountNok) || !Number.isFinite(budgetYear)) {
      return null
    }
    return {
      kind: 'budget',
      categoryName,
      parentCategory,
      amountNok: Math.round(amountNok),
      period,
      budgetYear,
      createLineIfMissing: o.createLineIfMissing === true,
    }
  }

  if (kind === 'transaction') {
    const date = typeof o.date === 'string' ? o.date.trim() : ''
    const description = typeof o.description === 'string' ? o.description.trim() : ''
    const categoryName = typeof o.categoryName === 'string' ? o.categoryName.trim() : ''
    const amountNok = typeof o.amountNok === 'number' ? o.amountNok : NaN
    const type = o.type === 'income' || o.type === 'expense' ? o.type : null
    if (!date || !description || !categoryName || !type || !Number.isFinite(amountNok)) return null
    return {
      kind: 'transaction',
      date,
      description,
      categoryName,
      amountNok: Math.round(amountNok),
      type,
      subcategory: typeof o.subcategory === 'string' ? o.subcategory.trim() : undefined,
      plannedFollowUp: o.plannedFollowUp === true,
      incomeIsNet: o.incomeIsNet === false ? false : undefined,
      incomeWithholdingPercent:
        typeof o.incomeWithholdingPercent === 'number' ? o.incomeWithholdingPercent : undefined,
    }
  }

  return null
}

/** Oppdager om brukerens melding nevner en annen profil enn aktiv. */
export function detectOtherProfileMention(
  slice: PersistedAppSlice,
  userMessage: string,
): string | null {
  const activeId = slice.activeProfileId
  const active = slice.profiles.find((p) => p.id === activeId)
  const activeName = normalizeCategoryNameForMatch(active?.name ?? '')
  const msg = normalizeCategoryNameForMatch(userMessage)

  for (const p of slice.profiles) {
    if (p.id === activeId) continue
    const name = p.name?.trim()
    if (!name) continue
    const norm = normalizeCategoryNameForMatch(name)
    if (norm.length < 2) continue
    if (msg.includes(norm) && norm !== activeName) {
      return name
    }
  }
  return null
}

function previousMonthlyAmount(budgeted: number[] | undefined, period: BudgetPeriod): number | null {
  if (!Array.isArray(budgeted) || budgeted.length !== 12) return null
  if (period.mode === 'monthly_all') {
    const vals = budgeted.filter((n) => typeof n === 'number' && n > 0)
    if (vals.length === 0) return null
    const first = vals[0]!
    return vals.every((v) => v === first) ? first : null
  }
  return null
}

export function validateProposedAction(
  stateInput: unknown,
  rawAction: unknown,
  options?: { userMessage?: string },
): ValidatedAction {
  const parsed = parseRawProposedAction(rawAction)
  if (!parsed) {
    return block('invalid_action', 'Forslaget kunne ikke leses. Prøv å formulere ønsket endring på nytt.')
  }

  const slice: PersistedAppSlice = isPersistedAppSlice(stateInput)
    ? stateInput
    : createDefaultPersistedSlice()

  if (isHouseholdAggregate(slice)) {
    return block(
      'household_readonly',
      'Du ser samlet husholdning. Velg én profil i «Viser data for» (øverst til venstre) og spør på nytt.',
    )
  }

  const otherProfile = options?.userMessage
    ? detectOtherProfileMention(slice, options.userMessage)
    : null
  if (otherProfile) {
    return block(
      'wrong_profile_mentioned',
      `Du står på ${slice.profiles.find((p) => p.id === slice.activeProfileId)?.name ?? 'aktiv profil'}. Bytt til ${otherProfile} i profilvelgeren og spør på nytt.`,
    )
  }

  const profileId = slice.activeProfileId
  const profileName = slice.profiles.find((p) => p.id === profileId)?.name?.trim() || 'Aktiv profil'
  const person = slice.people[profileId]
  if (!person) {
    return block('invalid_action', 'Kunne ikke finne data for aktiv profil.')
  }

  if (parsed.kind === 'budget') {
    return validateBudgetAction(slice, parsed, profileId, profileName, person.budgetCategories ?? [])
  }

  return validateTransactionAction(parsed, profileId, profileName, person.budgetCategories ?? [])
}

function validateBudgetAction(
  slice: PersistedAppSlice,
  action: ProposedBudgetAction,
  profileId: string,
  profileName: string,
  categories: import('@/lib/store').BudgetCategory[],
): ValidatedBudgetAction | BlockedAction {
  if (action.amountNok <= 0 || !Number.isFinite(action.amountNok)) {
    return block('invalid_amount', 'Beløpet må være et positivt tall.')
  }

  if (action.budgetYear !== slice.budgetYear) {
    const archived = slice.archivedBudgetsByYear[String(action.budgetYear)]
    if (archived) {
      return block(
        'year_archived_readonly',
        `Budsjettår ${action.budgetYear} er arkivert. Bytt til aktivt år (${slice.budgetYear}) på Budsjett-siden.`,
      )
    }
    return block(
      'year_not_active',
      `Aktivt budsjettår er ${slice.budgetYear}. Bytt budsjettår på Budsjett-siden eller bruk ${slice.budgetYear} i forespørselen.`,
    )
  }

  const canonicalName = resolveCanonicalCategoryName(action.parentCategory, action.categoryName)
  const existing = findBudgetCategoryByName(categories, action.parentCategory, canonicalName)
  const isNewLine = !existing

  if (isNewLine && !action.createLineIfMissing) {
    return block(
      'missing_category',
      `Fant ingen linje «${canonicalName}» under ${PARENT_CATEGORY_LABELS[action.parentCategory]}. Be om å opprette linjen, eller legg den inn manuelt på Budsjett-siden.`,
    )
  }

  const subscriptionWarning =
    !!existing &&
    (existing.subscriptionBudgetManaged === 'single' || existing.subscriptionBudgetManaged === 'aggregated')

  const periodLabel = formatBudgetPeriodLabel(action.period)
  const lineLabel = `${PARENT_CATEGORY_LABELS[action.parentCategory]} → ${existing?.name ?? canonicalName}`

  const validated: ValidatedBudgetAction = {
    kind: 'budget',
    blocked: false,
    profileId,
    profileName,
    categoryName: existing?.name ?? canonicalName,
    parentCategory: action.parentCategory,
    lineLabel,
    amountNok: action.amountNok,
    period: action.period,
    periodLabel,
    budgetYear: action.budgetYear,
    resolvedCategoryId: existing?.id ?? null,
    isNewLine,
    previousAmountNok: existing ? previousMonthlyAmount(existing.budgeted, action.period) : null,
    createLineIfMissing: action.createLineIfMissing ?? isNewLine,
    subscriptionWarning,
    payload: { ...action, categoryName: existing?.name ?? canonicalName },
  }

  return validated
}

function validateTransactionAction(
  action: ProposedTransactionAction,
  profileId: string,
  profileName: string,
  categories: import('@/lib/store').BudgetCategory[],
): ValidatedTransactionAction | BlockedAction {
  if (action.amountNok <= 0 || !Number.isFinite(action.amountNok)) {
    return block('invalid_amount', 'Beløpet må være et positivt tall.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date)) {
    return block('invalid_date', 'Datoen må være på formatet yyyy-mm-dd.')
  }

  const resolved = resolveCategoryGroupAndType(action.categoryName, action.type)
  const existing = findBudgetCategoryByName(categories, resolved.parentCategory, action.categoryName)
  const categoryName = existing?.name ?? resolveCanonicalCategoryName(resolved.parentCategory, action.categoryName)
  const lineLabel =
    action.type === 'income'
      ? `${PARENT_CATEGORY_LABELS[resolved.parentCategory]} → ${categoryName}`
      : `${PARENT_CATEGORY_LABELS[resolved.parentCategory]} → ${categoryName}`

  const today = new Date().toISOString().slice(0, 10)
  const plannedFollowUp = action.plannedFollowUp ?? action.date > today

  return {
    kind: 'transaction',
    blocked: false,
    profileId,
    profileName,
    date: action.date,
    dateLabel: formatIsoDateNb(action.date),
    description: action.description,
    amountNok: action.amountNok,
    categoryName,
    typeLabel: action.type === 'income' ? 'Inntekt' : 'Utgift',
    lineLabel,
    plannedFollowUp,
    payload: { ...action, categoryName },
  }
}

export function toAppliedBudgetSummary(action: ValidatedBudgetAction): import('@/lib/dottirAiActions/types').AppliedBudgetSummary {
  return {
    kind: 'budget',
    profileName: action.profileName,
    lineLabel: action.lineLabel,
    amountLabel: formatAmountLabel(action.amountNok, action.period),
    periodLabel: action.periodLabel,
    budgetYear: action.budgetYear,
    isNewLine: action.isNewLine,
  }
}

export function toAppliedTransactionSummary(
  action: ValidatedTransactionAction,
): import('@/lib/dottirAiActions/types').AppliedTransactionSummary {
  const formatted = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(action.amountNok)
  return {
    kind: 'transaction',
    profileName: action.profileName,
    dateLabel: action.dateLabel,
    description: action.description,
    amountLabel: formatted,
    lineLabel: action.lineLabel,
    plannedFollowUp: action.plannedFollowUp,
  }
}

export function isBlockedAction(a: ValidatedAction): a is BlockedAction {
  return 'blocked' in a && a.blocked === true
}

export function isValidatedBudgetAction(a: ValidatedAction): a is ValidatedBudgetAction {
  return !isBlockedAction(a) && a.kind === 'budget'
}

export function isValidatedTransactionAction(a: ValidatedAction): a is ValidatedTransactionAction {
  return !isBlockedAction(a) && a.kind === 'transaction'
}
