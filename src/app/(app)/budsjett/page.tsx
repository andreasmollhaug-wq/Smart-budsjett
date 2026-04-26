'use client'
import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import BudgetAmountCell from '@/components/budget/BudgetAmountCell'
import AddBudgetLineModal from '@/components/budget/AddBudgetLineModal'
import BudgetLineIncomeWithholdingModal from '@/components/budget/BudgetLineIncomeWithholdingModal'
import {
  useStore,
  useActivePersonFinance,
  BudgetCategory,
  mergeBudgetCategoriesFromSnapshots,
  type BudgetYearCopySource,
} from '@/lib/store'
import { budgetedArrayForCategoryName } from '@/lib/budgetYearHelpers'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { parsePositiveMoneyAmount2Decimals } from '@/lib/money/parseNorwegianAmount'
import { budgetedMonthsFromFrequency, formatPercent, generateId } from '@/lib/utils'
import {
  budgetCategoryUsesIncomeWithholding,
  effectiveBudgetedIncomeMonth,
  grossFromDesiredNet,
  grossWithholdingNetForBudgetMonth,
  normalizeIncomeWithholdingRule,
  withholdingPercentForBudgetCategory,
} from '@/lib/incomeWithholding'
import { mergeBudgetCategoryValues } from '@/lib/budgetCategoryMerge'
import {
  getAvailableLabels,
  DEFAULT_STANDARD_LABELS,
  type ParentCategory,
} from '@/lib/budgetCategoryCatalog'
import {
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wallet,
  TrendingDown,
  Scale,
  Copy,
  Percent,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react'
import BudsjettSubnav from '@/components/budget/BudsjettSubnav'
import EditBudgetLineModal from '@/components/budget/EditBudgetLineModal'
import BudsjettOpenArchiveModal from '@/components/budget/BudsjettOpenArchiveModal'
import BudsjettNewYearModal from '@/components/budget/BudsjettNewYearModal'
import BudgetLineReorderButtons from '@/components/budget/BudgetLineReorderButtons'
import {
  createDefaultHouseholdSplitForm,
  type HouseholdSplitFormState,
} from '@/components/budget/HouseholdBudgetSplitSection'
import { amountReferencesSumMatchesLine, impliedNewMonthTotal } from '@/lib/householdBudgetSplit'
import { applyOnceMonthIndexChange } from '@/lib/budget/applyOnceMonthIndexChange'

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

function yearBudgetLineTotal(cat: BudgetCategory, parent: ParentCategory): number {
  if (parent === 'inntekter' && cat.type === 'income') {
    let s = 0
    for (let i = 0; i < 12; i++) s += effectiveBudgetedIncomeMonth(cat, i)
    return s
  }
  const arr = ensureArrayBudgeted(cat.budgeted)
  return arr.reduce((a, b) => a + b, 0)
}

function yearIncomeWhBreakdownTotals(cat: BudgetCategory): { gross: number; withholding: number; net: number } {
  let gross = 0
  let withholding = 0
  let net = 0
  for (let i = 0; i < 12; i++) {
    const b = grossWithholdingNetForBudgetMonth(cat, i)
    gross += b.gross
    withholding += b.withholding
    net += b.net
  }
  return { gross, withholding, net }
}

/** Brutto for én inntektslinje én måned (samme som lagret brutto når trekk er på). */
function incomeLineGrossMonth(cat: BudgetCategory, monthIndex: number): number {
  if (cat.parentCategory !== 'inntekter' || cat.type !== 'income') return 0
  return grossWithholdingNetForBudgetMonth(cat, monthIndex).gross
}

function sumIncomeGrossForMonth(items: BudgetCategory[], monthIndex: number): number {
  return items.filter((c) => c.type === 'income').reduce((s, c) => s + incomeLineGrossMonth(c, monthIndex), 0)
}

function sumIncomeGrossYear(items: BudgetCategory[]): number {
  let t = 0
  for (let i = 0; i < 12; i++) t += sumIncomeGrossForMonth(items, i)
  return t
}

function applyBudgetAmountCellChange(
  cat: BudgetCategory,
  monthIndex: number,
  n: number,
  update: (id: string, data: Partial<BudgetCategory>) => void,
) {
  if (cat.frequency === 'once') {
    update(cat.id, {
      budgeted: budgetedMonthsFromFrequency(n, 'once', monthIndex),
      onceMonthIndex: monthIndex,
    })
    return
  }
  const arr = ensureArrayBudgeted(cat.budgeted)
  const newBudgeted = [...arr]
  newBudgeted[monthIndex] = n
  update(cat.id, { budgeted: newBudgeted })
}

export default function BudsjettPage() {
  const {
    budgetCategories,
    budgetYear,
    archivedBudgetsByYear,
    startNewBudgetYear,
    switchActiveBudgetYear,
    profiles,
    activeProfileId,
    customBudgetLabels,
    hiddenBudgetLabels,
    addBudgetCategory,
    removeBudgetCategory,
    reorderBudgetCategory,
    updateBudgetCategory,
    addCustomBudgetLabel,
    isHouseholdAggregate,
    serviceSubscriptions,
    remapBudgetCategoryName,
    remapSharedHouseholdBudgetLineName,
    subscriptionPlan,
    addSharedHouseholdBudgetLine,
    resplitSharedHouseholdGroupFromTotals,
    applySharedHouseholdMonthCellEdit,
  } = useActivePersonFinance()

  const { formatNOK, formatNOKOrDash } = useNokDisplayFormatters()
  const people = useStore((s) => s.people)
  /** Husholdning: hvilken budsjettlinje (aggregat-id) som viser bidrag per person. */
  const [householdLineBreakdownOpen, setHouseholdLineBreakdownOpen] = useState<string | null>(null)
  const [incomeWhBreakdownOpenId, setIncomeWhBreakdownOpenId] = useState<string | null>(null)
  const [incomeGroupGrossBreakdownOpen, setIncomeGroupGrossBreakdownOpen] = useState(false)
  const [incomeWithholdingModalCategoryId, setIncomeWithholdingModalCategoryId] = useState<string | null>(null)

  const [viewingYear, setViewingYear] = useState(budgetYear)
  const [newYearModalOpen, setNewYearModalOpen] = useState(false)
  const [openArchiveModalOpen, setOpenArchiveModalOpen] = useState(false)
  const [incomeCopySource, setIncomeCopySource] = useState<BudgetYearCopySource>('budget')
  const [expenseCopySource, setExpenseCopySource] = useState<BudgetYearCopySource>('budget')

  useEffect(() => {
    setViewingYear(budgetYear)
  }, [budgetYear])

  useEffect(() => {
    if (newYearModalOpen) {
      setIncomeCopySource('budget')
      setExpenseCopySource('budget')
    }
  }, [newYearModalOpen])

  const displayCategories = useMemo(() => {
    if (viewingYear === budgetYear) return budgetCategories
    const snap = archivedBudgetsByYear[String(viewingYear)]
    if (!snap) return []
    if (isHouseholdAggregate) {
      return mergeBudgetCategoriesFromSnapshots(snap, profiles.map((p) => p.id))
    }
    return snap[activeProfileId] ?? []
  }, [
    budgetCategories,
    budgetYear,
    viewingYear,
    archivedBudgetsByYear,
    isHouseholdAggregate,
    profiles,
    activeProfileId,
  ])

  const yearOptions = useMemo(() => {
    const s = new Set<number>([budgetYear, ...Object.keys(archivedBudgetsByYear).map(Number)])
    return [...s].sort((a, b) => b - a)
  }, [budgetYear, archivedBudgetsByYear])

  const getHouseholdLineBreakdown = useCallback(
    (parentCategory: ParentCategory, categoryName: string) => {
      return profiles.map((p) => {
        const cats =
          viewingYear === budgetYear
            ? people[p.id]?.budgetCategories
            : archivedBudgetsByYear[String(viewingYear)]?.[p.id]
        const monthly = budgetedArrayForCategoryName(cats, parentCategory, categoryName)
        const yearTotal = monthly.reduce((a, b) => a + b, 0)
        return { profileId: p.id, name: p.name, monthly, yearTotal }
      })
    },
    [profiles, viewingYear, budgetYear, people, archivedBudgetsByYear],
  )

  const readOnly = isHouseholdAggregate || viewingYear !== budgetYear
  const canOpenArchiveForEdit =
    viewingYear !== budgetYear && !isHouseholdAggregate && Boolean(archivedBudgetsByYear[String(viewingYear)])

  useEffect(() => {
    if (readOnly) setAddModalGroup(null)
  }, [readOnly])

  useEffect(() => {
    if (readOnly) setIncomeWhBreakdownOpenId(null)
  }, [readOnly])
  useEffect(() => {
    if (readOnly) setEditLine(null)
  }, [readOnly])
  const [view, setView] = useState<'month' | 'year'>('year')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    inntekter: true,
    regninger: true,
    utgifter: true,
    gjeld: false,
    sparing: false,
  })
  const [addModalGroup, setAddModalGroup] = useState<ParentCategory | null>(null)
  const [editLine, setEditLine] = useState<{
    category: BudgetCategory
    parent: ParentCategory
    allowOnceMonthEdit: boolean
  } | null>(null)
  const [modalSearch, setModalSearch] = useState('')
  const [newForm, setNewForm] = useState<{
    name: string
    amount: string
    freq: BudgetCategory['frequency']
    onceMonthIndex: number
    incomeWhApply: boolean
    incomeWhPercent: string
    householdSplit: HouseholdSplitFormState
  }>({
    name: '',
    amount: '',
    freq: 'monthly',
    onceMonthIndex: 0,
    incomeWhApply: false,
    incomeWhPercent: '32',
    householdSplit: createDefaultHouseholdSplitForm([]),
  })
  const [focusAmountSignal, setFocusAmountSignal] = useState(0)

  const labelLists = useMemo(
    () => ({ customBudgetLabels, hiddenBudgetLabels }),
    [customBudgetLabels, hiddenBudgetLabels],
  )

  const getCategoriesForGroup = useCallback(
    (group: ParentCategory) => displayCategories.filter((c) => c.parentCategory === group),
    [displayCategories],
  )

  const getSumForMonth = (group: ParentCategory, monthIndex: number) =>
    getCategoriesForGroup(group).reduce((sum, c) => {
      if (group === 'inntekter' && c.type === 'income') {
        return sum + effectiveBudgetedIncomeMonth(c, monthIndex)
      }
      const arr = ensureArrayBudgeted(c.budgeted)
      return sum + (arr[monthIndex] || 0)
    }, 0)

  const getTotalCostsForMonth = (monthIndex: number) =>
    COST_GROUPS.reduce((s, g) => s + getSumForMonth(g, monthIndex), 0)

  const getResultForMonth = (monthIndex: number) =>
    getSumForMonth('inntekter', monthIndex) - getTotalCostsForMonth(monthIndex)

  const sumBudgetedForGroup = (group: ParentCategory, mode: 'month' | 'year', monthIndex: number) =>
    getCategoriesForGroup(group).reduce((sum, c) => {
      if (group === 'inntekter' && c.type === 'income') {
        if (mode === 'month') return sum + effectiveBudgetedIncomeMonth(c, monthIndex)
        let y = 0
        for (let i = 0; i < 12; i++) y += effectiveBudgetedIncomeMonth(c, i)
        return sum + y
      }
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
    view === 'month'
      ? `${MONTHS_FULL[selectedMonth]} ${viewingYear} (budsjettert)`
      : `Hele året ${viewingYear} (budsjettert)`

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
    setNewForm({
      name: '',
      amount: '',
      freq: 'monthly',
      onceMonthIndex: 0,
      incomeWhApply: false,
      incomeWhPercent: '32',
      householdSplit: createDefaultHouseholdSplitForm(profiles),
    })
  }

  const openAddLineModal = (group: ParentCategory) => {
    const d = normalizeIncomeWithholdingRule(people[activeProfileId]?.defaultIncomeWithholding)
    setAddModalGroup(group)
    setModalSearch('')
    setNewForm({
      name: '',
      amount: '',
      freq: 'monthly',
      onceMonthIndex: 0,
      incomeWhApply: group === 'inntekter' && d.apply,
      incomeWhPercent: String(d.percent > 0 ? d.percent : 32),
      householdSplit: createDefaultHouseholdSplitForm(profiles),
    })
    setFocusAmountSignal(0)
  }

  const handlePickSuggestion = (group: ParentCategory, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const d = normalizeIncomeWithholdingRule(people[activeProfileId]?.defaultIncomeWithholding)
    setNewForm({
      name: trimmed,
      amount: '',
      freq: 'monthly',
      onceMonthIndex: 0,
      incomeWhApply: group === 'inntekter' && d.apply,
      incomeWhPercent: String(d.percent > 0 ? d.percent : 32),
      householdSplit: createDefaultHouseholdSplitForm(profiles),
    })
    setModalSearch('')
    setFocusAmountSignal((n) => n + 1)
  }

  const handleAddCustom = (group: ParentCategory) => {
    if (!newForm.name || !newForm.amount) return
    const name = newForm.name.trim()
    const raw = parsePositiveMoneyAmount2Decimals(String(newForm.amount))
    if (!Number.isFinite(raw)) {
      window.alert('Skriv inn et gyldig beløp (større enn null).')
      return
    }
    const budgeted = budgetedMonthsFromFrequency(
      raw,
      newForm.freq,
      newForm.freq === 'once' ? newForm.onceMonthIndex : undefined,
    )

    const existing = getCategoriesForGroup(group).find((c) => c.name === name)
    if (existing) {
      if (
        newForm.householdSplit.enabled &&
        subscriptionPlan === 'family' &&
        profiles.length >= 2 &&
        group !== 'inntekter'
      ) {
        window.alert(
          'Det finnes allerede en linje med dette navnet. Velg et annet navn for felles linje, eller rediger den eksisterende.',
        )
        return
      }
      const merged = mergeBudgetCategoryValues(existing, budgeted, 0)
      updateBudgetCategory(existing.id, merged)
      closeAddModal()
      return
    }

    const canHousehold =
      subscriptionPlan === 'family' &&
      profiles.length >= 2 &&
      group !== 'inntekter' &&
      newForm.householdSplit.enabled

    if (canHousehold) {
      const pids = newForm.householdSplit.participantIds
      if (pids.length < 2) {
        window.alert('Velg minst to deltakere for felles husholdning.')
        return
      }
      const mode = newForm.householdSplit.mode
      let percentWeights: number[] | undefined
      let amountReferenceByProfileId: Record<string, number> | undefined
      if (mode === 'percent') {
        const w = pids.map(
          (id) => Number(String(newForm.householdSplit.percentByProfileId[id] ?? '0').replace(',', '.')) || 0,
        )
        const s = w.reduce((a, b) => a + b, 0)
        if (Math.abs(s - 100) > 0.05) {
          window.alert('Prosentene skal sum til 100.')
          return
        }
        percentWeights = w
      }
      if (mode === 'amount') {
        const ref: Record<string, number> = {}
        for (const id of pids) {
          const v = parsePositiveMoneyAmount2Decimals(String(newForm.householdSplit.amountByProfileId[id] ?? '0'))
          ref[id] = Number.isFinite(v) ? v : 0
        }
        if (pids.map((id) => ref[id] ?? 0).reduce((a, b) => a + b, 0) <= 0) {
          window.alert('Fyll inn andelsbeløp (kroner) for hver deltaker.')
          return
        }
        const amountLine = amountReferencesSumMatchesLine(pids, ref, raw)
        if (!amountLine.ok) {
          window.alert(amountLine.message)
          return
        }
        amountReferenceByProfileId = ref
      }
      if (shouldRegisterCustom(group, name)) addCustomBudgetLabel(group, name)
      const r = addSharedHouseholdBudgetLine({
        name,
        parentCategory: group,
        frequency: newForm.freq,
        onceMonthIndex: newForm.freq === 'once' ? newForm.onceMonthIndex : undefined,
        amount: raw,
        color: COLORS[displayCategories.length % COLORS.length],
        participantProfileIds: pids,
        mode: mode === 'percent' ? 'percent' : mode === 'amount' ? 'amount' : 'equal',
        percentWeights,
        amountReferenceByProfileId,
      })
      if (r.ok) {
        closeAddModal()
        return
      }
      if (r.reason === 'name_conflict') {
        window.alert('Navnet kolliderer med en eksisterende linje på en av profilene. Velg et annet navn.')
        return
      }
      window.alert('Kunne ikke opprette felles linje. Sjekk beløp og fordeling.')
      return
    }

    if (shouldRegisterCustom(group, name)) addCustomBudgetLabel(group, name)

    const whRule =
      group === 'inntekter'
        ? normalizeIncomeWithholdingRule({
            apply: newForm.incomeWhApply,
            percent: Number(String(newForm.incomeWhPercent).replace(',', '.')) || 0,
          })
        : null

    const cat: BudgetCategory = {
      id: generateId(),
      name,
      budgeted,
      spent: 0,
      type: GROUPS.find((g) => g.id === group)?.type || 'expense',
      color: COLORS[displayCategories.length % COLORS.length],
      parentCategory: group,
      frequency: newForm.freq as BudgetCategory['frequency'],
      ...(newForm.freq === 'once' ? { onceMonthIndex: newForm.onceMonthIndex } : {}),
      ...(group === 'inntekter' && whRule?.apply
        ? { incomeWithholding: { apply: true, percent: whRule.percent } }
        : {}),
    }
    addBudgetCategory(cat)
    closeAddModal()
  }

  const fillAllMonthsFromSelected = (cat: BudgetCategory) => {
    if (cat.householdSplit && !isHouseholdAggregate) {
      const m = cat.householdSplit
      const arr = ensureArrayBudgeted(cat.budgeted)
      if (cat.frequency === 'once') {
        const mi = cat.onceMonthIndex ?? 0
        const v = arr[mi] ?? 0
        const t =
          impliedNewMonthTotal(
            m.mode,
            m.participantProfileIds,
            activeProfileId,
            v,
            m.percentWeights,
            m.amountReferenceByProfileId,
          ) ?? 0
        const total = Array(12).fill(0)
        total[mi] = t
        resplitSharedHouseholdGroupFromTotals(m.groupId, total, m)
        return
      }
      const v = arr[selectedMonth] ?? 0
      const t =
        impliedNewMonthTotal(
          m.mode,
          m.participantProfileIds,
          activeProfileId,
          v,
          m.percentWeights,
          m.amountReferenceByProfileId,
        ) ?? 0
      if (t <= 0) return
      const total = Array(12).fill(t)
      resplitSharedHouseholdGroupFromTotals(m.groupId, total, m)
      return
    }
    const arr = ensureArrayBudgeted(cat.budgeted)
    if (budgetCategoryUsesIncomeWithholding(cat)) {
      const targetNet = effectiveBudgetedIncomeMonth(cat, selectedMonth)
      const p = withholdingPercentForBudgetCategory(cat)
      const gross = grossFromDesiredNet(targetNet, p)
      updateBudgetCategory(cat.id, { budgeted: Array(12).fill(gross) })
      return
    }
    const v = arr[selectedMonth] ?? 0
    updateBudgetCategory(cat.id, { budgeted: Array(12).fill(v) })
  }

  const onExpenseCellChange = useCallback(
    (cat: BudgetCategory, monthIndex: number, n: number) => {
      if (cat.householdSplit && !isHouseholdAggregate) {
        const m = cat.householdSplit
        if (cat.frequency === 'once') {
          const t = impliedNewMonthTotal(
            m.mode,
            m.participantProfileIds,
            activeProfileId,
            n,
            m.percentWeights,
            m.amountReferenceByProfileId,
          )
          if (t == null) return
          const total = Array(12).fill(0)
          total[monthIndex] = t
          resplitSharedHouseholdGroupFromTotals(m.groupId, total, m)
        } else {
          applySharedHouseholdMonthCellEdit(cat.id, monthIndex, n)
        }
        return
      }
      applyBudgetAmountCellChange(cat, monthIndex, n, updateBudgetCategory)
    },
    [
      isHouseholdAggregate,
      activeProfileId,
      resplitSharedHouseholdGroupFromTotals,
      applySharedHouseholdMonthCellEdit,
      updateBudgetCategory,
    ],
  )

  const monthColumnIndices = view === 'month' ? [selectedMonth] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const modalGroupLabel = addModalGroup ? GROUPS.find((g) => g.id === addModalGroup)?.label ?? '' : ''
  const modalAvailable = addModalGroup
    ? getAvailableLabels(addModalGroup, labelLists, getCategoriesForGroup(addModalGroup).map((i) => i.name), {
        omitExistingLines: false,
      })
    : []

  const editLineAvailableLabels = useMemo(() => {
    if (!editLine) return []
    const existingNames = getCategoriesForGroup(editLine.parent).map((c) => c.name)
    const all = getAvailableLabels(editLine.parent, labelLists, existingNames, { omitExistingLines: false })
    return all.filter((n) => n !== editLine.category.name)
  }, [editLine, getCategoriesForGroup, labelLists])

  const handleApplyOnceMonthFromModal = useCallback(
    (newMonth: number) => {
      if (!editLine) return
      const id = editLine.category.id
      const s = useStore.getState()
      const pid = s.activeProfileId
      const fresh = s.people[pid]?.budgetCategories.find((c) => c.id === id)
      if (!fresh || fresh.frequency !== 'once') return
      const parent = editLine.parent
      const useWh =
        parent === 'inntekter' && fresh.type === 'income' && budgetCategoryUsesIncomeWithholding(fresh)
      applyOnceMonthIndexChange(
        {
          category: fresh,
          newMonthIndex: newMonth,
          isHouseholdAggregate,
          activeProfileId: pid,
          useIncomeWithholding: useWh,
        },
        { updateBudgetCategory, resplitSharedHouseholdGroupFromTotals },
      )
    },
    [editLine, isHouseholdAggregate, updateBudgetCategory, resplitSharedHouseholdGroupFromTotals],
  )

  return (
    <div className="min-w-0 flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Budsjett"
        subtitle={
          viewingYear !== budgetYear
            ? `Arkiv ${viewingYear} (kun visning) · Aktivt budsjettår er ${budgetYear}`
            : 'Budsjetter per måned for fullstendig kontroll'
        }
      />
      <BudsjettSubnav />

      {openArchiveModalOpen && (
        <BudsjettOpenArchiveModal
          viewingYear={viewingYear}
          budgetYear={budgetYear}
          onClose={() => setOpenArchiveModalOpen(false)}
          onConfirm={() => {
            const r = switchActiveBudgetYear(viewingYear)
            setOpenArchiveModalOpen(false)
            if (!r.ok && r.reason === 'not_in_archive') {
              alert('Fant ikke arkiv for dette året.')
            } else if (!r.ok) {
              alert('Kunne ikke åpne året — mangler data for en profil.')
            }
          }}
        />
      )}

      {newYearModalOpen && (
        <BudsjettNewYearModal
          budgetYear={budgetYear}
          incomeCopySource={incomeCopySource}
          expenseCopySource={expenseCopySource}
          onIncomeCopySourceChange={setIncomeCopySource}
          onExpenseCopySourceChange={setExpenseCopySource}
          onClose={() => setNewYearModalOpen(false)}
          onConfirm={() => {
            startNewBudgetYear({ income: incomeCopySource, expenses: expenseCopySource })
            setNewYearModalOpen(false)
          }}
        />
      )}

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
        showHouseholdSplitBlock={subscriptionPlan === 'family' && profiles.length >= 2}
        profilesForHousehold={profiles}
      />

      <BudgetLineIncomeWithholdingModal
        open={incomeWithholdingModalCategoryId !== null}
        category={
          incomeWithholdingModalCategoryId
            ? displayCategories.find((c) => c.id === incomeWithholdingModalCategoryId) ?? null
            : null
        }
        previewMonthIndex={selectedMonth}
        monthLabel={`${MONTHS_FULL[selectedMonth]} ${viewingYear}`}
        onClose={() => setIncomeWithholdingModalCategoryId(null)}
        onSave={(id, rule) => {
          updateBudgetCategory(id, {
            incomeWithholding: rule.apply ? { apply: true, percent: rule.percent } : undefined,
          })
        }}
      />

      <EditBudgetLineModal
        open={editLine !== null}
        onClose={() => setEditLine(null)}
        category={editLine?.category ?? null}
        parent={editLine?.parent ?? 'inntekter'}
        groupLabel={editLine ? groupLabel(editLine.parent) : ''}
        availableLabels={editLineAvailableLabels}
        budgetCategories={displayCategories}
        linkedServiceSubscriptionLabels={
          editLine && editLine.parent === 'regninger'
            ? serviceSubscriptions
                .filter(
                  (s) => s.syncToBudget && s.linkedBudgetCategoryId === editLine.category.id,
                )
                .map((s) => s.label)
            : []
        }
        remapBudgetCategoryName={remapBudgetCategoryName}
        onOpenIncomeWithholding={
          editLine && editLine.parent === 'inntekter' && editLine.category.type === 'income'
            ? () => setIncomeWithholdingModalCategoryId(editLine.category.id)
            : undefined
        }
        sharedGroupId={editLine?.category.householdSplit?.groupId ?? null}
        remapSharedHouseholdBudgetLineName={remapSharedHouseholdBudgetLineName}
        allowOnceMonthEdit={editLine?.allowOnceMonthEdit ?? false}
        viewingYear={viewingYear}
        onApplyOnceMonth={handleApplyOnceMonthFromModal}
      />

      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {isHouseholdAggregate && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--primary-pale)',
              border: '1px solid var(--accent)',
              color: 'var(--text)',
            }}
          >
            Du ser samlet husholdning — budsjett kan ikke redigeres her. Velg en person under «Viser data for» for å
            legge til eller endre linjer, inkludert <strong>felles fordeling</strong> (Familie-abonnement). Linjer
            merket «Fordelt» er budsjettert per person ut fra husholdningens valg.
          </div>
        )}
        {canOpenArchiveForEdit && (
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
            style={{
              background: 'var(--primary-pale)',
              border: '1px solid var(--accent)',
              color: 'var(--text)',
            }}
          >
            <span>
              Du viser arkiv for {viewingYear}. Aktivt budsjettår er {budgetYear}.
            </span>
            <button
              type="button"
              onClick={() => setOpenArchiveModalOpen(true)}
              className="px-3 py-2 rounded-xl font-medium shrink-0"
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Åpne {viewingYear} for redigering
            </button>
          </div>
        )}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {(['year', 'month'] as const).map((v) => (
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
                Budsjettår:
              </span>
              <select
                value={viewingYear}
                onChange={(e) => setViewingYear(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-xl min-w-[5rem]"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                    {y === budgetYear ? ' (aktivt)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {viewingYear === budgetYear && (
              <button
                type="button"
                onClick={() => setNewYearModalOpen(true)}
                className="px-3 py-2 text-sm font-medium rounded-xl"
                style={{ border: '1px solid var(--border)', color: 'var(--primary)' }}
              >
                Start nytt budsjettår
              </button>
            )}
          </div>

          {view === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Måned:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-xl"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-label="Velg måned for budsjettvisning"
              >
                {MONTHS_FULL.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={`space-y-6 ${readOnly ? 'pointer-events-none opacity-[0.92]' : ''}`}>
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
                        {formatNOKOrDash(getSumForMonth('inntekter', mi))}
                      </td>
                    ))}
                    <td
                      className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      {formatNOKOrDash(sumBudgetedForGroup('inntekter', 'year', selectedMonth))}
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
                          {formatNOKOrDash(getSumForMonth(gid, mi))}
                        </td>
                      ))}
                      <td
                        className="text-right py-2 pl-2 pr-0 tabular-nums font-medium align-middle"
                        style={{ borderTop: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        {formatNOKOrDash(sumBudgetedForGroup(gid, 'year', selectedMonth))}
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
                          {formatNOKOrDash(r)}
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
                      {formatNOKOrDash(budgetResult)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {GROUPS.map((group) => {
          const items = getCategoriesForGroup(group.id)
          const incomeLinesOnly = group.id === 'inntekter' ? items.filter((c) => c.type === 'income') : []
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
                aria-label={`${group.label}, ${formatNOKOrDash(groupSum)}, ${isExpanded ? 'utvidet' : 'skjult'}`}
                onClick={() => setExpanded({ ...expanded, [group.id]: !isExpanded })}
                className="w-full flex items-center justify-between gap-3 text-left pointer-events-auto"
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
                      {formatNOKOrDash(groupSum)}
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
                        {items.map((cat, idx) => {
                          const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                          const lineOpen = householdLineBreakdownOpen === cat.id
                          const showHouseholdLineBreakdown = isHouseholdAggregate
                          const linkedServiceSubs =
                            group.id === 'regninger'
                              ? serviceSubscriptions.filter(
                                  (s) => s.syncToBudget && s.linkedBudgetCategoryId === cat.id,
                                )
                              : []
                          const subBudgetLocked = linkedServiceSubs.length > 0
                          const amountReadOnly = readOnly || subBudgetLocked
                          const incomeWhOn =
                            group.id === 'inntekter' && cat.type === 'income' && budgetCategoryUsesIncomeWithholding(cat)
                          const whBreakdownOpen = incomeWhOn && incomeWhBreakdownOpenId === cat.id
                          const whYearTotals = whBreakdownOpen ? yearIncomeWhBreakdownTotals(cat) : null
                          return (
                            <Fragment key={cat.id}>
                              <tr className="align-middle" style={{ borderTop: '1px solid var(--border)' }}>
                                <td className="py-2 px-2 align-middle max-w-[14rem] md:max-w-[18rem]">
                                  <div className="flex items-center gap-1.5 min-w-0">
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
                                    {cat.householdSplit && (
                                      <span
                                        className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                        style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                                      >
                                        Fordelt
                                      </span>
                                    )}
                                    {showHouseholdLineBreakdown && (
                                      <button
                                        type="button"
                                        className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity"
                                        style={{ color: 'var(--text-muted)' }}
                                        onClick={() =>
                                          setHouseholdLineBreakdownOpen((o) =>
                                            o === cat.id ? null : cat.id,
                                          )
                                        }
                                        aria-expanded={lineOpen}
                                        aria-label={`Vis eller skjul bidrag per person for ${cat.name} (${group.label})`}
                                      >
                                        {lineOpen ? (
                                          <Minus size={14} strokeWidth={2} />
                                        ) : (
                                          <Plus size={14} strokeWidth={2} />
                                        )}
                                      </button>
                                    )}
                                    <BudgetLineReorderButtons
                                      disabled={readOnly}
                                      canMoveUp={idx > 0}
                                      canMoveDown={idx < items.length - 1}
                                      categoryLabel={cat.name}
                                      onMoveUp={() => reorderBudgetCategory(group.id, cat.id, 'up')}
                                      onMoveDown={() => reorderBudgetCategory(group.id, cat.id, 'down')}
                                    />
                                    {incomeWhOn && (
                                      <button
                                        type="button"
                                        className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity min-w-[28px] min-h-[28px] inline-flex items-center justify-center"
                                        style={{ color: 'var(--text-muted)' }}
                                        onClick={() =>
                                          setIncomeWhBreakdownOpenId((o) => (o === cat.id ? null : cat.id))
                                        }
                                        aria-expanded={whBreakdownOpen}
                                        aria-label={`Vis eller skjul forenklet trekk for ${cat.name}`}
                                      >
                                        {whBreakdownOpen ? (
                                          <Minus size={14} strokeWidth={2} />
                                        ) : (
                                          <Plus size={14} strokeWidth={2} />
                                        )}
                                      </button>
                                    )}
                                    {group.id === 'inntekter' && cat.type === 'income' && !readOnly && (
                                      <button
                                        type="button"
                                        onClick={() => setIncomeWithholdingModalCategoryId(cat.id)}
                                        className="p-1 opacity-70 hover:opacity-100 flex-shrink-0 min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded-lg"
                                        style={{ color: 'var(--primary)' }}
                                        title="Forenklet trekk på linjen"
                                        aria-label={`Forenklet trekk for ${cat.name}`}
                                      >
                                        <SlidersHorizontal size={14} strokeWidth={2} />
                                      </button>
                                    )}
                                    {!readOnly && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditLine({
                                            category: cat,
                                            parent: group.id,
                                            allowOnceMonthEdit: cat.frequency === 'once' && !subBudgetLocked,
                                          })
                                        }
                                        className="p-1 opacity-60 hover:opacity-100 flex-shrink-0 min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded-lg"
                                        style={{ color: 'var(--primary)' }}
                                        title="Rediger linje"
                                        aria-label={`Rediger ${cat.name}`}
                                      >
                                        <Pencil size={14} strokeWidth={2} />
                                      </button>
                                    )}
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
                                      value={
                                        incomeWhOn
                                          ? effectiveBudgetedIncomeMonth(cat, mi)
                                          : budgetedArr[mi] ?? 0
                                      }
                                      readOnly={amountReadOnly}
                                      onChange={(n) =>
                                        incomeWhOn
                                          ? applyBudgetAmountCellChange(
                                              cat,
                                              mi,
                                              grossFromDesiredNet(
                                                n,
                                                withholdingPercentForBudgetCategory(cat),
                                              ),
                                              updateBudgetCategory,
                                            )
                                          : onExpenseCellChange(cat, mi, n)
                                      }
                                    />
                                  </td>
                                ))}
                                <td
                                  className="align-middle py-2 px-2 text-xs tabular-nums whitespace-nowrap text-right font-semibold"
                                  style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                >
                                  {formatNOKOrDash(yearBudgetLineTotal(cat, group.id))}
                                </td>
                                <td className="align-middle py-1 px-1 text-center">
                                  <button
                                    type="button"
                                    disabled={readOnly || subBudgetLocked}
                                    onClick={() => fillAllMonthsFromSelected(cat)}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg opacity-80 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none"
                                    style={{ background: 'var(--bg)', color: 'var(--primary)' }}
                                    title={`Kopier beløpet fra ${MONTHS_FULL[selectedMonth]} til alle tolv måneder`}
                                    aria-label="Samme beløp alle måneder"
                                  >
                                    <Copy size={16} strokeWidth={2} />
                                  </button>
                                </td>
                              </tr>
                              {whBreakdownOpen && whYearTotals && (
                                <>
                                  <tr
                                    className="align-middle"
                                    style={{
                                      borderTop: '1px solid var(--border)',
                                      background: 'var(--surface)',
                                    }}
                                  >
                                    <td
                                      className="py-1.5 px-2 text-xs align-middle max-w-[14rem] md:max-w-[18rem]"
                                      style={{
                                        color: 'var(--text-muted)',
                                        boxShadow: 'inset 3px 0 0 var(--border)',
                                      }}
                                    >
                                      Brutto (budsjett)
                                    </td>
                                    {monthColumnIndices.map((mi) => {
                                      const b = grossWithholdingNetForBudgetMonth(cat, mi)
                                      return (
                                        <td
                                          key={mi}
                                          className="align-middle py-1 px-0.5 text-right text-xs tabular-nums"
                                          style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                        >
                                          {formatNOKOrDash(b.gross)}
                                        </td>
                                      )
                                    })}
                                    <td
                                      className="align-middle py-1.5 px-2 text-xs tabular-nums text-right font-medium whitespace-nowrap"
                                      style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                    >
                                      {formatNOKOrDash(whYearTotals.gross)}
                                    </td>
                                    <td className="align-middle py-1 px-1" aria-hidden />
                                  </tr>
                                  <tr
                                    className="align-middle"
                                    style={{
                                      borderTop: '1px solid var(--border)',
                                      background: 'var(--surface)',
                                    }}
                                  >
                                    <td
                                      className="py-1.5 px-2 text-xs align-middle max-w-[14rem] md:max-w-[18rem]"
                                      style={{
                                        color: 'var(--text-muted)',
                                        boxShadow: 'inset 3px 0 0 var(--border)',
                                      }}
                                    >
                                      Forenklet trekk ({withholdingPercentForBudgetCategory(cat)} %)
                                    </td>
                                    {monthColumnIndices.map((mi) => {
                                      const b = grossWithholdingNetForBudgetMonth(cat, mi)
                                      return (
                                        <td
                                          key={mi}
                                          className="align-middle py-1 px-0.5 text-right text-xs tabular-nums"
                                          style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                        >
                                          {formatNOKOrDash(b.withholding)}
                                        </td>
                                      )
                                    })}
                                    <td
                                      className="align-middle py-1.5 px-2 text-xs tabular-nums text-right font-medium whitespace-nowrap"
                                      style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                    >
                                      {formatNOKOrDash(whYearTotals.withholding)}
                                    </td>
                                    <td className="align-middle py-1 px-1" aria-hidden />
                                  </tr>
                                  <tr
                                    className="align-middle"
                                    style={{
                                      borderTop: '1px solid var(--border)',
                                      background: 'var(--surface)',
                                    }}
                                  >
                                    <td
                                      className="py-1.5 px-2 text-xs align-middle max-w-[14rem] md:max-w-[18rem]"
                                      style={{
                                        color: 'var(--text-muted)',
                                        boxShadow: 'inset 3px 0 0 var(--border)',
                                      }}
                                    >
                                      Netto i summeringer
                                    </td>
                                    {monthColumnIndices.map((mi) => {
                                      const b = grossWithholdingNetForBudgetMonth(cat, mi)
                                      return (
                                        <td
                                          key={mi}
                                          className="align-middle py-1 px-0.5 text-right text-xs tabular-nums"
                                          style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                        >
                                          {formatNOKOrDash(b.net)}
                                        </td>
                                      )
                                    })}
                                    <td
                                      className="align-middle py-1.5 px-2 text-xs tabular-nums text-right font-medium whitespace-nowrap"
                                      style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                    >
                                      {formatNOKOrDash(whYearTotals.net)}
                                    </td>
                                    <td className="align-middle py-1 px-1" aria-hidden />
                                  </tr>
                                </>
                              )}
                              {linkedServiceSubs.length > 0 && group.id === 'regninger' && (
                                <tr style={{ background: 'var(--bg)' }}>
                                  <td
                                    colSpan={monthColumnIndices.length + 3}
                                    className="py-2 px-2 pl-8 text-xs leading-relaxed"
                                    style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
                                  >
                                    <span style={{ color: 'var(--text)' }}>Abonnementer: </span>
                                    {linkedServiceSubs.map((s) => s.label).join(', ')} — planbeløp styres fra{' '}
                                    <span className="font-medium" style={{ color: 'var(--primary)' }}>
                                      Abonnementer
                                    </span>
                                    .
                                  </td>
                                </tr>
                              )}
                              {lineOpen &&
                                showHouseholdLineBreakdown &&
                                getHouseholdLineBreakdown(group.id, cat.name).map((row) => (
                                  <tr
                                    key={`${cat.id}-${row.profileId}`}
                                    className="align-middle"
                                    style={{
                                      borderTop: '1px solid var(--border)',
                                      background: 'var(--bg)',
                                    }}
                                  >
                                    <td className="py-1.5 px-2 pl-8 align-middle max-w-[14rem] md:max-w-[18rem]">
                                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {row.name}
                                      </span>
                                    </td>
                                    {monthColumnIndices.map((mi) => (
                                      <td
                                        key={mi}
                                        className="align-middle py-1 px-0.5 text-right text-xs tabular-nums"
                                        style={{
                                          borderLeft: '1px solid var(--border)',
                                          color: 'var(--text)',
                                        }}
                                      >
                                        {formatNOKOrDash(row.monthly[mi] ?? 0)}
                                      </td>
                                    ))}
                                    <td
                                      className="align-middle py-1.5 px-2 text-xs tabular-nums whitespace-nowrap text-right font-medium"
                                      style={{ borderLeft: '1px solid var(--border)', color: 'var(--text)' }}
                                    >
                                      {formatNOKOrDash(row.yearTotal)}
                                    </td>
                                    <td className="align-middle py-1 px-1" aria-hidden />
                                  </tr>
                                ))}
                            </Fragment>
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
                              {formatNOKOrDash(getSumForMonth(group.id, mi))}
                            </td>
                          ))}
                          <td
                            className="text-right py-2 px-2 text-xs tabular-nums"
                            style={{ borderLeft: '1px solid var(--border)', color: 'var(--primary)' }}
                          >
                            {formatNOKOrDash(sumBudgetedForGroup(group.id, 'year', selectedMonth))}
                          </td>
                          <td />
                        </tr>
                        {incomeLinesOnly.length > 0 && (
                          <>
                            <tr aria-hidden="true">
                              <td
                                colSpan={monthColumnIndices.length + 3}
                                className="h-3 p-0 border-0"
                                style={{ background: 'transparent', lineHeight: 0, fontSize: 0 }}
                              />
                            </tr>
                            <tr
                              className="align-middle"
                              style={{
                                background: 'transparent',
                                borderTop: '1px dashed var(--border)',
                              }}
                            >
                              <td className="py-2 px-2 align-middle max-w-[14rem] md:max-w-[18rem]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity min-w-[28px] min-h-[28px] inline-flex items-center justify-center touch-manipulation"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={() => setIncomeGroupGrossBreakdownOpen((o) => !o)}
                                    aria-expanded={incomeGroupGrossBreakdownOpen}
                                    aria-label="Vis eller skjul brutto per inntektslinje"
                                  >
                                    {incomeGroupGrossBreakdownOpen ? (
                                      <Minus size={14} strokeWidth={2} />
                                    ) : (
                                      <Plus size={14} strokeWidth={2} />
                                    )}
                                  </button>
                                  <span
                                    className="text-[11px] leading-snug font-normal italic"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    Brutto totalt (sum linjer){' '}
                                    <span className="not-italic opacity-80">— til sammenligning med netto over</span>
                                  </span>
                                </div>
                              </td>
                              {monthColumnIndices.map((mi) => (
                                <td
                                  key={mi}
                                  className="text-right text-[11px] tabular-nums py-2 px-1 align-middle font-normal"
                                  style={{
                                    borderLeft: '1px solid var(--border)',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {formatNOKOrDash(sumIncomeGrossForMonth(items, mi))}
                                </td>
                              ))}
                              <td
                                className="text-right py-2 px-2 text-[11px] tabular-nums align-middle whitespace-nowrap font-normal"
                                style={{ borderLeft: '1px solid var(--border)', color: 'var(--text-muted)' }}
                              >
                                {formatNOKOrDash(sumIncomeGrossYear(items))}
                              </td>
                              <td className="align-middle" aria-hidden />
                            </tr>
                            {incomeGroupGrossBreakdownOpen &&
                              incomeLinesOnly.map((cat) => (
                                <tr
                                  key={`income-gross-${cat.id}`}
                                  className="align-middle"
                                  style={{ background: 'transparent' }}
                                >
                                  <td
                                    className="py-1 px-2 pl-8 text-[10px] align-middle max-w-[14rem] md:max-w-[18rem] truncate font-normal"
                                    style={{ color: 'var(--text-muted)' }}
                                    title={cat.name}
                                  >
                                    {cat.name}
                                  </td>
                                  {monthColumnIndices.map((mi) => (
                                    <td
                                      key={mi}
                                      className="text-right text-[10px] tabular-nums py-1 px-0.5 align-middle font-normal"
                                      style={{
                                        borderLeft: '1px solid var(--border)',
                                        color: 'var(--text-muted)',
                                        opacity: 0.92,
                                      }}
                                    >
                                      {formatNOKOrDash(incomeLineGrossMonth(cat, mi))}
                                    </td>
                                  ))}
                                  <td
                                    className="text-right py-1 px-2 text-[10px] tabular-nums align-middle whitespace-nowrap font-normal"
                                    style={{
                                      borderLeft: '1px solid var(--border)',
                                      color: 'var(--text-muted)',
                                      opacity: 0.92,
                                    }}
                                  >
                                    {formatNOKOrDash(yearIncomeWhBreakdownTotals(cat).gross)}
                                  </td>
                                  <td className="align-middle" aria-hidden />
                                </tr>
                              ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="block md:hidden mt-4 space-y-3 overflow-x-auto">
                    {view === 'year' ? (
                      <div className="min-w-[640px] space-y-3">
                        {items.map((cat, idx) => {
                          const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                          const lineOpen = householdLineBreakdownOpen === cat.id
                          const showHouseholdLineBreakdown = isHouseholdAggregate
                          const linkedServiceSubs =
                            group.id === 'regninger'
                              ? serviceSubscriptions.filter(
                                  (s) => s.syncToBudget && s.linkedBudgetCategoryId === cat.id,
                                )
                              : []
                          const subBudgetLocked = linkedServiceSubs.length > 0
                          const amountReadOnly = readOnly || subBudgetLocked
                          const incomeWhOn =
                            group.id === 'inntekter' && cat.type === 'income' && budgetCategoryUsesIncomeWithholding(cat)
                          const whBreakdownOpen = incomeWhOn && incomeWhBreakdownOpenId === cat.id
                          const whYearTotalsMob = whBreakdownOpen ? yearIncomeWhBreakdownTotals(cat) : null
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
                                  {cat.householdSplit && (
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                                    >
                                      Fordelt
                                    </span>
                                  )}
                                  {showHouseholdLineBreakdown && (
                                    <button
                                      type="button"
                                      className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity"
                                      style={{ color: 'var(--text-muted)' }}
                                      onClick={() =>
                                        setHouseholdLineBreakdownOpen((o) =>
                                          o === cat.id ? null : cat.id,
                                        )
                                      }
                                      aria-expanded={lineOpen}
                                      aria-label={`Vis eller skjul bidrag per person for ${cat.name} (${group.label})`}
                                    >
                                      {lineOpen ? (
                                        <Minus size={14} strokeWidth={2} />
                                      ) : (
                                        <Plus size={14} strokeWidth={2} />
                                      )}
                                    </button>
                                  )}
                                {incomeWhOn && (
                                    <button
                                      type="button"
                                      className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
                                      style={{ color: 'var(--text-muted)' }}
                                      onClick={() =>
                                        setIncomeWhBreakdownOpenId((o) => (o === cat.id ? null : cat.id))
                                      }
                                      aria-expanded={whBreakdownOpen}
                                      aria-label={`Vis eller skjul forenklet trekk for ${cat.name}`}
                                    >
                                      {whBreakdownOpen ? (
                                        <Minus size={14} strokeWidth={2} />
                                      ) : (
                                        <Plus size={14} strokeWidth={2} />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <BudgetLineReorderButtons
                                    disabled={readOnly}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < items.length - 1}
                                    categoryLabel={cat.name}
                                    onMoveUp={() => reorderBudgetCategory(group.id, cat.id, 'up')}
                                    onMoveDown={() => reorderBudgetCategory(group.id, cat.id, 'down')}
                                  />
                                  {group.id === 'inntekter' && cat.type === 'income' && !readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => setIncomeWithholdingModalCategoryId(cat.id)}
                                      className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                                      style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                      title="Forenklet trekk"
                                      aria-label={`Forenklet trekk for ${cat.name}`}
                                    >
                                      <SlidersHorizontal size={16} strokeWidth={2} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={readOnly || subBudgetLocked}
                                    onClick={() => fillAllMonthsFromSelected(cat)}
                                    className="p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                    title={`Kopier beløp fra ${MONTHS_FULL[selectedMonth]} til alle måneder`}
                                    aria-label="Samme beløp alle måneder"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditLine({
                                          category: cat,
                                          parent: group.id,
                                          allowOnceMonthEdit: cat.frequency === 'once' && !subBudgetLocked,
                                        })
                                      }
                                      className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                                      style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                      title="Rediger linje"
                                      aria-label={`Rediger ${cat.name}`}
                                    >
                                      <Pencil size={16} strokeWidth={2} />
                                    </button>
                                  )}
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
                                    value={incomeWhOn ? effectiveBudgetedIncomeMonth(cat, i) : val}
                                    readOnly={amountReadOnly}
                                    onChange={(n) =>
                                      incomeWhOn
                                        ? applyBudgetAmountCellChange(
                                            cat,
                                            i,
                                            grossFromDesiredNet(
                                              n,
                                              withholdingPercentForBudgetCategory(cat),
                                            ),
                                            updateBudgetCategory,
                                          )
                                        : onExpenseCellChange(cat, i, n)
                                    }
                                    className="!max-w-full !ml-0 w-full text-[11px]"
                                  />
                                ))}
                              </div>
                              {whBreakdownOpen && whYearTotalsMob && (
                                <div
                                  className="mt-3 pt-3 space-y-3 pointer-events-auto"
                                  style={{ borderTop: '1px solid var(--border)' }}
                                >
                                  <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                                    Forenklet trekk — detalj
                                  </p>
                                  {(
                                    [
                                      ['Brutto (budsjett)', 'gross'],
                                      [
                                        `Forenklet trekk (${withholdingPercentForBudgetCategory(cat)} %)`,
                                        'withholding',
                                      ],
                                      ['Netto i summeringer', 'net'],
                                    ] as const
                                  ).map(([label, key]) => (
                                    <div key={key}>
                                      <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                                        {label}
                                      </div>
                                      <div className="overflow-x-auto -mx-1 px-1">
                                        <div className="flex gap-2 min-w-max pb-1">
                                          {MONTH_INDEXES.map((mi) => {
                                            const b = grossWithholdingNetForBudgetMonth(cat, mi)
                                            const v = b[key]
                                            return (
                                              <div key={mi} className="text-center shrink-0 w-11">
                                                <div style={{ color: 'var(--text-muted)' }}>{MONTHS[mi]}</div>
                                                <div className="tabular-nums mt-0.5 text-[11px]" style={{ color: 'var(--text)' }}>
                                                  {formatNOKOrDash(v)}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                      <div className="text-[11px] tabular-nums text-right mt-1" style={{ color: 'var(--text)' }}>
                                        Totalt/år {formatNOKOrDash(whYearTotalsMob[key])}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {linkedServiceSubs.length > 0 && group.id === 'regninger' && (
                                <p className="text-[11px] mt-2 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                  <span style={{ color: 'var(--text)' }}>Abonnementer: </span>
                                  {linkedServiceSubs.map((s) => s.label).join(', ')} — planbeløp styres fra Abonnementer.
                                </p>
                              )}
                              {lineOpen && showHouseholdLineBreakdown && (
                                <div
                                  className="mt-3 pt-3 space-y-2 pointer-events-auto"
                                  style={{ borderTop: '1px solid var(--border)' }}
                                >
                                  {getHouseholdLineBreakdown(group.id, cat.name).map((row) => (
                                    <div
                                      key={row.profileId}
                                      className="rounded-lg p-2 text-xs"
                                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    >
                                      <div className="font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                                        {row.name}
                                      </div>
                                      <div className="overflow-x-auto -mx-1 px-1">
                                        <div className="flex gap-2 min-w-max pb-1">
                                          {MONTH_INDEXES.map((mi) => (
                                            <div key={mi} className="text-center shrink-0 w-11">
                                              <div style={{ color: 'var(--text-muted)' }}>{MONTHS[mi]}</div>
                                              <div className="tabular-nums mt-0.5" style={{ color: 'var(--text)' }}>
                                                {formatNOKOrDash(row.monthly[mi] ?? 0)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      items.map((cat, idx) => {
                        const budgetedArr = ensureArrayBudgeted(cat.budgeted)
                        const lineOpen = householdLineBreakdownOpen === cat.id
                        const showHouseholdLineBreakdown = isHouseholdAggregate
                        const linkedServiceSubs =
                          group.id === 'regninger'
                            ? serviceSubscriptions.filter(
                                (s) => s.syncToBudget && s.linkedBudgetCategoryId === cat.id,
                              )
                            : []
                        const subBudgetLocked = linkedServiceSubs.length > 0
                        const amountReadOnly = readOnly || subBudgetLocked
                        const incomeWhOn =
                          group.id === 'inntekter' && cat.type === 'income' && budgetCategoryUsesIncomeWithholding(cat)
                        const whBreakdownOpen = incomeWhOn && incomeWhBreakdownOpenId === cat.id
                        const whYearTotalsMobMonth = whBreakdownOpen ? yearIncomeWhBreakdownTotals(cat) : null
                        const whSel = whBreakdownOpen
                          ? grossWithholdingNetForBudgetMonth(cat, selectedMonth)
                          : null
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
                                {cat.householdSplit && (
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                    style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                                  >
                                    Fordelt
                                  </span>
                                )}
                                {showHouseholdLineBreakdown && (
                                  <button
                                    type="button"
                                    className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={() =>
                                      setHouseholdLineBreakdownOpen((o) =>
                                        o === cat.id ? null : cat.id,
                                      )
                                    }
                                    aria-expanded={lineOpen}
                                    aria-label={`Vis eller skjul bidrag per person for ${cat.name} (${group.label})`}
                                  >
                                    {lineOpen ? (
                                      <Minus size={14} strokeWidth={2} />
                                    ) : (
                                      <Plus size={14} strokeWidth={2} />
                                    )}
                                  </button>
                                )}
                                {incomeWhOn && (
                                  <button
                                    type="button"
                                    className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={() =>
                                      setIncomeWhBreakdownOpenId((o) => (o === cat.id ? null : cat.id))
                                    }
                                    aria-expanded={whBreakdownOpen}
                                    aria-label={`Vis eller skjul forenklet trekk for ${cat.name}`}
                                  >
                                    {whBreakdownOpen ? (
                                      <Minus size={14} strokeWidth={2} />
                                    ) : (
                                      <Plus size={14} strokeWidth={2} />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <BudgetLineReorderButtons
                                  disabled={readOnly}
                                  canMoveUp={idx > 0}
                                  canMoveDown={idx < items.length - 1}
                                  categoryLabel={cat.name}
                                  onMoveUp={() => reorderBudgetCategory(group.id, cat.id, 'up')}
                                  onMoveDown={() => reorderBudgetCategory(group.id, cat.id, 'down')}
                                />
                                {group.id === 'inntekter' && cat.type === 'income' && !readOnly && (
                                  <button
                                    type="button"
                                    onClick={() => setIncomeWithholdingModalCategoryId(cat.id)}
                                    className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                    title="Forenklet trekk"
                                    aria-label={`Forenklet trekk for ${cat.name}`}
                                  >
                                    <SlidersHorizontal size={16} strokeWidth={2} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={readOnly || subBudgetLocked}
                                  onClick={() => fillAllMonthsFromSelected(cat)}
                                  className="p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                                  style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                  title={`Kopier beløp fra ${MONTHS_FULL[selectedMonth]} til alle måneder`}
                                  aria-label="Samme beløp alle måneder"
                                >
                                  <Copy size={16} />
                                </button>
                                {!readOnly && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditLine({
                                        category: cat,
                                        parent: group.id,
                                        allowOnceMonthEdit: cat.frequency === 'once' && !subBudgetLocked,
                                      })
                                    }
                                    className="p-1.5 rounded-lg min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                                    title="Rediger linje"
                                    aria-label={`Rediger ${cat.name}`}
                                  >
                                    <Pencil size={16} strokeWidth={2} />
                                  </button>
                                )}
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
                              <div>
                                {MONTHS[selectedMonth]}
                                {incomeWhOn ? ' (netto)' : ''}:
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <BudgetAmountCell
                                  value={
                                    incomeWhOn
                                      ? effectiveBudgetedIncomeMonth(cat, selectedMonth)
                                      : budgetedArr[selectedMonth] || 0
                                  }
                                  readOnly={amountReadOnly}
                                  onChange={(n) =>
                                    incomeWhOn
                                      ? applyBudgetAmountCellChange(
                                          cat,
                                          selectedMonth,
                                          grossFromDesiredNet(
                                            n,
                                            withholdingPercentForBudgetCategory(cat),
                                          ),
                                          updateBudgetCategory,
                                        )
                                      : onExpenseCellChange(cat, selectedMonth, n)
                                  }
                                />
                              </div>
                              <div>Totalt år:</div>
                              <div style={{ textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>
                                {formatNOKOrDash(yearBudgetLineTotal(cat, group.id))}
                              </div>
                            </div>
                            {whBreakdownOpen && whYearTotalsMobMonth && whSel && (
                              <div
                                className="mt-3 pt-3 space-y-2 text-xs pointer-events-auto"
                                style={{ borderTop: '1px solid var(--border)' }}
                              >
                                <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Forenklet trekk — detalj
                                </p>
                                <div className="flex justify-between gap-2 tabular-nums">
                                  <span style={{ color: 'var(--text-muted)' }}>Brutto (budsjett)</span>
                                  <span style={{ color: 'var(--text)' }}>
                                    {formatNOKOrDash(whSel.gross)}{' '}
                                    <span className="text-[10px] opacity-80">
                                      / år {formatNOKOrDash(whYearTotalsMobMonth.gross)}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex justify-between gap-2 tabular-nums">
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    Trekk ({withholdingPercentForBudgetCategory(cat)} %)
                                  </span>
                                  <span style={{ color: 'var(--text)' }}>
                                    {formatNOKOrDash(whSel.withholding)}{' '}
                                    <span className="text-[10px] opacity-80">
                                      / år {formatNOKOrDash(whYearTotalsMobMonth.withholding)}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex justify-between gap-2 tabular-nums">
                                  <span style={{ color: 'var(--text-muted)' }}>Netto i summeringer</span>
                                  <span style={{ color: 'var(--text)' }}>
                                    {formatNOKOrDash(whSel.net)}{' '}
                                    <span className="text-[10px] opacity-80">
                                      / år {formatNOKOrDash(whYearTotalsMobMonth.net)}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            )}
                            {linkedServiceSubs.length > 0 && group.id === 'regninger' && (
                              <p className="text-[11px] mt-2 mb-0 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                <span style={{ color: 'var(--text)' }}>Abonnementer: </span>
                                {linkedServiceSubs.map((s) => s.label).join(', ')} — planbeløp styres fra Abonnementer.
                              </p>
                            )}
                            {lineOpen && showHouseholdLineBreakdown && (
                              <div
                                className="mt-3 pt-3 space-y-2 pointer-events-auto"
                                style={{ borderTop: '1px solid var(--border)' }}
                              >
                                {getHouseholdLineBreakdown(group.id, cat.name).map((row) => (
                                  <div
                                    key={row.profileId}
                                    className="flex items-start justify-between gap-2 text-xs"
                                  >
                                    <span style={{ color: 'var(--text-muted)' }}>{row.name}</span>
                                    <div className="text-right shrink-0">
                                      <div className="tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                                        {formatNOKOrDash(row.monthly[selectedMonth] ?? 0)}
                                      </div>
                                      <div style={{ color: 'var(--text-muted)' }}>
                                        Totalt/år {formatNOKOrDash(row.yearTotal)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                          {formatNOKOrDash(
                            view === 'year'
                              ? sumBudgetedForGroup(group.id, 'year', selectedMonth)
                              : getSumForMonth(group.id, selectedMonth),
                          )}
                        </div>
                      </div>
                    </div>
                    {group.id === 'inntekter' && incomeLinesOnly.length > 0 && (
                      <div
                        className="mt-2.5 p-2.5 rounded-xl space-y-2"
                        style={{
                          background: 'var(--surface)',
                          border: '1px dashed var(--border)',
                        }}
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Bruttoinformasjon
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <button
                              type="button"
                              className="pointer-events-auto p-0.5 rounded flex-shrink-0 opacity-45 hover:opacity-90 transition-opacity min-h-[28px] min-w-[28px] inline-flex items-center justify-center touch-manipulation"
                              style={{ color: 'var(--text-muted)' }}
                              onClick={() => setIncomeGroupGrossBreakdownOpen((o) => !o)}
                              aria-expanded={incomeGroupGrossBreakdownOpen}
                              aria-label="Vis eller skjul brutto per inntektslinje"
                            >
                              {incomeGroupGrossBreakdownOpen ? (
                                <Minus size={14} strokeWidth={2} />
                              ) : (
                                <Plus size={14} strokeWidth={2} />
                              )}
                            </button>
                            <span
                              className="leading-snug min-w-0 text-[11px] italic font-normal"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Sum brutto (alle linjer)
                            </span>
                          </div>
                          <span
                            className="tabular-nums font-normal shrink-0 text-[11px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {formatNOKOrDash(
                              view === 'year'
                                ? sumIncomeGrossYear(items)
                                : sumIncomeGrossForMonth(items, selectedMonth),
                            )}
                          </span>
                        </div>
                        {incomeGroupGrossBreakdownOpen && (
                          <ul className="space-y-1.5 pl-7 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {incomeLinesOnly.map((cat) => (
                              <li
                                key={`mob-gross-${cat.id}`}
                                className="flex items-start justify-between gap-2 tabular-nums font-normal"
                              >
                                <span className="truncate min-w-0" title={cat.name}>
                                  {cat.name}
                                </span>
                                <span className="shrink-0 text-right">
                                  {formatNOKOrDash(
                                    view === 'year'
                                      ? yearIncomeWhBreakdownTotals(cat).gross
                                      : incomeLineGrossMonth(cat, selectedMonth),
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openAddLineModal(group.id)}
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
