import { describe, expect, it } from 'vitest'
import { normalizeProductKey } from './normalizeProductKey'

describe('normalizeProductKey', () => {
  it('normaliserer norsk', () => {
    expect(normalizeProductKey('Øl')).toBe('ol')
    expect(normalizeProductKey('Melk')).toBe('melk')
  })
})
