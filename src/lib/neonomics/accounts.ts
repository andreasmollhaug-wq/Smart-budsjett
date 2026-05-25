import { neonomicsJson } from '@/lib/neonomics/client'
import type { NeonomicsRequestContext } from '@/lib/neonomics/client'

export type NeonomicsAccount = {
  id: string
  iban?: string
  bban?: string
  accountName?: string
  displayName?: string
  ownerName?: string
  balances?: { amount: string; currency: string; type: string }[]
}

export async function fetchNeonomicsAccounts(
  ctx: NeonomicsRequestContext & { sessionId: string },
): Promise<NeonomicsAccount[]> {
  const data = await neonomicsJson<NeonomicsAccount[] | { accounts?: NeonomicsAccount[] }>(
    '/ics/v3/accounts',
    ctx,
    { method: 'GET' },
  )
  if (Array.isArray(data)) return data
  return data.accounts ?? []
}
