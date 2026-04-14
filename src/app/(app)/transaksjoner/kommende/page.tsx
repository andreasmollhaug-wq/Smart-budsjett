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
  isPlannedKommendeLater,
  isPlannedKommendeThisMonth,
  isUpcomingPlannedTransaction,
  sortTransactionsByDateAsc,
  todayYyyyMmDd,
} from '@/lib/plannedTransactions'
import { REPORT_GROUP_LABELS } from '@/lib/bankReportData'
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

  const { thisMonth, later, overdue } = useMemo(() => {
    const today = todayYyyyMmDd()
    const list = transactions.filter((t) => (expenseOnly ? t.type === 'expense' : true))
    const od = list
      .filter((t) => isOverduePlanFollowUp(t, today))
      .sort(sortTransactionsByDateAsc)
    const tm = list
      .filter((t) => isPlannedKommendeThisMonth(t, today))
      .sort(sortTransactionsByDateAsc)
    const lat = list
      .filter((t) => isPlannedKommendeLater(t, today))
      .sort(sortTransactionsByDateAsc)
    return { thisMonth: tm, later: lat, overdue: od }
  }, [transactions, expenseOnly])

  const sumThisMonthExpense = useMemo(
    () =>
      thisMonth
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0),
    [thisMonth],
  )

  const within7d = useMemo(() => {
    const today = todayYyyyMmDd()
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const limit = todayYyyyMmDd(d)
    const list = transactions.filter((t) => (expenseOnly ? t.type === 'expense' : true))
    return list
      .filter(
        (t) =>
          isUpcomingPlannedTransaction(t, today) &&
          t.type === 'expense' &&
          t.date.slice(0, 10) <= limit,
      )
      .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0)
  }, [transactions, expenseOnly])

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

  const rowCardStyle = {
    background: 'var(--bg)' as const,
    border: '1px solid var(--border)' as const,
  }

  const Row = ({ tx }: { tx: Transaction }) => {
    const pname = profileLabel(tx.profileId)
    const catMeta = allCats.find((c) => c.name === tx.category && c.type === tx.type)
    const parentLabel = catMeta?.parentCategory ? REPORT_GROUP_LABELS[catMeta.parentCategory] : null
    const catColor = catMeta?.color || 'var(--text-muted)'
    const descTrim = (tx.description ?? '').trim()
    const metaParts = [
      parentLabel,
      formatIsoDateDdMmYyyy(tx.date),
      tx.subcategory?.trim() || null,
      pname || null,
    ].filter(Boolean) as string[]
    const ariaLabel = [
      tx.type === 'income' ? 'Inntekt' : 'Utgift',
      tx.category,
      descTrim || null,
      metaParts.join(', '),
    ]
      .filter(Boolean)
      .join('. ')

    return (
      <div
        className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl min-w-0 overflow-hidden sm:flex-row sm:items-center sm:justify-between"
        style={rowCardStyle}
      >
        <button
          type="button"
          onClick={() => setDetailTx(tx)}
          aria-label={ariaLabel}
          className="flex flex-1 min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] touch-manipulation py-0.5 sm:py-0"
        >
          <span className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
              style={{ background: catColor }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 gap-y-1">
                <span
                  className="inline-flex min-h-[28px] items-center rounded-md px-2 py-0.5 text-xs font-semibold shrink-0"
                  style={{
                    background: 'var(--primary-pale)',
                    color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {tx.type === 'income' ? 'Inntekt' : 'Utgift'}
                </span>
                <span
                  className="min-w-0 text-sm font-semibold leading-snug break-words"
                  style={{ color: 'var(--text)' }}
                >
                  {tx.category}
                </span>
              </span>
              {descTrim ? (
                <span
                  className="mt-1 block text-sm leading-snug break-words"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {descTrim}
                </span>
              ) : null}
              <span
                className="mt-1.5 block text-xs leading-relaxed break-words"
                style={{ color: 'var(--text-muted)' }}
              >
                {metaParts.join(' · ')}
              </span>
            </span>
          </span>
          <span className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] pt-2 sm:w-auto sm:border-t-0 sm:pt-0 sm:pl-2">
            {tx.reviewedAt ? (
              <CheckCircle2 size={18} className="shrink-0" style={{ color: 'var(--success)' }} aria-label="Gjennomgått" />
            ) : null}
            <span
              className="text-sm font-semibold tabular-nums leading-tight"
              style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
            >
              {tx.type === 'income' ? '+' : '-'}
              {formatNOK(tx.amount)}
            </span>
          </span>
        </button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {!tx.reviewedAt ? (
            <button
              type="button"
              onClick={() => markReviewed(tx.id)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[44px]"
              style={{
                background: 'var(--primary-pale)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              Gjennomgått
            </button>
          ) : null}
          {tx.type === 'expense' && !tx.paidAt ? (
            <button
              type="button"
              onClick={() => markPaid(tx.id)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[44px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Betalt
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleDelete(tx)}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[44px]"
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
        subtitle="Etter forfall, inneværende måned og senere — gjennomgang, betalt og opprydding (mobilvennlig)"
      />
      <TransaksjonerSubnav />
      <div
        className="mx-auto max-w-3xl space-y-6 py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:py-8 md:pl-[max(2rem,env(safe-area-inset-left))] md:pr-[max(2rem,env(safe-area-inset-right))]"
      >
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <label className="inline-flex min-h-[44px] cursor-pointer select-none items-center gap-3 touch-manipulation">
            <input
              type="checkbox"
              checked={expenseOnly}
              onChange={(e) => setExpenseOnly(e.target.checked)}
              className="min-h-[22px] min-w-[22px] shrink-0 rounded border"
              style={{ borderColor: 'var(--border)' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Kun utgifter
            </span>
          </label>
          <Link
            href="/transaksjoner"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-sm font-medium touch-manipulation underline-offset-2 hover:underline sm:inline-flex sm:w-auto sm:justify-center sm:px-3"
            style={{ color: 'var(--text)' }}
          >
            Til transaksjonsliste
          </Link>
        </div>

        <p className="-mt-1 text-xs leading-relaxed sm:-mt-2" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Utgift / inntekt
          </span>{' '}
          og kategori vises øverst. Beskrivelsen under er fritekst (det du skrev eller som kom fra import) — endre den
          under Transaksjoner ved behov.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="min-w-0 rounded-2xl p-4 sm:p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
              Kommende utgifter denne måneden
            </p>
            <p className="text-lg font-bold tabular-nums sm:text-xl mt-2" style={{ color: 'var(--text)' }}>
              {formatNOK(sumThisMonthExpense)}
            </p>
          </div>
          <div
            className="min-w-0 rounded-2xl p-4 sm:p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
              Utgifter innen 7 dager
            </p>
            <p className="text-lg font-bold tabular-nums sm:text-xl mt-2" style={{ color: 'var(--text)' }}>
              {formatNOK(within7d)}
            </p>
          </div>
          <div
            className="min-w-0 rounded-2xl p-4 sm:p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
              Trenger oppfølging (etter dato)
            </p>
            <p className="text-lg font-bold tabular-nums sm:text-xl mt-2" style={{ color: 'var(--text)' }}>
              {overdue.length}
            </p>
          </div>
        </div>

        <section
          className="min-w-0 space-y-4 rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold" style={{ color: 'var(--text)' }}>
              Etter planlagt dato
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Dato er passert — huk av som gjennomgått eller betalt, eller slett om den ikke lenger gjelder.
            </p>
          </div>
          {overdue.length === 0 ? (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
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

        <section
          className="min-w-0 space-y-4 rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold" style={{ color: 'var(--text)' }}>
              Denne måneden
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Planlagt i inneværende måned (inkl. i dag) som ikke er fullført.
            </p>
          </div>
          {thisMonth.length === 0 ? (
            <p
              className="text-sm rounded-xl px-4 py-3 max-w-lg leading-relaxed"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Ingen planlagte poster igjen denne måneden{expenseOnly ? ' (utgifter)' : ''}. Legg inn under
              Transaksjoner med dato i måneden, eller se «Senere» for neste måned og utover.
            </p>
          ) : (
            <div className="space-y-2">
              {thisMonth.map((tx) => (
                <Row key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </section>

        <section
          className="min-w-0 space-y-4 rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold" style={{ color: 'var(--text)' }}>
              Senere
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Planlagt fra og med neste måned — oversikt før de flyttes inn under «Denne måneden».
            </p>
          </div>
          {later.length === 0 ? (
            <p
              className="text-sm rounded-xl px-4 py-3 max-w-lg leading-relaxed"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Ingen planlagte transaksjoner lenger frem i tid{expenseOnly ? ' (utgifter)' : ''}.
            </p>
          ) : (
            <div className="space-y-2">
              {later.map((tx) => (
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
    <Suspense
      fallback={
        <div
          className="p-8 text-sm pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
          style={{ color: 'var(--text-muted)' }}
        >
          Laster …
        </div>
      }
    >
      <KommendePageInner />
    </Suspense>
  )
}
