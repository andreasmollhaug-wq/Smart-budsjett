import { describe, expect, it } from 'vitest'
import { bankPendingNeonomicsKey } from '@/lib/neonomics/bankCatalogKeys'

describe('bankCatalogKeys', () => {
  it('bygger pending-nøkkel', () => {
    expect(bankPendingNeonomicsKey('p1', 'bank-dnb-id')).toBe('p1:bank-dnb-id')
  })
})
