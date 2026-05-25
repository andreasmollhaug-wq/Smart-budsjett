import { afterEach, describe, expect, it } from 'vitest'
import { isNeonomicsPublicEnabled, isNeonomicsServerEnabled } from '@/lib/neonomics/feature'

const env = process.env

afterEach(() => {
  process.env = { ...env }
})

describe('isNeonomicsServerEnabled', () => {
  it('er false uten flagg', () => {
    delete process.env.NEONOMICS_ENABLED
    expect(isNeonomicsServerEnabled()).toBe(false)
  })

  it('er true for true/1', () => {
    process.env.NEONOMICS_ENABLED = 'true'
    expect(isNeonomicsServerEnabled()).toBe(true)
    process.env.NEONOMICS_ENABLED = '1'
    expect(isNeonomicsServerEnabled()).toBe(true)
  })
})

describe('isNeonomicsPublicEnabled', () => {
  it('krever både server og public flagg', () => {
    delete process.env.NEONOMICS_ENABLED
    delete process.env.NEXT_PUBLIC_NEONOMICS_ENABLED
    expect(isNeonomicsPublicEnabled()).toBe(false)

    process.env.NEONOMICS_ENABLED = 'true'
    process.env.NEXT_PUBLIC_NEONOMICS_ENABLED = 'true'
    expect(isNeonomicsPublicEnabled()).toBe(true)

    process.env.NEXT_PUBLIC_NEONOMICS_ENABLED = 'false'
    expect(isNeonomicsPublicEnabled()).toBe(false)
  })
})
