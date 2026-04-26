'use client'

import { useMemo, useState, Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import TransaksjonerSubnav from '@/components/transactions/TransaksjonerSubnav'
import TransactionDetailModal, { type TransactionSavePatch } from '@/components/transactions/TransactionDetailModal'
import { useTransaksjonerFilters } from '@/components/transactions/useTransaksjonerFilters'
import type { Transaction } from '@/lib/store'
import { useStore } from '@/lib/store'
import {
  inferPlannedFollowUpOnDateChange,
  isIncompletePlannedInCalendarMonth,
  isOverduePlanFollowUp,
  isPlannedKommendeLater,
  isPlanOverdueFromEarlierMonths,
  isUpcomingPlannedTransaction,
  sortThisMonthPlannedByUrgency,
  sortTransactionsByDateAsc,
  todayYyyyMmDd,
} from '@/lib/plannedTransactions'
import { REPORT_GROUP_LABELS } from '@/lib/bankReportData'
import { useNokDisplayFormatters } from '@/lib/hooks/useNokDisplayFormatters'
import { formatIsoDateDdMmYyyy } from '@/lib/utils'
import { AlertTriangle, CalendarDays, CheckCircle2, type LucideIcon, Timer } from 'lucide-react'

type RowScope = 'earlierMonth' | 'inMonth' | 'later'

function KommendeKpiCard({
  label,
  value,
  icon: Icon,
  valueColor = 'var(--text)',
  iconColor = 'var(--text-muted)',
}: {
  label: string
  value: string
  icon: LucideIcon
  valueColor?: string
  iconColor?: string
}) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: iconColor }} aria-hidden />
        <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums sm:text-xl" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  )
}

function KommendePageInner() {
  const { formatNOK } = useNokDisplayFormatters()
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
    activeProfileId,
  } = useTransaksjonerFilters()

  const people = useStore((s) => s.people)

  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [expenseOnly, setExpenseOnly] = useState(false)

  const { olderOverdue, thisMonth, later, today, monthNameGenitive } = useMemo(() => {
    const t = todayYyyyMmDd()
    const y = parseInt(t.slice(0, 4), 10)
    const m0 = parseInt(t.slice(5, 7), 10) - 1
    const first = new Date(y, m0, 1)
    const monthNameGenitive = first.toLocaleString('no-NO', { month: 'long' })
    const list = transactions.filter((x) => (expenseOnly ? x.type === 'expense' : true))
    const older = list
      .filter((x) => isPlanOverdueFromEarlierMonths(x, t))
      .sort(sortTransactionsByDateAsc)
    const tm = list
      .filter((x) => isIncompletePlannedInCalendarMonth(x, t))
      .sort((a, b) => sortThisMonthPlannedByUrgency(a, b, t))
    const lat = list
      .filter((x) => isPlannedKommendeLater(x, t))
      .sort(sortTransactionsByDateAsc)
    return { olderOverdue: older, thisMonth: tm, later: lat, today: t, monthNameGenitive }
  }, [transactions, expenseOnly])

  const sumThisMonthExpense = useMemo(
    () =>
      thisMonth
        .filter((x) => x.type === 'expense')
        .reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0),
    [thisMonth],
  )

  const within7d = useMemo(() => {
    const t = todayYyyyMmDd()
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const limit = todayYyyyMmDd(d)
    const list = transactions.filter((x) => (expenseOnly ? x.type === 'expense' : true))
    return list
      .filter(
        (x) =>
          isUpcomingPlannedTransaction(x, t) && x.type === 'expense' && x.date.slice(0, 10) <= limit,
      )
      .reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0)
  }, [transactions, expenseOnly])

  const laterByMonth = useMemo(() => {
    const byKey = new Map<string, Transaction[]>()
    for (const x of later) {
      const k = (x.date ?? '').slice(0, 7)
      if (k.length < 7 || !/^\d{4}-\d{2}$/.test(k)) continue
      if (!byKey.has(k)) byKey.set(k, [])
      byKey.get(k)!.push(x)
    }
    const keys = [...byKey.keys()].sort()
    return keys.map((monthKey) => {
      const items = (byKey.get(monthKey) ?? []).slice().sort(sortTransactionsByDateAsc)
      const sumExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0)
      const sumIncome = items
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0)
      const [yStr, mStr] = monthKey.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10)
      const raw = new Date(y, m - 1, 1).toLocaleString('no-NO', { month: 'long', year: 'numeric' })
      const monthLabel = raw.charAt(0).toUpperCase() + raw.slice(1)
      return { monthKey, monthLabel, items, sumExpense, sumIncome }
    })
  }, [later])

  const profileLabel = (profileId: string | undefined) => {
    if (!isHouseholdAggregate || !profileId) return ''
    return profiles.find((p) => p.id === profileId)?.name?.trim() ?? ''
  }

  const createCategoryProps = !isHouseholdAggregate
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
    setDetailTx((prev) => (prev && prev.id === id ? { ...prev, ...patch, ...extra } : prev))
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

  const baseRowStyle = (rowScope: RowScope, isOverdue: boolean): React.CSSProperties => {
    if (rowScope === 'earlierMonth') {
      return {
        background: 'var(--bg)',
        border: '1px solid var(--danger)',
        boxShadow: 'inset 4px 0 0 0 var(--danger)',
      }
    }
    if (rowScope === 'inMonth' && isOverdue) {
      return {
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 4px 0 0 0 var(--danger)',
      }
    }
    return { background: 'var(--bg)', border: '1px solid var(--border)' }
  }

  const Row = ({ tx, rowScope }: { tx: Transaction; rowScope: RowScope }) => {
    const pname = profileLabel(tx.profileId)
    const catMeta = allCats.find((c) => c.name === tx.category && c.type === tx.type)
    const parentLabel = catMeta?.parentCategory ? REPORT_GROUP_LABELS[catMeta.parentCategory] : null
    const catColor = catMeta?.color || 'var(--text-muted)'
    const descTrim = (tx.description ?? '').trim()
    const isOverdue = isOverduePlanFollowUp(tx, today)
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

    let statusBadge: ReactNode = null
    if (rowScope === 'earlierMonth') {
      statusBadge = (
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--danger) 15%, var(--bg))',
            color: 'var(--danger)',
            border: '1px solid var(--border)',
          }}
        >
          <AlertTriangle size={12} className="shrink-0" aria-hidden />
          Fra tidligere måned
        </span>
      )
    } else if (rowScope === 'inMonth' && isOverdue) {
      statusBadge = (
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold shrink-0"
          style={{ background: 'var(--primary-pale)', color: 'var(--danger)', border: '1px solid var(--border)' }}
        >
          Forfalt
        </span>
      )
    }

    return (
      <div
        className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl min-w-0 overflow-hidden sm:flex-row sm:items-center sm:justify-between"
        style={baseRowStyle(rowScope, isOverdue)}
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
                {statusBadge}
                <span
                  className="min-w-0 text-sm font-semibold leading-snug break-words"
                  style={{ color: 'var(--text)' }}
                >
                  {tx.category}
                </span>
                {rowScope === 'inMonth' && isOverdue ? (
                  <span className="sr-only">Forfalt etter planlagt dato</span>
                ) : null}
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
          ) : (
            <button
              type="button"
              onClick={() => handleQuickPatch(tx.id, { reviewedAt: undefined })}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[44px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Angre gjennomgang
            </button>
          )}
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
          {tx.type === 'expense' && tx.paidAt ? (
            <button
              type="button"
              onClick={() => handleQuickPatch(tx.id, { paidAt: undefined })}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[44px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              Fjern betalt
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

  const olderKpiCount = olderOverdue.length
  const olderKpiColor = olderKpiCount > 0 ? 'var(--danger)' : 'var(--text)'

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header
        title="Kommende"
        subtitle="Forfalt tidligere måneder, så faste planer i inneværende måned, deretter senere — med gjennomgang, betalt og angre (mobilvennlig)"
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

        <p className="text-xs leading-relaxed rounded-xl p-3 sm:p-4" style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Gjennomgått
          </span>{' '}
          betyr at du har sjekket at posten fortsatt gjelder.{' '}
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Betalt
          </span>{' '}
          (utgift) at trekket er betalt. Enten av delene ferdigstiller planlagt oppfølging. Du kan angre nederst på hver rad
          hvis du huket av ved en feil.
        </p>

        <p className="-mt-1 text-xs leading-relaxed sm:-mt-2" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            Utgift / inntekt
          </span>{' '}
          og kategori vises øverst. Beskrivelsen under er fritekst — endre under Transaksjoner ved behov.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KommendeKpiCard
            label="Forfalt fra tidligere måneder"
            value={String(olderKpiCount)}
            icon={AlertTriangle}
            valueColor={olderKpiColor}
            iconColor={olderKpiCount > 0 ? 'var(--danger)' : 'var(--text-muted)'}
          />
          <KommendeKpiCard
            label="Kommende utgifter i måneden"
            value={formatNOK(sumThisMonthExpense)}
            icon={CalendarDays}
            valueColor="var(--text)"
            iconColor="var(--primary)"
          />
          <KommendeKpiCard
            label="Utgifter innen 7 dager"
            value={formatNOK(within7d)}
            icon={Timer}
            valueColor="var(--text)"
            iconColor="var(--text-muted)"
          />
        </div>

        {olderOverdue.length > 0 ? (
          <section
            className="min-w-0 space-y-4 rounded-2xl p-5 sm:p-6"
            style={{
              background: 'color-mix(in srgb, var(--danger) 6%, var(--surface))',
              border: '1px solid var(--danger)',
            }}
          >
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <AlertTriangle size={20} className="shrink-0" style={{ color: 'var(--danger)' }} aria-hidden />
                Forfalt — tidligere måneder
              </h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Planlagt dato er før inneværende måned. Huk av som gjennomgått eller betalt, eller slett om den ikke
                lenger gjelder.
              </p>
            </div>
            <div className="space-y-2">
              {olderOverdue.map((x) => (
                <Row key={x.id} tx={x} rowScope="earlierMonth" />
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="min-w-0 space-y-4 rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold" style={{ color: 'var(--text)' }}>
              Denne måneden ({monthNameGenitive})
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Planlagt i inneværende kalendermåned som ikke er fullført — inkl. forfalte datoer i måneden.
            </p>
          </div>
          {thisMonth.length === 0 ? (
            <p
              className="text-sm rounded-xl px-4 py-3 max-w-lg leading-relaxed"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Ingen planlagte poster denne måneden{expenseOnly ? ' (utgifter)' : ''}. Legg inn under Transaksjoner med
              dato i {monthNameGenitive}, eller se «Senere» for neste måned.
            </p>
          ) : (
            <div className="space-y-2">
              {thisMonth.map((x) => (
                <Row key={x.id} tx={x} rowScope="inMonth" />
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
              Planlagt fra og med neste måned — gruppert per kalendermåned med en liten sum pr. måned. Flyttes til «Denne
              måneden» når måneden blir inneværende.
            </p>
          </div>
          {laterByMonth.length === 0 ? (
            <p
              className="text-sm rounded-xl px-4 py-3 max-w-lg leading-relaxed"
              style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Ingen planlagte transaksjoner lenger frem i tid{expenseOnly ? ' (utgifter)' : ''}.
            </p>
          ) : (
            <div className="space-y-5">
              {laterByMonth.map((group, groupIdx) => {
                const showExpenseSub = !expenseOnly && group.sumExpense > 0
                const showIncomeSub = !expenseOnly && group.sumIncome > 0
                const onlyExpenseList = expenseOnly
                return (
                  <div key={group.monthKey} className="min-w-0 space-y-2">
                    <div
                      className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 ${groupIdx > 0 ? 'pt-4 border-t border-[var(--border)]' : ''}`}
                    >
                      <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                        {group.monthLabel}
                      </h3>
                      {onlyExpenseList ? (
                        group.sumExpense > 0 ? (
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={`Sum utgifter ${group.monthLabel}`}
                          >
                            Sum utgifter {formatNOK(group.sumExpense)}
                          </span>
                        ) : null
                      ) : (
                        showExpenseSub || showIncomeSub ? (
                          <span
                            className="text-xs font-medium tabular-nums text-right max-w-full"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {showExpenseSub ? (
                              <span>
                                Utg. {formatNOK(group.sumExpense)}
                                {showIncomeSub ? ' · ' : ''}
                              </span>
                            ) : null}
                            {showIncomeSub ? <span>Innt. {formatNOK(group.sumIncome)}</span> : null}
                          </span>
                        ) : null
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.items.map((x) => (
                        <Row key={x.id} tx={x} rowScope="later" />
                      ))}
                    </div>
                  </div>
                )
              })}
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
          const tx0 = transactions.find((t) => t.id === id)
          if (tx0) handleDelete(tx0)
        }}
        onPatchTransaction={handleQuickPatch}
        householdHint={isHouseholdAggregate}
        createCategory={createCategoryProps}
        incomeWithholdingDefault={
          detailTx ? people[detailTx.profileId ?? activeProfileId]?.defaultIncomeWithholding : undefined
        }
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
