import { describe, expect, it } from 'vitest'
import { canAdministerHjemflyt } from './hjemflytPermissions'

const PRIMARY = 'default'

describe('canAdministerHjemflyt', () => {
  it('hovedprofil er alltid admin', () => {
    expect(canAdministerHjemflyt(PRIMARY, [{ id: PRIMARY }])).toBe(true)
  })

  it('ekstra profil uten hjemflyt-meta er admin', () => {
    expect(
      canAdministerHjemflyt('p2', [
        { id: PRIMARY },
        { id: 'p2' },
      ]),
    ).toBe(true)
  })

  it('ekstra profil med kind child er ikke admin', () => {
    expect(
      canAdministerHjemflyt('kid', [
        { id: PRIMARY },
        { id: 'kid', hjemflyt: { kind: 'child' } },
      ]),
    ).toBe(false)
  })

  it('ukjent profil-id er ikke admin', () => {
    expect(canAdministerHjemflyt('ghost', [{ id: PRIMARY }])).toBe(false)
  })
})
