import { describe, expect, it } from 'vitest'
import { normalizeUiColorPaletteId } from './uiColorPalette'

describe('normalizeUiColorPaletteId', () => {
  it('returnerer default for ukjente verdier og undefined', () => {
    expect(normalizeUiColorPaletteId(undefined)).toBe('default')
    expect(normalizeUiColorPaletteId('')).toBe('default')
    expect(normalizeUiColorPaletteId('blue')).toBe('default')
    expect(normalizeUiColorPaletteId(1)).toBe('default')
  })

  it('beholder gyldige paletter', () => {
    expect(normalizeUiColorPaletteId('default')).toBe('default')
    expect(normalizeUiColorPaletteId('green')).toBe('green')
    expect(normalizeUiColorPaletteId('rose')).toBe('rose')
    expect(normalizeUiColorPaletteId('dark')).toBe('dark')
  })

  it('mapper legacy teal til dark', () => {
    expect(normalizeUiColorPaletteId('teal')).toBe('dark')
  })
})
