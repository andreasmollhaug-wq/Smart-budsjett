import { applyDottirAiBudgetAction } from '@/lib/dottirAiActions/applyBudget'
import { applyDottirAiTransactionAction } from '@/lib/dottirAiActions/applyTransaction'
import {
  isValidatedBudgetAction,
  isValidatedTransactionAction,
  type ValidatedAction,
} from '@/lib/dottirAiActions/validate'
import type { AppliedActionSummary } from '@/lib/dottirAiActions/types'
import { useStore } from '@/lib/store'

export type ApplyActionStore = Pick<
  ReturnType<typeof useStore.getState>,
  | 'activeProfileId'
  | 'people'
  | 'addBudgetCategory'
  | 'updateBudgetCategory'
  | 'addCustomBudgetLabel'
  | 'recalcBudgetSpent'
  | 'addTransaction'
>

export function applyDottirAiAction(
  store: ApplyActionStore,
  validated: ValidatedAction,
): AppliedActionSummary {
  if (isValidatedBudgetAction(validated)) {
    return applyDottirAiBudgetAction(store, validated)
  }
  if (isValidatedTransactionAction(validated)) {
    return applyDottirAiTransactionAction(store, validated)
  }
  throw new Error('Kan ikke bruke blokkert handling')
}
