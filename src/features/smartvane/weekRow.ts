/** Kalenderdag i måneden (1–31). */
export function dayOfMonthToWeekRow(day: number): number {
  if (day < 1 || day > 31) {
    throw new RangeError(`day må være 1–31, fikk ${day}`)
  }
  return Math.floor((day - 1) / 7)
}

export function weekRowDayRange(weekRow: number, daysInMonth: number): { start: number; end: number } | null {
  if (weekRow < 0 || weekRow > 4) return null
  const start = weekRow * 7 + 1
  if (start > daysInMonth) return null
  const end = Math.min((weekRow + 1) * 7, daysInMonth)
  return { start, end }
}

/** Om dagens kalenderdag (i måneden) tilhører week_row og det er plass i måneden. */
export function calendarDayInWeekRow(day: number, weekRow: number, daysInMonth: number): boolean {
  const range = weekRowDayRange(weekRow, daysInMonth)
  if (!range) return false
  return day >= range.start && day <= range.end
}
