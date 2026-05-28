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
    expect(normalizeUiColorPaletteId('fjord')).toBe('fjord')
    expect(normalizeUiColorPaletteId('sand')).toBe('sand')
    expect(normalizeUiColorPaletteId('slate')).toBe('slate')
    expect(normalizeUiColorPaletteId('sage')).toBe('sage')
    expect(normalizeUiColorPaletteId('wine')).toBe('wine')
  })

  it('mapper legacy teal til dark', () => {
    expect(normalizeUiColorPaletteId('teal')).toBe('dark')
  })
})

describe('uiPaletteCssVarsForExport', () => {
  it('returnerer tokens for default og dark', async () => {
    const { uiPaletteCssVarsForExport, ctaGradientForUiPalette } = await import('./uiColorPalette')
    const def = uiPaletteCssVarsForExport('default')
    expect(def['--primary']).toBe('#3B5BDB')
    expect(def['--bg']).toBe('#EEF2FF')

    const dark = uiPaletteCssVarsForExport('dark')
    expect(dark['--text']).toBe('#e9ecef')
    expect(dark['--cta-gradient']).toBe(ctaGradientForUiPalette('dark'))
  })
})
