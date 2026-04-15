'use client'
import { Suspense, useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import TransactionActualsYearGrid from '@/components/transactions/TransactionActualsYearGrid'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionDetailModal, { type TransactionSavePatch } from '@/components/transactions/TransactionDetailModal'
import BudgetCategoryPicker from '@/components/transactions/BudgetCategoryPicker'
import NewBudgetCategoryModal from '@/components/transactions/NewBudgetCategoryModal'
import SameDayBatchTransactionForm from '@/components/transactions/SameDayBatchTransactionForm'
import { useTransaksjonPageQuery } from '@/components/transactions/useTransaksjonPageQuery'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import { buildCategoryActualsYearMatrix, REPORT_GROUP_LABELS, REPORT_GROUP_ORDER } from '@/lib/bankReportData'
import { mergeBudgetCategoriesFromSnapshots } from '@/lib/store'
import type { ParentCategory } from '@/lib/budgetCategoryCatalog'
import type { Transaction } from '@/lib/store'
import {
  dateInMonth,
  formatIntegerNbNo,
  formatIntegerNbNoWhileTyping,
  formatIsoDateDdMmYyyy,
  formatNOK,
  generateId,
  parseIntegerNbNo,
} from '@/lib/utils'
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, Info, CheckCircle2 } from 'lucide-react'
import {
  inferPlannedFollowUpOnDateChange,
  shouldShowKommendeAttentionBanner,
  todayYyyyMmDd,
} from '@/lib/plannedTransactions'
import { createEmptyBatchRow, validateAndBuildSameDayTransactions, type SameDayBatchRowInput } from '@/lib/transactionBatch'

const MONTHS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']

const DEFAULT_SAME_DAY_BATCH_ROW_COUNT = 10

function createDefaultBatchRows(): SameDayBatchRowInput[] {
  return Array.from({ length: DEFAULT_SAME_DAY_BATCH_ROW_COUNT }, () => createEmptyBatchRow())
}

function TransaksjonerPageInner() {
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
    transactions,
    budgetCategories,
    expenseCategories,
    incomeCategories,
    allCats,
    yearOptions,
    txInPeriod,
    categoryOptions,
    displayFilteredTx,
    hasFutureDatedInPeriod,
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
    activeProfileId,
    customBudgetLabels,
    addBudgetCategory,
    addCustomBudgetLabel,
    budgetYear,
    archivedBudgetsByYear,
  } = useTransaksjonerFilters()

  const { vis, setVis, setYearInUrl } = useTransaksjonPageQuery()

  const [showForm, setShowForm] = useState(false)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  /** Kun for rent dato-sortering; ved «hovedgruppe» brukes dateSort som retning innen gruppe. */
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc')
  const [listSortMode, setListSortMode] = useState<'date' | 'parent'>('date')
  const [newCatOpen, setNewCatOpen] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    subcategory: '',
  })
  const [formParent, setFormParent] = useState<ParentCategory | 'all'>('all')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkMonths, setBulkMonths] = useState(() => Array.from({ length: 12 }, () => true))
  const [formError, setFormError] = useState<string | null>(null)
  const [formTargetProfileId, setFormTargetProfileId] = useState(activeProfileId)

  const [entryMode, setEntryMode] = useState<'single' | 'sameDayBatch'>('single')
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().split('T')[0])
  const [batchRows, setBatchRows] = useState<SameDayBatchRowInput[]>(() => createDefaultBatchRows())

  const showHouseholdProfilePicker = isHouseholdAggregate && profiles.length >= 2

  const categoriesForAddForm = useMemo(() => {
    if (formParent === 'all') return categoryOptions
    return categoryOptions.filter((c) => c.parentCategory === formParent)
  }, [categoryOptions, formParent])

  const selectedCat = useMemo(() => {
    if (!form.category) return undefined
    if (formParent === 'all') return allCats.find((c) => c.name === form.category)
    return categoriesForAddForm.find((c) => c.name === form.category)
  }, [form.category, formParent, allCats, categoriesForAddForm])

  const txType = selectedCat?.type || 'expense'

  const profileLabel = (pid: string | undefined) => {
    if (!isHouseholdAggregate) return null
    const id = pid ?? profiles[0]?.id
    return profiles.find((p) => p.id === id)?.name ?? null
  }

  const sortedDisplayTx = useMemo(() => {
    const list = [...displayFilteredTx]
    const mul = dateSort === 'desc' ? -1 : 1
    const parentRank = (t: Transaction): [number, number] => {
      const m = allCats.find((c) => c.name === t.category && c.type === t.type)
      if (!m) return [2, 999]
      if (m.type === 'income') return [0, REPORT_GROUP_ORDER.indexOf('inntekter')]
      const i = REPORT_GROUP_ORDER.indexOf(m.parentCategory as ParentCategory)
      return [1, i === -1 ? 999 : i]
    }
    if (listSortMode === 'parent') {
      list.sort((a, b) => {
        const [ka, ia] = parentRank(a)
        const [kb, ib] = parentRank(b)
        if (ka !== kb) return ka - kb
        if (ia !== ib) return ia - ib
        return mul * (new Date(a.date).getTime() - new Date(b.date).getTime())
      })
      return list
    }
    list.sort((a, b) => mul * (new Date(a.date).getTime() - new Date(b.date).getTime()))
    return list
  }, [displayFilteredTx, dateSort, listSortMode, allCats])

  const hasKommendeBanner = useMemo(
    () => shouldShowKommendeAttentionBanner(transactions),
    [transactions],
  )

  const displayCategories = useMemo(() => {
    if (filterYear === budgetYear) return budgetCategories
    const snap = archivedBudgetsByYear[String(filterYear)]
    if (!snap) return []
    if (isHouseholdAggregate) {
      return mergeBudgetCategoriesFromSnapshots(snap, profiles.map((p) => p.id))
    }
    return snap[activeProfileId] ?? []
  }, [
    filterYear,
    budgetYear,
    budgetCategories,
    archivedBudgetsByYear,
    isHouseholdAggregate,
    profiles,
    activeProfileId,
  ])

  const filteredCategoriesForOverview = useMemo(() => {
    if (vis !== 'oversikt') return []
    let list = displayCategories
    const q = searchQuery.trim().toLowerCase()
    if (filterParent !== 'all') list = list.filter((c) => c.parentCategory === filterParent)
    if (filterCategory !== 'all') list = list.filter((c) => c.name === filterCategory)
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q))
    return list
  }, [vis, displayCategories, filterParent, filterCategory, searchQuery])

  const actualsMatrixForOverviewKpi = useMemo(() => {
    if (vis !== 'oversikt') return null
    return buildCategoryActualsYearMatrix(transactions, filterYear, filteredCategoriesForOverview)
  }, [vis, transactions, filterYear, filteredCategoriesForOverview])

  const overviewIncome = useMemo(() => {
    if (!actualsMatrixForOverviewKpi) return 0
    let s = 0
    for (const c of filteredCategoriesForOverview) {
      if (c.type !== 'income') continue
      const row = actualsMatrixForOverviewKpi.get(c.name)
      if (!row) continue
      s += row.reduce((a, b) => a + b, 0)
    }
    return s
  }, [actualsMatrixForOverviewKpi, filteredCategoriesForOverview])

  const overviewExpense = useMemo(() => {
    if (!actualsMatrixForOverviewKpi) return 0
    let s = 0
    for (const c of filteredCategoriesForOverview) {
      if (c.type !== 'expense') continue
      const row = actualsMatrixForOverviewKpi.get(c.name)
      if (!row) continue
      s += row.reduce((a, b) => a + b, 0)
    }
    return s
  }, [actualsMatrixForOverviewKpi, filteredCategoriesForOverview])

  const bulkYearLabel = useMemo(() => {
    const y = parseInt(form.date.slice(0, 4), 10)
    return Number.isFinite(y) ? String(y) : '—'
  }, [form.date])

  useEffect(() => {
    setFormError(null)
  }, [
    form.description,
    form.category,
    form.amount,
    form.date,
    bulkMode,
    bulkMonths,
    formParent,
    entryMode,
    batchDate,
    batchRows,
  ])

  useEffect(() => {
    if (formParent === 'all') return
    const ok = categoriesForAddForm.some((c) => c.name === form.category)
    if (form.category && !ok) setForm((f) => ({ ...f, category: '' }))
  }, [formParent, categoriesForAddForm, form.category])

  useEffect(() => {
    setFormTargetProfileId(activeProfileId)
  }, [activeProfileId])

  const resetTransactionForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: '',
      subcategory: '',
    })
    setFormParent('all')
    setBulkMode(false)
    setBulkMonths(Array.from({ length: 12 }, () => true))
    setFormError(null)
    setFormTargetProfileId(activeProfileId)
    setEntryMode('single')
    setBatchDate(new Date().toISOString().split('T')[0])
    setBatchRows(createDefaultBatchRows())
  }

  const newTxProfilePatch = (): Pick<Transaction, 'profileId'> | Record<string, never> =>
    showHouseholdProfilePicker ? { profileId: formTargetProfileId } : {}

  const handleBatchSubmit = () => {
    const result = validateAndBuildSameDayTransactions(batchRows, {
      date: batchDate,
      categoryOptions,
      todayStr: todayYyyyMmDd(),
      profilePatch: newTxProfilePatch(),
    })
    if (!result.ok) {
      setFormError(result.message)
      return
    }
    addTransactions(result.transactions)
    if (!isHouseholdAggregate) {
      const seen = new Set<string>()
      for (const t of result.transactions) {
        if (seen.has(t.category)) continue
        seen.add(t.category)
        recalcBudgetSpent(t.category)
      }
    }
    resetTransactionForm()
    setShowForm(false)
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
    if (!selectedCat) {
      setFormError('Ugyldig kategori.')
      return
    }
    const amountNum = parseIntegerNbNo(form.amount)
    if (!Number.isFinite(amountNum)) {
      setFormError('Skriv inn et gyldig beløp (større enn null).')
      return
    }
    const sub = form.subcategory.trim()

    const todayStr = todayYyyyMmDd()

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
        const dStr = dateInMonth(year, m, day)
        txs.push({
          id: generateId(),
          date: dStr,
          description: desc,
          amount: amountNum,
          category: form.category,
          type: txType,
          ...newTxProfilePatch(),
          ...(sub ? { subcategory: sub } : {}),
          ...(dStr > todayStr ? { plannedFollowUp: true as const } : {}),
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
      ...newTxProfilePatch(),
      ...(sub ? { subcategory: sub } : {}),
      ...(form.date > todayStr ? { plannedFollowUp: true as const } : {}),
    }
    addTransaction(newTx)
    if (!isHouseholdAggregate) recalcBudgetSpent(form.category)
    resetTransactionForm()
    setShowForm(false)
  }

  const handleDelete = (tx: Transaction) => {
    if (typeof window !== 'undefined' && !window.confirm('Slette denne transaksjonen?')) return
    removeTransaction(tx.id)
    if (!isHouseholdAggregate) recalcBudgetSpent(tx.category)
  }

  const handleSaveDetail = (id: string, patch: TransactionSavePatch) => {
    const old = transactions.find((t) => t.id === id)
    if (!old) return
    const extra: Partial<{ plannedFollowUp: boolean }> = {}
    if (patch.date !== undefined) {
      Object.assign(extra, inferPlannedFollowUpOnDateChange(old, patch.date))
    }
    updateTransaction(id, { ...patch, ...extra })
    setDetailTx((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            ...patch,
            ...extra,
          }
        : prev,
    )
    if (!isHouseholdAggregate) {
      recalcBudgetSpent(old.category)
      if (patch.category !== undefined && patch.category !== old.category) {
        recalcBudgetSpent(patch.category)
      }
    }
  }

  const handleQuickPatch = (id: string, patch: Partial<Pick<Transaction, 'reviewedAt' | 'paidAt'>>) => {
    updateTransaction(id, patch)
    setDetailTx((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev))
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

  const hasOverviewGridContent = filteredCategoriesForOverview.length > 0

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Transaksjoner"
        subtitle={
          vis === 'oversikt'
            ? `Faktisk oversikt · Hele kalenderåret ${filterYear}`
            : 'Logg inntekter og utgifter'
        }
      />
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
          initialKind={
            formParent === 'inntekter' ? 'income' : formParent !== 'all' ? 'expense' : undefined
          }
          initialExpenseParent={
            formParent !== 'all' && formParent !== 'inntekter' ? formParent : undefined
          }
        />
      )}
      <TransactionDetailModal
        transaction={detailTx}
        open={detailTx !== null}
        onClose={() => setDetailTx(null)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSave={handleSaveDetail}
        onPatchTransaction={handleQuickPatch}
        onDelete={(id) => {
          const tx = transactions.find((t) => t.id === id)
          if (tx) handleDelete(tx)
        }}
        householdHint={isHouseholdAggregate}
        createCategory={createCategoryProps}
      />
      <div className="space-y-6 px-4 py-6 md:p-8">
        {vis === 'liste' && hasKommendeBanner ? (
          <div
            className="rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}
            role="status"
          >
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Noen planlagte transaksjoner trenger oppfølging (forfalt eller planlagt i inneværende måned uten
              gjennomgang). Åpne <strong>Kommende</strong> for å huke av eller slette.
            </p>
            <Link
              href="/transaksjoner/kommende"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              Gå til Kommende
            </Link>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
            Visning
          </span>
          <div
            className="inline-flex rounded-xl p-0.5 gap-0.5 shrink-0"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            role="group"
            aria-label="Velg visning"
          >
            <button
              type="button"
              onClick={() => setVis('liste')}
              className="px-3 py-2 text-sm font-medium rounded-lg min-h-[44px] transition-colors"
              style={{
                background: vis === 'liste' ? 'var(--primary-pale)' : 'transparent',
                color: vis === 'liste' ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              Transaksjonsliste
            </button>
            <button
              type="button"
              onClick={() => setVis('oversikt', { ensureYear: filterYear })}
              className="px-3 py-2 text-sm font-medium rounded-lg min-h-[44px] transition-colors"
              style={{
                background: vis === 'oversikt' ? 'var(--primary-pale)' : 'transparent',
                color: vis === 'oversikt' ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              Faktisk oversikt
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/konto/importer-transaksjoner"
            className="text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            Importer fra CSV
          </Link>
          {vis === 'liste' ? (
            <>
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
            </>
          ) : (
            <>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                År:
              </span>
              <select
                value={filterYear}
                onChange={(e) => setYearInUrl(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-xl min-h-[44px]"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-label="Velg år for faktisk oversikt"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}
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
          <input
            type="search"
            placeholder={vis === 'oversikt' ? 'Søk i kategorinavn' : 'Søk i beskrivelse'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[12rem] flex-1 px-3 py-2 text-sm rounded-xl max-w-xs"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label={vis === 'oversikt' ? 'Søk i kategorinavn' : 'Søk i beskrivelse'}
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
          {(vis === 'liste'
            ? [
                { key: 'income', label: 'Inntekt', value: formatNOK(periodIncome), color: 'var(--success)', icon: ArrowUpRight },
                { key: 'expense', label: 'Utgifter', value: formatNOK(periodExpense), color: 'var(--danger)', icon: ArrowDownLeft },
                {
                  key: 'net',
                  label: 'Netto',
                  value: formatNOK(periodIncome - periodExpense),
                  color: periodIncome - periodExpense >= 0 ? 'var(--success)' : 'var(--danger)',
                  icon: periodIncome - periodExpense >= 0 ? ArrowUpRight : ArrowDownLeft,
                },
              ]
            : [
                { key: 'income', label: 'Inntekt', value: formatNOK(overviewIncome), color: 'var(--success)', icon: ArrowUpRight },
                { key: 'expense', label: 'Utgifter', value: formatNOK(overviewExpense), color: 'var(--danger)', icon: ArrowDownLeft },
                {
                  key: 'net',
                  label: 'Netto',
                  value: formatNOK(overviewIncome - overviewExpense),
                  color: overviewIncome - overviewExpense >= 0 ? 'var(--success)' : 'var(--danger)',
                  icon: overviewIncome - overviewExpense >= 0 ? ArrowUpRight : ArrowDownLeft,
                },
              ]
          ).map(({ key, label, value, color, icon: Icon }) => (
            <div key={key} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
        {vis === 'liste' && hasFutureDatedInPeriod ? (
          <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
            Kortene (inntekt, utgifter, netto) viser beløp til og med i dag. Fremtidige transaksjoner i valgt
            periode vises i listen under.
          </p>
        ) : null}

        {vis === 'oversikt' ? (
          <p className="text-xs -mt-2 max-w-3xl" style={{ color: 'var(--text-muted)' }}>
            Samme oppsett som budsjett «Årlig»: faktiske beløp per måned og per kategori. Kortene viser sum for hele{' '}
            {filterYear} med gjeldende filtre.
          </p>
        ) : null}

        {vis === 'liste' && txInPeriod.length === 0 && !showForm ? (
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
        ) : vis === 'liste' ? (
          <>
            {showForm ? (
              <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Ny transaksjon</h2>
                <div
                  className="flex flex-wrap gap-2 mb-4"
                  role="tablist"
                  aria-label="Registreringsmodus"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={entryMode === 'single'}
                    onClick={() => setEntryMode('single')}
                    className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] min-w-0"
                    style={{
                      background: entryMode === 'single' ? 'var(--primary-pale)' : 'var(--bg)',
                      color: entryMode === 'single' ? 'var(--primary)' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Én transaksjon
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={entryMode === 'sameDayBatch'}
                    onClick={() => {
                      setEntryMode('sameDayBatch')
                      setBulkMode(false)
                      setBatchDate(form.date)
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] min-w-0"
                    style={{
                      background: entryMode === 'sameDayBatch' ? 'var(--primary-pale)' : 'var(--bg)',
                      color: entryMode === 'sameDayBatch' ? 'var(--primary)' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Flere på samme dag
                  </button>
                </div>

                {entryMode === 'sameDayBatch' ? (
                  <SameDayBatchTransactionForm
                    batchDate={batchDate}
                    onBatchDateChange={setBatchDate}
                    rows={batchRows}
                    onRowsChange={setBatchRows}
                    categoryOptions={categoryOptions}
                    formError={formError}
                    onSubmit={handleBatchSubmit}
                    onCancel={() => {
                      resetTransactionForm()
                      setShowForm(false)
                    }}
                    showHouseholdProfilePicker={showHouseholdProfilePicker}
                    profiles={profiles}
                    formTargetProfileId={formTargetProfileId}
                    onProfileChange={setFormTargetProfileId}
                  />
                ) : (
                  <>
                {showHouseholdProfilePicker && (
                  <div className="mb-4 max-w-md">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Profil
                    </label>
                    <select
                      value={formTargetProfileId}
                      onChange={(e) => setFormTargetProfileId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                      aria-label="Velg profil for ny transaksjon"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Nye transaksjoner legges til valgt profil.
                    </p>
                  </div>
                )}
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
                    onChange={(e) =>
                      setForm({ ...form, amount: formatIntegerNbNoWhileTyping(e.target.value) })
                    }
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
                        setEntryMode('single')
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
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="w-full sm:max-w-[min(100%,14rem)] min-w-0 shrink-0">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                        Hovedgruppe
                      </label>
                      <select
                        value={formParent}
                        onChange={(e) =>
                          setFormParent(e.target.value === 'all' ? 'all' : (e.target.value as ParentCategory))
                        }
                        className="w-full px-3 py-2 rounded-xl text-sm min-h-[44px]"
                        style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        aria-label="Velg hovedgruppe for ny transaksjon"
                      >
                        <option value="all">Alle hovedgrupper</option>
                        {REPORT_GROUP_ORDER.map((p) => (
                          <option key={p} value={p}>
                            {REPORT_GROUP_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:items-stretch">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                          Kategori
                        </label>
                        <BudgetCategoryPicker
                          value={form.category}
                          onChange={(name) => setForm({ ...form, category: name })}
                          categories={categoriesForAddForm}
                          variant="pick"
                          sortAlphabetically={false}
                        />
                      </div>
                      {createCategoryProps && (
                        <div className="flex items-end shrink-0">
                          <button
                            type="button"
                            onClick={() => setNewCatOpen(true)}
                            className="w-full sm:w-auto px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap min-h-[44px]"
                            style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                          >
                            Ny kategori
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedCat && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Registreres som: {txType === 'income' ? 'Inntekt' : 'Utgift'} ·{' '}
                      {REPORT_GROUP_LABELS[selectedCat.parentCategory]}
                    </p>
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
                  </>
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
                <div className="flex flex-wrap items-center gap-2 text-sm shrink-0">
                  <label className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>Sortering</span>
                    <select
                      value={listSortMode}
                      onChange={(e) => setListSortMode(e.target.value as 'date' | 'parent')}
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    >
                      <option value="date">Etter dato</option>
                      <option value="parent">Etter hovedgruppe</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {listSortMode === 'parent' ? 'Deretter dato' : 'Rekkefølge'}
                    </span>
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
              </div>
              <div className="space-y-2">
                {displayFilteredTx.length === 0 && txInPeriod.length > 0 && filtersActive ? (
                  <div className="rounded-xl p-6 text-center md:p-8" style={{ background: 'var(--bg)' }}>
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
                    const catMeta = allCats.find((c) => c.name === tx.category && c.type === tx.type)
                    const parentLabel =
                      catMeta?.parentCategory != null
                        ? REPORT_GROUP_LABELS[catMeta.parentCategory]
                        : null
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
                                background: catMeta?.color || 'var(--text-muted)',
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
                                {parentLabel ? (
                                  <span
                                    className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none max-w-[min(100%,9rem)] truncate"
                                    style={{
                                      background: 'var(--primary-pale)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text)',
                                    }}
                                  >
                                    {parentLabel}
                                  </span>
                                ) : null}
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
                          <span className="flex items-center gap-2 shrink-0">
                            {tx.reviewedAt ? (
                              <CheckCircle2
                                size={18}
                                className="shrink-0"
                                style={{ color: 'var(--success)' }}
                                aria-label="Gjennomgått"
                              />
                            ) : null}
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                            >
                              {tx.type === 'income' ? '+' : '-'}
                              {formatNOK(tx.amount)}
                            </span>
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
        ) : null}

        {vis === 'oversikt' ? (
          <div className="space-y-4">
            <p
              className="text-sm lg:hidden rounded-xl px-3 py-2"
              style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              Tip: Tabeller er enklest på større skjerm — på mobil kan du sveipe sideveis.
            </p>
            {displayCategories.length === 0 ? (
              <div
                className="rounded-2xl p-4 sm:p-5 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Ingen budsjett for {filterYear}
                </p>
                <p>
                  Det finnes ikke budsjettlinjer for dette året (ikke aktivt budsjett og ikke i arkiv). Velg aktivt budsjettår{' '}
                  <strong>{budgetYear}</strong> eller et år du har arkivert fra budsjett-siden.
                </p>
              </div>
            ) : !hasOverviewGridContent && filtersActive ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  Ingen treff med valgte filtre.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium px-4 py-2 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  Nullstill filtre
                </button>
              </div>
            ) : !hasOverviewGridContent ? (
              <div
                className="rounded-2xl p-6 text-center text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                Ingen kategorier å vise for {filterYear}. Juster filtre eller velg et annet år.
              </div>
            ) : (
              <>
                <TransactionActualsYearGrid
                  year={filterYear}
                  categories={filteredCategoriesForOverview}
                  transactions={transactions}
                />
                <p className="text-sm">
                  <button
                    type="button"
                    onClick={() => setVis('liste')}
                    className="font-medium underline underline-offset-2 hover:opacity-90"
                    style={{ color: 'var(--primary)' }}
                  >
                    Åpne transaksjonsliste
                  </button>
                </p>
              </>
            )}
          </div>
        ) : null}

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
          <p className="px-4 py-6 text-sm md:p-8" style={{ color: 'var(--text-muted)' }}>
            Laster …
          </p>
        </div>
      }
    >
      <TransaksjonerPageInner />
    </Suspense>
  )
}
