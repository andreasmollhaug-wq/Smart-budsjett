import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { normalizeHjemFlytState } from '@/features/hjemflyt/normalize'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from './store'

describe('HjemFlyt i store', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })
  afterEach(() => {
    resetStoreForLogout()
  })

  it('hovedprofil kan legge til og fullføre uten å endre transaksjoner (ingen budsjett-kobling)', () => {
    expect(useStore.getState().activeProfileId).toBe(DEFAULT_PROFILE_ID)
    const r = useStore.getState().hjemflytAddTask({
      title: 'Kjør søppel',
      rewardPoints: null,
      recurrence: { type: 'none' },
      assignMode: 'everyone',
      assigneeProfileIds: [],
    })
    expect(r.ok).toBe(true)
    const tx0 = useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.length
    useStore.getState().hjemflytCompleteTask(useStore.getState().hjemflyt.tasks[0]!.id)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.length).toBe(tx0)
  })

  it('kan sette hjemflytState via setState + normalize', () => {
    const next = normalizeHjemFlytState({ tasks: 'bad' } as unknown)
    useStore.setState({ hjemflyt: next })
    expect(useStore.getState().hjemflyt.tasks).toEqual([])
  })
})
