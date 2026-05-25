import { describe, expect, it } from 'vitest'
import { accountLabelFromNeonomics, maskIban } from '@/lib/neonomics/accountTypes'
import {
  countPendingByAccountId,
  resolveAccountsToSync,
  syncAccountIdsFromConnection,
} from '@/lib/neonomics/syncAccounts'
import type { NeonomicsAccount } from '@/lib/neonomics/accounts'

const apiAccounts: NeonomicsAccount[] = [
  { id: 'a1', displayName: 'Lønn', iban: 'NO9320001234567' },
  { id: 'a2', accountName: 'Buffert', iban: 'NO9320007654321' },
]

describe('syncAccounts', () => {
  it('resolveAccountsToSync returnerer alle når sync_account_ids er tom', () => {
    const out = resolveAccountsToSync({ sync_account_ids: [] }, apiAccounts)
    expect(out.map((a) => a.id)).toEqual(['a1', 'a2'])
  })

  it('resolveAccountsToSync filtrerer til valgte ids', () => {
    const out = resolveAccountsToSync({ sync_account_ids: ['a2'] }, apiAccounts)
    expect(out.map((a) => a.id)).toEqual(['a2'])
  })

  it('syncAccountIdsFromConnection faller tilbake til selected_account_id', () => {
    expect(
      syncAccountIdsFromConnection({
        sync_account_ids: [],
        selected_account_id: 'legacy-1',
      }),
    ).toEqual(['legacy-1'])
  })

  it('maskIban maskerer lang iban', () => {
    expect(maskIban('NO9320001234567')).toBe('NO93 •••• 4567')
  })

  it('accountLabelFromNeonomics bruker displayName', () => {
    expect(accountLabelFromNeonomics(apiAccounts[0]!)).toBe('Lønn')
  })

  it('countPendingByAccountId grupperer rader', () => {
    const m = countPendingByAccountId([
      { externalBankAccountId: 'a1' },
      { externalBankAccountId: 'a1' },
      { externalBankAccountId: 'a2' },
    ])
    expect(m.get('a1')).toBe(2)
    expect(m.get('a2')).toBe(1)
  })
})
