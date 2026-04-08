import { describe, expect, it } from 'vitest'
import {
  budgetedTwelveFromMonthly,
  findDuplicatePresetServiceGroups,
  monthlyEquivalentNok,
  uniqueRegningerName,
  yearlyEquivalentNok,
} from './serviceSubscriptionHelpers'

describe('serviceSubscriptionHelpers', () => {
  it('monthlyEquivalentNok', () => {
    expect(monthlyEquivalentNok({ amountNok: 1200, billing: 'monthly' })).toBe(1200)
    expect(monthlyEquivalentNok({ amountNok: 1200, billing: 'yearly' })).toBe(100)
  })

  it('yearlyEquivalentNok', () => {
    expect(yearlyEquivalentNok({ amountNok: 100, billing: 'monthly' })).toBe(1200)
    expect(yearlyEquivalentNok({ amountNok: 1200, billing: 'yearly' })).toBe(1200)
  })

  it('uniqueRegningerName', () => {
    expect(uniqueRegningerName('Netflix', [])).toBe('Netflix')
    expect(uniqueRegningerName('Netflix', ['Netflix'])).toBe('Netflix (2)')
    expect(uniqueRegningerName('Netflix', ['Netflix', 'Netflix (2)'])).toBe('Netflix (3)')
  })

  it('budgetedTwelveFromMonthly', () => {
    expect(budgetedTwelveFromMonthly(100)).toEqual(Array(12).fill(100))
  })

  describe('findDuplicatePresetServiceGroups', () => {
    it('returns group when two profiles share same preset', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, presetKey: 'spotify', sourceProfileId: 'a' },
        { active: true, presetKey: 'spotify', sourceProfileId: 'b' },
      ])
      expect(res).toHaveLength(1)
      expect(res[0].presetKey).toBe('spotify')
      expect(res[0].serviceLabel).toBe('Spotify')
      expect(res[0].profileIds).toEqual(['a', 'b'])
    })

    it('returns empty when same profile has two rows with same preset', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, presetKey: 'spotify', sourceProfileId: 'a' },
        { active: true, presetKey: 'spotify', sourceProfileId: 'a' },
      ])
      expect(res).toHaveLength(0)
    })

    it('ignores annet preset', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, presetKey: 'annet', sourceProfileId: 'a' },
        { active: true, presetKey: 'annet', sourceProfileId: 'b' },
      ])
      expect(res).toHaveLength(0)
    })

    it('ignores missing presetKey', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, sourceProfileId: 'a' },
        { active: true, sourceProfileId: 'b' },
      ])
      expect(res).toHaveLength(0)
    })

    it('ignores inactive subscriptions', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: false, presetKey: 'spotify', sourceProfileId: 'a' },
        { active: true, presetKey: 'spotify', sourceProfileId: 'b' },
      ])
      expect(res).toHaveLength(0)
    })

    it('ignores unknown presetKey', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, presetKey: 'nonexistent_key', sourceProfileId: 'a' },
        { active: true, presetKey: 'nonexistent_key', sourceProfileId: 'b' },
      ])
      expect(res).toHaveLength(0)
    })

    it('sorts multiple groups by service label (nb)', () => {
      const res = findDuplicatePresetServiceGroups([
        { active: true, presetKey: 'spotify', sourceProfileId: 'a' },
        { active: true, presetKey: 'spotify', sourceProfileId: 'b' },
        { active: true, presetKey: 'netflix', sourceProfileId: 'a' },
        { active: true, presetKey: 'netflix', sourceProfileId: 'b' },
      ])
      expect(res.map((g) => g.presetKey)).toEqual(['netflix', 'spotify'])
    })
  })
})
