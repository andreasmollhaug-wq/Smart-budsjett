'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import { REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import { useActivePersonFinance } from '@/lib/store'
import type { BudgetCategory } from '@/lib/store'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'
import {
  isIsoDateString,
  todayIsoLocal,
  transactionInPeriod,
  transactionOnOrBeforeToday,
  type TransactionPeriodMode,
} from '@/lib/transactionPeriodFilter'

function safeDecodeCategoryParam(raw: string): string {
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

function parentRank(c: BudgetCategory): number {
  const i = REPORT_GROUP_ORDER.indexOf(c.parentCategory)
  return i === -1 ? 999 : i
}

function compareCategoriesForPicker(a: BudgetCategory, b: BudgetCategory): number {
  if (a.type !== b.type) return a.type === 'income' ? -1 : 1
  const ra = parentRank(a)
  const rb = parentRank(b)
  if (ra !== rb) return ra - rb
  return a.name.localeCompare(b.name, 'nb')
}

/**
 * Felles filtre for transaksjonsliste og transaksjonsdashboard (år, måned/YTD/hele året, kategori, søk).
 * Synkroniseres med query (?year=&month=&category=) som budsjett-dashboard lenker til.
 *
 * Én useActivePersonFinance()-kilde (unngår dobbelt abonnement sammen med liste-siden).
 */
export function useTransaksjonerFilters() {
  const searchParams = useSearchParams()
  const finance = useActivePersonFinance()
  const {
    transactions,
    budgetCategories,
    budgetYear,
    customBudgetLabels,
    hiddenBudgetLabels,
    activeProfileId,
  } = finance

  const categoriesForPicker = useMemo(
    () =>
      mergeBudgetCategoriesForTransactionPicker(budgetCategories, {
        customBudgetLabels,
        hiddenBudgetLabels,
      }),
    [budgetCategories, customBudgetLabels, hiddenBudgetLabels],
  )

  const [filterYear, setFilterYear] = useState(budgetYear)
  const [filterMonth, setFilterMonth] = useState<TransactionPeriodMode>('ytd')
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all')
  const [filterParent, setFilterParent] = useState<ParentCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const querySignature = searchParams.toString()

  useEffect(() => {
    const params = new URLSearchParams(querySignature)
    const y = params.get('year')
    const m = params.get('month')
    const c = params.get('category')

    if (y !== null) {
      const yn = parseInt(y, 10)
      if (Number.isFinite(yn)) setFilterYear(yn)
    } else {
      setFilterYear(budgetYear)
    }

    if (m !== null) {
      if (m === 'all') setFilterMonth('all')
      else if (m === 'ytd') setFilterMonth('ytd')
      else {
        const mi = parseInt(m, 10)
        if (Number.isFinite(mi) && mi >= 0 && mi <= 11) setFilterMonth(mi)
      }
    }

    if (c !== null && c.trim() !== '') {
      setFilterCategory(safeDecodeCategoryParam(c))
    }
  }, [budgetYear, querySignature])

  const expenseCategories = useMemo(
    () => categoriesForPicker.filter((c) => c.type === 'expense'),
    [categoriesForPicker],
  )
  const incomeCategories = useMemo(
    () => categoriesForPicker.filter((c) => c.type === 'income'),
    [categoriesForPicker],
  )
  const allCats = useMemo(
    () => [...expenseCategories, ...incomeCategories],
    [expenseCategories, incomeCategories],
  )

  useEffect(() => {
    if (filterCategory === 'all') return
    if (allCats.some((c) => c.name === filterCategory)) return
    if (transactions.some((t) => t.category === filterCategory)) return
    setFilterCategory('all')
  }, [allCats, filterCategory, transactions])

  const yearOptions = useMemo(() => {
    const y = new Set<number>([budgetYear, new Date().getFullYear(), filterYear])
    for (const t of transactions) {
      const d = t.date
      if (!d || typeof d !== 'string') continue
      const yy = parseInt(d.slice(0, 4), 10)
      if (Number.isFinite(yy)) y.add(yy)
    }
    return [...y].sort((a, b) => b - a)
  }, [transactions, budgetYear, filterYear])

  const txInPeriod = useMemo(
    () =>
      transactions.filter((t) => transactionInPeriod(t, filterMonth, filterYear)),
    [transactions, filterMonth, filterYear],
  )

  const categoryOptions = useMemo(
    () => [...allCats].sort(compareCategoriesForPicker),
    [allCats],
  )

  const displayFilteredTx = useMemo(() => {
    let list = txInPeriod
    if (filterParent !== 'all') {
      list = list.filter((t) => {
        const meta = allCats.find((c) => c.name === t.category && c.type === t.type)
        return meta?.parentCategory === filterParent
      })
    }
    if (filterCategory !== 'all') list = list.filter((t) => t.category === filterCategory)
    const q = searchQuery.trim().toLowerCase()
    if (q) list = list.filter((t) => (t.description ?? '').toLowerCase().includes(q))
    return list
  }, [txInPeriod, filterParent, filterCategory, searchQuery, allCats])

  const displayFilteredTxForKpis = useMemo(
    () => displayFilteredTx.filter((t) => transactionOnOrBeforeToday(t)),
    [displayFilteredTx],
  )

  const hasFutureDatedInPeriod = useMemo(() => {
    const today = todayIsoLocal()
    return displayFilteredTx.some(
      (t) => typeof t.date === 'string' && isIsoDateString(t.date) && t.date > today,
    )
  }, [displayFilteredTx])

  const periodIncome = displayFilteredTxForKpis
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const periodExpense = displayFilteredTxForKpis
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)

  const filtersActive =
    filterCategory !== 'all' || searchQuery.trim() !== '' || filterParent !== 'all'

  const clearFilters = () => {
    setFilterCategory('all')
    setFilterParent('all')
    setSearchQuery('')
  }

  return {
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    filterCategory,
    setFilterCategory,
    filterParent,
    setFilterParent,
    searchQuery,
    setSearchQuery,
    transactions,
    budgetCategories,
    expenseCategories,
    incomeCategories,
    allCats,
    yearOptions,
    txInPeriod,
    categoryOptions,
    displayFilteredTx,
    displayFilteredTxForKpis,
    hasFutureDatedInPeriod,
    periodIncome,
    periodExpense,
    filtersActive,
    clearFilters,
    addTransaction: finance.addTransaction,
    addTransactions: finance.addTransactions,
    removeTransaction: finance.removeTransaction,
    updateTransaction: finance.updateTransaction,
    recalcBudgetSpent: finance.recalcBudgetSpent,
    isHouseholdAggregate: finance.isHouseholdAggregate,
    profiles: finance.profiles,
    customBudgetLabels: finance.customBudgetLabels,
    addBudgetCategory: finance.addBudgetCategory,
    addCustomBudgetLabel: finance.addCustomBudgetLabel,
    activeProfileId,
  }
}
