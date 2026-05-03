import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SMARTVANE_PROFILE_ID,
  parseSmartvaneProfileCookie,
  sanitizeSmartvaneProfileId,
} from '@/features/smartvane/smartvaneProfileCookie'

describe('sanitizeSmartvaneProfileId', () => {
  it('default for tom/ugyldig', () => {
    expect(sanitizeSmartvaneProfileId('')).toBe(DEFAULT_SMARTVANE_PROFILE_ID)
    expect(sanitizeSmartvaneProfileId(null)).toBe(DEFAULT_SMARTVANE_PROFILE_ID)
    expect(sanitizeSmartvaneProfileId('../../etc/passwd')).toBe(DEFAULT_SMARTVANE_PROFILE_ID)
  })

  it('beholder default og korte alfanumeriske id-er', () => {
    expect(sanitizeSmartvaneProfileId('default')).toBe('default')
    expect(sanitizeSmartvaneProfileId('abc123xyz')).toBe('abc123xyz')
    expect(sanitizeSmartvaneProfileId('a-b_9')).toBe('a-b_9')
  })
})

describe('parseSmartvaneProfileCookie', () => {
  it('decoder URL og faller tilbake', () => {
    expect(parseSmartvaneProfileCookie(encodeURIComponent('prof1'))).toBe('prof1')
    expect(parseSmartvaneProfileCookie(undefined)).toBe(DEFAULT_SMARTVANE_PROFILE_ID)
  })
})
