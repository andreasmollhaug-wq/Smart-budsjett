'use client'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { useActivePersonFinance, useStore, type SavingsGoal } from '@/lib/store'
import { chartColorsForUiPalette } from '@/lib/uiColorPalette'
import {
  calcProgress,
  generateId,
  mixHexWithBlack,
  mixHexWithWhite,
  parseThousands,
  formatThousands,
} from '@/lib/utils'
import {
  aggregateSavingsGoalsKpi,
  getEffectiveCurrentAmount,
  isSavingsGoalCompleted,
  resolveGoalProfileId,
  resolveSavingsGoalStorageKey,
  sumSavingsTransactionsForCategory,
} from '@/lib/savingsDerived'
import { applyDedicatedSparingCategory, SPARING_LINK_NEW_DEDICATED } from '@/lib/savingsBudgetLink'
import {
  SPARING_SORT_LABELS,
  SPARING_SORT_MODES,
  sortSavingsGoalsForDisplay,
  type SparingSortMode,
} from '@/lib/sparingGoalsSort'
import { useFormattedThousandsInput } from '@/lib/useFormattedThousandsInput'
import { Calendar, Percent, PiggyBank, Plus, Target, Trash2 } from 'lucide-react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import SparingGoalDetailModal from '@/components/sparing/SparingGoalDetailModal'
import SparingNewGoalModal, { type NewSavingsGoalPayload } from '@/components/sparing/SparingNewGoalModal'
import SparingSubnav from '@/components/sparing/SparingSubnav'
import StatCard from '@/components/ui/StatCard'

export default function SparingPage() {
  const { formatNOK } = useNokDisplayFormatters()
  const uiColorPalette = useStore((s) => s.uiColorPalette)
  const goalColors = useMemo(() => {
    const { primary } = chartColorsForUiPalette(uiColorPalette)
    return [primary, '#0CA678', '#F08C00', '#AE3EC9', '#E03131', '#0B7285']
  }, [uiColorPalette])
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoalForProfile,
    removeSavingsGoalForProfile,
    budgetCategories,
    customBudgetLabels,
    transactions,
    addTransaction,
    addBudgetCategory,
    addCustomBudgetLabel,
    activeProfileId,
    updateTransaction,
    removeTransaction,
  } = useActivePersonFinance()

  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false)
  const sortSelectId = useId()
  const showCompletedSwitchId = useId()
  const [goalSortMode, setGoalSortMode] = useState<SparingSortMode>('name_asc')
  const [showCompletedGoals, setShowCompletedGoals] = useState(true)
  const [goalSelection, setGoalSelection] = useState<'all' | Set<string>>('all')
  const goalSelectionInputPrefix = useId()

  const [depositId, setDepositId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const { onChange: onDepositAmountChange } = useFormattedThousandsInput(depositAmount, setDepositAmount)
  const [depositNote, setDepositNote] = useState('')
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [editInModal, setEditInModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    linkedBudgetCategoryId: '' as string,
  })
  const { onChange: onEditTargetAmountChange } = useFormattedThousandsInput(
    editForm.targetAmount,
    (v) => setEditForm((prev) => ({ ...prev, targetAmount: v })),
  )

  const patchGoal = useCallback(
    (goal: SavingsGoal, data: Partial<SavingsGoal>) => {
      const { profileId, goalId } = resolveSavingsGoalStorageKey(goal, activeProfileId)
      updateSavingsGoalForProfile(profileId, goalId, data)
    },
    [activeProfileId, updateSavingsGoalForProfile],
  )

  const removeGoal = useCallback(
    (goal: SavingsGoal) => {
      const { profileId, goalId } = resolveSavingsGoalStorageKey(goal, activeProfileId)
      removeSavingsGoalForProfile(profileId, goalId)
    },
    [activeProfileId, removeSavingsGoalForProfile],
  )

  const spareCategories = useMemo(
    () => budgetCategories.filter((c) => c.parentCategory === 'sparing' && c.type === 'expense'),
    [budgetCategories],
  )

  const { sortedSavingsGoals, effectiveByGoalId } = useMemo(() => {
    const rows = savingsGoals.map((goal) => {
      const effective = getEffectiveCurrentAmount(
        goal,
        transactions,
        budgetCategories,
        activeProfileId,
      )
      const progress = calcProgress(effective, goal.targetAmount)
      return { goal, effective, progress }
    })
    const effectiveByGoalId = new Map(rows.map((r) => [r.goal.id, r.effective]))
    return {
      sortedSavingsGoals: sortSavingsGoalsForDisplay(rows, goalSortMode),
      effectiveByGoalId,
    }
  }, [savingsGoals, transactions, budgetCategories, activeProfileId, goalSortMode])

  const displayedGoals = useMemo(() => {
    if (showCompletedGoals) return sortedSavingsGoals
    return sortedSavingsGoals.filter(
      (g) => !isSavingsGoalCompleted(effectiveByGoalId.get(g.id) ?? 0, g.targetAmount),
    )
  }, [sortedSavingsGoals, effectiveByGoalId, showCompletedGoals])

  useEffect(() => {
    const visibleIds = new Set(displayedGoals.map((g) => g.id))
    setGoalSelection((prev) => {
      if (prev === 'all') return 'all'
      const next = new Set([...prev].filter((id) => visibleIds.has(id)))
      return next.size === 0 ? 'all' : next
    })
  }, [displayedGoals])

  const goalsForKpi = useMemo(() => {
    if (displayedGoals.length === 0) return []
    if (goalSelection === 'all') return displayedGoals
    const filtered = displayedGoals.filter((g) => goalSelection.has(g.id))
    return filtered.length === 0 ? displayedGoals : filtered
  }, [displayedGoals, goalSelection])

  const { totalSaved, totalTarget, progressPct: aggregateProgressPct } = useMemo(
    () =>
      aggregateSavingsGoalsKpi(goalsForKpi, transactions, budgetCategories, activeProfileId),
    [goalsForKpi, transactions, budgetCategories, activeProfileId],
  )

  const toggleGoalInKpiSelection = useCallback(
    (goalId: string) => {
      setGoalSelection((prev) => {
        const visibleIds = displayedGoals.map((g) => g.id)
        if (visibleIds.length === 0) return 'all'
        if (prev === 'all') {
          const next = new Set(visibleIds.filter((id) => id !== goalId))
          if (next.size === 0 || next.size === visibleIds.length) return 'all'
          return next
        }
        const next = new Set(prev)
        if (next.has(goalId)) next.delete(goalId)
        else next.add(goalId)
        if (next.size === 0) return 'all'
        if (next.size === visibleIds.length && visibleIds.every((id) => next.has(id))) return 'all'
        return next
      })
    },
    [displayedGoals],
  )

  const hiddenCompletedCount = useMemo(() => {
    if (showCompletedGoals) return 0
    return sortedSavingsGoals.filter((g) =>
      isSavingsGoalCompleted(effectiveByGoalId.get(g.id) ?? 0, g.targetAmount),
    ).length
  }, [sortedSavingsGoals, effectiveByGoalId, showCompletedGoals])

  const handleCreateGoal = (payload: NewSavingsGoalPayload) => {
    let linkedId: string | null = null
    let baselineAmount: number | undefined

    if (payload.linkMode === 'new_dedicated') {
      const applied = applyDedicatedSparingCategory(
        payload.name,
        budgetCategories,
        customBudgetLabels,
        { addCustomBudgetLabel, addBudgetCategory },
      )
      if (applied) {
        linkedId = applied.linkedId
        const sum = sumSavingsTransactionsForCategory(
          transactions,
          applied.categoryNameForBaseline,
          activeProfileId,
        )
        baselineAmount = payload.currentAmount - sum
      }
    } else if (payload.linkMode === 'existing' && payload.linkedBudgetCategoryId) {
      linkedId = payload.linkedBudgetCategoryId
      const cat = budgetCategories.find((c) => c.id === linkedId)
      if (cat) {
        const sum = sumSavingsTransactionsForCategory(transactions, cat.name, activeProfileId)
        baselineAmount = payload.currentAmount - sum
      }
    }

    addSavingsGoal({
      id: generateId(),
      name: payload.name,
      targetAmount: payload.targetAmount,
      currentAmount: payload.currentAmount,
      targetDate: payload.targetDate,
      color: goalColors[savingsGoals.length % goalColors.length],
      linkedBudgetCategoryId: linkedId,
      baselineAmount,
      deposits: [],
    })
    setCreateGoalModalOpen(false)
  }

  const handleDeposit = useCallback(
    (goal: SavingsGoal, amount: number, note: string, dateIso: string) => {
      if (!Number.isFinite(amount) || amount <= 0) return
      const ownerPid = resolveGoalProfileId(goal, activeProfileId)
      if (goal.linkedBudgetCategoryId) {
        const cat = budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)
        if (!cat) return
        addTransaction({
          id: generateId(),
          date: dateIso,
          description: note.trim() || 'Innskudd sparing',
          amount,
          category: cat.name,
          type: 'expense',
          profileId: ownerPid,
        })
      } else {
        const dep = {
          id: generateId(),
          date: dateIso,
          amount,
          note: note.trim() || undefined,
        }
        patchGoal(goal, {
          deposits: [...(goal.deposits ?? []), dep],
          currentAmount: goal.currentAmount + amount,
        })
      }
    },
    [activeProfileId, addTransaction, budgetCategories, patchGoal],
  )

  const handleDepositInline = (goal: SavingsGoal) => {
    const amount = parseThousands(depositAmount)
    if (amount <= 0) return
    handleDeposit(goal, amount, depositNote, new Date().toISOString().split('T')[0]!)
    setDepositId(null)
    setDepositAmount('')
    setDepositNote('')
  }

  const handleEditUnlinkedDeposit = (
    goal: SavingsGoal,
    depositId: string,
    next: { amount: number; date: string; note?: string },
  ) => {
    const old = goal.deposits?.find((d) => d.id === depositId)
    if (!old) return
    const delta = next.amount - old.amount
    patchGoal(goal, {
      deposits: (goal.deposits ?? []).map((d) =>
        d.id === depositId ? { ...d, amount: next.amount, date: next.date, note: next.note } : d,
      ),
      currentAmount: Math.max(0, goal.currentAmount + delta),
    })
  }

  const handleDeleteUnlinkedDeposit = (goal: SavingsGoal, depositId: string) => {
    const dep = goal.deposits?.find((d) => d.id === depositId)
    if (!dep) return
    if (!window.confirm('Slette denne innbetalingen?')) return
    patchGoal(goal, {
      deposits: (goal.deposits ?? []).filter((d) => d.id !== depositId),
      currentAmount: Math.max(0, goal.currentAmount - dep.amount),
    })
  }

  const detailGoal = detailGoalId ? savingsGoals.find((g) => g.id === detailGoalId) : null

  const openDetail = (g: SavingsGoal) => {
    setDetailGoalId(g.id)
    setEditInModal(false)
    setEditForm({
      name: g.name,
      targetAmount: g.targetAmount > 0 ? formatThousands(String(g.targetAmount)) : '',
      targetDate: g.targetDate,
      linkedBudgetCategoryId: g.linkedBudgetCategoryId ?? '',
    })
  }

  const saveEditFromModal = () => {
    if (!detailGoal) return
    const rawLink = editForm.linkedBudgetCategoryId
    const effectiveNow = getEffectiveCurrentAmount(
      detailGoal,
      transactions,
      budgetCategories,
      activeProfileId,
    )
    const ownerPid = resolveGoalProfileId(detailGoal, activeProfileId)
    const targetParsed = parseThousands(editForm.targetAmount)
    const targetAmt = targetParsed > 0 ? targetParsed : detailGoal.targetAmount
    const nextName = editForm.name.trim() || detailGoal.name

    if (rawLink === SPARING_LINK_NEW_DEDICATED) {
      const applied = applyDedicatedSparingCategory(nextName, budgetCategories, customBudgetLabels, {
        addCustomBudgetLabel,
        addBudgetCategory,
      })
      if (applied) {
        const sum = sumSavingsTransactionsForCategory(
          transactions,
          applied.categoryNameForBaseline,
          ownerPid,
        )
        const baselineAmount = effectiveNow - sum
        patchGoal(detailGoal, {
          name: nextName,
          targetAmount: targetAmt,
          targetDate: editForm.targetDate,
          linkedBudgetCategoryId: applied.linkedId,
          baselineAmount,
        })
      }
    } else if (rawLink) {
      const cat = budgetCategories.find((c) => c.id === rawLink)
      const sum = cat ? sumSavingsTransactionsForCategory(transactions, cat.name, ownerPid) : 0
      const baselineAmount = effectiveNow - sum
      patchGoal(detailGoal, {
        name: nextName,
        targetAmount: targetAmt,
        targetDate: editForm.targetDate,
        linkedBudgetCategoryId: rawLink,
        baselineAmount,
      })
    } else {
      patchGoal(detailGoal, {
        name: nextName,
        targetAmount: targetAmt,
        targetDate: editForm.targetDate,
        linkedBudgetCategoryId: null,
        baselineAmount: undefined,
        currentAmount: effectiveNow,
      })
    }
    setEditInModal(false)
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Sparing" subtitle="Følg opp sparemålene dine" />
      <SparingSubnav />
      <div
        className="space-y-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:py-8 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]"
      >
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard
              label="Totalt spart"
              value={formatNOK(totalSaved)}
              sub="Effektiv sparing · inkl. koblede transaksjoner"
              icon={PiggyBank}
              trend="up"
              color={goalColors[0]}
              valueNoWrap
              info="Summen følger samme logikk som på hvert målkort: koblede mål teller transaksjoner på budsjettlinjen, ukoblede teller manuelle innskudd."
            />
            <StatCard
              label="Totalt mål"
              value={formatNOK(totalTarget)}
              sub={
                goalsForKpi.length === 0
                  ? 'Ingen sparemål i utvalget'
                  : goalsForKpi.length === 1
                    ? 'Ett sparemål'
                    : `${goalsForKpi.length} sparemål`
              }
              icon={Target}
              color="#495057"
              valueNoWrap
            />
            <StatCard
              label="Samlet fremgang"
              value={`${aggregateProgressPct} %`}
              sub="Spart beløp i forhold til summerte mål"
              icon={Percent}
              trend={totalTarget > 0 && aggregateProgressPct >= 100 ? 'up' : undefined}
              color="#0CA678"
              valueNoWrap
              info="Prosenten er spart beløp delt på summen av alle målbeløp (maks 100 % i visningen)."
            />
          </div>
          {goalSelection !== 'all' && displayedGoals.length > 0 ? (
            <p
              className="text-xs leading-snug break-words min-w-0"
              style={{ color: 'var(--text-muted)' }}
            >
              Sammendrag: {goalsForKpi.length} av {displayedGoals.length} mål i listen
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold shrink-0" style={{ color: 'var(--text)' }}>
            Sparemål
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex w-full min-w-0 items-center gap-2 touch-manipulation sm:max-w-md sm:flex-1">
              <label
                htmlFor={sortSelectId}
                className="shrink-0 text-sm whitespace-nowrap"
                style={{ color: 'var(--text-muted)' }}
              >
                Sorter
              </label>
              <select
                id={sortSelectId}
                value={goalSortMode}
                onChange={(e) => setGoalSortMode(e.target.value as SparingSortMode)}
                className="min-h-[44px] min-w-0 flex-1 rounded-xl px-3 py-2.5 text-base touch-manipulation sm:text-sm"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
                aria-label="Sorter sparemål"
              >
                {SPARING_SORT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {SPARING_SORT_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setGoalSelection('all')}
              className="min-h-[44px] w-full shrink-0 rounded-xl border px-4 text-sm font-medium touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:w-auto"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            >
              Velg alle
            </button>
            <button
              type="button"
              id={showCompletedSwitchId}
              role="switch"
              aria-checked={showCompletedGoals}
              onClick={() => setShowCompletedGoals((v) => !v)}
              className="inline-flex min-h-[44px] w-full shrink-0 items-center gap-3 rounded-xl text-left touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:ml-auto sm:w-auto"
            >
              <span
                className="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors"
                style={{ background: showCompletedGoals ? 'var(--primary)' : 'var(--border)' }}
              >
                <span
                  className="mt-1 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: showCompletedGoals ? 'translateX(1.5rem)' : 'translateX(0.25rem)',
                  }}
                />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
                Vis fullførte mål
              </span>
            </button>
          </div>
          {hiddenCompletedCount > 0 ? (
            <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
              {hiddenCompletedCount === 1
                ? 'Ett fullført mål er skjult.'
                : `${hiddenCompletedCount} fullførte mål er skjult.`}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedGoals.map((goal) => {
            const effective =
              effectiveByGoalId.get(goal.id) ??
              getEffectiveCurrentAmount(goal, transactions, budgetCategories, activeProfileId)
            const pct = calcProgress(effective, goal.targetAmount)
            const remaining = goal.targetAmount - effective
            const goalRadial = [{ v: Math.min(100, pct) }]
            const trackColor = mixHexWithWhite(goal.color, 0.84)
            const fillColor = mixHexWithBlack(goal.color, 0.12)
            const daysLeft = goal.targetDate
              ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
              : null
            const linkedName = goal.linkedBudgetCategoryId
              ? budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)?.name
              : null

            return (
              <div
                key={goal.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetail(goal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openDetail(goal)
                  }
                }}
                className="min-w-0 cursor-pointer touch-manipulation rounded-2xl p-4 outline-none transition-opacity hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <label
                      className="flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg outline-none focus-within:ring-2 focus-within:ring-[var(--primary)] min-h-[44px] min-w-[44px] -ml-1"
                      htmlFor={`${goalSelectionInputPrefix}-${goal.id}`}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <input
                        id={`${goalSelectionInputPrefix}-${goal.id}`}
                        type="checkbox"
                        checked={goalSelection === 'all' || goalSelection.has(goal.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleGoalInKpiSelection(goal.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="h-5 w-5 shrink-0 touch-manipulation rounded border"
                        style={{ accentColor: 'var(--primary)' }}
                        aria-label={`Inkluder ${goal.name} i sammendrag`}
                      />
                    </label>
                    <div className="min-w-0 flex-1 pt-2 sm:pt-2.5">
                      <h3 className="break-words font-semibold" style={{ color: 'var(--text)' }}>
                        {goal.name}
                      </h3>
                    {goal.targetDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {daysLeft} dager igjen
                        </span>
                      </div>
                    )}
                    {linkedName && (
                      <p className="text-xs mt-1" style={{ color: 'var(--primary)' }}>
                        Koblet til: {linkedName}
                      </p>
                    )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeGoal(goal)
                    }}
                    className="-mr-1 flex shrink-0 items-center justify-center rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation min-h-[44px] min-w-[44px]"
                    aria-label={`Slett sparemål ${goal.name}`}
                  >
                    <Trash2 size={18} style={{ color: 'var(--text-muted)' }} aria-hidden />
                  </button>
                </div>

                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="100%"
                        data={goalRadial}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <RadialBar
                          dataKey="v"
                          cornerRadius={3}
                          fill={fillColor}
                          background={{ fill: trackColor }}
                          stroke="var(--surface)"
                          strokeWidth={2}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                      {Math.round(pct)}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Mot mål
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--success)' }}>
                      {formatNOK(effective)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      av {formatNOK(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    Mangler: <strong>{formatNOK(Math.max(0, remaining))}</strong>
                  </p>
                  {depositId === goal.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Beløp"
                        value={depositAmount}
                        onChange={onDepositAmountChange}
                        aria-label="Innskuddsbeløp"
                        className="min-h-[44px] w-full rounded-lg px-3 py-2.5 text-base sm:text-sm"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                        }}
                      />
                      <input
                        placeholder="Kommentar (valgfritt)"
                        value={depositNote}
                        onChange={(e) => setDepositNote(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg px-3 py-2.5 text-base sm:text-sm"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleDepositInline(goal)}
                          className="min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium text-white touch-manipulation sm:flex-initial"
                          style={{ background: goal.color }}
                        >
                          Sett inn
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDepositId(null)
                            setDepositAmount('')
                            setDepositNote('')
                          }}
                          className="min-h-[44px] rounded-lg border px-4 text-sm touch-manipulation sm:min-w-[5rem]"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDepositId(goal.id)}
                      className="min-h-[44px] w-full rounded-lg py-2.5 text-sm font-medium touch-manipulation transition-colors"
                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
                    >
                      + Sett inn penger
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => setCreateGoalModalOpen(true)}
            className="flex min-h-[200px] touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 transition-colors active:opacity-95"
            style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--primary-pale)' }}
            >
              <Plus size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <span className="text-sm font-medium">Nytt sparemål</span>
          </button>
        </div>
      </div>

      <SparingNewGoalModal
        open={createGoalModalOpen}
        onClose={() => setCreateGoalModalOpen(false)}
        onCreate={handleCreateGoal}
        spareCategories={spareCategories}
      />

      {detailGoal && (
        <SparingGoalDetailModal
          detailGoal={detailGoal}
          onClose={() => setDetailGoalId(null)}
          editInModal={editInModal}
          setEditInModal={setEditInModal}
          editForm={editForm}
          setEditForm={setEditForm}
          onEditTargetAmountChange={onEditTargetAmountChange}
          spareCategories={spareCategories}
          transactions={transactions}
          budgetCategories={budgetCategories}
          activeProfileId={activeProfileId}
          onSaveEdit={saveEditFromModal}
          onDeposit={handleDeposit}
          updateTransaction={updateTransaction}
          removeTransaction={removeTransaction}
          onEditUnlinkedDeposit={handleEditUnlinkedDeposit}
          onDeleteUnlinkedDeposit={handleDeleteUnlinkedDeposit}
        />
      )}
    </div>
  )
}
