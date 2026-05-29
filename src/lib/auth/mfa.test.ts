import { describe, expect, it } from 'vitest'
import {
  getVerifiedTotpFactorId,
  hasVerifiedTotpFactor,
  isMfaChallengePath,
  isMfaExemptPath,
  needsMfaStepUp,
} from '@/lib/auth/mfa'

function mockIsPublic(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/logg-inn')
}

describe('needsMfaStepUp', () => {
  it('returns true when current is aal1 and next is aal2', () => {
    expect(needsMfaStepUp({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(true)
  })

  it('returns false when already at aal2', () => {
    expect(needsMfaStepUp({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(false)
  })

  it('returns false when user has no MFA enrolled', () => {
    expect(needsMfaStepUp({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(needsMfaStepUp(null)).toBe(false)
    expect(needsMfaStepUp(undefined)).toBe(false)
  })
})

describe('isMfaChallengePath', () => {
  it('matches challenge route', () => {
    expect(isMfaChallengePath('/logg-inn/tofaktor')).toBe(true)
  })

  it('does not match plain login', () => {
    expect(isMfaChallengePath('/logg-inn')).toBe(false)
  })
})

describe('isMfaExemptPath', () => {
  it('exempts public paths', () => {
    expect(isMfaExemptPath('/', mockIsPublic)).toBe(true)
  })

  it('exempts challenge path', () => {
    expect(isMfaExemptPath('/logg-inn/tofaktor', mockIsPublic)).toBe(true)
  })

  it('exempts password recovery', () => {
    expect(isMfaExemptPath('/tilbakestill-passord', mockIsPublic)).toBe(true)
    expect(isMfaExemptPath('/glemt-passord', mockIsPublic)).toBe(true)
  })

  it('does not exempt protected app routes', () => {
    expect(isMfaExemptPath('/dashboard', mockIsPublic)).toBe(false)
    expect(isMfaExemptPath('/konto/sikkerhet', mockIsPublic)).toBe(false)
  })
})

describe('hasVerifiedTotpFactor', () => {
  it('detects verified TOTP', () => {
    expect(hasVerifiedTotpFactor({ totp: [{ status: 'verified' }] })).toBe(true)
  })

  it('returns false for unverified or empty', () => {
    expect(hasVerifiedTotpFactor({ totp: [{ status: 'unverified' }] })).toBe(false)
    expect(hasVerifiedTotpFactor({ totp: [] })).toBe(false)
    expect(hasVerifiedTotpFactor(null)).toBe(false)
  })
})

describe('getVerifiedTotpFactorId', () => {
  it('returns id of verified factor', () => {
    expect(
      getVerifiedTotpFactorId({
        totp: [{ id: 'f1', status: 'unverified' }, { id: 'f2', status: 'verified' }],
      }),
    ).toBe('f2')
  })

  it('returns null when none verified', () => {
    expect(getVerifiedTotpFactorId({ totp: [{ id: 'f1', status: 'unverified' }] })).toBe(null)
  })
})
