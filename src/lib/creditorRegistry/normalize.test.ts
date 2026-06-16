import { describe, expect, it } from 'vitest'
import { normalizeCreditorRegistry } from './normalize'

describe('normalizeCreditorRegistry', () => {
  it('returnerer tom state ved undefined', () => {
    const s = normalizeCreditorRegistry(undefined)
    expect(s.creditors).toEqual([])
    expect(s.prefs?.creditorSort).toBe('name_asc')
  })

  it('filtrerer ugyldige kreditorer og lån', () => {
    const s = normalizeCreditorRegistry({
      creditors: [
        { id: 'g1', name: 'SVEA', loans: [{ id: 'l1', name: 'Lån', remainingAmount: -100, monthlyPayment: 'x', interestRate: 5, type: 'bogus' }] },
        { id: '', name: 'Bad' },
      ],
    })
    expect(s.creditors).toHaveLength(1)
    expect(s.creditors[0]!.loans[0]!.remainingAmount).toBe(0)
    expect(s.creditors[0]!.loans[0]!.type).toBe('loan')
  })

  it('beholder prefs og overrides når det finnes lån', () => {
    const s = normalizeCreditorRegistry({
      creditors: [
        {
          id: 'g1',
          name: 'SVEA',
          loans: [{ id: 'l1', name: 'L', remainingAmount: 100, monthlyPayment: 10, interestRate: 5, type: 'loan' }],
        },
      ],
      prefs: { creditorSort: 'remaining_desc', hasReviewedSubtotals: true },
      checklistOverrides: { all_creditors: true, invalid: true },
    })
    expect(s.prefs?.creditorSort).toBe('remaining_desc')
    expect(s.prefs?.hasReviewedSubtotals).toBe(true)
    expect(s.checklistOverrides?.all_creditors).toBe(true)
    expect((s.checklistOverrides as Record<string, unknown>).invalid).toBeUndefined()
  })

  it('nullstiller sjekkliste-prefs uten kreditorer', () => {
    const s = normalizeCreditorRegistry({
      creditors: [],
      prefs: { hasReviewedSubtotals: true, standaloneInfoAcknowledged: true },
      checklistOverrides: { all_creditors: true },
    })
    expect(s.prefs?.hasReviewedSubtotals).toBe(false)
    expect(s.prefs?.standaloneInfoAcknowledged).toBe(false)
    expect(s.checklistOverrides?.all_creditors).toBeUndefined()
  })

  it('beholder skjul-valg uten kreditorer', () => {
    const s = normalizeCreditorRegistry({
      creditors: [],
      prefs: { checklistDismissed: true, checklistCollapsed: false },
    })
    expect(s.prefs?.checklistDismissed).toBe(true)
    expect(s.prefs?.checklistCollapsed).toBe(false)
  })
})
