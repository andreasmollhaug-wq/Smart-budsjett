import { beforeEach, describe, expect, it } from 'vitest'
import { countLedgerRunTransactions } from '@/lib/ledgerImport/countLedgerRunTransactions'
import type { LedgerImportRun } from '@/lib/ledgerImport/types'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

function baseRun(id: string): LedgerImportRun {
  return {
    id,
    createdAt: '2026-03-01T12:00:00.000Z',
    sourceId: 'generic',
    profileId: DEFAULT_PROFILE_ID,
    csvProfileId: 'generic_hovedbok_v1',
    fileName: 'test.csv',
    displayName: null,
    rowCountParsed: 2,
    rowCountImported: 2,
    rowCountSkipped: 0,
    errorSummary: null,
  }
}

describe('removeLedgerImportRun modes', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('historyOnly fjerner kun historikk og lar transaksjoner stå', () => {
    const runId = 'ledger-run-a'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      ledgerImportHistory: [baseRun(runId)],
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
              ledgerImportRunId: runId,
            },
          ],
        },
      },
    })

    expect(countLedgerRunTransactions(useStore.getState().people, DEFAULT_PROFILE_ID, runId)).toBe(1)

    const res = useStore.getState().removeLedgerImportRun(runId, 'historyOnly')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.mode).toBe('historyOnly')

    expect(useStore.getState().ledgerImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-a')).toBe(true)
  })

  it('full fjerner tilknyttede transaksjoner og historikk', () => {
    const runId = 'ledger-run-b'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      ledgerImportHistory: [baseRun(runId)],
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
              ledgerImportRunId: runId,
            },
          ],
        },
      },
    })

    const res = useStore.getState().removeLedgerImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.transactionsRemoved).toBe(1)
    expect(res.orphanFullRemoval).toBe(false)

    expect(useStore.getState().ledgerImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-b')).toBe(false)
  })

  it('full uten tilknyttede transaksjoner gir orphanFullRemoval og fjerner historikk', () => {
    const runId = 'ledger-run-c'
    useStore.setState({
      ledgerImportHistory: [{ ...baseRun(runId), rowCountImported: 5 }],
    })

    const res = useStore.getState().removeLedgerImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.transactionsRemoved).toBe(0)
    expect(res.orphanFullRemoval).toBe(true)

    expect(useStore.getState().ledgerImportHistory.some((r) => r.id === runId)).toBe(false)
  })

  it('ukjent id gir not_found', () => {
    const res = useStore.getState().removeLedgerImportRun('finnes-ikke', 'full')
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.reason).toBe('not_found')
  })
})
