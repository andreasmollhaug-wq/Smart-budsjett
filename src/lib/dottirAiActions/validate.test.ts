import { describe, expect, it } from 'vitest'
import { formatBudgetPeriodLabel, buildBudgetedFromPeriod } from '@/lib/dottirAiActions/periodLabels'
import {
  detectOtherProfileMention,
  parseRawProposedAction,
  validateProposedAction,
  isBlockedAction,
} from '@/lib/dottirAiActions/validate'
import { createDefaultPersistedSlice, DEFAULT_PROFILE_ID } from '@/lib/store'

describe('formatBudgetPeriodLabel', () => {
  it('formats monthly_all', () => {
    expect(formatBudgetPeriodLabel({ mode: 'monthly_all' })).toBe('Hver måned (jan–des)')
  })

  it('formats single month', () => {
    expect(formatBudgetPeriodLabel({ mode: 'single_month', month: 4 })).toBe('Kun apr')
  })
})

describe('buildBudgetedFromPeriod', () => {
  it('fills all months for monthly_all', () => {
    expect(buildBudgetedFromPeriod({ mode: 'monthly_all' }, 1500)).toEqual(Array(12).fill(1500))
  })

  it('sets range months', () => {
    const arr = buildBudgetedFromPeriod({ mode: 'month_range', from: 1, to: 3 }, 500)
    expect(arr.slice(0, 3)).toEqual([500, 500, 500])
    expect(arr.slice(3).every((n) => n === 0)).toBe(true)
  })
})

describe('parseRawProposedAction', () => {
  it('parses budget action', () => {
    const a = parseRawProposedAction({
      kind: 'budget',
      categoryName: 'Strøm',
      parentCategory: 'regninger',
      amountNok: 1500,
      period: { mode: 'monthly_all' },
      budgetYear: 2026,
      createLineIfMissing: true,
    })
    expect(a?.kind).toBe('budget')
  })
})

describe('validateProposedAction', () => {
  const base = createDefaultPersistedSlice()

  it('blocks household mode', () => {
    const slice = {
      ...base,
      subscriptionPlan: 'family' as const,
      financeScope: 'household' as const,
      profiles: [
        { id: 'a', name: 'Anna' },
        { id: 'b', name: 'Ola' },
      ],
    }
    const result = validateProposedAction(slice, {
      kind: 'budget',
      categoryName: 'Strøm',
      parentCategory: 'regninger',
      amountNok: 1500,
      period: { mode: 'monthly_all' },
      budgetYear: slice.budgetYear,
      createLineIfMissing: true,
    })
    expect(isBlockedAction(result)).toBe(true)
    if (isBlockedAction(result)) {
      expect(result.reason).toBe('household_readonly')
    }
  })

  it('blocks wrong profile mention', () => {
    const slice = {
      ...base,
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Anna' },
        { id: 'ola', name: 'Ola' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }
    const result = validateProposedAction(
      slice,
      {
        kind: 'budget',
        categoryName: 'Strøm',
        parentCategory: 'regninger',
        amountNok: 1500,
        period: { mode: 'monthly_all' },
        budgetYear: slice.budgetYear,
        createLineIfMissing: true,
      },
      { userMessage: 'Legg inn for Ola under Strøm' },
    )
    expect(isBlockedAction(result)).toBe(true)
    if (isBlockedAction(result)) {
      expect(result.reason).toBe('wrong_profile_mentioned')
    }
  })

  it('validates budget for active profile', () => {
    const result = validateProposedAction(base, {
      kind: 'budget',
      categoryName: 'Strøm',
      parentCategory: 'regninger',
      amountNok: 1500,
      period: { mode: 'monthly_all' },
      budgetYear: base.budgetYear,
      createLineIfMissing: true,
    })
    expect(isBlockedAction(result)).toBe(false)
    if (!isBlockedAction(result) && result.kind === 'budget') {
      expect(result.isNewLine).toBe(true)
      expect(result.profileName).toBe('Meg')
    }
  })
})

describe('detectOtherProfileMention', () => {
  it('detects other profile name', () => {
    const slice = createDefaultPersistedSlice()
    const withOla = {
      ...slice,
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Anna' },
        { id: 'ola', name: 'Ola' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }
    expect(detectOtherProfileMention(withOla, 'legg inn for Ola')).toBe('Ola')
    expect(detectOtherProfileMention(withOla, 'legg inn strøm')).toBeNull()
  })
})
