import { describe, expect, it } from 'vitest'
import type { BudgetCategory } from '@/lib/store'
import {
  normalizeCategoryNameForMatch,
  partitionRegningerForSubscriptionSharedLine,
  sortRegningerCategoriesForSubscriptionPicker,
  subscriptionSharedLineLegacyCategory,
} from './regningerCategoryPicker'

function cat(partial: Pick<BudgetCategory, 'id' | 'name'> & Partial<BudgetCategory>): BudgetCategory {
  return {
    budgeted: Array(12).fill(0),
    spent: 0,
    type: 'expense',
    color: '#000',
    parentCategory: 'regninger',
    frequency: 'monthly',
    ...partial,
  }
}

describe('normalizeCategoryNameForMatch', () => {
  it('bruker små bokstaver og fjerner enkelte diakritiske tegn', () => {
    expect(normalizeCategoryNameForMatch('Strøm')).toBe('strøm')
    expect(normalizeCategoryNameForMatch('café')).toBe('cafe')
  })
})

describe('sortRegningerCategoriesForSubscriptionPicker', () => {
  it('prioriterer streaming/abonnement over strøm', () => {
    const sorted = sortRegningerCategoriesForSubscriptionPicker([
      cat({ id: '1', name: 'Strøm' }),
      cat({ id: '2', name: 'Streaming' }),
      cat({ id: '3', name: 'Annen post' }),
    ])
    expect(sorted.map((c) => c.name)).toEqual(['Streaming', 'Annen post', 'Strøm'])
  })

  it('sorterer resten alfabetisk', () => {
    const sorted = sortRegningerCategoriesForSubscriptionPicker([
      cat({ id: 'a', name: 'Zebra' }),
      cat({ id: 'b', name: 'Alpha' }),
    ])
    expect(sorted.map((c) => c.name)).toEqual(['Alpha', 'Zebra'])
  })
})

describe('partitionRegningerForSubscriptionSharedLine', () => {
  it('tar med streaming og abonnement, ikke husleie/internett', () => {
    const p = partitionRegningerForSubscriptionSharedLine([
      cat({ id: '1', name: 'Husleie' }),
      cat({ id: '2', name: 'Internett' }),
      cat({ id: '3', name: 'Streaming' }),
      cat({ id: '4', name: 'Mobilabonnement' }),
    ])
    expect(p.streaming.map((c) => c.name)).toEqual(['Streaming'])
    expect(p.abonnement.map((c) => c.name)).toEqual(['Mobilabonnement'])
  })
})

describe('subscriptionSharedLineLegacyCategory', () => {
  it('returnerer kategori når valgt id ikke er i partisjon', () => {
    const all = [cat({ id: 'x', name: 'Husleie' })]
    const partition = { streaming: [], abonnement: [] }
    expect(subscriptionSharedLineLegacyCategory(all, partition, 'x')?.name).toBe('Husleie')
  })
  it('returnerer undefined når valgt id allerede er i partisjon', () => {
    const c = cat({ id: 's', name: 'Streaming' })
    const partition = { streaming: [c], abonnement: [] }
    expect(subscriptionSharedLineLegacyCategory([c], partition, 's')).toBeUndefined()
  })
})
