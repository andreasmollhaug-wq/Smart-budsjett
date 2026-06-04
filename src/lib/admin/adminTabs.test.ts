import { describe, expect, it } from 'vitest'
import { DEFAULT_ADMIN_TAB, parseAdminTabParam } from '@/lib/admin/adminTabs'

describe('parseAdminTabParam', () => {
  it('returnerer default for null og ugyldig', () => {
    expect(parseAdminTabParam(null)).toBe(DEFAULT_ADMIN_TAB)
    expect(parseAdminTabParam('')).toBe(DEFAULT_ADMIN_TAB)
    expect(parseAdminTabParam('ukjent')).toBe(DEFAULT_ADMIN_TAB)
  })

  it('returnerer gyldige faner', () => {
    expect(parseAdminTabParam('oversikt')).toBe('oversikt')
    expect(parseAdminTabParam('grafer')).toBe('grafer')
    expect(parseAdminTabParam('verktoy')).toBe('verktoy')
  })
})
