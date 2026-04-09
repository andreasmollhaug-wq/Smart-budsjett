import { describe, expect, it } from 'vitest'
import {
  createDefaultPersistedSlice,
  createDemoPersonDataForProfile,
  DEFAULT_PROFILE_ID,
  mergePersistedIntoFullState,
  useStore,
} from './store'

describe('mergePersistedIntoFullState', () => {
  it('erstatter ugyldig budgetYear med et endelig årstall', () => {
    const slice = createDefaultPersistedSlice()
    const merged = mergePersistedIntoFullState({ ...slice, budgetYear: NaN }, useStore.getState())
    expect(Number.isFinite(merged.budgetYear)).toBe(true)
    expect(typeof merged.budgetYear).toBe('number')
  })

  it('legger til tom PersonData for profil som mangler i people', () => {
    const slice = createDefaultPersistedSlice()
    const withExtraProfile = {
      ...slice,
      profiles: [
        ...slice.profiles,
        { id: 'extra-profile', name: 'Ekstra' },
      ],
    }
    const merged = mergePersistedIntoFullState(withExtraProfile, useStore.getState())
    expect(merged.people['extra-profile']).toBeDefined()
    expect(Array.isArray(merged.people['extra-profile']!.transactions)).toBe(true)
  })

  it('bevarer aktiv profil når persisted matcher', () => {
    const slice = createDefaultPersistedSlice()
    expect(slice.activeProfileId).toBe(DEFAULT_PROFILE_ID)
    const merged = mergePersistedIntoFullState(slice, useStore.getState())
    expect(merged.activeProfileId).toBe(DEFAULT_PROFILE_ID)
    expect(merged.people[DEFAULT_PROFILE_ID]).toBeDefined()
  })

  it('bevarer dismissedDuplicateSubscriptionPresetKeys fra lagret slice', () => {
    const slice = createDefaultPersistedSlice()
    const merged = mergePersistedIntoFullState(
      { ...slice, dismissedDuplicateSubscriptionPresetKeys: ['netflix', 'spotify'] },
      useStore.getState(),
    )
    expect(merged.dismissedDuplicateSubscriptionPresetKeys).toEqual(['netflix', 'spotify'])
  })

  it('nullstiller people når demo er av men lagret people fortsatt har demo-kategorier', () => {
    const slice = createDefaultPersistedSlice()
    const demo = createDemoPersonDataForProfile(DEFAULT_PROFILE_ID, slice.budgetYear)
    const inconsistent = {
      ...slice,
      demoDataEnabled: false,
      people: { [DEFAULT_PROFILE_ID]: demo },
      peopleBeforeDemo: null,
    }
    const merged = mergePersistedIntoFullState(inconsistent, useStore.getState())
    expect(merged.demoDataEnabled).toBe(false)
    expect(merged.people[DEFAULT_PROFILE_ID]!.budgetCategories).toHaveLength(0)
    expect(merged.peopleBeforeDemo).toBeNull()
  })
})
