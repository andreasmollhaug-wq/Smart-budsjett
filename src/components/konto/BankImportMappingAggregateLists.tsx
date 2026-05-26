'use client'

import { useId } from 'react'
import ImportCategoryPicker from '@/components/konto/ImportCategoryPicker'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BankMappingAggregateRow } from '@/lib/bankImport/bankImportUiHelpers'
import type { BankParsedRow } from '@/lib/bankImport/types'
import type { BudgetCategory } from '@/lib/store'
import { ChevronDown, ChevronRight, X } from 'lucide-react'

const EXPANDED_ROW_CAP = 20

export type BankImportMappingSearchProps = {
  query: string
  onQueryChange: (q: string) => void
  filteredGroupCount?: number
  totalGroupCount?: number
  id?: string
}

export function BankImportMappingSearch({
  query,
  onQueryChange,
  filteredGroupCount,
  totalGroupCount,
  id: idProp,
}: BankImportMappingSearchProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const trimmed = query.trim()
  const showCount =
    trimmed.length > 0 &&
    filteredGroupCount !== undefined &&
    totalGroupCount !== undefined

  return (
    <div className="space-y-1.5 min-w-0">
      <label htmlFor={id} className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Søk i transaksjoner
      </label>
      <div className="relative min-w-0">
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Søk i beskrivelse …"
          autoComplete="off"
          className="w-full rounded-xl border px-3 py-3 pr-11 text-sm min-h-[44px] touch-manipulation min-w-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        {trimmed.length > 0 && (
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg touch-manipulation"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => onQueryChange('')}
            aria-label="Tøm søk"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </div>
      <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
        Søk i beskrivelse — viser grupper med treff
        {showCount ? ` (${filteredGroupCount} av ${totalGroupCount})` : ''}
      </p>
    </div>
  )
}

export type BankImportMappingAggregateListsProps = {
  incomeList: BankMappingAggregateRow[]
  expenseList: BankMappingAggregateRow[]
  incomeSectionMode: 'list' | 'empty-file' | 'hidden'
  expenseSectionMode: 'list' | 'empty-file' | 'hidden'
  className?: string
  formatNOK: (amount: number) => string
  formatDate: (iso: string) => string
  allPickerCategories: BudgetCategory[]
  resolvedCategoryName: (primaryMappingKey: string) => string
  onAggregateCategoryChange: (aggregate: BankMappingAggregateRow, categoryName: string | null) => void
  rowsByMappingKey: Map<string, BankParsedRow[]>
  expandedKeys: Set<string>
  onToggleExpanded: (mappingKey: string) => void
  resolveRowCategoryName: (row: BankParsedRow) => string
  onRowCategoryChange: (row: BankParsedRow, categoryName: string | null) => void
  aggregateCategoryName: (mappingKey: string) => string
  budgetCategories: BudgetCategory[]
  customBudgetLabels: Record<ParentCategory, string[]>
  addBudgetCategory: (c: BudgetCategory) => void
  addCustomBudgetLabel: (parent: ParentCategory, name: string) => void
  fieldIdScope?: string
}

function AggregateRows({
  items,
  transactionType,
  formatNOK,
  formatDate,
  allPickerCategories,
  resolvedCategoryName,
  onAggregateCategoryChange,
  rowsByMappingKey,
  expandedKeys,
  onToggleExpanded,
  resolveRowCategoryName,
  onRowCategoryChange,
  aggregateCategoryName,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  fieldIdScope,
}: {
  items: BankMappingAggregateRow[]
  transactionType: 'income' | 'expense'
  formatNOK: (amount: number) => string
  formatDate: (iso: string) => string
  allPickerCategories: BudgetCategory[]
  resolvedCategoryName: (primaryMappingKey: string) => string
  onAggregateCategoryChange: (aggregate: BankMappingAggregateRow, categoryName: string | null) => void
  rowsByMappingKey: Map<string, BankParsedRow[]>
  expandedKeys: Set<string>
  onToggleExpanded: (mappingKey: string) => void
  resolveRowCategoryName: (row: BankParsedRow) => string
  onRowCategoryChange: (row: BankParsedRow, categoryName: string | null) => void
  aggregateCategoryName: (mappingKey: string) => string
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
      {items.map((a) => {
        const canExpand = a.rowCount > 1
        const isExpanded = canExpand && expandedKeys.has(a.mappingKey)
        const panelId = `bank-map-rows${scope}-${a.mappingKey}`
        const childRows = rowsByMappingKey.get(a.mappingKey) ?? []
        const visibleRows = isExpanded ? childRows.slice(0, EXPANDED_ROW_CAP) : []
        const hiddenCount = Math.max(0, childRows.length - EXPANDED_ROW_CAP)

        return (
          <li key={a.mappingKey} className="min-w-0 space-y-2 px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-start gap-2 min-w-0">
              {canExpand ? (
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center min-h-[44px] min-w-[44px] rounded-lg touch-manipulation"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  aria-label={isExpanded ? 'Skjul enkeltrader' : 'Vis enkeltrader'}
                  onClick={() => onToggleExpanded(a.mappingKey)}
                >
                  {isExpanded ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
                </button>
              ) : (
                <span className="inline-block shrink-0 min-w-[44px]" aria-hidden />
              )}
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
              onChange={(name) => onAggregateCategoryChange(a, name)}
              categories={cats}
              budgetCategories={budgetCategories}
              customBudgetLabels={customBudgetLabels}
              addBudgetCategory={addBudgetCategory}
              addCustomBudgetLabel={addCustomBudgetLabel}
            />
            {isExpanded && (
              <div
                id={panelId}
                className="rounded-xl border overflow-hidden min-w-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <ul className="m-0 list-none divide-y divide-[color:var(--border)] p-0 max-h-[min(40vh,16rem)] overflow-y-auto">
                  {visibleRows.map((row) => {
                    const rowCat = resolveRowCategoryName(row)
                    const aggCat = aggregateCategoryName(a.mappingKey)
                    const hasRowOverride = !!rowCat && rowCat !== aggCat
                    return (
                      <li key={row.fileLine} className="min-w-0 space-y-2 px-3 py-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 min-w-0">
                          <p className="text-xs m-0 tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(row.dateIso)}
                          </p>
                          <p className="text-xs m-0 tabular-nums shrink-0 font-medium" style={{ color: 'var(--text)' }}>
                            {formatNOK(row.amount)}
                          </p>
                        </div>
                        <p className="text-xs m-0 break-words" style={{ color: 'var(--text)' }}>
                          {row.forklaringRaw}
                        </p>
                        {hasRowOverride && (
                          <p className="text-[11px] m-0" style={{ color: 'var(--primary)' }}>
                            Kun denne raden
                          </p>
                        )}
                        <ImportCategoryPicker
                          fieldId={`bank-map-row${scope}-${row.fileLine}`}
                          value={rowCat}
                          onChange={(name) => onRowCategoryChange(row, name)}
                          categories={cats}
                          budgetCategories={budgetCategories}
                          customBudgetLabels={customBudgetLabels}
                          addBudgetCategory={addBudgetCategory}
                          addCustomBudgetLabel={addCustomBudgetLabel}
                        />
                      </li>
                    )
                  })}
                </ul>
                {hiddenCount > 0 && (
                  <p className="text-xs m-0 px-3 py-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    … og {hiddenCount} til
                  </p>
                )}
              </div>
            )}
          </li>
        )
      })}
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
  formatDate,
  allPickerCategories,
  resolvedCategoryName,
  onAggregateCategoryChange,
  rowsByMappingKey,
  expandedKeys,
  onToggleExpanded,
  resolveRowCategoryName,
  onRowCategoryChange,
  aggregateCategoryName,
  budgetCategories,
  customBudgetLabels,
  addBudgetCategory,
  addCustomBudgetLabel,
  fieldIdScope = '',
}: BankImportMappingAggregateListsProps) {
  const sharedRowProps = {
    formatNOK,
    formatDate,
    allPickerCategories,
    resolvedCategoryName,
    onAggregateCategoryChange,
    rowsByMappingKey,
    expandedKeys,
    onToggleExpanded,
    resolveRowCategoryName,
    onRowCategoryChange,
    aggregateCategoryName,
    budgetCategories,
    customBudgetLabels,
    addBudgetCategory,
    addCustomBudgetLabel,
    fieldIdScope,
  }

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
            ) : incomeList.length === 0 ? (
              <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                Ingen treff i inntekt.
              </p>
            ) : (
              <AggregateRows items={incomeList} transactionType="income" {...sharedRowProps} />
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
            ) : expenseList.length === 0 ? (
              <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
                Ingen treff i utgift.
              </p>
            ) : (
              <AggregateRows items={expenseList} transactionType="expense" {...sharedRowProps} />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
