import type { PersonProfile } from '@/lib/store'
import type { BudgetExportScope, BudgetExportSubject } from './types'
import {
  resolveBudgetCategoriesForScope,
  resolveLabelListsForScope,
  type ResolveBudgetCategoriesCtx,
} from './resolveBudgetCategoriesForScope'

export type ResolveBudgetExportScopesCtx = ResolveBudgetCategoriesCtx & {
  isHouseholdAggregate: boolean
  activeProfileId: string
}

export function getDefaultBudgetExportSubject(
  isHouseholdAggregate: boolean,
  activeProfileId: string,
): BudgetExportSubject {
  return isHouseholdAggregate ? 'household' : activeProfileId
}

function scopeKeysForSubject(
  subject: BudgetExportSubject,
  ctx: Pick<ResolveBudgetExportScopesCtx, 'isHouseholdAggregate' | 'profiles' | 'activeProfileId'>,
): Array<'household' | string> {
  if (subject === 'all') {
    const keys: Array<'household' | string> = []
    if (ctx.isHouseholdAggregate) keys.push('household')
    for (const p of ctx.profiles) keys.push(p.id)
    return keys
  }
  if (subject === 'household') {
    return ctx.isHouseholdAggregate ? ['household'] : [ctx.activeProfileId]
  }
  return [subject]
}

function scopeLabelForKey(key: 'household' | string, profiles: PersonProfile[]): string {
  if (key === 'household') return 'Husholdning (samlet)'
  return profiles.find((p) => p.id === key)?.name ?? 'Profil'
}

export function resolveBudgetExportScopes(
  subject: BudgetExportSubject,
  ctx: ResolveBudgetExportScopesCtx,
): BudgetExportScope[] {
  const normalizedSubject =
    subject === 'household' && !ctx.isHouseholdAggregate
      ? ctx.activeProfileId
      : subject === 'all' || subject === 'household' || ctx.profiles.some((p) => p.id === subject)
        ? subject
        : ctx.activeProfileId

  const keys = scopeKeysForSubject(normalizedSubject, ctx)

  return keys.map((key) => ({
    key,
    label: scopeLabelForKey(key, ctx.profiles),
    categories: resolveBudgetCategoriesForScope(key, ctx),
    labelLists: resolveLabelListsForScope(key, ctx),
  }))
}
