import { describe, expect, it } from 'vitest'
import { BOLIGLAN_KALKULATOR_HREF, STUDIELAN_KALKULATOR_HREF } from '@/lib/sidebarNav'
import {
  activityGapSuggestions,
  mergeContextualSuggestions,
  routeSuggestionsForPath,
  type DottirAiUserSnapshot,
} from '@/lib/dottirAiRouteSuggestions'

const emptyUser: DottirAiUserSnapshot = {
  transactionCount: 0,
  debtCount: 0,
  savingsGoalCount: 0,
  budgetLinesWithAmount: 0,
  serviceSubscriptionCount: 0,
  investmentCount: 0,
  checklistOpenCount: 5,
  creditorRegistryChecklistOpenCount: 0,
  onboardingStatus: 'completed',
  demoDataEnabled: false,
  isHouseholdAggregate: false,
}

describe('routeSuggestionsForPath', () => {
  it('returns dashboard suggestions', () => {
    expect(routeSuggestionsForPath('/dashboard')).toEqual([
      'Oppsummer måneden kort',
      'Hva skiller seg ut i tallene?',
    ])
  })

  it('returns studielan kalkulator suggestions', () => {
    const kalkulator = routeSuggestionsForPath(STUDIELAN_KALKULATOR_HREF)
    expect(kalkulator[0]).toBe('Hva betyr rentefri periode for studielån?')
    expect(routeSuggestionsForPath('/gjeld')).not.toEqual(kalkulator)
  })

  it('prefers specific routes over parent prefix', () => {
    const kalkulator = routeSuggestionsForPath(BOLIGLAN_KALKULATOR_HREF)
    expect(kalkulator[0]).toBe('Hva betyr lånegrad og egenkapital her?')
    expect(routeSuggestionsForPath('/gjeld')).not.toEqual(kalkulator)
  })

  it('matches nested paths', () => {
    expect(routeSuggestionsForPath('/budsjett/2025')).toContain('Hvor avviker jeg fra budsjettet?')
  })

  it('returns oversikt gjeld suggestions before generic gjeld', () => {
    const oversikt = routeSuggestionsForPath('/gjeld/oversikt-gjeld')
    expect(oversikt[0]).toBe('Hva bør jeg gjøre neste i oversikt gjeld?')
    expect(routeSuggestionsForPath('/gjeld')).not.toEqual(oversikt)
  })

  it('returns suggestions for innstillinger', () => {
    expect(routeSuggestionsForPath('/konto/innstillinger')).toContain('Demodata og startveiledning — hvor?')
  })
})

describe('activityGapSuggestions', () => {
  it('suggests onboarding help for pending onboarding', () => {
    const gaps = activityGapSuggestions({ ...emptyUser, onboardingStatus: 'pending' })
    expect(gaps[0]).toMatch(/først/)
  })

  it('suggests transactions when none registered', () => {
    const gaps = activityGapSuggestions(emptyUser)
    expect(gaps.some((g) => g.includes('transaksjoner'))).toBe(true)
  })

  it('skips transaction hint when demo data is on', () => {
    const gaps = activityGapSuggestions({ ...emptyUser, demoDataEnabled: true })
    expect(gaps.some((g) => g.includes('transaksjoner'))).toBe(false)
  })
})

describe('mergeContextualSuggestions', () => {
  const generic = ['Generisk ett', 'Generisk to', 'Generisk tre']

  it('puts route suggestions first', () => {
    const merged = mergeContextualSuggestions('/gjeld', emptyUser, generic, 8)
    expect(merged[0]).toBe('Hvilken gjeld bør jeg prioritere?')
    expect(merged).toContain('Generisk ett')
  })

  it('includes starter gaps for new users', () => {
    const merged = mergeContextualSuggestions('/dashboard', emptyUser, generic, 6)
    expect(merged.some((q) => q.includes('transaksjoner') || q.includes('budsjett'))).toBe(true)
  })

  it('deduplicates and respects max', () => {
    const merged = mergeContextualSuggestions('/dashboard', emptyUser, ['Oppsummer måneden kort', 'Ekstra'], 3)
    expect(merged).toHaveLength(3)
    expect(new Set(merged).size).toBe(3)
  })

  it('prioritizes boliglånskalkulator over gjeld oversikt', () => {
    const merged = mergeContextualSuggestions(BOLIGLAN_KALKULATOR_HREF, emptyUser, generic, 3)
    expect(merged[0]).toMatch(/lånegrad/)
  })
})
