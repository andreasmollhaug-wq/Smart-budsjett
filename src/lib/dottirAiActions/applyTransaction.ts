import { toAppliedTransactionSummary } from '@/lib/dottirAiActions/validate'
import type { AppliedTransactionSummary, ValidatedTransactionAction } from '@/lib/dottirAiActions/types'
import { useStore } from '@/lib/store'
import { generateId } from '@/lib/utils'

export type ApplyTransactionStore = Pick<
  ReturnType<typeof useStore.getState>,
  'addTransaction' | 'recalcBudgetSpent' | 'activeProfileId'
>

export function applyDottirAiTransactionAction(
  store: ApplyTransactionStore,
  action: ValidatedTransactionAction,
): AppliedTransactionSummary {
  const today = new Date().toISOString().slice(0, 10)
  const plannedFollowUp = action.plannedFollowUp || action.date > today

  store.addTransaction({
    id: generateId(),
    date: action.date,
    description: action.description,
    amount: action.amountNok,
    category: action.categoryName,
    type: action.payload.type,
    ...(action.payload.subcategory ? { subcategory: action.payload.subcategory } : {}),
    ...(plannedFollowUp ? { plannedFollowUp: true as const } : {}),
    ...(action.payload.type === 'income' && action.payload.incomeIsNet === false
      ? {
          incomeIsNet: false as const,
          ...(typeof action.payload.incomeWithholdingPercent === 'number'
            ? { incomeWithholdingPercent: action.payload.incomeWithholdingPercent }
            : {}),
        }
      : {}),
  })

  store.recalcBudgetSpent(action.categoryName)

  return toAppliedTransactionSummary(action)
}
