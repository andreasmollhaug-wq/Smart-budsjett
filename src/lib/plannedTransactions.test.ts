import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/store'
import {
  inferPlannedFollowUpOnDateChange,
  isOverduePlanFollowUp,
  isUpcomingPlannedTransaction,
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
})
