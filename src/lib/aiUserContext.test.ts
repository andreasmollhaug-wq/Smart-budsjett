import { describe, expect, it } from 'vitest'
import { buildAiFinanceContextText } from './aiUserContext'
import type { PersonData, Transaction } from './store'

function emptyLabels() {
  return {
    inntekter: [] as string[],
    regninger: [] as string[],
    utgifter: [] as string[],
    gjeld: [] as string[],
    sparing: [] as string[],
  }
}

function basePerson(overrides: Partial<PersonData> = {}): PersonData {
  return {
    transactions: [],
    budgetCategories: [],
    customBudgetLabels: emptyLabels(),
    hiddenBudgetLabels: emptyLabels(),
    savingsGoals: [],
    debts: [],
    investments: [],
    serviceSubscriptions: [],
    snowballExtraMonthly: 0,
    debtPayoffStrategy: 'snowball',
    ...overrides,
  }
}

describe('buildAiFinanceContextText', () => {
  it('i profilmodus: transaksjonstabell uten profilkolonne', () => {
    const tx: Transaction = {
      id: '1',
      date: '2026-01-15',
      description: 'Test',
      amount: 100,
      category: 'Mat',
      subcategory: '',
      type: 'expense',
    }
    const person = basePerson({ transactions: [tx] })
    const text = buildAiFinanceContextText(person, {
      budgetYear: 2026,
      scopeLabel: 'Jenny',
      isHouseholdAggregate: false,
      profileNamesById: { p1: 'Jenny' },
    })
    expect(text).toContain('Visningsmodus: Jenny')
    expect(text).toContain('tallene under gjelder kun den valgte profilen')
    expect(text).toContain('dato | beskrivelse | beløp (kr) | kategori | underkategori | type')
    expect(text).not.toContain('dato | beskrivelse | beløp (kr) | kategori | underkategori | type | profil')
  })

  it('i husholdningsmodus: transaksjoner og abonnement merket med profil', () => {
    const tx: Transaction = {
      id: '1',
      date: '2026-02-01',
      description: 'Netflix',
      amount: 189,
      category: 'Underholdning',
      subcategory: '',
      type: 'expense',
      profileId: 'vetle',
    }
    const person = basePerson({
      transactions: [tx],
      serviceSubscriptions: [
        {
          id: 's1',
          label: 'Spotify',
          amountNok: 119,
          billing: 'monthly',
          active: true,
          syncToBudget: true,
          sourceProfileId: 'meg',
        },
        {
          id: 's2',
          label: 'Netflix',
          amountNok: 129,
          billing: 'monthly',
          active: true,
          syncToBudget: false,
          sourceProfileId: 'vetle',
        },
      ],
    })
    const text = buildAiFinanceContextText(person, {
      budgetYear: 2026,
      scopeLabel: 'Husholdning (alle profiler)',
      isHouseholdAggregate: true,
      profileNamesById: { meg: 'Meg', vetle: 'Vetle' },
    })
    expect(text).toContain('aggregert på tvers av alle profiler')
    expect(text.indexOf('Tjenesteabonnementer (streaming')).toBeLessThan(
      text.indexOf('Transaksjoner (nyeste først'),
    )
    expect(text).toContain('Tabell — tjenesteabonnementer per profil')
    expect(text).toContain('Meg | 119 | 1428 | Spotify')
    expect(text).toContain('Vetle | 129 | 1548 | Netflix')
    expect(text).toContain('Totalt husholdning | 248 | 2976 | alle profiler')
    expect(text).toContain('dato | beskrivelse | beløp (kr) | kategori | underkategori | type | profil')
    expect(text).toMatch(/Vetle/)
    expect(text).toContain('[Meg]')
    expect(text).toContain('- Spotify [Meg]:')
    expect(text).toContain('- Netflix [Vetle]:')
  })
})
