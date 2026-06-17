import { describe, expect, it } from 'vitest'
import {
  canEditList,
  defaultMemberProfileIds,
  isFamilyCollaborationEnabled,
  isListOwner,
} from './familyGate'

describe('familyGate', () => {
  it('family enabled with 2+ profiles', () => {
    expect(isFamilyCollaborationEnabled('family', 2)).toBe(true)
    expect(isFamilyCollaborationEnabled('solo', 2)).toBe(false)
    expect(isFamilyCollaborationEnabled('family', 1)).toBe(false)
  })

  it('default members exclude owner', () => {
    expect(defaultMemberProfileIds('a', ['a', 'b', 'c'])).toEqual(['b', 'c'])
  })

  it('canEditList for owner and member', () => {
    const list = { ownerProfileId: 'a', memberProfileIds: ['b'] }
    expect(canEditList(list, 'a')).toBe(true)
    expect(canEditList(list, 'b')).toBe(true)
    expect(canEditList(list, 'c')).toBe(false)
    expect(isListOwner(list, 'a')).toBe(true)
  })
})
