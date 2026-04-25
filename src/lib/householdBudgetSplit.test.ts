import { describe, expect, it } from 'vitest'
import {
  impliedNewMonthTotal,
  splitTotalBudgetBetweenParticipants,
  validateHouseholdSplitMeta,
} from './householdBudgetSplit'

describe('validateHouseholdSplitMeta', () => {
  it('accepts equal with two participants', () => {
    const r = validateHouseholdSplitMeta({
      groupId: 'g1',
      mode: 'equal',
      participantProfileIds: ['a', 'b'],
    })
    expect(r.ok).toBe(true)
  })

  it('rejects percent not 100', () => {
    const r = validateHouseholdSplitMeta({
      groupId: 'g1',
      mode: 'percent',
      participantProfileIds: ['a', 'b'],
      percentWeights: [40, 40],
    })
    expect(r.ok).toBe(false)
  })
})

describe('splitTotalBudgetBetweenParticipants', () => {
  it('splits monthly 20000 equally', () => {
    const total = Array(12).fill(20000)
    const meta = { groupId: 'g', mode: 'equal' as const, participantProfileIds: ['a', 'b'] }
    const r = splitTotalBudgetBetweenParticipants(total, meta)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.byProfileId['a']?.every((x) => x === 10000)).toBe(true)
    expect(r.byProfileId['b']?.every((x) => x === 10000)).toBe(true)
  })

  it('splits quarterly amounts', () => {
    const total = Array(12).fill(0)
    for (const i of [0, 3, 6, 9]) total[i] = 12000
    const meta = { groupId: 'g', mode: 'equal' as const, participantProfileIds: ['a', 'b', 'c'] }
    const r = splitTotalBudgetBetweenParticipants(total, meta)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    for (const m of [0, 3, 6, 9]) {
      const s =
        (r.byProfileId['a']?.[m] ?? 0) + (r.byProfileId['b']?.[m] ?? 0) + (r.byProfileId['c']?.[m] ?? 0)
      expect(s).toBe(12000)
    }
  })

  it('splits percent 60/40', () => {
    const total = Array(12).fill(10000)
    const meta = {
      groupId: 'g',
      mode: 'percent' as const,
      participantProfileIds: ['a', 'b'],
      percentWeights: [60, 40],
    }
    const r = splitTotalBudgetBetweenParticipants(total, meta)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.byProfileId['a']?.[0]).toBe(6000)
    expect(r.byProfileId['b']?.[0]).toBe(4000)
  })

  it('splits amount mode from reference', () => {
    const total = Array(12).fill(10000)
    const meta = {
      groupId: 'g',
      mode: 'amount' as const,
      participantProfileIds: ['a', 'b'],
      amountReferenceByProfileId: { a: 6000, b: 4000 },
    }
    const r = splitTotalBudgetBetweenParticipants(total, meta)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.byProfileId['a']?.[0]).toBe(6000)
    expect(r.byProfileId['b']?.[0]).toBe(4000)
  })
})

describe('impliedNewMonthTotal', () => {
  it('equal: n * participants', () => {
    expect(
      impliedNewMonthTotal('equal', ['a', 'b'], 'a', 10000, undefined, undefined),
    ).toBe(20000)
  })

  it('percent: newPart * 100 / w', () => {
    expect(
      impliedNewMonthTotal('percent', ['a', 'b'], 'a', 6000, [60, 40], undefined),
    ).toBe(10000)
  })
})
