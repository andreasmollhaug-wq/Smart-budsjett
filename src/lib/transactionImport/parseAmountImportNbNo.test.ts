import { describe, expect, it } from 'vitest'
import { parseAmountImportNbNo } from '@/lib/transactionImport/parseAmountImportNbNo'

describe('parseAmountImportNbNo', () => {
  it('parses plain integer', () => {
    expect(parseAmountImportNbNo('1050')).toBe(1050)
    expect(parseAmountImportNbNo('13000')).toBe(13000)
  })

  it('parses comma as decimal and keeps up to two decimal places', () => {
    expect(parseAmountImportNbNo('1050,66')).toBe(1050.66)
    expect(parseAmountImportNbNo('1050,4')).toBe(1050.4)
    expect(parseAmountImportNbNo('500,50')).toBe(500.5)
    expect(parseAmountImportNbNo('99,99')).toBe(99.99)
  })

  it('handles space as thousands separator', () => {
    expect(parseAmountImportNbNo('13 000')).toBe(13000)
    expect(parseAmountImportNbNo('1 050,66')).toBe(1050.66)
    expect(parseAmountImportNbNo('1 050 000')).toBe(1050000)
  })

  it('handles NBSP (\\u00a0) as thousands separator', () => {
    expect(parseAmountImportNbNo('13\u00a0000')).toBe(13000)
    expect(parseAmountImportNbNo('1\u00a0050,66')).toBe(1050.66)
  })

  it('handles thin space (\\u202f) as thousands separator', () => {
    expect(parseAmountImportNbNo('13\u202f000')).toBe(13000)
    expect(parseAmountImportNbNo('1\u202f050,50')).toBe(1050.5)
  })

  it('handles period as thousands separator with comma decimal', () => {
    expect(parseAmountImportNbNo('1.050,66')).toBe(1050.66)
    expect(parseAmountImportNbNo('1.050.000,50')).toBe(1050000.5)
  })

  it('handles period as thousands separator without decimal', () => {
    expect(parseAmountImportNbNo('1.050')).toBe(1050)
    expect(parseAmountImportNbNo('1.050.000')).toBe(1050000)
  })

  it('handles period as decimal when there is no comma (Excel/locale)', () => {
    expect(parseAmountImportNbNo('499.5')).toBe(499.5)
    expect(parseAmountImportNbNo('116.9')).toBe(116.9)
    expect(parseAmountImportNbNo('499.50')).toBe(499.5)
    expect(parseAmountImportNbNo('10.5')).toBe(10.5)
  })

  it('strips currency suffixes/prefixes', () => {
    expect(parseAmountImportNbNo('1050 kr')).toBe(1050)
    expect(parseAmountImportNbNo('NOK 1050')).toBe(1050)
    expect(parseAmountImportNbNo('1050,-')).toBe(1050)
  })

  it('returns NaN for empty or whitespace', () => {
    expect(parseAmountImportNbNo('')).toBeNaN()
    expect(parseAmountImportNbNo('   ')).toBeNaN()
  })

  it('returns NaN for negative amounts', () => {
    expect(parseAmountImportNbNo('-100')).toBeNaN()
    expect(parseAmountImportNbNo('-100,50')).toBeNaN()
  })

  it('returns NaN for zero', () => {
    expect(parseAmountImportNbNo('0')).toBeNaN()
  })

  it('accepts small positive amounts below 1 kr', () => {
    expect(parseAmountImportNbNo('0,4')).toBe(0.4)
    expect(parseAmountImportNbNo('0,01')).toBe(0.01)
  })

  it('returns NaN for non-numeric text', () => {
    expect(parseAmountImportNbNo('abc')).toBeNaN()
    expect(parseAmountImportNbNo('ti tusen')).toBeNaN()
  })

  it('handles three decimal digits with roundMoney2', () => {
    expect(parseAmountImportNbNo('100,995')).toBe(101)
  })
})
