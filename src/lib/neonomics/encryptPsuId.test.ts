import { describe, expect, it } from 'vitest'
import { encryptPsuId } from '@/lib/neonomics/encryptPsuId'

/** 16-byte key as base64 (AES-128). */
const TEST_KEY_B64 = Buffer.alloc(16, 7).toString('base64')

describe('encryptPsuId', () => {
  it('krypterer til base64 (iv + ciphertext + tag)', () => {
    const out = encryptPsuId('31125461118', TEST_KEY_B64)
    expect(out).toMatch(/^[A-Za-z0-9+/]+=*$/)
    const raw = Buffer.from(out, 'base64')
    expect(raw.length).toBeGreaterThanOrEqual(12 + 1 + 16)
  })

  it('gir ulik ciphertext ved ny IV', () => {
    const a = encryptPsuId('31125461118', TEST_KEY_B64)
    const b = encryptPsuId('31125461118', TEST_KEY_B64)
    expect(a).not.toBe(b)
  })

  it('feiler ved feil nøkkellengde', () => {
    const shortKey = Buffer.alloc(8, 1).toString('base64')
    expect(() => encryptPsuId('31125461118', shortKey)).toThrow(/16-byte/)
  })
})
