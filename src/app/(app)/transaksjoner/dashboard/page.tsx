'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionActualsBreakdown from '@/components/transactions/TransactionActualsBreakdown'
import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import { formatNOK } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

const MONTHS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

function buildTransaksjonerListeHref(
  year: number,
  month: number | 'all',
  category: string,
): string {
  const p = new URLSearchParams()
  p.set('year', String(year))
  p.set('month', month === 'all' ? 'all' : String(month))
  p.set('category', category)
  return `/transaksjoner?${p.toString()}`
}

function TransaksjonerDashboardInner() {
  const router = useRouter()
  const {
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    allCats,
    yearOptions,
    categoryOptions,
    displayFilteredTx,
    periodIncome,
    periodExpense,
    filtersActive,
    clearFilters,
  } = useTransaksjonerFilters()

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Transaksjoner"
        subtitle="Transaksjonsdashboard — faktiske beløp gruppert etter kategori (ikke budsjett)"
      />
      <TransaksjonerSubnav />
      <div className="p-8 space-y-6">
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
            value={filterMonth === 'all' ? 'all' : String(filterMonth)}
            onChange={(e) => {
              const v = e.target.value
              setFilterMonth(v === 'all' ? 'all' : Number(v))
            }}
            className="px-3 py-2 text-sm rounded-xl min-w-[10rem]"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            <option value="all">Hele året</option>
            {MONTHS_FULL.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <div className="min-w-[12rem] max-w-[min(100%,20rem)] flex-1">
            <BudgetCategoryPicker
              variant="filter"
              value={filterCategory}
              onChange={(v) => setFilterCategory(v === 'all' ? 'all' : v)}
              categories={categoryOptions}
            />
          </div>
          <input
            type="search"
            placeholder="Søk i beskrivelse"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[12rem] flex-1 px-3 py-2 text-sm rounded-xl max-w-xs"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label="Søk i beskrivelse"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'income', label: 'Inntekt', value: formatNOK(periodIncome), color: 'var(--success)', icon: ArrowUpRight },
            { key: 'expense', label: 'Utgifter', value: formatNOK(periodExpense), color: 'var(--danger)', icon: ArrowDownLeft },
            {
              key: 'net',
              label: 'Netto',
              value: formatNOK(periodIncome - periodExpense),
              color: periodIncome - periodExpense >= 0 ? 'var(--success)' : 'var(--danger)',
              icon: periodIncome - periodExpense >= 0 ? ArrowUpRight : ArrowDownLeft,
            },
          ].map(({ key, label, value, color, icon: Icon }) => (
            <div key={key} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        <TransactionActualsBreakdown
          transactions={displayFilteredTx}
          budgetCategories={allCats}
          onPickCategory={(name) => {
            router.push(buildTransaksjonerListeHref(filterYear, filterMonth, name))
          }}
        />
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
          <p className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Laster …
          </p>
        </div>
      }
    >
      <TransaksjonerDashboardInner />
    </Suspense>
  )
}
