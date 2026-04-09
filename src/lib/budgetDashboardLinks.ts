/** Query til /transaksjoner fra budsjett-dashboard (month er 0–11, «ytd», eller «all» for hele året). */

export type DashboardPeriodMode = 'month' | 'ytd' | 'year'

export function transactionsHrefForCategory(
  mode: DashboardPeriodMode,
  year: number,
  monthIndex: number,
  categoryName: string,
): string {
  const category = encodeURIComponent(categoryName)
  if (mode === 'month') {
    return `/transaksjoner?year=${year}&month=${monthIndex}&category=${category}`
  }
  if (mode === 'ytd') {
    return `/transaksjoner?year=${year}&month=ytd&category=${category}`
  }
  return `/transaksjoner?year=${year}&month=all&category=${category}`
}
