import { describe, expect, it } from 'vitest'
import { commitDayOfMonthText } from '@/lib/dayOfMonthInput'

describe('commitDayOfMonthText', () => {
  it('returns previous value when cleared', () => {
    expect(commitDayOfMonthText('', 12)).toEqual({ value: 12, text: '12' })
  })

  it('falls back to 1 when cleared with no previous', () => {
    expect(commitDayOfMonthText('', undefined)).toEqual({ value: 1, text: '1' })
  })

  it('parses and keeps valid values', () => {
    expect(commitDayOfMonthText('22', 1)).toEqual({ value: 22, text: '22' })
    expect(commitDayOfMonthText('11', 31)).toEqual({ value: 11, text: '11' })
  })

  it('clamps to 1–31', () => {
    expect(commitDayOfMonthText('0', 10)).toEqual({ value: 1, text: '1' })
    expect(commitDayOfMonthText('99', 10)).toEqual({ value: 31, text: '31' })
  })

  it('ignores whitespace and invalid numbers', () => {
    expect(commitDayOfMonthText('  9 ', 1)).toEqual({ value: 9, text: '9' })
    expect(commitDayOfMonthText('abc', 7)).toEqual({ value: 7, text: '7' })
  })
})

