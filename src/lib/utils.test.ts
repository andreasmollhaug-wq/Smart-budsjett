import { describe, expect, it } from 'vitest'
import {
  budgetedMonthsFromFrequency,
  dateInMonth,
  daysInMonth,
  formatIntegerNbNo,
  formatIntegerNbNoWhileTyping,
  formatIsoDateDdMmYyyy,
} from './utils'

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

describe('formatIntegerNbNoWhileTyping', () => {
  it('returnerer tom streng uten siffer', () => {
    expect(formatIntegerNbNoWhileTyping('')).toBe('')
    expect(formatIntegerNbNoWhileTyping('abc')).toBe('')
  })

  it('ignorerer mellomrom og tusenskille ved liming', () => {
    expect(formatIntegerNbNoWhileTyping('12 345')).toBe(formatIntegerNbNo(12345))
    expect(formatIntegerNbNoWhileTyping('1\u00a0234')).toBe(formatIntegerNbNo(1234))
  })

  it('formaterer store tall med nb-NO-gruppering', () => {
    expect(formatIntegerNbNoWhileTyping('1234567')).toBe(formatIntegerNbNo(1234567))
  })

  it('returnerer tom streng for kun nuller', () => {
    expect(formatIntegerNbNoWhileTyping('0')).toBe('')
    expect(formatIntegerNbNoWhileTyping('000')).toBe('')
  })
})

describe('budgetedMonthsFromFrequency', () => {
  it('månedlig: samme beløp alle måneder', () => {
    expect(budgetedMonthsFromFrequency(1000, 'monthly')).toEqual(Array(12).fill(1000))
  })

  it('årlig: tolvtedel hver måned', () => {
    const b = budgetedMonthsFromFrequency(12000, 'yearly')
    expect(b).toEqual(Array(12).fill(1000))
  })

  it('kvartalsvis: fire måneder med fullt beløp', () => {
    const b = budgetedMonthsFromFrequency(3000, 'quarterly')
    expect(b[0]).toBe(3000)
    expect(b[3]).toBe(3000)
    expect(b[6]).toBe(3000)
    expect(b[9]).toBe(3000)
    expect(b.reduce((a, x) => a + x, 0)).toBe(12000)
  })

  it('halvårlig: jan og jul', () => {
    const b = budgetedMonthsFromFrequency(5000, 'semiAnnual')
    expect(b[0]).toBe(5000)
    expect(b[6]).toBe(5000)
    expect(b.filter((x) => x > 0).length).toBe(2)
  })

  it('ukentlig: jevnt månedlig ekvivalent', () => {
    const b = budgetedMonthsFromFrequency(100, 'weekly')
    expect(b.length).toBe(12)
    b.forEach((x) => expect(x).toBeCloseTo(433, 5))
  })

  it('én gang: kun januar (standard)', () => {
    const b = budgetedMonthsFromFrequency(9999, 'once')
    expect(b[0]).toBe(9999)
    expect(b.slice(1).every((x) => x === 0)).toBe(true)
  })

  it('én gang: valgt måned (f.eks. juni)', () => {
    const b = budgetedMonthsFromFrequency(8000, 'once', 5)
    expect(b[5]).toBe(8000)
    expect(b.filter((x) => x > 0).length).toBe(1)
  })

  it('én gang: klemmer ugyldig indeks til 0–11', () => {
    const low = budgetedMonthsFromFrequency(1, 'once', -3)
    expect(low[0]).toBe(1)
    const high = budgetedMonthsFromFrequency(2, 'once', 99)
    expect(high[11]).toBe(2)
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
