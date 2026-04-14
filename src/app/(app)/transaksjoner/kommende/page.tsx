'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionDetailModal, { type TransactionSavePatch } from '@/components/transactions/TransactionDetailModal'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import type { Transaction } from '@/lib/store'
import {
  inferPlannedFollowUpOnDateChange,
  isOverduePlanFollowUp,
  isUpcomingPlannedTransaction,
  sortTransactionsByDateAsc,
  todayYyyyMmDd,
} from '@/lib/plannedTransactions'
import { formatIsoDateDdMmYyyy, formatNOK } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

function KommendePageInner() {
  const {
    transactions,
    expenseCategories,
    incomeCategories,
    allCats,
    updateTransaction,
    removeTransaction,
    recalcBudgetSpent,
    isHouseholdAggregate,
    profiles,
    customBudgetLabels,
    addBudgetCategory,
    addCustomBudgetLabel,
    budgetCategories,
  } = useTransaksjonerFilters()

  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [expenseOnly, setExpenseOnly] = useState(false)

  const { upcoming, overdue } = useMemo(() => {
    const today = todayYyyyMmDd()
    const list = transactions.filter((t) => (expenseOnly ? t.type === 'expense' : true))
    const up = list
      .filter((t) => isUpcomingPlannedTransaction(t, today))
      .sort(sortTransactionsByDateAsc)
    const od = list
      .filter((t) => isOverduePlanFollowUp(t, today))
      .sort(sortTransactionsByDateAsc)
    return { upcoming: up, overdue: od }
  }, [transactions, expenseOnly])

  const sumUpcomingExpense = useMemo(
    () =>
      upcoming
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [upcoming],
  )

  const within7d = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const limit = todayYyyyMmDd(d)
    return upcoming
      .filter((t) => t.type === 'expense' && t.date.slice(0, 10) <= limit)
      .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0)
  }, [upcoming])

  const profileLabel = (profileId: string | undefined) => {
    if (!isHouseholdAggregate || !profileId) return ''
    return profiles.find((p) => p.id === profileId)?.name?.trim() ?? ''
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

  const handleQuickPatch = (id: string, patch: Partial<Pick<Transaction, 'reviewedAt' | 'paidAt'>>) => {
    updateTransaction(id, patch)
    setDetailTx((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev))
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
      prev && prev.id === id ? { ...prev, ...patch, ...extra } : prev,
    )
    if (!isHouseholdAggregate) {
      recalcBudgetSpent(old.category)
      if (patch.category !== undefined && patch.category !== old.category) {
        recalcBudgetSpent(patch.category)
      }
    }
  }

  const handleDelete = (tx: Transaction) => {
    if (typeof window !== 'undefined' && !window.confirm('Slette denne transaksjonen?')) return
    removeTransaction(tx.id)
    if (!isHouseholdAggregate) recalcBudgetSpent(tx.category)
    setDetailTx(null)
  }

  const markReviewed = (id: string) => {
    updateTransaction(id, { reviewedAt: new Date().toISOString() })
  }

  const markPaid = (id: string) => {
    updateTransaction(id, { paidAt: new Date().toISOString() })
  }

  const Row = ({ tx }: { tx: Transaction }) => {
    const pname = profileLabel(tx.profileId)
    return (
      <div
        className="flex flex-col gap-3 p-3 rounded-xl sm:flex-row sm:items-center sm:justify-between"
        style={{ background: 'var(--bg)' }}
      >
        <button
          type="button"
          onClick={() => setDetailTx(tx)}
          className="flex flex-1 min-w-0 items-start justify-between gap-3 text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <span className="flex min-w-0 items-start gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
              style={{
                background: allCats.find((c) => c.name === tx.category)?.color || 'var(--text-muted)',
              }}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                {tx.description}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {[tx.category, tx.subcategory?.trim()].filter(Boolean).join(' · ')} ·{' '}
                {formatIsoDateDdMmYyyy(tx.date)}
                {pname ? ` · ${pname}` : ''}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            {tx.reviewedAt ? (
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} aria-label="Gjennomgått" />
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
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {!tx.reviewedAt ? (
            <button
              type="button"
              onClick={() => markReviewed(tx.id)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              Gjennomgått
            </button>
          ) : null}
          {tx.type === 'expense' && !tx.paidAt ? (
            <button
              type="button"
              onClick={() => markPaid(tx.id)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Betalt
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleDelete(tx)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium"
            style={{ color: 'var(--danger)', border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            Slett
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Kommende"
        subtitle="Planlagte transaksjoner — gjennomgang, betalt og opprydding (mobilvennlig)"
      />
      <TransaksjonerSubnav />
      <div className="space-y-8 px-4 py-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={expenseOnly}
              onChange={(e) => setExpenseOnly(e.target.checked)}
              className="rounded border"
              style={{ borderColor: 'var(--border)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              Kun utgifter
            </span>
          </label>
          <Link
            href="/transaksjoner"
            className="text-sm font-medium min-h-[44px] inline-flex items-center"
            style={{ color: 'var(--primary)' }}
          >
            Til transaksjonsliste
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Kommende utgifter (sum)
            </p>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>
              {formatNOK(sumUpcomingExpense)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Utgifter innen 7 dager
            </p>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>
              {formatNOK(within7d)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Trenger oppfølging (etter dato)
            </p>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>
              {overdue.length}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Kommende
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
              Ingen planlagte transaksjoner frem i tid{expenseOnly ? ' (utgifter)' : ''}. Legg inn en rad under
              Transaksjoner med dato senere enn i dag, eller bruk import — fremtidige rader følges opp her.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((tx) => (
                <Row key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Etter planlagt dato
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Dato er passert — huk av som gjennomgått eller betalt, eller slett om den ikke lenger gjelder.
          </p>
          {overdue.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ingen utestående.
            </p>
          ) : (
            <div className="space-y-2">
              {overdue.map((tx) => (
                <Row key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </section>
      </div>

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
        onPatchTransaction={handleQuickPatch}
        householdHint={isHouseholdAggregate}
        createCategory={createCategoryProps}
      />
    </div>
  )
}

export default function KommendePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Laster …</div>}>
      <KommendePageInner />
    </Suspense>
  )
}
