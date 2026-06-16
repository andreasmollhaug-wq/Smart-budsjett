import { describe, expect, it } from 'vitest'
import { inferSortPreset, sortCreditorGroups, sortLoans, sortPrefsFromPreset } from './sort'
import type { CreditorRegistryGroup, CreditorRegistryLoan } from './types'

const loan = (id: string, name: string, remaining: number, monthly = 0, rate = 0): CreditorRegistryLoan => ({
  id,
  name,
  remainingAmount: remaining,
  monthlyPayment: monthly,
  interestRate: rate,
  type: 'loan',
})

describe('sortLoans', () => {
  const loans = [
    loan('b', 'Bravo', 50_000, 500, 12),
    loan('a', 'Alpha', 100_000, 1000, 8),
  ]

  it('sorterer alfabetisk', () => {
    expect(sortLoans(loans, 'name_asc').map((l) => l.name)).toEqual(['Alpha', 'Bravo'])
  })

  it('sorterer restgjeld desc', () => {
    expect(sortLoans(loans, 'remaining_desc').map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('sorterer rente desc', () => {
    expect(sortLoans(loans, 'interest_desc').map((l) => l.id)).toEqual(['b', 'a'])
  })
})

describe('sortCreditorGroups', () => {
  const groups: CreditorRegistryGroup[] = [
    { id: '2', name: 'Bank B', loans: [loan('l2', 'X', 20_000)] },
    { id: '1', name: 'Bank A', loans: [loan('l1', 'Y', 80_000, 2000)] },
  ]

  it('sorterer navn asc', () => {
    expect(sortCreditorGroups(groups, 'name_asc').map((g) => g.name)).toEqual(['Bank A', 'Bank B'])
  })

  it('sorterer rest desc', () => {
    expect(sortCreditorGroups(groups, 'remaining_desc').map((g) => g.id)).toEqual(['1', '2'])
  })

  it('sorterer loan count desc', () => {
    const g2: CreditorRegistryGroup[] = [
      { id: 'a', name: 'A', loans: [loan('1', 'a', 1), loan('2', 'b', 1)] },
      { id: 'b', name: 'B', loans: [loan('3', 'c', 1)] },
    ]
    expect(sortCreditorGroups(g2, 'loanCount_desc').map((g) => g.id)).toEqual(['a', 'b'])
  })
})

describe('registry sort preset', () => {
  it('mapper felles sortering', () => {
    expect(inferSortPreset('remaining_desc', 'remaining_desc')).toBe('remaining_desc')
  })

  it('gjenkjenner rente-sortering', () => {
    expect(inferSortPreset('name_asc', 'interest_desc')).toBe('interest_desc')
  })

  it('setter begge sorteringer for delte presets', () => {
    expect(sortPrefsFromPreset('monthly_desc')).toEqual({
      creditorSort: 'monthly_desc',
      loanSort: 'monthly_desc',
    })
  })
})
