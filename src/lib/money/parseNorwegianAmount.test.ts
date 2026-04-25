import { describe, expect, it } from 'vitest'
import { caretIndexAfterDigitCount } from '@/lib/utils'
import {
  formatMoneyAmountWhileTyping,
  formatMoneyInputFromNumber,
  moneyCaretIndexAfterDigitCount,
  normalizeNorwegianAmountToPlainDecimalString,
  parseNonNegativeMoneyAmount2Decimals,
  parsePositiveMoneyAmount2Decimals,
  roundMoney2,
} from '@/lib/money/parseNorwegianAmount'

describe('normalizeNorwegianAmountToPlainDecimalString', () => {
  it('matches import behavior for trailing comma (invalid without form flag)', () => {
    expect(normalizeNorwegianAmountToPlainDecimalString('100,')).toBeNull()
    expect(normalizeNorwegianAmountToPlainDecimalString('100,', { allowTrailingComma: true })).toBe('100.0')
  })
})

describe('parseNonNegativeMoneyAmount2Decimals', () => {
  it('tillater null', () => {
    expect(parseNonNegativeMoneyAmount2Decimals('0')).toBe(0)
    expect(parseNonNegativeMoneyAmount2Decimals('0,5')).toBe(0.5)
  })
})

describe('parsePositiveMoneyAmount2Decimals', () => {
  it('parses comma decimal and spaces', () => {
    expect(parsePositiveMoneyAmount2Decimals('100,5')).toBe(100.5)
    expect(parsePositiveMoneyAmount2Decimals('52,35')).toBe(52.35)
    expect(parsePositiveMoneyAmount2Decimals('1 234,56')).toBe(1234.56)
    expect(parsePositiveMoneyAmount2Decimals('1.234,5')).toBe(1234.5)
  })

  it('rounds to two decimals', () => {
    expect(parsePositiveMoneyAmount2Decimals('100,995')).toBe(101)
  })

  it('rejects invalid and non-positive', () => {
    expect(parsePositiveMoneyAmount2Decimals('')).toBeNaN()
    expect(parsePositiveMoneyAmount2Decimals('0')).toBeNaN()
    expect(parsePositiveMoneyAmount2Decimals('abc')).toBeNaN()
  })
})

describe('formatMoneyInputFromNumber', () => {
  it('formats nb-NO with up to 2 fraction digits', () => {
    expect(formatMoneyInputFromNumber(100.5)).toMatch(/100[,.]5/)
    expect(formatMoneyInputFromNumber(100)).toBe('100')
  })
})

describe('formatMoneyAmountWhileTyping', () => {
  it('legger inn tusenskille uten desimaler', () => {
    const a = formatMoneyAmountWhileTyping('1234')
    expect(a.replace(/[\s\u00a0\u202f]/g, ' ')).toBe('1 234')
    expect(a.replace(/[\s\u00a0\u202f]/g, ' ').replace(' ', '')).toContain('1234')
  })

  it('kombinerer tusenskille og desimaler', () => {
    const x = formatMoneyAmountWhileTyping('1234,5').replace(/[\s\u00a0\u202f]/g, ' ')
    expect(x).toMatch(/234,5$/)
    expect(formatMoneyAmountWhileTyping('52,35')).toBe('52,35')
  })

  it('bevarer ufullstendig desimal (trailing ,)', () => {
    expect(formatMoneyAmountWhileTyping('100,')).toBe('100,')
  })

  it('tusenskille med desimal (10 000,5) — regresjon', () => {
    const x = formatMoneyAmountWhileTyping('10 000,5').replace(/[\s\u00a0\u202f]/g, ' ')
    expect(x).toBe('10 000,5')
  })
})

describe('moneyCaretIndexAfterDigitCount', () => {
  it('flytter markør forbi hengende desimalkomma (10 000,)', () => {
    const s = formatMoneyAmountWhileTyping('10 000,').replace(/[\s\u00a0\u202f]/g, ' ')
    expect(s.endsWith(',')).toBe(true)
    expect(moneyCaretIndexAfterDigitCount(s, 5)).toBe(s.length)
    expect(caretIndexAfterDigitCount(s, 5)).toBe(s.lastIndexOf(','))
  })

  it('flytter forbi 1,', () => {
    const s = formatMoneyAmountWhileTyping('1,').replace(/[\s\u00a0\u202f]/g, ' ')
    expect(moneyCaretIndexAfterDigitCount(s, 1)).toBe(s.length)
  })

  it('bøyer ikke ferdig desimal (52,35)', () => {
    expect(moneyCaretIndexAfterDigitCount('52,35', 4)).toBe(5)
    expect('52,35'.length).toBe(5)
  })
})

describe('roundMoney2', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney2(1.01)).toBe(1.01)
    expect(roundMoney2(1.456)).toBe(1.46)
    expect(roundMoney2(1.001)).toBe(1)
  })
})
