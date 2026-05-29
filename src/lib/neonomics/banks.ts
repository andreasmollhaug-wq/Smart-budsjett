import 'server-only'

import type { NeonomicsRequestContext } from '@/lib/neonomics/client'
import { neonomicsJson } from '@/lib/neonomics/client'

export type NeonomicsApiBank = {
  id: string
  countryCode?: string
  bankingGroupName?: string
  bankDisplayName?: string
  bankOfficialName?: string
  bankLogoUrl?: string
  personalIdentificationRequired?: boolean
  status?: string
  bic?: string
}

/** Henter tilgjengelige banker for appen fra Neonomics (sandbox ~3 NO-banker, prod mye flere). */
export async function fetchNeonomicsBanksApi(
  ctx: NeonomicsRequestContext,
  countryCode = 'NO',
): Promise<NeonomicsApiBank[]> {
  const raw = await neonomicsJson<NeonomicsApiBank[] | { banks?: NeonomicsApiBank[] }>(
    '/ics/v3/banks',
    ctx,
    { searchParams: { countryCode } },
  )
  const list = Array.isArray(raw) ? raw : (raw.banks ?? [])
  return list.filter((b) => b.id?.trim() && b.status !== 'UNAVAILABLE')
}
