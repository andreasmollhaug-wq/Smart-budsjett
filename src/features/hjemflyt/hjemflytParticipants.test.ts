import { describe, expect, it } from 'vitest'
import { effectiveHjemflytProfileIds } from './hjemflytParticipants'

describe('effectiveHjemflytProfileIds', () => {
  const all = ['a', 'b', 'c']

  it('null betyr alle profiler', () => {
    expect(effectiveHjemflytProfileIds(all, null)).toEqual(all)
  })

  it('tom array behandles som alle', () => {
    expect(effectiveHjemflytProfileIds(all, [])).toEqual(all)
  })

  it('subset filtrert til gyldige id-er', () => {
    expect(effectiveHjemflytProfileIds(all, ['b'])).toEqual(['b'])
    expect(effectiveHjemflytProfileIds(all, ['c', 'a'])).toEqual(['c', 'a'])
  })

  it('fjerner ukjente id-er', () => {
    expect(effectiveHjemflytProfileIds(all, ['b', 'ghost'])).toEqual(['b'])
  })

  it('tom etter filtrering faller tilbake til alle', () => {
    expect(effectiveHjemflytProfileIds(all, ['x', 'y'])).toEqual(all)
  })
})
