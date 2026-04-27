import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { normalizeHjemFlytState } from '@/features/hjemflyt/normalize'
import {
  createEmptyPersonData,
  DEFAULT_PROFILE_ID,
  resetStoreForLogout,
  useStore,
} from './store'

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

  it('annen voksen profil kan legge til oppgaver', () => {
    const p0 = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: 'partner', name: 'Partner' },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: p0,
        partner: createEmptyPersonData(),
      },
      activeProfileId: 'partner',
    })
    const r = useStore.getState().hjemflytAddTask({
      title: 'Partner legger inn',
      rewardPoints: null,
      recurrence: { type: 'none' },
      assignMode: 'everyone',
      assigneeProfileIds: [],
    })
    expect(r.ok).toBe(true)
    expect(useStore.getState().hjemflyt.tasks.some((t) => t.title === 'Partner legger inn')).toBe(true)
  })

  it('barneprofil kan ikke legge til oppgaver', () => {
    const p0 = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: 'kid', name: 'Barn', hjemflyt: { kind: 'child' } },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: p0,
        kid: createEmptyPersonData(),
      },
      activeProfileId: 'kid',
    })
    const r = useStore.getState().hjemflytAddTask({
      title: 'Ulovlig',
      rewardPoints: null,
      recurrence: { type: 'none' },
      assignMode: 'everyone',
      assigneeProfileIds: [],
    })
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected fail')
    expect(r.reason).toBe('forbidden')
  })

  it('barneprofil kan ikke endre HjemFlyt-innstillinger', () => {
    const p0 = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: 'kid', name: 'Barn', hjemflyt: { kind: 'child' } },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: p0,
        kid: createEmptyPersonData(),
      },
      activeProfileId: 'kid',
      hjemflyt: {
        ...useStore.getState().hjemflyt,
        settings: { showRewardForChildren: true, weeklyGoalPoints: 10, participantProfileIds: null },
      },
    })
    const res = useStore.getState().setHjemflytSettings({ showRewardForChildren: false })
    expect(res.ok).toBe(false)
    expect(useStore.getState().hjemflyt.settings.showRewardForChildren).toBe(true)
  })

  it('profiler utenfor participantProfileIds kan ikke fullføre «alle»-oppgave', () => {
    const p0 = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      subscriptionPlan: 'family',
      profiles: [
        { id: DEFAULT_PROFILE_ID, name: 'Meg' },
        { id: 'p2', name: 'Annen' },
      ],
      people: {
        [DEFAULT_PROFILE_ID]: p0,
        p2: createEmptyPersonData(),
      },
      activeProfileId: DEFAULT_PROFILE_ID,
      hjemflyt: {
        ...useStore.getState().hjemflyt,
        settings: {
          ...useStore.getState().hjemflyt.settings,
          participantProfileIds: [DEFAULT_PROFILE_ID],
        },
      },
    })
    const add = useStore.getState().hjemflytAddTask({
      title: 'Test deltakere',
      rewardPoints: null,
      recurrence: { type: 'none' },
      assignMode: 'everyone',
      assigneeProfileIds: [],
    })
    expect(add.ok).toBe(true)
    const taskId = useStore.getState().hjemflyt.tasks[0]!.id
    useStore.setState({ activeProfileId: 'p2' })
    const r = useStore.getState().hjemflytCompleteTask(taskId)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('expected fail')
    expect(r.reason).toBe('not_assigned')
  })
})
