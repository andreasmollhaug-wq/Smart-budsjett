'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import BudgetAmountCell from '@/components/budget/BudgetAmountCell'
import AddBudgetLineModal from '@/components/budget/AddBudgetLineModal'
import { useActivePersonFinance, BudgetCategory } from '@/lib/store'
import { formatNOK, formatPercent, generateId, parseThousands, toMonthly } from '@/lib/utils'
import {
  getAvailableLabels,
  DEFAULT_STANDARD_LABELS,
  type ParentCategory,
} from '@/lib/budgetCategoryCatalog'
import { Plus, Trash2, ChevronDown, ChevronUp, Wallet, TrendingDown, Scale, Copy, Percent } from 'lucide-react'

const COLORS = ['#3B5BDB', '#4C6EF5', '#7048E8', '#AE3EC9', '#E03131', '#F08C00', '#0CA678', '#0B7285']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_FULL = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember']

const COST_GROUPS: ParentCategory[] = ['regninger', 'utgifter', 'gjeld', 'sparing']

const GROUPS: { id: ParentCategory; label: string; icon: string; type: 'income' | 'expense' }[] = [
  { id: 'inntekter', label: 'Inntekter', icon: '💰', type: 'income' },
  { id: 'regninger', label: 'Regninger', icon: '🧾', type: 'expense' },
  { id: 'utgifter', label: 'Utgifter', icon: '🛒', type: 'expense' },
  { id: 'gjeld', label: 'Gjeld', icon: '💳', type: 'expense' },
  { id: 'sparing', label: 'Sparing', icon: '🐷', type: 'expense' },
]

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

function groupLabel(id: ParentCategory): string {
  return GROUPS.find((g) => g.id === id)?.label ?? id
}

function ensureArrayBudgeted(budgeted: unknown): number[] {
  if (Array.isArray(budgeted)) return budgeted
  return Array(12).fill(budgeted || 0)
}

export default function BudsjettPage() {
  const {
    budgetCategories,
    customBudgetLabels,
    hiddenBudgetLabels,
    addBudgetCategory,
    removeBudgetCategory,
    updateBudgetCategory,
    addCustomBudgetLabel,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const readOnly = isHouseholdAggregate

  useEffect(() => {
    if (readOnly) setAddModalGroup(null)
  }, [readOnly])
  const [view, setView] = useState<'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    inntekter: true,
    regninger: true,
    utgifter: true,
    gjeld: false,
    sparing: false,
  })
  const [addModalGroup, setAddModalGroup] = useState<ParentCategory | null>(null)
  const [modalSearch, setModalSearch] = useState('')
  const [newForm, setNewForm] = useState({ name: '', amount: '', freq: 'monthly' as BudgetCategory['frequency'] })
  const [focusAmountSignal, setFocusAmountSignal] = useState(0)

  const labelLists = { customBudgetLabels, hiddenBudgetLabels }

  const getCategoriesForGroup = (group: ParentCategory) =>
    budgetCategories.filter((c) => c.parentCategory === group)

  const getSumForMonth = (group: ParentCategory, monthIndex: number) =>
    getCategoriesForGroup(group).reduce((sum, c) => {
      const arr = ensureArrayBudgeted(c.budgeted)
      return sum + (arr[monthIndex] || 0)
    }, 0)

  const getTotalCostsForMonth = (monthIndex: number) =>
    COST_GROUPS.reduce((s, g) => s + getSumForMonth(g, monthIndex), 0)

  const getResultForMonth = (monthIndex: number) =>
    getSumForMonth('inntekter', monthIndex) - getTotalCostsForMonth(monthIndex)

  const sumBudgetedForGroup = (group: ParentCategory, mode: 'month' | 'year', monthIndex: number) =>
    getCategoriesForGroup(group).reduce((sum, c) => {
      const arr = ensureArrayBudgeted(c.budgeted)
      if (mode === 'month') return sum + (arr[monthIndex] || 0)
      return sum + arr.reduce((a, b) => a + b, 0)
    }, 0)

  const totalBudgetedIncome = sumBudgetedForGroup('inntekter', view, selectedMonth)
  const totalBudgetedCosts = COST_GROUPS.reduce(
    (s, g) => s + sumBudgetedForGroup(g, view, selectedMonth),
    0,
  )
  const budgetResult = totalBudgetedIncome - totalBudgetedCosts

  const overskuddsandelDisplay =
    totalBudgetedIncome > 0
      ? formatPercent((budgetResult / totalBudgetedIncome) * 100)
      : '–'

  const kpiSub =
    view === 'month' ? `${MONTHS_FULL[selectedMonth]} (budsjettert)` : 'Hele året (budsjettert)'

  const shouldRegisterCustom = (parent: ParentCategory, name: string) => {
    const n = name.trim()
    if (!n) return false
    if (DEFAULT_STANDARD_LABELS[parent].includes(n)) return false
    if ((customBudgetLabels[parent] ?? []).includes(n)) return false
    return true
  }

  const closeAddModal = () => {
    setAddModalGroup(null)
    setModalSearch('')
    setNewForm({ name: '', amount: '', freq: 'monthly' })
  }

  const handlePickSuggestion = (group: ParentCategory, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const items = getCategoriesForGroup(group)
    if (items.some((i) => i.name === trimmed)) return
    setNewForm({ name: trimmed, amount: '', freq: 'monthly' })
    setModalSearch('')
    setFocusAmountSignal((n) => n + 1)
  }

  const handleAddCustom = (group: ParentCategory) => {
    if (!newForm.name || !newForm.amount) return
    const name = newForm.name.trim()
    if (shouldRegisterCustom(group, name)) addCustomBudgetLabel(group, name)

    const raw = parseThousands(String(newForm.amount))
    const monthly = toMonthly(raw, newForm.freq)

    const cat: BudgetCategory = {
      id: generateId(),
      name,
      budgeted: Array(12).fill(monthly),
      spent: monthly,
      type: GROUPS.find((g) => g.id === group)?.type || 'expense',
      color: COLORS[budgetCategories.length % COLORS.length],
      parentCategory: group,
      frequency: newForm.freq as BudgetCategory['frequency'],
    }
    addBudgetCategory(cat)
    closeAddModal()
  }

  const fillAllMonthsFromSelected = (cat: BudgetCategory) => {
    const arr = ensureArrayBudgeted(cat.budgeted)
    const v = arr[selectedMonth] ?? 0
    updateBudgetCategory(cat.id, { budgeted: Array(12).fill(v) })
  }

  const monthColumnIndices = view === 'month' ? [selectedMonth] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const modalGroupLabel = addModalGroup ? GROUPS.find((g) => g.id === addModalGroup)?.label ?? '' : ''
  const modalAvailable = addModalGroup
    ? getAvailableLabels(addModalGroup, labelLists, getCategoriesForGroup(addModalGroup).map((i) => i.name))
    : []

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Budsjett" subtitle="Budsjetter per måned for fullstendig kontroll" />

      <AddBudgetLineModal
        open={addModalGroup !== null}
        group={addModalGroup}
        groupLabel={modalGroupLabel}
        search={modalSearch}
        onSearchChange={setModalSearch}
        available={modalAvailable}
        onPickSuggestion={(name) => addModalGroup && handlePickSuggestion(addModalGroup, name)}
        newForm={newForm}
        onNewFormChange={setNewForm}
        onAddCustom={() => addModalGroup && handleAddCustom(addModalGroup)}
        onClose={closeAddModal}
        focusAmountSignal={focusAmountSignal}
      />

      <div className="p-8 space-y-6">
        {readOnly && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--primary-pale)',
              border: '1px solid var(--accent)',
              color: 'var(--text)',
            }}
          >
            Du ser samlet husholdning — budsjett kan ikke redigeres her. Velg en person under «Viser data for» for å
            endre linjer.
          </div>
        )}
        <div className={`space-y-6 ${readOnly ? 'pointer-events-none opacity-[0.92]' : ''}`}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['month', 'year'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: view === v ? 'var(--primary)' : 'var(--surface)',
                  color: view === v ? 'white' : 'var(--text-muted)',
                }}
              >
                {v === 'month' ? 'Månedlig' : 'Årlig'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Måned:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm rounded-xl"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              {MONTHS_FULL.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Budsjetterte inntekter"
            value={formatNOK(totalBudgetedIncome)}
            sub={kpiSub}
            icon={Wallet}
            trend="up"
            color="#3B5BDB"
          />
          <StatCard
            label="Budsjetterte kostnader"
            value={formatNOK(totalBudgetedCosts)}
            sub={kpiSub}
            icon={TrendingDown}
            trend="down"
            color="#E03131"
          />
          <StatCard
            label="Resultat (budsjett)"
            value={formatNOK(budgetResult)}
            sub={kpiSub}
            icon={Scale}
            trend={budgetResult >= 0 ? 'up' : 'down'}
            color={budgetResult >= 0 ? '#0CA678' : '#E03131'}
          />
          <StatCard
            label="Overskuddsandel"
            value={overskuddsandelDisplay}
            sub={kpiSub}
            icon={Percent}
            trend={totalBudgetedIncome > 0 ? (budgetResult >= 0 ? 'up' : 'down') : undefined}
            color={
              totalBudgetedIncome > 0 ? (budgetResult >= 0 ? '#0CA678' : '#E03131') : '#868E96'
            }
            info="Viser budsjettert resultat som andel av budsjetterte inntekter for samme periode som de andre kortene (én måned eller hele året). Dette er ikke det samme som beløp kun i «Sparing»-gruppen — der ligger bevisst satt av sparing, mens dette måler margin på alt du har budsjettert."
          />
        </div>

        {view === 'year' && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] text-sm border-collapse">
                <caption
                  className="caption-top text-left font-semibold text-base pb-3 px-0"
                  style={{ color: 'var(--text)' }}
                >
                  Budsjett per måned
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
                        {formatNOK(getSumForMonth('inntekter', mi))}
                      </td>
                    ))}
                    <td
                      className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {formatNOK(sumBudgetedForGroup('inntekter', 'year', selectedMonth))}
                    </td>
                  </tr>
                  {COST_GROUPS.map((gid) => (
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
                          {formatNOK(getSumForMonth(gid, mi))}
                        </td>
                      ))}
                      <td
                        className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                        style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        {formatNOK(sumBudgetedForGroup(gid, 'year', selectedMonth))}
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
                        color: budgetResult >= 0 ? '#0CA678' : '#E03131',
                        background: 'var(--primary-pale)',
                      }}
                    >
                      {formatNOK(budgetResult)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {GROUPS.map((group) => {
          const items = getCategoriesForGroup(group.id)
          const isExpanded = expanded[group.id] ?? true
          const groupSum = sumBudgetedForGroup(group.id, view, selectedMonth)

          return (
            <div
              key={group.id}
              className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={`${group.label}, ${formatNOK(groupSum)}, ${isExpanded ? 'utvidet' : 'skjult'}`}
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
                    <p
                      className="font-semibold tabular-nums text-sm sm:text-base"
                      style={{ color: 'var(--primary)' }}
                    >
                      {formatNOK(groupSum)}
                    </p>
                    {items.length === 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Ingen linjer
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                  ) : (
                    <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <>
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
                          {monthColumnIndices.map((mi) => (
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
                          <th
                            className="w-10 py-2 px-1"
                            style={{ borderBottom: '1px solid var(--border)' }}
                            aria-label="Kopier til alle måneder"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((cat) => {
                          const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                          return (
                            <tr key={cat.id} className="align-middle" style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="py-2 px-2 align-middle max-w-[14rem] md:max-w-[18rem]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ background: cat.color }}
                                  />
                                  <span
                                    className="text-sm truncate flex-1 min-w-0"
                                    style={{ color: 'var(--text)' }}
                                    title={cat.name}
                                  >
                                    {cat.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeBudgetCategory(cat.id)}
                                    className="p-1 opacity-60 hover:opacity-100 flex-shrink-0"
                                    aria-label={`Slett ${cat.name}`}
                                  >
                                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                  </button>
                                </div>
                              </td>
                              {monthColumnIndices.map((mi) => (
                                <td
                                  key={mi}
                                  className="align-middle py-1 px-0.5"
                                  style={{ borderLeft: '1px solid var(--border)' }}
                                >
                                  <BudgetAmountCell
                                    value={budgetedArr[mi] ?? 0}
                                    onChange={(n) => {
                                      const newBudgeted = [...budgetedArr]
                                      newBudgeted[mi] = n
                                      updateBudgetCategory(cat.id, { budgeted: newBudgeted })
                                    }}
                                  />
                                </td>
                              ))}
                              <td
                                className="align-middle py-2 px-2 text-xs tabular-nums whitespace-nowrap text-right font-semibold"
                                style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                              >
                                {formatNOK(budgetedArr.reduce((a, b) => a + b, 0))}
                              </td>
                              <td className="align-middle py-1 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => fillAllMonthsFromSelected(cat)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-lg opacity-80 hover:opacity-100"
                                  style={{ background: 'var(--bg)', color: 'var(--primary)' }}
                                  title={`Kopier beløpet fra ${MONTHS_FULL[selectedMonth]} til alle tolv måneder`}
                                  aria-label="Samme beløp alle måneder"
                                >
                                  <Copy size={16} strokeWidth={2} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="align-middle" style={{ background: 'var(--bg)', fontWeight: 600 }}>
                          <td className="py-2 px-2" style={{ color: 'var(--primary)' }}>
                            Total {group.label}
                          </td>
                          {monthColumnIndices.map((mi) => (
                            <td
                              key={mi}
                              className="text-right text-xs tabular-nums py-2 px-1"
                              style={{ borderLeft: '1px solid var(--border)', color: 'var(--primary)' }}
                            >
                              {formatNOK(getSumForMonth(group.id, mi))}
                            </td>
                          ))}
                          <td
                            className="text-right py-2 px-2 text-xs tabular-nums"
                            style={{ borderLeft: '1px solid var(--border)', color: 'var(--primary)' }}
                          >
                            {formatNOK(
                              getCategoriesForGroup(group.id).reduce((sum, c) => {
                                const arr = ensureArrayBudgeted(c.budgeted)
                                return sum + arr.reduce((a, b) => a + b, 0)
                              }, 0),
                            )}
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="block md:hidden mt-4 space-y-3 overflow-x-auto">
                    {view === 'year' ? (
                      <div className="min-w-[640px] space-y-3">
                        {items.map((cat) => {
                          const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                          return (
                            <div key={cat.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                              <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                  <span
                                    className="text-sm font-medium truncate"
                                    style={{ color: 'var(--text)' }}
                                    title={cat.name}
                                  >
                                    {cat.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => fillAllMonthsFromSelected(cat)}
                                    className="p-1.5 rounded-lg"
                                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                    title={`Kopier beløp fra ${MONTHS_FULL[selectedMonth]} til alle måneder`}
                                    aria-label="Samme beløp alle måneder"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeBudgetCategory(cat.id)}
                                    className="p-1 opacity-60 hover:opacity-100"
                                  >
                                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-12 gap-1 text-[10px]">
                                {MONTHS.map((m) => (
                                  <div key={m} className="text-center" style={{ color: 'var(--text-muted)' }}>
                                    {m}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-12 gap-1 mt-1">
                                {budgetedArr.map((val, i) => (
                                  <BudgetAmountCell
                                    key={i}
                                    value={val}
                                    onChange={(n) => {
                                      const nb = [...budgetedArr]
                                      nb[i] = n
                                      updateBudgetCategory(cat.id, { budgeted: nb })
                                    }}
                                    className="!max-w-full !ml-0 w-full text-[11px]"
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      items.map((cat) => {
                        const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                        return (
                          <div key={cat.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                            <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                                <span
                                  className="text-sm font-medium truncate"
                                  style={{ color: 'var(--text)' }}
                                  title={cat.name}
                                >
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => fillAllMonthsFromSelected(cat)}
                                  className="p-1.5 rounded-lg"
                                  style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                  title={`Kopier beløp fra ${MONTHS_FULL[selectedMonth]} til alle måneder`}
                                  aria-label="Samme beløp alle måneder"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeBudgetCategory(cat.id)}
                                  className="p-1 opacity-60 hover:opacity-100"
                                >
                                  <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <div>{MONTHS[selectedMonth]}:</div>
                              <div style={{ textAlign: 'right' }}>
                                <BudgetAmountCell
                                  value={budgetedArr[selectedMonth] || 0}
                                  onChange={(n) => {
                                    const newBudgeted = [...budgetedArr]
                                    newBudgeted[selectedMonth] = n
                                    updateBudgetCategory(cat.id, { budgeted: newBudgeted })
                                  }}
                                />
                              </div>
                              <div>Totalt år:</div>
                              <div style={{ textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>
                                {formatNOK(budgetedArr.reduce((a, b) => a + b, 0))}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--primary-pale)', border: '1px solid var(--accent)' }}
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Total {group.label}</div>
                        <div style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                          {formatNOK(
                            view === 'year'
                              ? sumBudgetedForGroup(group.id, 'year', selectedMonth)
                              : getSumForMonth(group.id, selectedMonth),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddModalGroup(group.id)
                      setModalSearch('')
                      setNewForm({ name: '', amount: '', freq: 'monthly' })
                      setFocusAmountSignal(0)
                    }}
                    className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors"
                    style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                  >
                    <Plus size={14} /> Legg til i {group.label.toLowerCase()}
                  </button>
                </>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
