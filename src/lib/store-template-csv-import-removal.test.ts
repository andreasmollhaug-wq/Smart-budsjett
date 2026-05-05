import { beforeEach, describe, expect, it } from 'vitest'
import { countTemplateCsvRunTransactions } from '@/lib/transactionImport/countTemplateCsvRunTransactions'
import type { TemplateCsvImportRun } from '@/lib/transactionImport/templateCsvImportRun'
import { TEMPLATE_CSV_IMPORT_PROFILE_ID } from '@/lib/transactionImport/transactionImport.constants'
import type { BudgetCategory } from '@/lib/store'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

function matCategory(budgetedBase = 100): BudgetCategory {
  return {
    id: 'cat-mat',
    name: 'Mat',
    parentCategory: 'utgifter',
    type: 'expense',
    color: '#000',
    frequency: 'monthly',
    budgeted: Array.from({ length: 12 }, () => budgetedBase),
    spent: 0,
  }
}

function baseTemplateRun(id: string): TemplateCsvImportRun {
  return {
    id,
    createdAt: '2026-03-01T12:00:00.000Z',
    profileId: DEFAULT_PROFILE_ID,
    csvProfileId: TEMPLATE_CSV_IMPORT_PROFILE_ID,
    fileName: 'test.csv',
    displayName: null,
    rowCountParsed: 2,
    rowCountImported: 2,
    rowCountSkipped: 0,
    errorSummary: null,
  }
}

describe('removeTemplateCsvImportRun modes', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('historyOnly fjerner kun historikk og lar transaksjoner stå', () => {
    const runId = 'csv-run-a'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      templateCsvImportHistory: [baseTemplateRun(runId)],
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
              templateCsvImportRunId: runId,
            },
          ],
        },
      },
    })

    expect(countTemplateCsvRunTransactions(useStore.getState().people, DEFAULT_PROFILE_ID, runId)).toBe(1)

    const res = useStore.getState().removeTemplateCsvImportRun(runId, 'historyOnly')
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.mode).toBe('historyOnly')

    expect(useStore.getState().templateCsvImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-a')).toBe(true)
  })

  it('full fjerner tilknyttede transaksjoner og historikk', () => {
    const runId = 'csv-run-b'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      templateCsvImportHistory: [baseTemplateRun(runId)],
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
              templateCsvImportRunId: runId,
            },
          ],
        },
      },
    })

    const res = useStore.getState().removeTemplateCsvImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.transactionsRemoved).toBe(1)
    expect(res.orphanFullRemoval).toBe(false)

    expect(useStore.getState().templateCsvImportHistory.some((r) => r.id === runId)).toBe(false)
    expect(useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions.some((t) => t.id === 'tx-b')).toBe(false)
  })

  it('full med budgetAdjustment reverserer budsjett og fjerner transaksjoner', () => {
    const runId = 'csv-run-budget'
    const p = useStore.getState().people[DEFAULT_PROFILE_ID]!
    useStore.setState({
      budgetYear: 2026,
      people: {
        ...useStore.getState().people,
        [DEFAULT_PROFILE_ID]: {
          ...p,
          budgetCategories: [matCategory()],
          transactions: [],
        },
      },
    })

    const run: TemplateCsvImportRun = {
      ...baseTemplateRun(runId),
      budgetAdjustment: {
        profileId: DEFAULT_PROFILE_ID,
        entries: [{ categoryId: 'cat-mat', monthIndex: 0, deltaApplied: 40 }],
      },
    }
    useStore.getState().addTemplateCsvImportRunWithTransactions(run, [
      {
        id: 'tx-csv-bud',
        date: '2026-01-12',
        description: 'csv imp',
        amount: 40,
        category: 'Mat',
        type: 'expense',
        profileId: DEFAULT_PROFILE_ID,
        templateCsvImportRunId: runId,
      },
    ])

    const afterAdd = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(afterAdd.budgetCategories[0]!.budgeted[0]).toBe(140)

    const res = useStore.getState().removeTemplateCsvImportRun(runId, 'full')
    expect(res.ok).toBe(true)
    if (!res.ok || res.mode !== 'full') return
    expect(res.removedBudgetAdjustment).toBe(true)
    expect(res.transactionsRemoved).toBe(1)

    const afterRemove = useStore.getState().people[DEFAULT_PROFILE_ID]!
    expect(afterRemove.budgetCategories[0]!.budgeted[0]).toBe(100)
    expect(afterRemove.transactions.some((t) => t.templateCsvImportRunId === runId)).toBe(false)
  })
})
