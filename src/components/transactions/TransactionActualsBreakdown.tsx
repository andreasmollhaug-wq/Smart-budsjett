'use client'

import { useMemo } from 'react'
import type { BudgetCategory, Transaction } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { formatNOK } from '@/lib/utils'

const PARENT_LABEL: Record<ParentCategory, string> = {
  inntekter: 'Inntekter',
  regninger: 'Regninger',
  utgifter: 'Utgifter',
  gjeld: 'Gjeld',
  sparing: 'Sparing',
}

const EXPENSE_PARENT_ORDER: ParentCategory[] = ['regninger', 'utgifter', 'gjeld', 'sparing']

type AggregatedLine = {
  categoryName: string
  sum: number
  type: 'income' | 'expense'
  parent: ParentCategory | 'unknown'
  isUnknown: boolean
}

function aggregateLines(transactions: Transaction[], budgetCategories: BudgetCategory[]): AggregatedLine[] {
  const metaByName = new Map<string, BudgetCategory>()
  for (const c of budgetCategories) {
    metaByName.set(c.name, c)
  }

  const sums = new Map<string, number>()
  for (const t of transactions) {
    const key = `${t.category}\0${t.type}`
    sums.set(key, (sums.get(key) ?? 0) + t.amount)
  }

  const lines: AggregatedLine[] = []
  for (const [key, sum] of sums) {
    const [categoryName, typeStr] = key.split('\0')
    const type = typeStr === 'income' ? 'income' : 'expense'
    const meta = metaByName.get(categoryName)
    if (meta && meta.type === type) {
      lines.push({
        categoryName,
        sum,
        type,
        parent: meta.parentCategory,
        isUnknown: false,
      })
    } else {
      lines.push({
        categoryName,
        sum,
        type,
        parent: 'unknown',
        isUnknown: true,
      })
    }
  }
  return lines
}

function groupByParent(lines: AggregatedLine[], type: 'income' | 'expense'): { parent: ParentCategory | 'unknown'; lines: AggregatedLine[] }[] {
  const order =
    type === 'income'
      ? (['inntekter', 'unknown'] as const)
      : ([...EXPENSE_PARENT_ORDER, 'unknown'] as const)

  const byParent = new Map<ParentCategory | 'unknown', AggregatedLine[]>()
  for (const line of lines) {
    if (line.type !== type) continue
    const list = byParent.get(line.parent) ?? []
    list.push(line)
    byParent.set(line.parent, list)
  }

  const result: { parent: ParentCategory | 'unknown'; lines: AggregatedLine[] }[] = []
  for (const p of order) {
    const list = byParent.get(p)
    if (!list?.length) continue
    list.sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'nb'))
    result.push({ parent: p, lines: list })
  }
  return result
}

type Props = {
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  onPickCategory: (categoryName: string) => void
}

export default function TransactionActualsBreakdown({ transactions, budgetCategories, onPickCategory }: Props) {
  const lines = useMemo(
    () => aggregateLines(transactions, budgetCategories),
    [transactions, budgetCategories],
  )

  const incomeGroups = useMemo(() => groupByParent(lines, 'income'), [lines])
  const expenseGroups = useMemo(() => groupByParent(lines, 'expense'), [lines])

  if (transactions.length === 0) return null

  const colorFor = (name: string) => budgetCategories.find((c) => c.name === name)?.color ?? 'var(--text-muted)'

  const renderGroup = (
    groups: { parent: ParentCategory | 'unknown'; lines: AggregatedLine[] }[],
    sectionType: 'income' | 'expense',
  ) => (
    <div className="space-y-3">
      {groups.map(({ parent, lines: groupLines }) => (
        <details
          key={`${sectionType}-${parent}`}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          open
        >
          <summary
            className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2"
            style={{ color: 'var(--text)' }}
          >
            <span>
              {parent === 'unknown'
                ? 'Ukjent kategori'
                : PARENT_LABEL[parent as ParentCategory]}
            </span>
            <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              {groupLines.length} {groupLines.length === 1 ? 'linje' : 'linjer'}
            </span>
          </summary>
          <ul className="border-t divide-y" style={{ borderColor: 'var(--border)' }}>
            {groupLines.map((line) => (
              <li key={`${line.categoryName}-${line.type}`}>
                <button
                  type="button"
                  onClick={() => onPickCategory(line.categoryName)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-none"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: line.isUnknown ? 'var(--text-muted)' : colorFor(line.categoryName) }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate" style={{ color: 'var(--text)' }}>
                        {line.categoryName}
                      </span>
                      {line.isUnknown && (
                        <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          Finnes ikke i budsjettkategorier
                        </span>
                      )}
                    </span>
                  </span>
                  <span
                    className="tabular-nums font-semibold shrink-0"
                    style={{ color: sectionType === 'income' ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {sectionType === 'income' ? '+' : '-'}
                    {formatNOK(line.sum)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  )

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
        Sammendrag etter kategori (faktisk)
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Summer fra transaksjoner i valgt periode med gjeldende filtre. Klikk en linje for å åpne transaksjonslisten med samme filter.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
            Inntekter
          </h3>
          {incomeGroups.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen inntekter i utvalget.
            </p>
          ) : (
            renderGroup(incomeGroups, 'income')
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
            Utgifter
          </h3>
          {expenseGroups.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen utgifter i utvalget.
            </p>
          ) : (
            renderGroup(expenseGroups, 'expense')
          )}
        </div>
      </div>
    </div>
  )
}
