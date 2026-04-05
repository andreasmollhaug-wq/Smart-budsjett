'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, type SavingsGoal } from '@/lib/store'
import { formatNOK, calcProgress, generateId, mixHexWithBlack, mixHexWithWhite } from '@/lib/utils'
import {
  getEffectiveCurrentAmount,
  getTotalEffectiveSaved,
  sumSavingsTransactionsForCategory,
} from '@/lib/savingsDerived'
import { Plus, Trash2, Target, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import SparingGoalDetailModal from '@/components/sparing/SparingGoalDetailModal'

const COLORS = ['#3B5BDB', '#0CA678', '#F08C00', '#AE3EC9', '#E03131', '#0B7285']

export default function SparingPage() {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    removeSavingsGoal,
    budgetCategories,
    transactions,
    addTransaction,
    recalcBudgetSpent,
    activeProfileId,
  } = useActivePersonFinance()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    linkedBudgetCategoryId: '' as string,
  })
  const [depositId, setDepositId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [editInModal, setEditInModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    linkedBudgetCategoryId: '' as string,
  })

  const spareCategories = useMemo(
    () => budgetCategories.filter((c) => c.parentCategory === 'sparing' && c.type === 'expense'),
    [budgetCategories],
  )

  const totalSaved = useMemo(
    () => getTotalEffectiveSaved(savingsGoals, transactions, budgetCategories, activeProfileId),
    [savingsGoals, transactions, budgetCategories, activeProfileId],
  )

  const totalTarget = savingsGoals.reduce((a, b) => a + b.targetAmount, 0)

  const handleAdd = () => {
    if (!form.name || !form.targetAmount) return
    const start = Number(form.currentAmount) || 0
    const linkedId = form.linkedBudgetCategoryId || undefined
    let baselineAmount: number | undefined
    if (linkedId) {
      const cat = budgetCategories.find((c) => c.id === linkedId)
      if (cat) {
        const sum = sumSavingsTransactionsForCategory(transactions, cat.name, activeProfileId)
        baselineAmount = start - sum
      }
    }
    addSavingsGoal({
      id: generateId(),
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: start,
      targetDate: form.targetDate,
      color: COLORS[savingsGoals.length % COLORS.length],
      linkedBudgetCategoryId: linkedId ?? null,
      baselineAmount,
      deposits: [],
    })
    setForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      linkedBudgetCategoryId: '',
    })
    setShowForm(false)
  }

  const handleDeposit = (goal: SavingsGoal) => {
    if (!depositAmount) return
    const amount = Number(depositAmount)
    if (!Number.isFinite(amount) || amount <= 0) return

    if (goal.linkedBudgetCategoryId) {
      const cat = budgetCategories.find((c) => c.id === goal.linkedBudgetCategoryId)
      if (!cat) return
      addTransaction({
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        description: depositNote.trim() || 'Innskudd sparing',
        amount,
        category: cat.name,
        type: 'expense',
        profileId: activeProfileId,
      })
      recalcBudgetSpent(cat.name)
    } else {
      const dep = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        amount,
        note: depositNote.trim() || undefined,
      }
      updateSavingsGoal(goal.id, {
        deposits: [...(goal.deposits ?? []), dep],
        currentAmount: goal.currentAmount + amount,
      })
    }
    setDepositId(null)
    setDepositAmount('')
    setDepositNote('')
  }

  const detailGoal = detailGoalId ? savingsGoals.find((g) => g.id === detailGoalId) : null

  const openDetail = (g: SavingsGoal) => {
    setDetailGoalId(g.id)
    setEditInModal(false)
    setEditForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      targetDate: g.targetDate,
      linkedBudgetCategoryId: g.linkedBudgetCategoryId ?? '',
    })
  }

  const saveEditFromModal = () => {
    if (!detailGoal) return
    const linkedId = editForm.linkedBudgetCategoryId || undefined
    const effectiveNow = getEffectiveCurrentAmount(
      detailGoal,
      transactions,
      budgetCategories,
      activeProfileId,
    )
    if (linkedId) {
      const cat = budgetCategories.find((c) => c.id === linkedId)
      const sum = cat
        ? sumSavingsTransactionsForCategory(transactions, cat.name, activeProfileId)
        : 0
      const baselineAmount = effectiveNow - sum
      updateSavingsGoal(detailGoal.id, {
        name: editForm.name.trim() || detailGoal.name,
        targetAmount: Number(editForm.targetAmount) || detailGoal.targetAmount,
        targetDate: editForm.targetDate,
        linkedBudgetCategoryId: linkedId,
        baselineAmount,
      })
    } else {
      updateSavingsGoal(detailGoal.id, {
        name: editForm.name.trim() || detailGoal.name,
        targetAmount: Number(editForm.targetAmount) || detailGoal.targetAmount,
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
      <div className="p-8 space-y-6">
        <Link
          href="/sparing/formuebygger"
          className="flex items-center gap-4 p-5 rounded-2xl transition-colors hover:opacity-95 max-w-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            <TrendingUp size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              Formuebyggeren PRO
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Simuler langvarig formuesvekst, reell kjøpekraft, skatt og milepæler — med sanntidsberegning.
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--primary)' }} className="shrink-0" />
        </Link>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Totalt spart
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--primary)' }}>
              {formatNOK(totalSaved)}
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Totalt mål
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
              {formatNOK(totalTarget)}
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Samlet fremgang
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success)' }}>
              {Math.round(calcProgress(totalSaved, totalTarget))}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const effective = getEffectiveCurrentAmount(
              goal,
              transactions,
              budgetCategories,
              activeProfileId,
            )
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
                className="rounded-2xl p-5 cursor-pointer outline-none transition-opacity hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSavingsGoal(goal.id)
                    }}
                  >
                    <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
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
                        type="number"
                        placeholder="Beløp"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg text-sm"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                      <input
                        placeholder="Kommentar (valgfritt)"
                        value={depositNote}
                        onChange={(e) => setDepositNote(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg text-sm"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleDeposit(goal)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
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
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDepositId(goal.id)}
                      className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors"
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
            onClick={() => setShowForm(true)}
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors min-h-[200px]"
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

        {showForm && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Target size={16} style={{ color: 'var(--primary)' }} />
              Nytt sparemål
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Navn på mål"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                placeholder="Målbeløp (NOK)"
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                placeholder="Startet med (NOK)"
                type="number"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <div className="col-span-2">
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Koble til budsjettkategori (valgfritt)
                </label>
                <select
                  value={form.linkedBudgetCategoryId}
                  onChange={(e) => setForm({ ...form, linkedBudgetCategoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="">Ingen kobling</option>
                  {spareCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                Opprett mål
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>

      {detailGoal && (
        <SparingGoalDetailModal
          detailGoal={detailGoal}
          onClose={() => setDetailGoalId(null)}
          editInModal={editInModal}
          setEditInModal={setEditInModal}
          editForm={editForm}
          setEditForm={setEditForm}
          spareCategories={spareCategories}
          transactions={transactions}
          budgetCategories={budgetCategories}
          activeProfileId={activeProfileId}
          onSaveEdit={saveEditFromModal}
        />
      )}
    </div>
  )
}
