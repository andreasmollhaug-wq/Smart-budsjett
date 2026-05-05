import { beforeEach, describe, expect, it } from 'vitest'
import { countBankRunTransactions } from '@/lib/bankImport/countBankRunTransactions'
import type { BankImportRun } from '@/lib/bankImport/types'
import { BANK_IMPORT_PROFILE_ID } from '@/lib/bankImport/bankImport.constants'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

function baseBankRun(id: string): BankImportRun {
  return {
    id,
    createdAt: '2026-03-01T12:00:00.000Z',
    sourceId: 'dnb_sbanken',
    profileId: DEFAULT_PROFILE_ID,
    csvProfileId: BANK_IMPORT_PROFILE_ID,
    fileName: 'test.xlsx',
    displayName: null,
    rowCountParsed: 2,
    rowCountImported: 2,
    rowCountSkipped: 0,
    errorSummary: null,
  }
}

describe('removeBankImportRun modes', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('historyOnly fjerner kun historikk og lar transaksjoner stå', () => {
    const runId = 'bank-run-a'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      bankImportHistory: [baseBankRun(runId)],
      people: {
        ...useStore.getState().people,
        [DEFAULT_PROFILE_ID]: {
          ...p,
          transactions: [
            {
              id: 'tx-a',
              date: '2026-01-15',
              description: 'imp',
              amount: 50,
              category: 'Mat',
              type: 'expense',
              profileId: DEFAULT_PROFILE_ID,
              bankImportRunId: runId,
            },
          ],
        },
      },
    })

    expect(countBankRunTransactions(useStore.getState().people, DEFAULT_PROFILE_ID, runId)).toBe(1)

    const res = useStore.getState().removeBankImportRun(runId, 'historyOnly')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.mode).toBe('historyOnly')

    expect(useStore.getState().bankImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-a')).toBe(true)
  })

  it('full fjerner tilknyttede transaksjoner og historikk', () => {
    const runId = 'bank-run-b'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      bankImportHistory: [baseBankRun(runId)],
      people: {
        ...useStore.getState().people,
        [DEFAULT_PROFILE_ID]: {
          ...p,
          transactions: [
            {
              id: 'tx-b',
              date: '2026-02-01',
              description: 'imp',
              amount: 99,
              category: 'Mat',
              type: 'expense',
              profileId: DEFAULT_PROFILE_ID,
              bankImportRunId: runId,
            },
          ],
        },
      },
    })

    const res = useStore.getState().removeBankImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.transactionsRemoved).toBe(1)
    expect(res.orphanFullRemoval).toBe(false)

    expect(useStore.getState().bankImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-b')).toBe(false)
  })

  it('full uten tilknyttede transaksjoner gir orphanFullRemoval', () => {
    const runId = 'bank-run-c'
    useStore.setState({
      bankImportHistory: [{ ...baseBankRun(runId), rowCountImported: 5 }],
    })

    const res = useStore.getState().removeBankImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.transactionsRemoved).toBe(0)
    expect(res.orphanFullRemoval).toBe(true)

    expect(useStore.getState().bankImportHistory.some((r) => r.id === runId)).toBe(false)
  })
})
