import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultPersistedSlice,
  createDemoPersonDataForProfile,
  createEmptyPersonData,
  DEFAULT_PROFILE_ID,
  mergePersistedIntoFullState,
  resetStoreForLogout,
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

  it('oppgraderer subscriptionPlan til family når lagret state har flere profiler men solo', () => {
    const slice = createDefaultPersistedSlice()
    const inconsistent = {
      ...slice,
      subscriptionPlan: 'solo' as const,
      profiles: [
        ...slice.profiles,
        { id: 'second', name: 'Iris' },
      ],
      people: {
        ...slice.people,
        second: createEmptyPersonData(),
      },
    }
    const merged = mergePersistedIntoFullState(inconsistent, useStore.getState())
    expect(merged.subscriptionPlan).toBe('family')
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

describe('setActiveProfileId', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('oppretter tom PersonData hvis profil finnes i profiles men mangler i people', () => {
    const extraId = 'iris-1'
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'SmartSpare' },
        { id: extraId, name: 'Iris' },
      ],
      people: { [DEFAULT_PROFILE_ID]: createEmptyPersonData() },
      activeProfileId: DEFAULT_PROFILE_ID,
      financeScope: 'profile',
    })
    useStore.getState().setActiveProfileId(extraId)
    const st = useStore.getState()
    expect(st.activeProfileId).toBe(extraId)
    expect(st.financeScope).toBe('profile')
    expect(st.people[extraId]).toBeDefined()
    expect(Array.isArray(st.people[extraId]!.transactions)).toBe(true)
  })
})

describe('removeProfile', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('fjerner sekundær profil, arkivnøkkel og justerer aktiv profil', () => {
    const extraId = 'extra-1'
    const empty = createEmptyPersonData()
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: extraId, name: 'Partner' },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: empty,
        [extraId]: createEmptyPersonData(),
      },
      activeProfileId: extraId,
      financeScope: 'household',
      archivedBudgetsByYear: {
        '2026': {
          [DEFAULT_PROFILE_ID]: [],
          [extraId]: [],
        },
      },
      peopleBeforeDemo: { [extraId]: createEmptyPersonData() },
    })
    const res = useStore.getState().removeProfile(extraId)
    expect(res).toEqual({ ok: true })
    const st = useStore.getState()
    expect(st.profiles.map((p) => p.id)).toEqual([DEFAULT_PROFILE_ID])
    expect(st.people[extraId]).toBeUndefined()
    expect(st.activeProfileId).toBe(DEFAULT_PROFILE_ID)
    expect(st.financeScope).toBe('profile')
    expect(st.archivedBudgetsByYear['2026']?.[extraId]).toBeUndefined()
    expect(st.peopleBeforeDemo?.[extraId]).toBeUndefined()
  })

  it('avviser primærprofil', () => {
    expect(useStore.getState().removeProfile(DEFAULT_PROFILE_ID)).toEqual({
      ok: false,
      reason: 'primary_locked',
    })
  })
})
