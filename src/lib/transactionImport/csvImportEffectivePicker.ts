import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { emptyLabelLists } from '@/lib/budgetCategoryCatalog'
import { buildZeroBudgetCategory } from '@/lib/createBudgetCategoryZero'
import type { PersonData, BudgetCategory } from '@/lib/store'
import type { ParsedTransactionRow } from '@/lib/transactionImport/parseTransactionCsv'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'

const DEFAULT_EXPENSE_PARENT: ParentCategory = 'utgifter'

function parentHintForCategory(
  catName: string,
  rows: { categoryRaw: string; parentCategoryHint: ParentCategory }[],
): ParentCategory {
  const match = rows.find((r) => r.categoryRaw.trim() === catName)
  return match?.parentCategoryHint ?? DEFAULT_EXPENSE_PARENT
}

/**
 * Speiler kategoriene som etter `runImport` ville vært tilgjengelige i picker (inkl. godkjente ukjente som Zero-rader).
 */
export function buildEffectivePickerCategoriesForCsvImport(
  person: PersonData,
  unknownList: string[],
  unknownApproval: Record<string, boolean>,
  parsedRows: ParsedTransactionRow[],
): BudgetCategory[] {
  const empty = emptyLabelLists()
  const lists = {
    customBudgetLabels: person.customBudgetLabels ?? empty.customBudgetLabels,
    hiddenBudgetLabels: person.hiddenBudgetLabels ?? empty.hiddenBudgetLabels,
  }
  let hypothetical = mergeBudgetCategoriesForTransactionPicker(person.budgetCategories, lists)
  const rejected = new Set(unknownList.filter((u) => unknownApproval[u] === false))
  const seen = new Set(hypothetical.map((c) => c.name))
  for (const u of unknownList) {
    if (!unknownApproval[u] || rejected.has(u.trim())) continue
    if (!seen.has(u)) {
      const hint = parentHintForCategory(u, parsedRows)
      const isIncome = hint === 'inntekter'
      hypothetical.push(
        buildZeroBudgetCategory(u, hint, isIncome ? 'income' : 'expense', hypothetical.length),
      )
      seen.add(u)
    }
  }
  return hypothetical
}
