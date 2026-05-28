import { beforeEach, describe, expect, it } from 'vitest'
import { applyDottirAiTransactionAction } from '@/lib/dottirAiActions/applyTransaction'
import { validateProposedAction, isValidatedTransactionAction } from '@/lib/dottirAiActions/validate'
import { DEFAULT_PROFILE_ID, resetStoreForLogout, useStore } from '@/lib/store'

describe('applyDottirAiTransactionAction', () => {
  beforeEach(() => {
    resetStoreForLogout()
  })

  it('adds expense transaction', () => {
    const validated = validateProposedAction(useStore.getState(), {
      kind: 'transaction',
      date: '2026-01-15',
      description: 'Rema 1000',
      amountNok: 847,
      categoryName: 'Mat & dagligvarer',
      type: 'expense',
    })
    expect(isValidatedTransactionAction(validated)).toBe(true)
    if (!isValidatedTransactionAction(validated)) return

    applyDottirAiTransactionAction(useStore.getState(), validated)
    const txs = useStore.getState().people[DEFAULT_PROFILE_ID]!.transactions
    expect(txs.length).toBe(1)
    expect(txs[0]!.description).toBe('Rema 1000')
    expect(txs[0]!.amount).toBe(847)
  })
})
