import { describe, expect, it } from 'vitest'
import { suggestProducts } from './suggestProducts'

describe('suggestProducts', () => {
  it('personlig rankes over katalog for samme prefiks', () => {
    const personal = [
      {
        normalizedKey: 'mormors saus',
        displayName: 'Mormors saus',
        useCount: 8,
        lastUsedAt: new Date().toISOString(),
      },
    ]
    const r = suggestProducts('mor', personal)
    expect(r[0]?.displayName).toBe('Mormors saus')
    expect(r[0]?.source).toBe('personal')
  })

  it('tom query gir quick eller personal', () => {
    const r = suggestProducts('', [])
    expect(r.length).toBeGreaterThan(0)
  })
})
