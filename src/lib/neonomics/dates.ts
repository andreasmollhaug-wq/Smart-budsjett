/** Default transaction window: last 12 months (Oslo calendar dates as YYYY-MM-DD). */
export function defaultNeonomicsTransactionDateRange(): { fromDate: string; toDate: string } {
  const to = new Date()
  const from = new Date(to)
  from.setFullYear(from.getFullYear() - 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { fromDate: fmt(from), toDate: fmt(to) }
}
