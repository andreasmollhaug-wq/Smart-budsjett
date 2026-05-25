import { describe, expect, it } from 'vitest'
import { mapNeonomicsTransactionsToSyncRows } from '@/lib/neonomics/mapToBankParsedRows'
import type { NeonomicsTransaction } from '@/lib/neonomics/transactions'

describe('mapNeonomicsTransactionsToSyncRows', () => {
  it('mapper transaksjon til BankParsedRow med externalBankTxId', () => {
    const txs: NeonomicsTransaction[] = [
      {
        id: 'tx-abc-123',
        bookingDate: '2024-06-15',
        valueDate: '2024-06-16',
        creditDebitIndicator: 'DBIT',
        transactionAmount: { value: '-499.50', currency: 'NOK' },
        counterpartyName: 'Butikk AS',
        transactionReference: 'Ref 1',
      },
    ]
    const rows = mapNeonomicsTransactionsToSyncRows(txs)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.externalBankTxId).toBe('tx-abc-123')
    expect(rows[0]!.amount).toBe(499.5)
    expect(rows[0]!.transactionType).toBe('expense')
    expect(rows[0]!.dateIso).toBe('2024-06-15')
    expect(rows[0]!.forklaringRaw).toContain('Butikk AS')
    expect(rows[0]!.mappingKey).toMatch(/^expense\t/)
  })

  it('hopper over rader uten id', () => {
    const rows = mapNeonomicsTransactionsToSyncRows([{ id: '', bookingDate: '2024-01-01' }])
    expect(rows).toHaveLength(0)
  })

  it('setter konto-metadata når account-kontekst er med', () => {
    const rows = mapNeonomicsTransactionsToSyncRows(
      [
        {
          id: 'tx-1',
          creditDebitIndicator: 'DBIT',
          transactionAmount: { value: '10' },
        },
      ],
      { accountId: 'acc-1', accountLabel: 'Lønnskonto' },
    )
    expect(rows[0]!.externalBankAccountId).toBe('acc-1')
    expect(rows[0]!.externalBankAccountLabel).toBe('Lønnskonto')
  })

  it('tolker CRDT som inntekt', () => {
    const rows = mapNeonomicsTransactionsToSyncRows([
      {
        id: 'in-1',
        creditDebitIndicator: 'CRDT',
        transactionAmount: { value: '1000' },
      },
    ])
    expect(rows[0]!.transactionType).toBe('income')
  })
})
