import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './safeRedirectPath'

describe('safeRedirectPath', () => {
  it('allows internal paths', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard')
    expect(safeRedirectPath('/snoball?x=1')).toBe('/snoball?x=1')
  })

  it('rejects external and protocol-relative targets', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard')
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard')
    expect(safeRedirectPath('//evil.com/path')).toBe('/dashboard')
    expect(safeRedirectPath('/\\evil')).toBe('/dashboard')
  })

  it('uses fallback for empty or invalid', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard')
    expect(safeRedirectPath('')).toBe('/dashboard')
    expect(safeRedirectPath('   ')).toBe('/dashboard')
  })

  it('respects custom fallback', () => {
    expect(safeRedirectPath('https://x', '/')).toBe('/')
  })
})
