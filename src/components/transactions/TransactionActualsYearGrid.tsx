'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { buildCategoryActualsYearMatrix } from '@/lib/bankReportData'
import { transactionsListeHrefForCategory } from '@/lib/budgetDashboardLinks'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { BudgetCategory, Transaction } from '@/lib/store'
import { formatNOK } from '@/lib/utils'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

const COST_GROUPS: ParentCategory[] = ['regninger', 'utgifter', 'gjeld', 'sparing']

const GROUPS: { id: ParentCategory; label: string; icon: string }[] = [
  { id: 'inntekter', label: 'Inntekter', icon: '💰' },
  { id: 'regninger', label: 'Regninger', icon: '🧾' },
  { id: 'utgifter', label: 'Utgifter', icon: '🛒' },
  { id: 'gjeld', label: 'Gjeld', icon: '💳' },
  { id: 'sparing', label: 'Sparing', icon: '🐷' },
]

function groupLabel(id: ParentCategory): string {
  return GROUPS.find((g) => g.id === id)?.label ?? id
}

function sumRow(arr: number[] | undefined): number {
  if (!arr) return 0
  return arr.reduce((a, b) => a + b, 0)
}

type Props = {
  year: number
  categories: BudgetCategory[]
  transactions: Transaction[]
}

export default function TransactionActualsYearGrid({ year, categories, transactions }: Props) {
  const matrix = useMemo(
    () => buildCategoryActualsYearMatrix(transactions, year, categories),
    [transactions, year, categories],
  )

  const getCategoriesForGroup = (group: ParentCategory) =>
    categories.filter((c) => c.parentCategory === group)

  const sumActualForMonth = (group: ParentCategory, monthIndex: number) =>
    getCategoriesForGroup(group).reduce((sum, c) => sum + (matrix.get(c.name)?.[monthIndex] ?? 0), 0)

  const sumActualYearForGroup = (group: ParentCategory) =>
    getCategoriesForGroup(group).reduce((sum, c) => sum + sumRow(matrix.get(c.name)), 0)

  const getTotalCostsForMonth = (monthIndex: number) =>
    COST_GROUPS.reduce((s, g) => s + sumActualForMonth(g, monthIndex), 0)

  const getResultForMonth = (monthIndex: number) =>
    sumActualForMonth('inntekter', monthIndex) - getTotalCostsForMonth(monthIndex)

  const totalCostsYear = COST_GROUPS.reduce((s, g) => s + sumActualYearForGroup(g), 0)
  const totalIncomeYear = sumActualYearForGroup('inntekter')
  const resultYear = totalIncomeYear - totalCostsYear

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    inntekter: true,
    regninger: true,
    utgifter: true,
    gjeld: true,
    sparing: true,
  })

  const hasGroupRows = (group: ParentCategory) => getCategoriesForGroup(group).length > 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <caption
              className="caption-top text-left font-semibold text-base pb-3 px-0"
              style={{ color: 'var(--text)' }}
            >
              Faktisk per måned
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] min-w-[8.5rem] align-bottom"
                  style={{
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                    color: 'var(--text)',
                  }}
                >
                  Post
                </th>
                {MONTH_INDEXES.map((mi) => (
                  <th
                    key={mi}
                    scope="col"
                    className="text-right py-2 px-1 font-medium whitespace-nowrap align-bottom tabular-nums"
                    style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    {MONTHS[mi]}
                  </th>
                ))}
                <th
                  scope="col"
                  className="text-right py-2 pl-2 pr-0 font-semibold whitespace-nowrap align-bottom tabular-nums"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  Totalt
                </th>
              </tr>
            </thead>
            <tbody>
              {hasGroupRows('inntekter') ? (
                <tr>
                  <th
                    scope="row"
                    className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] align-middle font-medium"
                    style={{
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                      color: 'var(--text)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {groupLabel('inntekter')}
                  </th>
                  {MONTH_INDEXES.map((mi) => (
                    <td
                      key={mi}
                      className="text-right py-2 px-1 tabular-nums align-middle"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {formatNOK(sumActualForMonth('inntekter', mi))}
                    </td>
                  ))}
                  <td
                    className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {formatNOK(sumActualYearForGroup('inntekter'))}
                  </td>
                </tr>
              ) : null}
              {COST_GROUPS.filter(hasGroupRows).map((gid) => (
                <tr key={gid}>
                  <th
                    scope="row"
                    className="text-left py-2 pr-3 pl-0 sticky left-0 z-[1] align-middle font-medium"
                    style={{
                      background: 'var(--surface)',
                      boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                      color: 'var(--text)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {groupLabel(gid)}
                  </th>
                  {MONTH_INDEXES.map((mi) => (
                    <td
                      key={mi}
                      className="text-right py-2 px-1 tabular-nums align-middle"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {formatNOK(sumActualForMonth(gid, mi))}
                    </td>
                  ))}
                  <td
                    className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    {formatNOK(sumActualYearForGroup(gid))}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <th
                  scope="row"
                  className="text-left py-2.5 pr-3 pl-0 sticky left-0 z-[1] align-middle"
                  style={{
                    background: 'var(--primary-pale)',
                    boxShadow: '4px 0 8px -4px rgba(0,0,0,0.08)',
                    color: 'var(--primary)',
                    borderTop: '2px solid var(--accent)',
                  }}
                >
                  Resultat
                </th>
                {MONTH_INDEXES.map((mi) => {
                  const r = getResultForMonth(mi)
                  return (
                    <td
                      key={mi}
                      className="text-right py-2.5 px-1 tabular-nums align-middle"
                      style={{
                        borderTop: '2px solid var(--accent)',
                        color: r >= 0 ? '#0CA678' : '#E03131',
                        background: 'var(--primary-pale)',
                      }}
                    >
                      {formatNOK(r)}
                    </td>
                  )
                })}
                <td
                  className="text-right py-2.5 pl-2 pr-0 tabular-nums align-middle"
                  style={{
                    borderTop: '2px solid var(--accent)',
                    color: resultYear >= 0 ? '#0CA678' : '#E03131',
                    background: 'var(--primary-pale)',
                  }}
                >
                  {formatNOK(resultYear)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {GROUPS.map((group) => {
        const items = getCategoriesForGroup(group.id)
        if (items.length === 0) return null
        const isExpanded = expanded[group.id] ?? true
        const groupSum = sumActualYearForGroup(group.id)

        return (
          <div
            key={group.id}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setExpanded({ ...expanded, [group.id]: !isExpanded })}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xl shrink-0">{group.icon}</span>
                <div className="text-left min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>
                    {group.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-sm sm:text-base" style={{ color: 'var(--primary)' }}>
                    {formatNOK(groupSum)}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                ) : (
                  <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="hidden md:block mt-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[320px]">
                  <thead>
                    <tr>
                      <th
                        className="text-left align-middle py-2 px-2 max-w-[14rem] md:max-w-[18rem]"
                        style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        {group.label}
                      </th>
                      {MONTH_INDEXES.map((mi) => (
                        <th
                          key={mi}
                          className="text-center align-middle py-2 px-1"
                          style={{
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            minWidth: 72,
                          }}
                        >
                          {MONTHS[mi]}
                        </th>
                      ))}
                      <th
                        className="text-right align-middle py-2 px-2 whitespace-nowrap"
                        style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        Totalt/år
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((cat) => {
                      const row = matrix.get(cat.name) ?? Array(12).fill(0)
                      return (
                        <tr key={cat.id} className="align-middle" style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="py-2 px-2 align-middle max-w-[14rem] md:max-w-[18rem]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: cat.color }}
                              />
                              <Link
                                href={transactionsListeHrefForCategory('year', year, 0, cat.name)}
                                className="text-sm truncate flex-1 min-w-0 font-medium underline-offset-2 hover:opacity-90"
                                style={{ color: 'var(--primary)' }}
                                title={cat.name}
                              >
                                {cat.name}
                              </Link>
                            </div>
                          </td>
                          {MONTH_INDEXES.map((mi) => (
                            <td
                              key={mi}
                              className="text-right align-middle py-2 px-1 tabular-nums text-sm"
                              style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                            >
                              <Link
                                href={transactionsListeHrefForCategory('month', year, mi, cat.name)}
                                className="block hover:opacity-90 underline-offset-2 decoration-transparent hover:decoration-[var(--primary)]"
                                style={{ color: 'var(--text)' }}
                              >
                                {formatNOK(row[mi] ?? 0)}
                              </Link>
                            </td>
                          ))}
                          <td
                            className="align-middle py-2 px-2 text-xs tabular-nums whitespace-nowrap text-right font-semibold"
                            style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                          >
                            {formatNOK(sumRow(row))}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="align-middle" style={{ background: 'var(--bg)', fontWeight: 600 }}>
                      <td className="py-2 px-2" style={{ color: 'var(--primary)' }}>
                        Total {group.label}
                      </td>
                      {MONTH_INDEXES.map((mi) => (
                        <td
                          key={mi}
                          className="text-right text-xs tabular-nums py-2 px-1"
                          style={{ borderLeft: '1px solid var(--border)', color: 'var(--primary)' }}
                        >
                          {formatNOK(sumActualForMonth(group.id, mi))}
                        </td>
                      ))}
                      <td
                        className="text-right py-2 px-2 text-xs tabular-nums"
                        style={{ borderLeft: '1px solid var(--border)', color: 'var(--primary)' }}
                      >
                        {formatNOK(groupSum)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {isExpanded && (
              <div className="block md:hidden mt-4 space-y-3">
                {items.map((cat) => {
                  const row = matrix.get(cat.name) ?? Array(12).fill(0)
                  return (
                    <div key={cat.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        <Link
                          href={transactionsListeHrefForCategory('year', year, 0, cat.name)}
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--primary)' }}
                        >
                          {cat.name}
                        </Link>
                      </div>
                      <div className="overflow-x-auto -mx-1 px-1">
                        <div className="flex gap-2 min-w-max pb-1">
                          {MONTH_INDEXES.map((mi) => (
                            <div key={mi} className="text-center shrink-0 w-14">
                              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {MONTHS[mi]}
                              </div>
                              <Link
                                href={transactionsListeHrefForCategory('month', year, mi, cat.name)}
                                className="tabular-nums text-xs mt-0.5 block"
                                style={{ color: 'var(--text)' }}
                              >
                                {formatNOK(row[mi] ?? 0)}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-right mt-2 font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        Totalt år: {formatNOK(sumRow(row))}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
