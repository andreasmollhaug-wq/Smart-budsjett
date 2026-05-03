import { describe, expect, it } from 'vitest'
import { calendarDayInWeekRow, dayOfMonthToWeekRow, weekRowDayRange } from './weekRow'

describe('dayOfMonthToWeekRow', () => {
  it('mapper 1–7 til 0, 8–14 til 1', () => {
    expect(dayOfMonthToWeekRow(1)).toBe(0)
    expect(dayOfMonthToWeekRow(7)).toBe(0)
    expect(dayOfMonthToWeekRow(8)).toBe(1)
    expect(dayOfMonthToWeekRow(14)).toBe(1)
    expect(dayOfMonthToWeekRow(29)).toBe(4)
    expect(dayOfMonthToWeekRow(31)).toBe(4)
  })
})

describe('weekRowDayRange', () => {
  it('februar 28: rad 4 er 29–28 tom — siste rad 22–28', () => {
    expect(weekRowDayRange(3, 28)).toEqual({ start: 22, end: 28 })
    expect(weekRowDayRange(4, 28)).toBeNull()
  })

  it('31 dager: rad 4 er 29–31', () => {
    expect(weekRowDayRange(4, 31)).toEqual({ start: 29, end: 31 })
  })
})

describe('calendarDayInWeekRow', () => {
  it('matcher uke-slice i måned', () => {
    expect(calendarDayInWeekRow(15, 2, 31)).toBe(true)
    expect(calendarDayInWeekRow(14, 2, 31)).toBe(false)
  })
})
