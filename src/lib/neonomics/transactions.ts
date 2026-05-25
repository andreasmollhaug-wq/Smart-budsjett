import { neonomicsFetch, neonomicsJson } from '@/lib/neonomics/client'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'

export type NeonomicsTransaction = {
  id: string
  transactionReference?: string
  transactionAmount?: { currency?: string; value?: string }
  creditDebitIndicator?: 'CRDT' | 'DBIT' | string
  bookingDate?: string
  valueDate?: string
  counterpartyName?: string
  counterpartyAccount?: string
  counterpartyAgent?: string
}

export type NeonomicsPagedTransactions = {
  transactions: NeonomicsTransaction[]
  links?: { rel?: string; href?: string }[]
}

export type FetchTransactionsParams = {
  accountId: string
  fromDate: string
  toDate: string
  pageSize?: number
  cursor?: string
}

export async function fetchNeonomicsTransactionsPage(
  ctx: NeonomicsRequestContext & { sessionId: string },
  params: FetchTransactionsParams,
): Promise<NeonomicsPagedTransactions> {
  const path = `/ics/v3/accounts/${encodeURIComponent(params.accountId)}/transactions`
  if (params.cursor) {
    return neonomicsJson<NeonomicsPagedTransactions>(path, ctx, {
      method: 'GET',
      searchParams: { cursor: params.cursor, pageSize: String(params.pageSize ?? 50) },
    })
  }
  return neonomicsJson<NeonomicsPagedTransactions>(path, ctx, {
    method: 'GET',
    searchParams: {
      fromDate: params.fromDate,
      toDate: params.toDate,
      pageSize: String(params.pageSize ?? 50),
    },
  })
}

/** Fetch all pages (respects next cursor links). */
export async function fetchAllNeonomicsTransactions(
  ctx: NeonomicsRequestContext & { sessionId: string },
  params: Omit<FetchTransactionsParams, 'cursor'>,
  maxPages = 20,
): Promise<NeonomicsTransaction[]> {
  const out: NeonomicsTransaction[] = []
  let cursor: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const batch = await fetchNeonomicsTransactionsPage(ctx, { ...params, cursor })
    out.push(...(batch.transactions ?? []))
    const next = batch.links?.find((l) => l.rel === 'next')
    if (!next?.href) break
    const nextUrl = new URL(next.href)
    cursor = nextUrl.searchParams.get('cursor') ?? undefined
    if (!cursor) break
  }
  return out
}

/** Raw fetch for consent flow on transactions (may throw 1426). */
export { neonomicsFetch }
