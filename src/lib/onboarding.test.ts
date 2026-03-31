import { describe, expect, it } from 'vitest'
import {
  createDefaultPersistedSlice,
  DEFAULT_PROFILE_ID,
  mergePersistedIntoFullState,
  useStore,
} from './store'

describe('onboarding persistence merge', () => {
  it('default persisted slice har pending', () => {
    expect(createDefaultPersistedSlice().onboarding.status).toBe('pending')
  })

  it('default slice uten demo har tomme budsjettkategorier', () => {
    const slice = createDefaultPersistedSlice()
    const me = slice.people[DEFAULT_PROFILE_ID]
    expect(me?.budgetCategories.length).toBe(0)
  })

  it('seedDemoData true gir demo-budsjettkategorier', () => {
    const slice = createDefaultPersistedSlice({ seedDemoData: true })
    const me = slice.people[DEFAULT_PROFILE_ID]
    expect(me?.budgetCategories.length).toBeGreaterThan(0)
  })

  it('payload uten onboarding felt blir completed etter merge', () => {
    const slice = createDefaultPersistedSlice()
    const { onboarding: _drop, ...withoutOnboarding } = slice
    const merged = mergePersistedIntoFullState(withoutOnboarding, useStore.getState())
    expect(merged.onboarding.status).toBe('completed')
  })
})
