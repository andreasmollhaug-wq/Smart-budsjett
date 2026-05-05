'use client'

import ImportCategoryPicker from '@/components/konto/ImportCategoryPicker'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BankMappingAggregateRow } from '@/lib/bankImport/bankImportUiHelpers'
import type { BudgetCategory } from '@/lib/store'

export type BankImportMappingAggregateListsProps = {
  incomeList: BankMappingAggregateRow[]
  expenseList: BankMappingAggregateRow[]
  /** list: vis rader; empty-file: ingen slike linjer i filen; hidden: ingen i gjeldende visning (f.eks. filtrert bort) */
  incomeSectionMode: 'list' | 'empty-file' | 'hidden'
  expenseSectionMode: 'list' | 'empty-file' | 'hidden'
  /** Root wrapper, e.g. scroll area with max-height */
  className?: string
  formatNOK: (amount: number) => string
  allPickerCategories: BudgetCategory[]
  resolvedCategoryName: (primaryMappingKey: string) => string
  onCategoryChange: (aggregate: BankMappingAggregateRow, categoryName: string | null) => void
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  addBudgetCategory: (c: BudgetCategory) => void
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  /** Unik suffiks når listen rendres flere steder (unngå dupliserte felt-id). */
  fieldIdScope?: string
}

function AggregateRows({
  items,
  transactionType,
  formatNOK,
  allPickerCategories,
  resolvedCategoryName,
  onCategoryChange,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  fieldIdScope,
}: {
  items: BankMappingAggregateRow[]
  transactionType: 'income' | 'expense'
  formatNOK: (amount: number) => string
  allPickerCategories: BudgetCategory[]
  resolvedCategoryName: (primaryMappingKey: string) => string
  onCategoryChange: (aggregate: BankMappingAggregateRow, categoryName: string | null) => void
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  addBudgetCategory: (c: BudgetCategory) => void
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  fieldIdScope: string
}) {
  const cats = allPickerCategories.filter((c) => c.type === transactionType)
  const scope = fieldIdScope ? `-${fieldIdScope}` : ''
  return (
    <ul className="m-0 list-none divide-y divide-[color:var(--border)] p-0">
      {items.map((a) => (
        <li key={a.mappingKey} className="min-w-0 space-y-2 px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium m-0 break-words" style={{ color: 'var(--text)' }}>
                {a.exampleForklaring}
              </p>
              <p className="text-xs tabular-nums m-0 mt-1" style={{ color: 'var(--text-muted)' }}>
                {a.rowCount} rad{a.rowCount === 1 ? '' : 'er'} · {formatNOK(a.sumAmount)}
              </p>
            </div>
          </div>
          <ImportCategoryPicker
            fieldId={`bank-map${scope}-${a.mappingKey}`}
            value={resolvedCategoryName(a.mappingKey)}
            onChange={(name) => onCategoryChange(a, name)}
            categories={cats}
            budgetCategories={budgetCategories}
            customBudgetLabels={customBudgetLabels}
            addBudgetCategory={addBudgetCategory}
            addCustomBudgetLabel={addCustomBudgetLabel}
          />
        </li>
      ))}
    </ul>
  )
}

export default function BankImportMappingAggregateLists({
  incomeList,
  expenseList,
  incomeSectionMode,
  expenseSectionMode,
  className = '',
  formatNOK,
  allPickerCategories,
  resolvedCategoryName,
  onCategoryChange,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  fieldIdScope = '',
}: BankImportMappingAggregateListsProps) {
  const scope = fieldIdScope
  return (
    <div className={className}>
      <div className="space-y-6">
        {incomeSectionMode !== 'hidden' && (
          <section className="min-w-0">
            <h3 className="text-sm font-semibold m-0 mb-2" style={{ color: 'var(--text)' }}>
              Inntekt
            </h3>
            {incomeSectionMode === 'empty-file' ? (
              <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                Ingen inntektslinjer i denne filen.
              </p>
            ) : (
              <AggregateRows
                items={incomeList}
                transactionType="income"
                formatNOK={formatNOK}
                allPickerCategories={allPickerCategories}
                resolvedCategoryName={resolvedCategoryName}
                onCategoryChange={onCategoryChange}
                budgetCategories={budgetCategories}
                customBudgetLabels={customBudgetLabels}
                addBudgetCategory={addBudgetCategory}
                addCustomBudgetLabel={addCustomBudgetLabel}
                fieldIdScope={scope}
              />
            )}
          </section>
        )}
        {expenseSectionMode !== 'hidden' && (
          <section className="min-w-0">
            <h3 className="text-sm font-semibold m-0 mb-2" style={{ color: 'var(--text)' }}>
              Utgift
            </h3>
            {expenseSectionMode === 'empty-file' ? (
              <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                Ingen utgiftslinjer i denne filen.
              </p>
            ) : (
              <AggregateRows
                items={expenseList}
                transactionType="expense"
                formatNOK={formatNOK}
                allPickerCategories={allPickerCategories}
                resolvedCategoryName={resolvedCategoryName}
                onCategoryChange={onCategoryChange}
                budgetCategories={budgetCategories}
                customBudgetLabels={customBudgetLabels}
                addBudgetCategory={addBudgetCategory}
                addCustomBudgetLabel={addCustomBudgetLabel}
                fieldIdScope={scope}
              />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
