'use client'

import { useMemo, type KeyboardEvent } from 'react'
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
  /** Klikk på en kategori-rad: navn, type og sum i tabellen (samme periode som listen). */
  onPickCategory: (categoryName: string, type: 'income' | 'expense', lineTotal: number) => void
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

  const accent = (sectionType: 'income' | 'expense') =>
    sectionType === 'income' ? 'var(--success)' : 'var(--danger)'

  const renderGroup = (
    groups: { parent: ParentCategory | 'unknown'; lines: AggregatedLine[] }[],
    sectionType: 'income' | 'expense',
  ) => (
    <div className="space-y-3">
      {groups.map(({ parent, lines: groupLines }) => {
        const groupTotal = groupLines.reduce((a, l) => a + l.sum, 0)
        const label =
          parent === 'unknown' ? 'Ukjent kategori' : PARENT_LABEL[parent as ParentCategory]
        const n = groupLines.length
        const categoryWord = n === 1 ? 'kategori' : 'kategorier'

        return (
          <div
            key={`${sectionType}-${parent}`}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-left">
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--text)' }}>
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {n} {categoryWord}
                </p>
              </div>
              <p
                className="shrink-0 font-semibold tabular-nums text-sm sm:text-base"
                style={{ color: accent(sectionType) }}
              >
                {sectionType === 'income' ? '+' : '-'}
                {formatNOK(groupTotal)}
              </p>
            </div>

            <div className="overflow-x-auto mt-2 px-0 pb-1" style={{ background: 'var(--surface)' }}>
              <table className="w-full min-w-[16rem] text-sm border-collapse">
                <caption className="sr-only">
                  {label}: faktiske beløp per kategori
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="text-left py-2 px-4 font-medium align-middle"
                      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      Kategori
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 px-4 font-medium align-middle whitespace-nowrap tabular-nums"
                      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Beløp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupLines.map((line) => {
                    const pick = () => onPickCategory(line.categoryName, line.type, line.sum)
                    const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        pick()
                      }
                    }
                    return (
                      <tr
                        key={`${line.categoryName}-${line.type}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Vis transaksjoner for ${line.categoryName}`}
                        onClick={pick}
                        onKeyDown={onRowKeyDown}
                        className="cursor-pointer transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]"
                        style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <td className="py-2.5 px-4 align-middle max-w-[min(100%,20rem)]">
                          <div className="flex items-start gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                              style={{ background: line.isUnknown ? 'var(--text-muted)' : colorFor(line.categoryName) }}
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <span className="block text-sm truncate" title={line.categoryName}>
                                {line.categoryName}
                              </span>
                              {line.isUnknown && (
                                <span className="block text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  Finnes ikke i budsjettkategorier
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td
                          className="py-2.5 px-4 text-right align-middle tabular-nums font-semibold text-sm whitespace-nowrap"
                          style={{ color: accent(sectionType) }}
                        >
                          {sectionType === 'income' ? '+' : '-'}
                          {formatNOK(line.sum)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
        Sammendrag etter kategori (faktisk)
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Summer fra transaksjoner i valgt periode med gjeldende filtre. Klikk en linje for å se detaljer og enkeltdokumenter
        (du kan også åpne full liste derfra).
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
