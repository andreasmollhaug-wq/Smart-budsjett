import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { prefersSameTabBankConsent } from '@/lib/neonomics/openBankConsent'

function stubWindow(innerWidth: number, matchMediaImpl: (query: string) => boolean) {
  vi.stubGlobal('window', {
    innerWidth,
    matchMedia: (query: string) => ({
      matches: matchMediaImpl(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  } as unknown as Window)
}

describe('openBankConsent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('foretrekker samme fane på smal skjerm (max-width media)', () => {
    stubWindow(390, (q) => q.includes('max-width: 767px'))
    expect(prefersSameTabBankConsent()).toBe(true)
  })

  it('bruker popup på bred skjerm uten coarse pointer', () => {
    stubWindow(1200, () => false)
    expect(prefersSameTabBankConsent()).toBe(false)
  })

  it('foretrekker samme fane ved coarse pointer og smal bredde', () => {
    stubWindow(600, (q) => q.includes('pointer: coarse'))
    expect(prefersSameTabBankConsent()).toBe(true)
  })
})
