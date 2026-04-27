import { describe, expect, it } from 'vitest'
import { effectiveHjemflytProfileIds } from './hjemflytParticipants'
import type { HjemflytSettings } from './types'

const baseSettings = (participantProfileIds: HjemflytSettings['participantProfileIds']): HjemflytSettings => ({
  showRewardForChildren: true,
  weeklyGoalPoints: null,
  participantProfileIds,
})

describe('effectiveHjemflytProfileIds', () => {
  const all = ['a', 'b', 'c']

  it('null betyr alle profiler', () => {
    expect(effectiveHjemflytProfileIds(all, baseSettings(null))).toEqual(all)
  })

  it('tom array behandles som alle', () => {
    expect(effectiveHjemflytProfileIds(all, baseSettings([]))).toEqual(all)
  })

  it('subset filtrert til gyldige id-er', () => {
    expect(effectiveHjemflytProfileIds(all, baseSettings(['b']))).toEqual(['b'])
    expect(effectiveHjemflytProfileIds(all, baseSettings(['c', 'a']))).toEqual(['c', 'a'])
  })

  it('fjerner ukjente id-er', () => {
    expect(effectiveHjemflytProfileIds(all, baseSettings(['b', 'ghost']))).toEqual(['b'])
  })

  it('tom etter filtrering faller tilbake til alle', () => {
    expect(effectiveHjemflytProfileIds(all, baseSettings(['x', 'y']))).toEqual(all)
  })
})
