import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/store'
import {
  buildPlannedOverdueNotification,
  getCalendarMonthRange,
  inferPlannedFollowUpOnDateChange,
  isIncompletePlannedInCalendarMonth,
  isOverduePlanFollowUp,
  isPlannedKommendeLater,
  isPlannedKommendeThisMonth,
  isPlanOverdueFromEarlierMonths,
  isUpcomingPlannedTransaction,
  shouldShowKommendeAttentionBanner,
  sortThisMonthPlannedByUrgency,
  transactionRequiresPlanFollowUp,
  todayYyyyMmDd,
} from '@/lib/plannedTransactions'

function tx(p: Partial<Transaction> & Pick<Transaction, 'id' | 'date' | 'type'>): Transaction {
  const { id, date, type, description, amount, category, ...rest } = p
  return {
    id,
    date,
    type,
    description: description ?? 'x',
    amount: amount ?? 100,
    category: category ?? 'Test',
    ...rest,
  }
}

describe('plannedTransactions', () => {
  it('transactionRequiresPlanFollowUp respects flag and links', () => {
    expect(transactionRequiresPlanFollowUp(tx({ id: '1', date: '2026-01-01', type: 'expense' }))).toBe(false)
    expect(
      transactionRequiresPlanFollowUp(
        tx({ id: '1', date: '2026-01-01', type: 'expense', plannedFollowUp: true }),
      ),
    ).toBe(true)
    expect(
      transactionRequiresPlanFollowUp(
        tx({ id: '1', date: '2026-01-01', type: 'expense', linkedDebtId: 'd' }),
      ),
    ).toBe(true)
  })

  it('isUpcomingPlannedTransaction requires future date and plan', () => {
    const t0 = todayYyyyMmDd()
    const future = `${parseInt(t0.slice(0, 4), 10) + 1}-06-15`
    expect(
      isUpcomingPlannedTransaction(
        tx({ id: '1', date: future, type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isUpcomingPlannedTransaction(tx({ id: '1', date: t0, type: 'expense', plannedFollowUp: true }), t0),
    ).toBe(false)
  })

  it('isOverduePlanFollowUp is true only after plan date and if not complete', () => {
    const t0 = todayYyyyMmDd()
    expect(
      isOverduePlanFollowUp(
        tx({ id: '1', date: '2020-01-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isOverduePlanFollowUp(
        tx({
          id: '1',
          date: '2020-01-01',
          type: 'expense',
          plannedFollowUp: true,
          reviewedAt: new Date().toISOString(),
        }),
        t0,
      ),
    ).toBe(false)
    expect(
      isOverduePlanFollowUp(
        tx({
          id: '1',
          date: t0,
          type: 'expense',
          plannedFollowUp: true,
        }),
        t0,
      ),
    ).toBe(false)
  })

  it('inferPlannedFollowUpOnDateChange leaves linked debt untouched', () => {
    const prev = tx({
      id: '1',
      date: '2026-12-01',
      type: 'expense',
      linkedDebtId: 'd1',
    })
    expect(inferPlannedFollowUpOnDateChange(prev, '2027-01-01')).toEqual({})
  })

  it('getCalendarMonthRange returns first and last day of month', () => {
    expect(getCalendarMonthRange('2026-04-14')).toEqual({ start: '2026-04-01', end: '2026-04-30' })
    expect(getCalendarMonthRange('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('isPlannedKommendeThisMonth includes today and same month, excludes next month', () => {
    const t0 = '2026-04-14'
    expect(
      isPlannedKommendeThisMonth(
        tx({ id: '1', date: '2026-04-14', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isPlannedKommendeThisMonth(
        tx({ id: '2', date: '2026-04-30', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isPlannedKommendeThisMonth(
        tx({ id: '3', date: '2026-05-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(false)
  })

  it('isPlannedKommendeLater is true after calendar month end', () => {
    const t0 = '2026-04-14'
    expect(
      isPlannedKommendeLater(
        tx({ id: '1', date: '2026-05-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isPlannedKommendeLater(
        tx({ id: '2', date: '2026-04-30', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(false)
  })

  it('overdue is disjoint from this month and later', () => {
    const t0 = '2026-04-14'
    const overdueTx = tx({ id: '1', date: '2026-04-01', type: 'expense', plannedFollowUp: true })
    expect(isOverduePlanFollowUp(overdueTx, t0)).toBe(true)
    expect(isPlannedKommendeThisMonth(overdueTx, t0)).toBe(false)
    expect(isPlannedKommendeLater(overdueTx, t0)).toBe(false)
  })

  it('shouldShowKommendeAttentionBanner for overdue or unreviewed this month', () => {
    const t0 = '2026-04-14'
    expect(
      shouldShowKommendeAttentionBanner(
        [tx({ id: '1', date: '2026-04-01', type: 'expense', plannedFollowUp: true })],
        t0,
      ),
    ).toBe(true)
    expect(
      shouldShowKommendeAttentionBanner(
        [
          tx({
            id: '2',
            date: '2026-04-20',
            type: 'expense',
            plannedFollowUp: true,
          }),
        ],
        t0,
      ),
    ).toBe(true)
    expect(
      shouldShowKommendeAttentionBanner(
        [
          tx({
            id: '3',
            date: '2026-04-20',
            type: 'expense',
            plannedFollowUp: true,
            reviewedAt: new Date().toISOString(),
          }),
        ],
        t0,
      ),
    ).toBe(false)
  })

  it('buildPlannedOverdueNotification includes this month when no overdue', () => {
    const t0 = '2026-04-14'
    const out = buildPlannedOverdueNotification(
      [
        tx({
          id: '1',
          date: '2026-04-20',
          type: 'expense',
          plannedFollowUp: true,
        }),
      ],
      t0,
    )
    expect(out).not.toBeNull()
    expect(out!.body).toContain('Planlagt denne måneden')
  })

  it('isIncompletePlannedInCalendarMonth includes forfalte datoer samme måned, ekskluderer eldre måneder', () => {
    const t0 = '2026-04-15'
    expect(
      isIncompletePlannedInCalendarMonth(
        tx({ id: '1', date: '2026-04-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isIncompletePlannedInCalendarMonth(
        tx({ id: '2', date: '2026-04-20', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isIncompletePlannedInCalendarMonth(
        tx({ id: '3', date: '2026-03-28', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(false)
  })

  it('isPlanOverdueFromEarlierMonths er true kun når dato er før inneværende måned', () => {
    const t0 = '2026-04-15'
    expect(
      isPlanOverdueFromEarlierMonths(
        tx({ id: '1', date: '2026-03-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(true)
    expect(
      isPlanOverdueFromEarlierMonths(
        tx({ id: '2', date: '2026-04-01', type: 'expense', plannedFollowUp: true }),
        t0,
      ),
    ).toBe(false)
  })

  it('de tre hovedbøttene for Kommende er disjunkte (eldre, denne mnd, senere)', () => {
    const t0 = '2026-04-15'
    const a = tx({ id: 'a', date: '2026-02-10', type: 'expense', plannedFollowUp: true })
    const b = tx({ id: 'b', date: '2026-04-05', type: 'expense', plannedFollowUp: true })
    const c = tx({ id: 'c', date: '2026-05-01', type: 'expense', plannedFollowUp: true })
    expect(isPlanOverdueFromEarlierMonths(a, t0)).toBe(true)
    expect(isIncompletePlannedInCalendarMonth(a, t0)).toBe(false)
    expect(isPlannedKommendeLater(a, t0)).toBe(false)

    expect(isPlanOverdueFromEarlierMonths(b, t0)).toBe(false)
    expect(isIncompletePlannedInCalendarMonth(b, t0)).toBe(true)
    expect(isPlannedKommendeLater(b, t0)).toBe(false)

    expect(isPlanOverdueFromEarlierMonths(c, t0)).toBe(false)
    expect(isIncompletePlannedInCalendarMonth(c, t0)).toBe(false)
    expect(isPlannedKommendeLater(c, t0)).toBe(true)
  })

  it('sortThisMonthPlannedByUrgency plasserer forfalt dato foran kommende', () => {
    const t0 = '2026-04-15'
    const late = tx({ id: '1', date: '2026-04-01', type: 'expense', plannedFollowUp: true, description: 'a' })
    const future = tx({ id: '2', date: '2026-04-20', type: 'expense', plannedFollowUp: true, description: 'b' })
    expect(sortThisMonthPlannedByUrgency(late, future, t0)).toBeLessThan(0)
    expect(sortThisMonthPlannedByUrgency(future, late, t0)).toBeGreaterThan(0)
  })
})
