'use client'

import { Suspense, useId, useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionActualsBreakdown from '@/components/transactions/TransactionActualsBreakdown'
import TransactionActualsCategoryModal from '@/components/transactions/TransactionActualsCategoryModal'
import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import { REPORT_GROUP_LABELS, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { Transaction } from '@/lib/store'
import { isIsoDateString, kpiSubForTransactionPeriod, todayIsoLocal } from '@/lib/transactionPeriodFilter'
import { uniqueDescriptionsForDatalist } from '@/lib/transactionDescriptionSuggestions'
import { useIsMinMdScreen } from '@/lib/useIsNarrowScreen'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

const MONTHS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

const KPI_INCOME_HEX = '#0CA678'
const KPI_EXPENSE_HEX = '#E03131'
const KPI_NET_POSITIVE_HEX = '#0CA678'
const KPI_NET_NEGATIVE_HEX = '#E03131'

function buildTransaksjonerListeHref(
  year: number,
  month: number | 'all' | 'ytd',
  category: string,
): string {
  const p = new URLSearchParams()
  p.set('year', String(year))
  p.set('month', month === 'all' ? 'all' : month === 'ytd' ? 'ytd' : String(month))
  p.set('category', category)
  return `/transaksjoner?${p.toString()}`
}

function TransaksjonerDashboardInner() {
  const { formatNOK } = useNokDisplayFormatters()
  const {
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
    allCats,
    yearOptions,
    categoryOptions,
    displayFilteredTx,
    hasFutureDatedInPeriod,
    periodIncome,
    periodExpense,
    filtersActive,
    clearFilters,
    profiles,
    isHouseholdAggregate,
    transactions,
  } = useTransaksjonerFilters()

  const descriptionSearchDatalistEligible = useIsMinMdScreen()
  const descriptionSearchDatalistId = useId()
  const descriptionSearchDatalistOptions = useMemo(
    () =>
      descriptionSearchDatalistEligible
        ? uniqueDescriptionsForDatalist(transactions, { max: 400 })
        : [],
    [transactions, descriptionSearchDatalistEligible],
  )

  const [categoryDetail, setCategoryDetail] = useState<{
    name: string
    type: 'income' | 'expense'
    lineTotal: number
  } | null>(null)

  const periodLabel = useMemo(
    () => kpiSubForTransactionPeriod(filterYear, filterMonth),
    [filterYear, filterMonth],
  )

  const categoryModalTxs = useMemo(() => {
    if (!categoryDetail) return []
    const { name, type } = categoryDetail
    const base = displayFilteredTx.filter((t) => t.category === name && t.type === type)

    /** Samme filtre som listen (hovedgruppe, kategori, søk), men uten dato-vindu — brukes til å hente inn fremtidige linjer ved YTD. */
    const matchesFilters = (t: Transaction): boolean => {
      if (filterParent !== 'all') {
        const meta = allCats.find((c) => c.name === t.category && c.type === t.type)
        if (meta?.parentCategory !== filterParent) return false
      }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      const q = searchQuery.trim().toLowerCase()
      if (q && !(t.description ?? '').toLowerCase().includes(q)) return false
      return true
    }

    if (filterMonth !== 'ytd') return base

    const today = todayIsoLocal()
    const prefix = `${filterYear}-`
    const seen = new Set(base.map((x) => x.id))
    const extras: Transaction[] = []
    for (const t of transactions) {
      if (t.category !== name || t.type !== type) continue
      if (!matchesFilters(t)) continue
      const d = t.date
      if (typeof d !== 'string' || !d.startsWith(prefix) || !isIsoDateString(d)) continue
      if (d <= today) continue
      if (seen.has(t.id)) continue
      seen.add(t.id)
      extras.push(t)
    }
    return [...base, ...extras]
  }, [
    categoryDetail,
    displayFilteredTx,
    filterMonth,
    filterYear,
    transactions,
    allCats,
    filterParent,
    filterCategory,
    searchQuery,
  ])

  const categoryModalHref = categoryDetail
    ? buildTransaksjonerListeHref(filterYear, filterMonth, categoryDetail.name)
    : '/transaksjoner'

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Transaksjoner"
        subtitle="Transaksjonsdashboard — faktiske beløp gruppert etter kategori (ikke budsjett)"
      />
      <TransaksjonerSubnav />
      <div className="space-y-6 px-4 py-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Vis:
          </span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 text-sm rounded-xl"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filterMonth === 'all' ? 'all' : filterMonth === 'ytd' ? 'ytd' : String(filterMonth)}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'all') setFilterMonth('all')
              else if (v === 'ytd') setFilterMonth('ytd')
              else setFilterMonth(Number(v))
            }}
            className="px-3 py-2 text-sm rounded-xl min-w-[10rem]"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            <option value="ytd">Hittil i år</option>
            <option value="all">Hele året</option>
            {MONTHS_FULL.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={filterParent}
            onChange={(e) =>
              setFilterParent(e.target.value === 'all' ? 'all' : (e.target.value as ParentCategory))
            }
            className="px-3 py-2 text-sm rounded-xl min-w-[10rem]"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label="Filtrer på hovedgruppe"
          >
            <option value="all">Alle hovedgrupper</option>
            {REPORT_GROUP_ORDER.map((p) => (
              <option key={p} value={p}>
                {REPORT_GROUP_LABELS[p]}
              </option>
            ))}
          </select>
          <div className="min-w-[12rem] max-w-[min(100%,20rem)] flex-1">
            <BudgetCategoryPicker
              variant="filter"
              sortAlphabetically={false}
              value={filterCategory}
              onChange={(v) => setFilterCategory(v === 'all' ? 'all' : v)}
              categories={categoryOptions}
            />
          </div>
          {descriptionSearchDatalistEligible && (
            <datalist id={descriptionSearchDatalistId}>
              {descriptionSearchDatalistOptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          )}
          <input
            type="search"
            placeholder="Søk i beskrivelse"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[12rem] flex-1 px-3 py-2 text-sm rounded-xl max-w-xs"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label="Søk i beskrivelse"
            list={descriptionSearchDatalistEligible ? descriptionSearchDatalistId : undefined}
            autoComplete="off"
          />
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium px-2 py-1 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{ color: 'var(--primary)' }}
            >
              Nullstill filtre
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            label="Inntekt"
            value={formatNOK(periodIncome)}
            sub={periodLabel}
            icon={ArrowUpRight}
            color={KPI_INCOME_HEX}
            valueNoWrap
          />
          <StatCard
            label="Utgifter"
            value={formatNOK(periodExpense)}
            sub={periodLabel}
            icon={ArrowDownLeft}
            color={KPI_EXPENSE_HEX}
            valueNoWrap
          />
          <StatCard
            label="Netto"
            value={formatNOK(periodIncome - periodExpense)}
            sub={periodLabel}
            icon={periodIncome - periodExpense >= 0 ? ArrowUpRight : ArrowDownLeft}
            color={periodIncome - periodExpense >= 0 ? KPI_NET_POSITIVE_HEX : KPI_NET_NEGATIVE_HEX}
            trend={periodIncome - periodExpense >= 0 ? 'up' : 'down'}
            valueNoWrap
          />
        </div>
        {hasFutureDatedInPeriod ? (
          <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
            Kortene (inntekt, utgifter, netto) viser beløp til og med i dag. Fremtidige transaksjoner i valgt
            periode vises i oversikten under.
          </p>
        ) : null}

        <TransactionActualsBreakdown
          transactions={displayFilteredTx}
          budgetCategories={allCats}
          onPickCategory={(name, type, lineTotal) => {
            setCategoryDetail({ name, type, lineTotal })
          }}
        />

        {categoryDetail ? (
          <TransactionActualsCategoryModal
            open
            onClose={() => setCategoryDetail(null)}
            categoryName={categoryDetail.name}
            txType={categoryDetail.type}
            periodLabel={periodLabel}
            lineTotal={categoryDetail.lineTotal}
            transactions={categoryModalTxs}
            transactionsListeHref={categoryModalHref}
            profiles={profiles}
            isHouseholdAggregate={isHouseholdAggregate}
            ytdPerspective={filterMonth === 'ytd'}
          />
        ) : null}
      </div>
    </div>
  )
}

export default function TransaksjonerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 overflow-auto min-h-[40vh]" style={{ background: 'var(--bg)' }}>
          <Header title="Transaksjoner" subtitle="Transaksjonsdashboard" />
          <TransaksjonerSubnav />
          <p className="px-4 py-6 text-sm md:p-8" style={{ color: 'var(--text-muted)' }}>
            Laster …
          </p>
        </div>
      }
    >
      <TransaksjonerDashboardInner />
    </Suspense>
  )
}
