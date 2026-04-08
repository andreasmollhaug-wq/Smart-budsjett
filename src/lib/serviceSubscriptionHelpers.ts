import { SERVICE_SUBSCRIPTION_PRESETS } from './serviceSubscriptionPresets'

/** presetKey → visningsnavn (uten «annet»). */
const PRESET_KEY_TO_LABEL: Map<string, string> = (() => {
  const m = new Map<string, string>()
  for (const g of SERVICE_SUBSCRIPTION_PRESETS) {
    for (const i of g.items) {
      if (i.key !== 'annet') m.set(i.key, i.label)
    }
  }
  return m
})()

/** Input med felt som trengs for duplikatsjekk (husholdningsaggregat har sourceProfileId). */
export type DuplicatePresetSubscriptionInput = {
  active: boolean
  presetKey?: string
  sourceProfileId?: string
}

export type DuplicatePresetServiceGroup = {
  presetKey: string
  /** Navn fra preset-listen (konsistent språk). */
  serviceLabel: string
  profileIds: string[]
}

/**
 * Finner forhåndsvalgte tjenester som er registrert aktivt for minst to ulike profiler.
 * Brukes i husholdningsvisning. Ignorerer «annet», manglende presetKey og ukjente nøkler.
 */
export function findDuplicatePresetServiceGroups(
  subs: DuplicatePresetSubscriptionInput[],
): DuplicatePresetServiceGroup[] {
  const byKey = new Map<string, Set<string>>()

  for (const s of subs) {
    if (!s.active) continue
    const key = s.presetKey
    if (!key || key === 'annet') continue
    if (!PRESET_KEY_TO_LABEL.has(key)) continue
    const pid = s.sourceProfileId
    if (!pid) continue

    let set = byKey.get(key)
    if (!set) {
      set = new Set()
      byKey.set(key, set)
    }
    set.add(pid)
  }

  const out: DuplicatePresetServiceGroup[] = []
  for (const [presetKey, ids] of byKey) {
    if (ids.size < 2) continue
    const serviceLabel = PRESET_KEY_TO_LABEL.get(presetKey)
    if (!serviceLabel) continue
    out.push({
      presetKey,
      serviceLabel,
      profileIds: [...ids].sort(),
    })
  }

  out.sort((a, b) => a.serviceLabel.localeCompare(b.serviceLabel, 'nb'))
  return out
}

/** Månedlig kostnad i NOK (årlig pris fordeles likt på 12 måneder). */
export function monthlyEquivalentNok(sub: { amountNok: number; billing: 'monthly' | 'yearly' }): number {
  const a = sub.amountNok
  if (!Number.isFinite(a) || a < 0) return 0
  return sub.billing === 'yearly' ? a / 12 : a
}

export function yearlyEquivalentNok(sub: { amountNok: number; billing: 'monthly' | 'yearly' }): number {
  const a = sub.amountNok
  if (!Number.isFinite(a) || a < 0) return 0
  return sub.billing === 'yearly' ? a : a * 12
}

export function budgetedTwelveFromMonthly(monthly: number): number[] {
  const m = Number.isFinite(monthly) && monthly >= 0 ? monthly : 0
  return Array(12).fill(m)
}

/** Unikt kategorinavn (unngår kollisjon med eksisterende linjer). */
export function uniqueRegningerName(desired: string, categoryNames: string[]): string {
  const trimmed = desired.trim() || 'Tjeneste'
  const names = new Set(categoryNames)
  if (!names.has(trimmed)) return trimmed
  let i = 2
  while (names.has(`${trimmed} (${i})`)) i += 1
  return `${trimmed} (${i})`
}

export function buildBudgetCategoryForSubscription(
  categoryId: string,
  displayName: string,
  monthly: number,
): {
  id: string
  name: string
  budgeted: number[]
  spent: number
  type: 'expense'
  color: string
  parentCategory: 'regninger'
  frequency: 'monthly'
} {
  const budgeted = budgetedTwelveFromMonthly(monthly)
  return {
    id: categoryId,
    name: displayName,
    budgeted,
    spent: 0,
    type: 'expense',
    color: '#868E96',
    parentCategory: 'regninger',
    frequency: 'monthly',
  }
}
