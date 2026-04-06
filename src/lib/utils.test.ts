import { describe, expect, it } from 'vitest'
import { dateInMonth, daysInMonth, formatIsoDateDdMmYyyy } from './utils'

describe('daysInMonth', () => {
  it('februar skilleår', () => {
    expect(daysInMonth(2024, 1)).toBe(29)
    expect(daysInMonth(2023, 1)).toBe(28)
  })

  it('31-dagers måneder', () => {
    expect(daysInMonth(2024, 0)).toBe(31)
    expect(daysInMonth(2024, 6)).toBe(31)
  })
})

describe('formatIsoDateDdMmYyyy', () => {
  it('konverterer yyyy-mm-dd til dd.mm.yyyy', () => {
    expect(formatIsoDateDdMmYyyy('2026-04-06')).toBe('06.04.2026')
  })
})

describe('dateInMonth', () => {
  it('klemmer dag 31 til siste dag i februar', () => {
    expect(dateInMonth(2024, 1, 31)).toBe('2024-02-29')
    expect(dateInMonth(2023, 1, 31)).toBe('2023-02-28')
  })

  it('bevarer gyldig dag når den finnes i måneden', () => {
    expect(dateInMonth(2024, 1, 15)).toBe('2024-02-15')
    expect(dateInMonth(2024, 0, 25)).toBe('2024-01-25')
  })
})
