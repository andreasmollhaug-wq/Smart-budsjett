import { describe, expect, it } from 'vitest'
import type { BudgetCategory, Transaction } from '@/lib/store'
import {
  budgetCategoryUsesIncomeWithholding,
  effectiveBudgetedIncomeMonth,
  effectiveIncomeTransactionAmount,
  effectiveWithholdingPercentForIncomeTransaction,
  grossFromDesiredNet,
  grossWithholdingNetForBudgetMonth,
  grossWithholdingNetForIncomeTransaction,
  transactionIncomeIsNet,
} from '@/lib/incomeWithholding'
import { taxMultiplier } from '@/lib/incomeSprint'

function incCat(partial: Partial<BudgetCategory> & Pick<BudgetCategory, 'id' | 'name'>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'income',
    color: '#000',
    parentCategory: 'inntekter',
    frequency: 'monthly',
    ...partial,
  } as BudgetCategory
}

describe('incomeWithholding budget', () => {
  it('Modus A: ingen trekk gir rå beløp', () => {
    const c = incCat({
      id: '1',
      name: 'Lønn',
      budgeted: Array(12).fill(100_000),
    })
    expect(budgetCategoryUsesIncomeWithholding(c)).toBe(false)
    expect(effectiveBudgetedIncomeMonth(c, 0)).toBe(100_000)
  })

  it('Modus B: brutto med 32% trekk gir avrundet netto', () => {
    const c = incCat({
      id: '1',
      name: 'Lønn',
      budgeted: Array(12).fill(100_000),
      incomeWithholding: { apply: true, percent: 32 },
    })
    expect(budgetCategoryUsesIncomeWithholding(c)).toBe(true)
    expect(effectiveBudgetedIncomeMonth(c, 0)).toBe(68_000)
    const br = grossWithholdingNetForBudgetMonth(c, 0)
    expect(br.gross).toBe(100_000)
    expect(br.net).toBe(68_000)
    expect(br.withholding).toBe(32_000)
  })
})

describe('grossFromDesiredNet', () => {
  function assertRoundTrip(net: number, percent: number) {
    const gross = grossFromDesiredNet(net, percent)
    const back = Math.round(gross * taxMultiplier(true, percent))
    expect(back).toBe(net)
  }

  it('round-trip 32 % og typisk lønn', () => {
    assertRoundTrip(68_000, 32)
    assertRoundTrip(36_000, 32)
    assertRoundTrip(0, 32)
    assertRoundTrip(1, 32)
  })

  it('round-trip 0 % og 100 %', () => {
    expect(grossFromDesiredNet(50_000, 0)).toBe(50_000)
    expect(Math.round(50_000 * taxMultiplier(true, 0))).toBe(50_000)
    expect(grossFromDesiredNet(0, 100)).toBe(0)
  })

  it('50 % halvering', () => {
    assertRoundTrip(25_000, 50)
    const g = grossFromDesiredNet(25_000, 50)
    expect(Math.round(g * taxMultiplier(true, 50))).toBe(25_000)
    // Flere brutto kan gi samme avrundede netto (f.eks. 49 999 og 50 000).
    expect(g).toBeLessThanOrEqual(50_000)
    expect(g).toBeGreaterThanOrEqual(49_999)
  })

  it('oppdaterer kategori likt som effectiveBudgetedIncomeMonth', () => {
    const c = incCat({
      id: '1',
      name: 'Lønn',
      budgeted: Array(12).fill(0),
      incomeWithholding: { apply: true, percent: 32 },
    })
    const net = 36_000
    const gross = grossFromDesiredNet(net, 32)
    const arr = [...(c.budgeted as number[])]
    arr[3] = gross
    const c2 = { ...c, budgeted: arr }
    expect(effectiveBudgetedIncomeMonth(c2, 3)).toBe(net)
  })
})

describe('incomeWithholding transactions', () => {
  const profile = { apply: true, percent: 25 }

  it('default manglende felt: netto', () => {
    const tx: Transaction = {
      id: 't',
      date: '2026-01-15',
      description: 'Lønn',
      amount: 50_000,
      category: 'Lønn',
      type: 'income',
    }
    expect(transactionIncomeIsNet(tx)).toBe(true)
    expect(effectiveIncomeTransactionAmount(tx, profile)).toBe(50_000)
  })

  it('brutto med override-prosent', () => {
    const tx: Transaction = {
      id: 't',
      date: '2026-01-15',
      description: 'Lønn',
      amount: 100_000,
      category: 'Lønn',
      type: 'income',
      incomeIsNet: false,
      incomeWithholdingPercent: 32,
    }
    expect(effectiveWithholdingPercentForIncomeTransaction(tx, profile)).toBe(32)
    expect(effectiveIncomeTransactionAmount(tx, profile)).toBe(68_000)
    const g = grossWithholdingNetForIncomeTransaction(tx, profile)
    expect(g.gross).toBe(100_000)
    expect(g.withholding).toBe(32_000)
    expect(g.net).toBe(68_000)
  })

  it('brutto uten override bruker profilstandard når apply', () => {
    const tx: Transaction = {
      id: 't',
      date: '2026-01-15',
      description: 'Lønn',
      amount: 80_000,
      category: 'Lønn',
      type: 'income',
      incomeIsNet: false,
    }
    expect(effectiveIncomeTransactionAmount(tx, profile)).toBe(60_000)
  })

  it('brutto med profil apply false gir 0% trekk', () => {
    const tx: Transaction = {
      id: 't',
      date: '2026-01-15',
      description: 'Lønn',
      amount: 80_000,
      category: 'Lønn',
      type: 'income',
      incomeIsNet: false,
    }
    expect(effectiveIncomeTransactionAmount(tx, { apply: false, percent: 40 })).toBe(80_000)
  })
})
