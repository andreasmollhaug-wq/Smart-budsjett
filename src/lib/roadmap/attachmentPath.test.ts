import { describe, expect, it } from 'vitest'
import {
  isValidStoragePathForRequest,
  sanitizeImageFileName,
  buildFeatureRequestImagePath,
} from './attachmentPath'

const uid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const rid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

describe('isValidStoragePathForRequest', () => {
  it('godkjenner eksakt sti for bruker, forespørsel og fil', () => {
    const fn = 'skjerm-1.png'
    const path = `${uid}/${rid}/${fn}`
    expect(isValidStoragePathForRequest(path, uid, rid, fn)).toBe(true)
  })

  it('avviser path traversal', () => {
    const fn = 'x.png'
    const path = `${uid}/${rid}/../${fn}`
    expect(isValidStoragePathForRequest(path, uid, rid, fn)).toBe(false)
  })

  it('avviser feil bruker-segment', () => {
    const fn = 'a.png'
    const path = `annet/${rid}/${fn}`
    expect(isValidStoragePathForRequest(path, uid, rid, fn)).toBe(false)
  })

  it('avviser feil request-id', () => {
    const fn = 'a.png'
    const path = `${uid}/00000000-0000-0000-0000-000000000000/${fn}`
    expect(isValidStoragePathForRequest(path, uid, rid, fn)).toBe(false)
  })
})

describe('sanitizeImageFileName', () => {
  it('fjerner uønskede tegn og gir fornuftig default', () => {
    expect(sanitizeImageFileName('')).toBe('image.png')
    expect(sanitizeImageFileName('foto! test')).toMatch(/^[\w.-]+\.png$/)
  })

  it('holder støttefilnavn under makslengde', () => {
    const long = 'a'.repeat(300) + '.png'
    const out = sanitizeImageFileName(long)
    expect(out.length).toBeLessThanOrEqual(200)
    expect(out.endsWith('.png')).toBe(true)
  })
})

describe('buildFeatureRequestImagePath', () => {
  it('bygger forventet sti', () => {
    const fn = sanitizeImageFileName('t.png')
    expect(buildFeatureRequestImagePath(uid, rid, fn)).toBe(`${uid}/${rid}/${fn}`)
  })

  it('kaster når filnavn er ugyldig', () => {
    expect(() => buildFeatureRequestImagePath(uid, rid, 'x/y')).toThrow()
  })
})
