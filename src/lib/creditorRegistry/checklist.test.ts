import { describe, expect, it } from 'vitest'
import {
  buildCreditorRegistryChecklist,
  countSequentialChecklistProgress,
  getNextCreditorRegistryChecklistStep,
  isCreditorRegistryChecklistComplete,
  reconcileCreditorRegistryChecklist,
} from './checklist'
import { normalizeCreditorRegistry } from './normalize'
import type { CreditorRegistryState } from './types'

const empty: CreditorRegistryState = { creditors: [] }

describe('buildCreditorRegistryChecklist', () => {
  it('steg 1 åpent uten lån, selv med kreditor', () => {
    const items = buildCreditorRegistryChecklist({
      creditors: [{ id: 'c1', name: 'SVEA', loans: [] }],
    })
    const step1 = items.find((i) => i.id === 'first_creditor_and_loan')
    expect(step1?.done).toBe(false)
    expect(step1?.ctaKind).toBe('add_loan')
    expect(step1?.ctaLabel).toBe('Legg til lån')
  })

  it('steg 1 auto-done ved minst ett lån', () => {
    const items = buildCreditorRegistryChecklist({
      creditors: [
        {
          id: 'c1',
          name: 'SVEA',
          loans: [
            {
              id: 'l1',
              name: 'Lån',
              remainingAmount: 10_000,
              monthlyPayment: 0,
              interestRate: 0,
              type: 'loan',
            },
          ],
        },
      ],
    })
    expect(items.find((i) => i.id === 'first_creditor_and_loan')?.done).toBe(true)
    expect(getNextCreditorRegistryChecklistStep(items)?.id).toBe('complete_loan_fields')
  })

  it('steg 2 krever rente eller avdrag på alle lån', () => {
    const state: CreditorRegistryState = {
      creditors: [
        {
          id: 'c1',
          name: 'SVEA',
          loans: [
            {
              id: 'l1',
              name: 'Lån',
              remainingAmount: 10_000,
              monthlyPayment: 0,
              interestRate: 0,
              type: 'loan',
            },
          ],
        },
      ],
    }
    const items = buildCreditorRegistryChecklist(state)
    expect(items.find((i) => i.id === 'complete_loan_fields')?.done).toBe(false)

    state.creditors[0]!.loans[0]!.interestRate = 5
    const items2 = buildCreditorRegistryChecklist(state)
    expect(items2.find((i) => i.id === 'complete_loan_fields')?.done).toBe(true)
  })

  it('steg 3 manuell override', () => {
    const items = buildCreditorRegistryChecklist({
      creditors: [{ id: 'c1', name: 'Only', loans: [{ id: 'l1', name: 'L', remainingAmount: 1, monthlyPayment: 1, interestRate: 1, type: 'loan' }] }],
      checklistOverrides: { all_creditors: true },
    })
    expect(items.find((i) => i.id === 'all_creditors')?.overriddenDone).toBe(true)
    expect(items.find((i) => i.id === 'all_creditors')?.done).toBe(true)
  })

  it('isComplete false til siste steg', () => {
    const items = buildCreditorRegistryChecklist({
      ...empty,
      prefs: {
        creditorSort: 'name_asc',
        loanSort: 'name_asc',
        hasReviewedSubtotals: true,
        standaloneInfoAcknowledged: false,
      },
      checklistOverrides: {
        first_creditor_and_loan: true,
        complete_loan_fields: true,
        all_creditors: true,
        review_subtotals: true,
      },
    })
    expect(isCreditorRegistryChecklistComplete(items)).toBe(false)
  })

  it('isComplete true når alt er acknowledged', () => {
    const items = buildCreditorRegistryChecklist({
      creditors: [{ id: 'c1', name: 'X', loans: [{ id: 'l1', name: 'L', remainingAmount: 100, monthlyPayment: 10, interestRate: 5, type: 'loan' }] }],
      prefs: {
        creditorSort: 'name_asc',
        loanSort: 'name_asc',
        hasReviewedSubtotals: true,
        standaloneInfoAcknowledged: true,
      },
      checklistOverrides: { all_creditors: true },
    })
    expect(isCreditorRegistryChecklistComplete(items)).toBe(true)
  })

  it('reconcile fjerner checkmarks når siste kreditor slettes', () => {
    const complete: CreditorRegistryState = {
      creditors: [
        {
          id: 'c1',
          name: 'SVEA',
          loans: [
            {
              id: 'l1',
              name: 'Lån',
              remainingAmount: 10_000,
              monthlyPayment: 500,
              interestRate: 5,
              type: 'loan',
            },
          ],
        },
      ],
      prefs: {
        creditorSort: 'name_asc',
        loanSort: 'name_asc',
        hasReviewedSubtotals: true,
        standaloneInfoAcknowledged: true,
        checklistDismissed: true,
      },
      checklistOverrides: { all_creditors: true },
    }

    const reconciled = reconcileCreditorRegistryChecklist(
      { ...complete, creditors: [] },
      'creditor_removed',
    )
    const items = buildCreditorRegistryChecklist(reconciled)

    expect(items.every((i) => !i.done)).toBe(true)
    expect(reconciled.prefs?.hasReviewedSubtotals).toBe(false)
    expect(reconciled.prefs?.standaloneInfoAcknowledged).toBe(false)
    expect(reconciled.prefs?.checklistDismissed).toBe(false)
    expect(reconciled.checklistOverrides?.all_creditors).toBeUndefined()
  })

  it('reconcile åpner steg igjen når kreditor slettes men data gjenstår', () => {
    const state: CreditorRegistryState = {
      creditors: [
        {
          id: 'c1',
          name: 'Bank',
          loans: [
            {
              id: 'l1',
              name: 'Lån',
              remainingAmount: 5_000,
              monthlyPayment: 200,
              interestRate: 4,
              type: 'loan',
            },
          ],
        },
        {
          id: 'c2',
          name: 'SVEA',
          loans: [
            {
              id: 'l2',
              name: 'Forbrukslån',
              remainingAmount: 3_000,
              monthlyPayment: 150,
              interestRate: 8,
              type: 'consumer_loan',
            },
          ],
        },
      ],
      prefs: {
        creditorSort: 'name_asc',
        loanSort: 'name_asc',
        hasReviewedSubtotals: true,
      },
    }

    const reconciled = reconcileCreditorRegistryChecklist(
      { ...state, creditors: [state.creditors[0]!] },
      'creditor_removed',
    )
    const items = buildCreditorRegistryChecklist(reconciled)

    expect(items.find((i) => i.id === 'all_creditors')?.done).toBe(false)
    expect(items.find((i) => i.id === 'review_subtotals')?.done).toBe(false)
    expect(reconciled.prefs?.hasReviewedSubtotals).toBe(false)
  })

  it('sekvensiell progresjon ignorerer steg 5 alene uten data', () => {
    const items = buildCreditorRegistryChecklist({
      creditors: [],
      prefs: {
        creditorSort: 'name_asc',
        loanSort: 'name_asc',
        standaloneInfoAcknowledged: true,
      },
    })
    expect(items.find((i) => i.id === 'understand_standalone')?.done).toBe(true)
    expect(countSequentialChecklistProgress(items)).toBe(0)
  })

  it('normalize nullstiller ferdig steg 5 uten lån', () => {
    const normalized = normalizeCreditorRegistry({
      creditors: [],
      prefs: { standaloneInfoAcknowledged: true },
    })
    expect(normalized.prefs?.standaloneInfoAcknowledged).toBe(false)
    expect(countSequentialChecklistProgress(buildCreditorRegistryChecklist(normalized))).toBe(0)
  })
})
