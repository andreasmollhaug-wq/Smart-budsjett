import { describe, expect, it } from 'vitest'
import { parseYmCookie, parseYmFromQuery, serializeYmCookie } from '@/features/smartvane/smartvaneMonthCookie'

describe('parseYmFromQuery', () => {
  it('null når ufullstendig', () => {
    expect(parseYmFromQuery('2025', null)).toBeNull()
    expect(parseYmFromQuery(null, '3')).toBeNull()
  })

  it('null når utenfor område', () => {
    expect(parseYmFromQuery('1999', '1')).toBeNull()
    expect(parseYmFromQuery('2025', '13')).toBeNull()
  })

  it('parser gyldig', () => {
    expect(parseYmFromQuery('2025', '3')).toEqual({ year: 2025, month: 3 })
  })
})

describe('parseYmCookie', () => {
  it('parser YYYY-M', () => {
    expect(parseYmCookie('2024-12')).toEqual({ year: 2024, month: 12 })
    expect(parseYmCookie('2024-2')).toEqual({ year: 2024, month: 2 })
  })

  it('avviser feil format', () => {
    expect(parseYmCookie('')).toBeNull()
    expect(parseYmCookie('foo')).toBeNull()
    expect(parseYmCookie('2024-02-01')).toBeNull()
  })
})

describe('serializeYmCookie', () => {
  it('bruker én siffer m når mulig', () => {
    expect(serializeYmCookie({ year: 2025, month: 5 })).toBe('2025-5')
  })
})
