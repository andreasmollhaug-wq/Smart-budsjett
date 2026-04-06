'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActivePersonFinance } from '@/lib/store'
import { mergeBudgetCategoriesForTransactionPicker } from '@/lib/transactionCategoryPicker'

function safeDecodeCategoryParam(raw: string): string {
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

/**
 * Felles filtre for transaksjonsliste og transaksjonsdashboard (år, måned, kategori, søk).
 * Synkroniseres med query (?year=&month=&category=) som budsjett-dashboard lenker til.
 *
 * Én useActivePersonFinance()-kilde (unngår dobbelt abonnement sammen med liste-siden).
 */
export function useTransaksjonerFilters() {
  const searchParams = useSearchParams()
  const finance = useActivePersonFinance()
  const { transactions, budgetCategories, budgetYear, customBudgetLabels, hiddenBudgetLabels } = finance

  const categoriesForPicker = useMemo(
    () =>
      mergeBudgetCategoriesForTransactionPicker(budgetCategories, {
        customBudgetLabels,
        hiddenBudgetLabels,
      }),
    [budgetCategories, customBudgetLabels, hiddenBudgetLabels],
  )

  const [filterYear, setFilterYear] = useState(budgetYear)
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all')
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

  const datePrefix =
    filterMonth === 'all'
      ? `${filterYear}-`
      : `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}`

  const txInPeriod = useMemo(
    () => transactions.filter((t) => typeof t.date === 'string' && t.date.startsWith(datePrefix)),
    [transactions, datePrefix],
  )

  const categoryOptions = useMemo(
    () => [...allCats].sort((a, b) => a.name.localeCompare(b.name, 'nb')),
    [allCats],
  )

  const displayFilteredTx = useMemo(() => {
    let list = txInPeriod
    if (filterCategory !== 'all') list = list.filter((t) => t.category === filterCategory)
    const q = searchQuery.trim().toLowerCase()
    if (q) list = list.filter((t) => (t.description ?? '').toLowerCase().includes(q))
    return list
  }, [txInPeriod, filterCategory, searchQuery])

  const periodIncome = displayFilteredTx
    .filter((t) => t.type === 'income')
    .reduce((a, b) => a + b.amount, 0)
  const periodExpense = displayFilteredTx
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0)

  const filtersActive = filterCategory !== 'all' || searchQuery.trim() !== ''

  const clearFilters = () => {
    setFilterCategory('all')
    setSearchQuery('')
  }

  return {
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    filterCategory,
    setFilterCategory,
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
  }
}
