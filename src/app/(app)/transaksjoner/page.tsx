'use client'
import { Suspense, useState, useMemo, useEffect } from 'react'
import Header from '@/components/layout/Header'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionDetailModal, { type TransactionSavePatch } from '@/components/transactions/TransactionDetailModal'
import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import NewBudgetCategoryModal from '@/components/transactions/NewBudgetCategoryModal'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import type { Transaction } from '@/lib/store'
import {
  dateInMonth,
  formatIntegerNbNo,
  formatIsoDateDdMmYyyy,
  formatNOK,
  generateId,
  parseIntegerNbNo,
} from '@/lib/utils'
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react'

const MONTHS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

function TransaksjonerPageInner() {
  const {
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
    addTransaction,
    addTransactions,
    removeTransaction,
    updateTransaction,
    recalcBudgetSpent,
    isHouseholdAggregate,
    profiles,
    customBudgetLabels,
    addBudgetCategory,
    addCustomBudgetLabel,
  } = useTransaksjonerFilters()

  const [showForm, setShowForm] = useState(false)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc')
  const [newCatOpen, setNewCatOpen] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    subcategory: '',
  })
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkMonths, setBulkMonths] = useState(() => Array.from({ length: 12 }, () => true))
  const [formError, setFormError] = useState<string | null>(null)

  const selectedCat = allCats.find((c) => c.name === form.category)
  const txType = selectedCat?.type || 'expense'

  const profileLabel = (pid: string | undefined) => {
    if (!isHouseholdAggregate) return null
    const id = pid ?? profiles[0]?.id
    return profiles.find((p) => p.id === id)?.name ?? null
  }

  const sortedDisplayTx = useMemo(() => {
    const list = [...displayFilteredTx]
    const mul = dateSort === 'desc' ? -1 : 1
    list.sort((a, b) => mul * (new Date(a.date).getTime() - new Date(b.date).getTime()))
    return list
  }, [displayFilteredTx, dateSort])

  const bulkYearLabel = useMemo(() => {
    const y = parseInt(form.date.slice(0, 4), 10)
    return Number.isFinite(y) ? String(y) : '—'
  }, [form.date])

  useEffect(() => {
    setFormError(null)
  }, [form.description, form.category, form.amount, form.date, bulkMode, bulkMonths])

  const resetTransactionForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: '',
      subcategory: '',
    })
    setBulkMode(false)
    setBulkMonths(Array.from({ length: 12 }, () => true))
    setFormError(null)
  }

  const handleAdd = () => {
    const desc = form.description.trim()
    if (!desc) {
      setFormError('Skriv inn beskrivelse.')
      return
    }
    if (!form.category) {
      setFormError('Velg kategori.')
      return
    }
    const amountNum = parseIntegerNbNo(form.amount)
    if (!Number.isFinite(amountNum)) {
      setFormError('Skriv inn et gyldig beløp (større enn null).')
      return
    }
    const sub = form.subcategory.trim()

    if (bulkMode) {
      const selectedCount = bulkMonths.filter(Boolean).length
      if (selectedCount === 0) {
        setFormError('Velg minst én måned.')
        return
      }
      const parts = form.date.split('-')
      if (parts.length !== 3) {
        setFormError('Velg en gyldig dato.')
        return
      }
      const year = parseInt(parts[0]!, 10)
      const day = parseInt(parts[2]!, 10)
      if (!Number.isFinite(year) || !Number.isFinite(day) || day < 1 || day > 31) {
        setFormError('Ugyldig dato.')
        return
      }
      const txs: Transaction[] = []
      for (let m = 0; m < 12; m++) {
        if (!bulkMonths[m]) continue
        txs.push({
          id: generateId(),
          date: dateInMonth(year, m, day),
          description: desc,
          amount: amountNum,
          category: form.category,
          type: txType,
          ...(sub ? { subcategory: sub } : {}),
        })
      }
      addTransactions(txs)
      if (!isHouseholdAggregate) recalcBudgetSpent(form.category)
      resetTransactionForm()
      setShowForm(false)
      return
    }

    if (!form.date || form.date.length < 10) {
      setFormError('Velg dato.')
      return
    }

    const newTx: Transaction = {
      id: generateId(),
      date: form.date,
      description: desc,
      amount: amountNum,
      category: form.category,
      type: txType,
      ...(sub ? { subcategory: sub } : {}),
    }
    addTransaction(newTx)
    if (!isHouseholdAggregate) recalcBudgetSpent(form.category)
    resetTransactionForm()
    setShowForm(false)
  }

  const handleDelete = (tx: Transaction) => {
    removeTransaction(tx.id)
    if (!isHouseholdAggregate) recalcBudgetSpent(tx.category)
  }

  const handleSaveDetail = (id: string, patch: TransactionSavePatch) => {
    const old = transactions.find((t) => t.id === id)
    if (!old) return
    updateTransaction(id, patch)
    if (!isHouseholdAggregate) {
      recalcBudgetSpent(old.category)
      if (patch.category !== undefined && patch.category !== old.category) {
        recalcBudgetSpent(patch.category)
      }
    }
  }

  const createCategoryProps =
    !isHouseholdAggregate
      ? {
          customBudgetLabels,
          budgetCategories,
          addCustomBudgetLabel,
          addBudgetCategory,
        }
      : undefined

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Transaksjoner" subtitle="Logg inntekter og utgifter" />
      <TransaksjonerSubnav />
      {createCategoryProps && (
        <NewBudgetCategoryModal
          open={newCatOpen}
          onClose={() => setNewCatOpen(false)}
          onCreated={(name) => setForm((f) => ({ ...f, category: name }))}
          customBudgetLabels={createCategoryProps.customBudgetLabels}
          budgetCategories={createCategoryProps.budgetCategories}
          addCustomBudgetLabel={createCategoryProps.addCustomBudgetLabel}
          addBudgetCategory={createCategoryProps.addBudgetCategory}
        />
      )}
      <TransactionDetailModal
        transaction={detailTx}
        open={detailTx !== null}
        onClose={() => setDetailTx(null)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSave={handleSaveDetail}
        onDelete={(id) => {
          const tx = transactions.find((t) => t.id === id)
          if (tx) handleDelete(tx)
        }}
        householdHint={isHouseholdAggregate}
        createCategory={createCategoryProps}
      />
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

        {txInPeriod.length === 0 && !showForm ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen transaksjoner i valgt periode
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={16} />
              Legg til transaksjon
            </button>
          </div>
        ) : (
          <>
            {showForm ? (
              <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Ny transaksjon</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                    {bulkMode && (
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        År og dag i måneden brukes for hver avkrysset måned.
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <input
                      placeholder="Beskrivelse"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                    {bulkMode && (
                      <p className="flex items-start gap-1.5 text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Info size={14} className="shrink-0 mt-0.5 opacity-80" aria-hidden />
                        <span>Samme beskrivelse på alle valgte måneder.</span>
                      </p>
                    )}
                  </div>
                  <input
                    placeholder="Beløp (NOK)"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    onBlur={() => {
                      const n = parseIntegerNbNo(form.amount)
                      if (Number.isFinite(n)) setForm((f) => ({ ...f, amount: formatIntegerNbNo(n) }))
                    }}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                </div>
                <label className="flex items-center gap-3 mt-4 cursor-pointer select-none min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={bulkMode}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setBulkMode(checked)
                      if (checked) {
                        setBulkMonths(Array.from({ length: 12 }, () => true))
                      }
                      setFormError(null)
                    }}
                    className="rounded border shrink-0 w-4 h-4"
                    style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Samme beløp for flere måneder
                  </span>
                </label>
                {bulkMode && (
                  <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                      Velg måneder for {bulkYearLabel}. Én transaksjon opprettes per avkrysset måned.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setBulkMonths(Array.from({ length: 12 }, () => true))}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                      >
                        Alle måneder
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkMonths(Array.from({ length: 12 }, () => false))}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        Ingen
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {MONTHS_FULL.map((label, i) => (
                        <label
                          key={label}
                          className="flex items-center gap-2 text-sm cursor-pointer rounded-lg px-2 py-1.5"
                          style={{ color: 'var(--text)' }}
                        >
                          <input
                            type="checkbox"
                            checked={bulkMonths[i]}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setBulkMonths((prev) => {
                                const next = [...prev]
                                next[i] = checked
                                return next
                              })
                            }}
                            className="rounded border shrink-0 w-4 h-4"
                            style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:items-stretch">
                  <div className="flex-1 min-w-0">
                    <BudgetCategoryPicker
                      value={form.category}
                      onChange={(name) => setForm({ ...form, category: name })}
                      categories={allCats}
                      variant="pick"
                    />
                  </div>
                  {createCategoryProps && (
                    <button
                      type="button"
                      onClick={() => setNewCatOpen(true)}
                      className="px-3 py-2 rounded-xl text-sm font-medium shrink-0 whitespace-nowrap"
                      style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                    >
                      Ny kategori
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Underkategori (valgfritt)
                  </label>
                  <input
                    placeholder="F.eks. butikk eller detalj"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    {bulkMode ? `Legg til (${bulkMonths.filter(Boolean).length} transaksjoner)` : 'Legg til'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetTransactionForm()
                      setShowForm(false)
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    Avbryt
                  </button>
                </div>
                {formError && (
                  <p className="text-xs mt-2 max-w-md" style={{ color: 'var(--text-muted)' }} role="status">
                    {formError}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={16} />
                Legg til transaksjon
              </button>
            )}

            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Transaksjoner
                </h2>
                <label className="flex items-center gap-2 text-sm shrink-0">
                  <span style={{ color: 'var(--text-muted)' }}>Sorter dato</span>
                  <select
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value as 'desc' | 'asc')}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <option value="desc">Nyeste først</option>
                    <option value="asc">Eldste først</option>
                  </select>
                </label>
              </div>
              <div className="space-y-2">
                {displayFilteredTx.length === 0 && txInPeriod.length > 0 && filtersActive ? (
                  <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg)' }}>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      Ingen treff med valgte filtre.
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-medium px-4 py-2 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--surface)' }}
                    >
                      Nullstill filtre
                    </button>
                  </div>
                ) : (
                  sortedDisplayTx.map((tx) => {
                    const pname = profileLabel(tx.profileId)
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl"
                        style={{ background: 'var(--bg)' }}
                      >
                        <button
                          type="button"
                          onClick={() => setDetailTx(tx)}
                          className="flex flex-1 min-w-0 items-center justify-between gap-3 rounded-lg text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                background: allCats.find((c) => c.name === tx.category)?.color || 'var(--text-muted)',
                              }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                                {tx.description}
                              </span>
                              <span
                                className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <span className="min-w-0 truncate">
                                  {[tx.category, tx.subcategory?.trim()].filter(Boolean).join(' · ')} •{' '}
                                  {formatIsoDateDdMmYyyy(tx.date)}
                                </span>
                                {pname ? (
                                  <span
                                    className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none"
                                    style={{
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text)',
                                    }}
                                  >
                                    {pname}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </span>
                          <span
                            className="text-sm font-semibold tabular-nums shrink-0"
                            style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatNOK(tx.amount)}
                          </span>
                        </button>
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            aria-label="Slett transaksjon"
                            onClick={() => handleDelete(tx)}
                            className="p-1 rounded-lg transition-colors hover:opacity-70"
                          >
                            <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default function TransaksjonerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 overflow-auto min-h-[40vh]" style={{ background: 'var(--bg)' }}>
          <Header title="Transaksjoner" subtitle="Logg inntekter og utgifter" />
          <TransaksjonerSubnav />
          <p className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Laster …
          </p>
        </div>
      }
    >
      <TransaksjonerPageInner />
    </Suspense>
  )
}
